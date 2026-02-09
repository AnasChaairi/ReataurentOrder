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
                # Get the POS config and its floor_ids
                config = self.config_model.browse(pos_config_id, ['floor_ids'])
                if config and config.get('floor_ids'):
                    floor_ids = config['floor_ids']
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

        # Build order lines in POS format
        lines = []
        for line in order_lines:
            # Get product name
            product = product_model.browse(line['product_id'], ['name', 'display_name'])
            product_name = product.get('display_name') or product.get('name') if product else f"Product {line['product_id']}"

            lines.append([0, 0, {
                'product_id': line['product_id'],
                'qty': line.get('qty', 1.0),
                'price_unit': line.get('price_unit', 0.0),
                'price_subtotal': line.get('qty', 1.0) * line.get('price_unit', 0.0),
                'price_subtotal_incl': line.get('qty', 1.0) * line.get('price_unit', 0.0),
                'full_product_name': product_name,
            }])

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

        # Create POS order
        order_data = {
            'session_id': session_id,
            'config_id': config_id,
            'lines': lines,
            'state': 'draft',  # Draft state so order shows on POS table view
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

        return order_id

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
            # Get payment methods for specific config
            config = self.config_model.browse(config_id, ['payment_method_ids'])
            if config and config.get('payment_method_ids'):
                domain = [['id', 'in', config['payment_method_ids']]]

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
