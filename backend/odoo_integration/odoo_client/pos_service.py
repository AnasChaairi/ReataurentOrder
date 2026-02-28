"""
POS (Point of Sale) service for Odoo.

Provides methods for:
- POS session management
- POS order creation
- Payment processing
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from .client import OdooClient, OdooModel
from .exceptions import OdooValidationError, OdooAPIError


class POSService(OdooModel):
    """
    Service for managing POS orders in Odoo.

    POS orders are different from sale orders:
    - They require an open POS session
    - They're typically paid immediately
    - They use different models (pos.order vs sale.order)
    """

    DEFAULT_FIELDS = [
        'id', 'name', 'pos_reference', 'partner_id', 'date_order',
        'amount_total', 'amount_tax', 'state', 'lines', 'session_id'
    ]

    def __init__(self, client: OdooClient):
        super().__init__(client, "pos.order")
        self.session_model = OdooModel(client, "pos.session")
        self.config_model = OdooModel(client, "pos.config")
        self.line_model = OdooModel(client, "pos.order.line")
        self.payment_model = OdooModel(client, "pos.payment")
        self.payment_method_model = OdooModel(client, "pos.payment.method")
        self.floor_model = OdooModel(client, "restaurant.floor")
        self.table_model = OdooModel(client, "restaurant.table")
        self.combo_model = OdooModel(client, "pos.combo")
        self.combo_line_model = OdooModel(client, "pos.combo.line")

    # ==================== RESTAURANT MANAGEMENT ====================

    def get_floors(self, pos_config_id: Optional[int] = None) -> List[dict]:
        """
        Get restaurant floors/salles.

        Args:
            pos_config_id: Optional POS config ID to filter by

        Returns:
            List of floor dictionaries
        """
        # If pos_config_id is provided, get floors from the config
        if pos_config_id:
            try:
                # Use search_read to properly fetch M2M field floor_ids
                configs = self.config_model.search_read(
                    [('id', '=', pos_config_id)],
                    ['id', 'floor_ids']
                )
                if configs and configs[0].get('floor_ids'):
                    floor_ids = configs[0]['floor_ids']
                    return self.floor_model.search_read(
                        [['id', 'in', floor_ids]],
                        ['id', 'name', 'table_ids']
                    )
            except Exception:
                # Fallback to getting all floors
                pass

        # Get all floors if no config specified or fallback
        return self.floor_model.search_read(
            [],
            ['id', 'name', 'table_ids']
        )

    def get_tables(self, floor_id: Optional[int] = None) -> List[dict]:
        """
        Get restaurant tables.

        Args:
            floor_id: Optional floor ID to filter by

        Returns:
            List of table dictionaries
        """
        domain = []
        if floor_id:
            domain = [['floor_id', '=', floor_id]]

        return self.table_model.search_read(
            domain,
            ['id', 'name', 'floor_id', 'seats', 'position_h', 'position_v']
        )

    def get_table_by_id(self, table_id: int) -> Optional[dict]:
        """
        Get a table by ID.

        Args:
            table_id: Table ID

        Returns:
            Table dictionary or None
        """
        return self.table_model.browse(table_id, ['id', 'name', 'floor_id', 'seats'])

    # ==================== POS SESSION MANAGEMENT ====================

    def get_pos_configs(self) -> List[dict]:
        """
        Get available POS configurations.

        Returns:
            List of POS config dictionaries
        """
        return self.config_model.search_read(
            [],
            ['id', 'name', 'current_session_id', 'current_session_state']
        )

    def get_open_session(self, config_id: Optional[int] = None) -> Optional[dict]:
        """
        Get an open POS session.

        Args:
            config_id: Optional POS config ID to filter by

        Returns:
            Open session dict or None
        """
        domain = [['state', '=', 'opened']]
        if config_id:
            domain.append(['config_id', '=', config_id])

        sessions = self.session_model.search_read(
            domain,
            ['id', 'name', 'config_id', 'user_id', 'start_at', 'state'],
            limit=1
        )

        return sessions[0] if sessions else None

    def open_session(self, config_id: int) -> int:
        """
        Open a new POS session.

        Args:
            config_id: POS configuration ID

        Returns:
            Session ID

        Raises:
            OdooAPIError: If session cannot be opened
        """
        # Check if there's already an open session
        existing = self.get_open_session(config_id)
        if existing:
            return existing['id']

        # Create new session
        session_id = self.session_model.create({
            'config_id': config_id,
            'user_id': self.client.uid
        })

        # Open the session
        self.session_model.call('action_pos_session_open', [[session_id]], {})

        return session_id

    def close_session(self, session_id: int) -> bool:
        """
        Close a POS session.

        Args:
            session_id: Session ID

        Returns:
            True if successful
        """
        # First close the session
        self.session_model.call('action_pos_session_closing_control', [[session_id]], {})
        return True

    def get_session_orders(self, session_id: int) -> List[dict]:
        """
        Get all orders for a session.

        Args:
            session_id: Session ID

        Returns:
            List of order dictionaries
        """
        return self.search_read(
            [['session_id', '=', session_id]],
            self.DEFAULT_FIELDS
        )

    # ==================== POS ORDER CREATION ====================

    def create_pos_order(
        self,
        session_id: int,
        partner_id: Optional[int] = None,
        order_lines: List[dict] = None,
        payments: Optional[List[dict]] = None,
        table_id: Optional[int] = None,
        pos_reference: Optional[str] = None
    ) -> int:
        """
        Create a POS order.

        Args:
            session_id: POS session ID (must be open)
            partner_id: Customer partner ID (optional for POS)
            order_lines: List of dicts with keys: product_id, qty, price_unit
            payments: List of payment dicts with keys: payment_method_id, amount
            table_id: Restaurant table ID (optional, for restaurant POS)
            pos_reference: Custom order reference (optional, e.g., "ORDER-001", "T5-2024")

        Returns:
            Created POS order ID

        Example:
            >>> order_id = pos_service.create_pos_order(
            ...     session_id=1,
            ...     partner_id=3,
            ...     order_lines=[{
            ...         'product_id': 5,
            ...         'qty': 2,
            ...         'price_unit': 10.0
            ...     }],
            ...     payments=[{
            ...         'payment_method_id': 1,
            ...         'amount': 20.0
            ...     }],
            ...     table_id=5,
            ...     pos_reference="TABLE-5-001"
            ... )
        """
        if not order_lines:
            raise OdooValidationError("At least one order line is required")

        # Get session info
        session = self.session_model.browse(session_id, ['config_id', 'state'])
        if not session:
            raise OdooAPIError(f"Session {session_id} not found")

        if session['state'] != 'opened':
            raise OdooAPIError(f"Session {session_id} is not open (state: {session['state']})")

        config_id = session['config_id'][0] if isinstance(session['config_id'], list) else session['config_id']

        # Get product model to fetch product names
        product_model = OdooModel(self.client, "product.product")
        line_model = OdooModel(self.client, "pos.order.line")

        # Separate combo lines from regular lines for two-step creation
        # combo_pending: list of (line_uuid, [combo_selections])
        combo_pending: List[tuple] = []

        # Build order lines in POS format (parent lines only)
        lines = []
        for line in order_lines:
            # Get product name
            product = product_model.browse(line['product_id'], ['name', 'display_name'])
            product_name = product.get('display_name') or product.get('name') if product else f"Product {line['product_id']}"

            import uuid as _uuid
            line_uuid = str(_uuid.uuid4())

            lines.append([0, 0, {
                'product_id': line['product_id'],
                'qty': line.get('qty', 1.0),
                'price_unit': line.get('price_unit', 0.0),
                'price_subtotal': line.get('qty', 1.0) * line.get('price_unit', 0.0),
                'price_subtotal_incl': line.get('qty', 1.0) * line.get('price_unit', 0.0),
                'full_product_name': product_name,
                'uuid': line_uuid,
            }])

            # Track combo selections to add as child lines after order creation
            combo_selections = line.get('combo_selections')
            if combo_selections:
                combo_pending.append((line_uuid, combo_selections))

        # Build payments in POS format
        payment_lines = []
        if payments:
            for payment in payments:
                payment_lines.append([0, 0, {
                    'payment_method_id': payment['payment_method_id'],
                    'amount': payment['amount']
                }])

        # Calculate totals
        amount_total = sum(
            line['qty'] * line['price_unit']
            for line in order_lines
        )

        # Step 1: Create POS order with parent lines
        order_data = {
            'session_id': session_id,
            'config_id': config_id,
            'lines': lines,
            'state': 'draft',
            'amount_total': amount_total,
            'amount_tax': 0.0,
            'amount_paid': sum(p['amount'] for p in payments) if payments else 0.0,
            'amount_return': 0.0,
        }

        if partner_id:
            order_data['partner_id'] = partner_id

        if table_id:
            order_data['table_id'] = table_id

        if pos_reference:
            order_data['pos_reference'] = pos_reference

        if payment_lines:
            order_data['payment_ids'] = payment_lines

        order_id = self.create(order_data)

        # Step 2: Add combo child lines for combo items
        if combo_pending:
            import uuid as _uuid2
            # Fetch all parent lines for this order to map uuid -> line id
            parent_lines = line_model.search_read(
                [('order_id', '=', order_id)],
                ['id', 'uuid']
            )
            uuid_to_id = {pl['uuid']: pl['id'] for pl in parent_lines if pl.get('uuid')}

            for line_uuid, combo_selections in combo_pending:
                parent_line_id = uuid_to_id.get(line_uuid)
                if not parent_line_id:
                    continue

                child_vals = []
                for selection in combo_selections:
                    child_product_id = selection.get('product_id')
                    if not child_product_id:
                        continue

                    child_product = product_model.browse(child_product_id, ['name', 'display_name'])
                    child_name = (
                        child_product.get('display_name') or child_product.get('name')
                        if child_product else selection.get('label', '')
                    )
                    price_extra = float(selection.get('price_extra', 0.0))

                    child_vals.append([0, 0, {
                        'order_id': order_id,
                        'product_id': child_product_id,
                        'qty': 1.0,
                        'price_unit': price_extra,
                        'price_subtotal': price_extra,
                        'price_subtotal_incl': price_extra,
                        'full_product_name': child_name,
                        'uuid': str(_uuid2.uuid4()),
                    }])

                if child_vals:
                    line_model.write([parent_line_id], {'combo_line_ids': child_vals})

        return order_id

    def get_pos_products(
        self,
        pos_config_id: int,
        fields: Optional[List[str]] = None
    ) -> List[dict]:
        """
        Get products available in a specific POS configuration.

        Reads the pos.config record to get its product_ids many2many field,
        then fetches only those products. This scopes the menu sync to the
        exact products configured for this POS — not all available_in_pos products.

        Args:
            pos_config_id: Odoo POS configuration ID
            fields: List of product fields to fetch

        Returns:
            List of product dictionaries for this POS config
        """
        fields = fields or [
            'id', 'name', 'list_price', 'categ_id', 'type',
            'available_in_pos', 'description_sale', 'image_256',
        ]

        product_model = OdooModel(self.client, 'product.product')

        try:
            # Read POS config to get category restrictions
            configs = self.config_model.search_read(
                [('id', '=', pos_config_id)],
                ['id', 'name', 'limit_categories', 'iface_available_categ_ids']
            )
            if not configs:
                raise OdooAPIError(f"POS config {pos_config_id} not found")

            config = configs[0]
            limit_categories = config.get('limit_categories', False)
            categ_ids = config.get('iface_available_categ_ids', [])

            if limit_categories and categ_ids:
                # Fetch products whose internal category is in the allowed POS categories
                return product_model.search_read(
                    [
                        ('available_in_pos', '=', True),
                        ('pos_categ_ids', 'in', categ_ids),
                    ],
                    fields
                )
            else:
                # No category restriction — return all available_in_pos products
                return product_model.search_read(
                    [('available_in_pos', '=', True)],
                    fields
                )

        except OdooAPIError:
            raise
        except Exception:
            # Fallback: return all available_in_pos products
            return product_model.search_read(
                [('available_in_pos', '=', True)],
                fields
            )

    def get_combo_products(self, pos_config_id: int) -> List[dict]:
        """
        Get combo products for a specific POS configuration.

        A combo product in Odoo 17 POS is a product whose template has
        combo_ids (Many2many to pos.combo). Each pos.combo has combo_line_ids
        (pos.combo.line records), where each line points to a product.product
        and carries a combo_price (price extra).

        Args:
            pos_config_id: Odoo POS configuration ID

        Returns:
            List of dicts, one per combo product:
            {
                'id': <product.product id>,
                'name': 'Burger Menu',
                'list_price': 12.50,
                'categ_id': [4, 'Combos'],
                'is_combo': True,
                'combos': [
                    {
                        'combo_id': 3,
                        'combo_name': 'Choose a drink',
                        'lines': [
                            {
                                'combo_line_id': 7,
                                'product_id': 15,
                                'product_name': 'Cola',
                                'price_extra': 0.0,
                            },
                            ...
                        ]
                    },
                    ...
                ]
            }
        """
        product_model = OdooModel(self.client, 'product.product')
        product_tmpl_model = OdooModel(self.client, 'product.template')

        # 1. Get category restrictions from POS config
        configs = self.config_model.search_read(
            [('id', '=', pos_config_id)],
            ['id', 'name', 'limit_categories', 'iface_available_categ_ids']
        )
        if not configs:
            return []

        config = configs[0]
        limit_categories = config.get('limit_categories', False)
        categ_ids = config.get('iface_available_categ_ids', [])

        # Build base domain for products
        if limit_categories and categ_ids:
            base_domain = [('available_in_pos', '=', True), ('pos_categ_ids', 'in', categ_ids)]
        else:
            base_domain = [('available_in_pos', '=', True)]

        # 2. Find combo products — try detailed_type first, fall back to type field
        try:
            combo_products = product_model.search_read(
                base_domain + [('detailed_type', '=', 'combo')],
                ['id', 'name', 'list_price', 'categ_id', 'product_tmpl_id', 'available_in_pos'],
            )
        except Exception:
            try:
                combo_products = product_model.search_read(
                    base_domain + [('type', '=', 'combo')],
                    ['id', 'name', 'list_price', 'categ_id', 'product_tmpl_id', 'available_in_pos'],
                )
            except Exception:
                return []

        if not combo_products:
            return []

        # 3. For each combo product, fetch its template's combo_ids and resolve lines
        result = []
        for product in combo_products:
            tmpl_id = product.get('product_tmpl_id')
            if isinstance(tmpl_id, list):
                tmpl_id = tmpl_id[0]

            # Read combo_ids from the product template using search_read (M2M safe)
            try:
                tmpls = product_tmpl_model.search_read(
                    [('id', '=', tmpl_id)],
                    ['id', 'combo_ids']
                )
                combo_ids = tmpls[0].get('combo_ids', []) if tmpls else []
            except Exception:
                combo_ids = []

            combos = []
            for combo_id in combo_ids:
                try:
                    combo = self.combo_model.browse(
                        combo_id, ['id', 'name', 'combo_line_ids']
                    )
                    if not combo:
                        continue

                    lines = []
                    for line_id in combo.get('combo_line_ids', []):
                        try:
                            line = self.combo_line_model.browse(
                                line_id,
                                ['id', 'product_id', 'combo_price']
                            )
                            if line and line.get('product_id'):
                                prod_id = line['product_id']
                                lines.append({
                                    'combo_line_id': line['id'],
                                    'product_id': prod_id[0] if isinstance(prod_id, list) else prod_id,
                                    'product_name': prod_id[1] if isinstance(prod_id, list) else '',
                                    'price_extra': line.get('combo_price', 0.0),
                                })
                        except Exception:
                            continue

                    combos.append({
                        'combo_id': combo['id'],
                        'combo_name': combo.get('name', f'Combo {combo_id}'),
                        'lines': lines,
                    })
                except Exception:
                    continue

            product['is_combo'] = True
            product['combos'] = combos
            result.append(product)

        return result

    def get_payment_methods(self, config_id: Optional[int] = None) -> List[dict]:
        """
        Get available payment methods.

        Args:
            config_id: Optional POS config ID to filter by

        Returns:
            List of payment method dictionaries
        """
        domain = []
        if config_id:
            # Use search_read to properly fetch M2M field payment_method_ids
            try:
                configs = self.config_model.search_read(
                    [('id', '=', config_id)],
                    ['id', 'payment_method_ids']
                )
                if configs and configs[0].get('payment_method_ids'):
                    domain = [['id', 'in', configs[0]['payment_method_ids']]]
            except Exception:
                pass

        return self.payment_method_model.search_read(
            domain,
            ['id', 'name', 'type', 'is_cash_count']
        )

    # ==================== POS ORDER QUERIES ====================

    def get_order_by_id(
        self,
        order_id: int,
        fields: Optional[List[str]] = None
    ) -> Optional[dict]:
        """
        Get a POS order by ID.

        Args:
            order_id: Order ID
            fields: Fields to fetch

        Returns:
            Order dictionary or None
        """
        fields = fields or self.DEFAULT_FIELDS
        return self.browse(order_id, fields)

    def get_order_with_lines(self, order_id: int) -> dict:
        """
        Get POS order with full line details.

        Args:
            order_id: Order ID

        Returns:
            Order dictionary with detailed lines
        """
        order = self.get_order_by_id(order_id)
        if not order:
            return {}

        # Get detailed line information
        if 'lines' in order and order['lines']:
            line_ids = order['lines']
            lines = self.line_model.read(
                line_ids,
                ['id', 'product_id', 'full_product_name', 'qty', 'price_unit', 'price_subtotal']
            )
            order['lines_detail'] = lines

        # Get payment information
        payments = self.payment_model.search_read(
            [['pos_order_id', '=', order_id]],
            ['id', 'payment_method_id', 'amount']
        )
        order['payments_detail'] = payments

        return order

    def get_orders_by_session(
        self,
        session_id: int,
        fields: Optional[List[str]] = None
    ) -> List[dict]:
        """
        Get all orders for a session.

        Args:
            session_id: Session ID
            fields: Fields to fetch

        Returns:
            List of order dictionaries
        """
        fields = fields or self.DEFAULT_FIELDS
        return self.search_read(
            [['session_id', '=', session_id]],
            fields
        )

    def get_recent_orders(self, limit: int = 20) -> List[dict]:
        """
        Get recent POS orders.

        Args:
            limit: Maximum number of orders

        Returns:
            List of order dictionaries
        """
        return self.search_read(
            [],
            self.DEFAULT_FIELDS,
            limit=limit,
            order='id desc'
        )
