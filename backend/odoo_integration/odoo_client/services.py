"""
Service classes for Odoo models.

Provides business logic layer for:
- Product management (CRUD, variants, categories)
- Sale order management (full lifecycle)
"""

from typing import List, Optional, Dict, Any
from .client import OdooClient, OdooModel
from .exceptions import OdooValidationError


class ProductService(OdooModel):
    """
    Service for managing products in Odoo.

    Provides methods for:
    - CRUD operations
    - Product variants
    - Categories
    - Advanced queries
    - Batch operations
    """

    # Required fields for product creation
    REQUIRED_FIELDS = ['name', 'type']

    # Default fields to fetch
    DEFAULT_FIELDS = [
        'id', 'name', 'default_code', 'list_price',
        'standard_price', 'barcode', 'type', 'categ_id',
        'qty_available', 'virtual_available'
    ]

    def __init__(self, client: OdooClient):
        super().__init__(client, "product.product")

    def _validate_product_data(self, data: dict) -> None:
        """
        Validate product data before create/update.

        Args:
            data: Product data dictionary

        Raises:
            OdooValidationError: If validation fails
        """
        # Check required fields for create
        if 'id' not in data:  # This is a create operation
            for field in self.REQUIRED_FIELDS:
                if field not in data or not data[field]:
                    raise OdooValidationError(f"Required field missing: {field}")

        # Validate prices are non-negative
        for price_field in ['list_price', 'standard_price']:
            if price_field in data:
                try:
                    price = float(data[price_field])
                    if price < 0:
                        raise OdooValidationError(f"{price_field} cannot be negative")
                except (ValueError, TypeError):
                    raise OdooValidationError(f"{price_field} must be a number")

        # Validate type
        if 'type' in data:
            valid_types = ['product', 'consu', 'service']
            if data['type'] not in valid_types:
                raise OdooValidationError(
                    f"Invalid product type: {data['type']}. "
                    f"Must be one of: {', '.join(valid_types)}"
                )

    # Existing methods
    def get_all_products(self, fields: Optional[List[str]] = None) -> List[dict]:
        """
        Get all products.

        Args:
            fields: List of fields to fetch (default: DEFAULT_FIELDS)

        Returns:
            List of product dictionaries
        """
        fields = fields or self.DEFAULT_FIELDS
        return self.search_read(domain=[], fields=fields)

    def get_by_sku(self, sku: str, fields: Optional[List[str]] = None) -> List[dict]:
        """
        Get product by SKU (default_code).

        Args:
            sku: Product SKU
            fields: List of fields to fetch

        Returns:
            List with one product dict if found, empty list otherwise
        """
        fields = fields or ["id", "name", "default_code", "list_price"]
        ids = self.search([["default_code", "=", sku]], limit=1)
        return self.read(ids, fields) if ids else []

    # New CRUD methods
    def create_product(self, values: dict) -> int:
        """
        Create a new product with validation.

        Args:
            values: Product data dictionary

        Returns:
            ID of created product

        Raises:
            OdooValidationError: If validation fails

        Example:
            >>> product_id = service.create_product({
            ...     'name': 'New Product',
            ...     'type': 'product',
            ...     'list_price': 100.0
            ... })
        """
        self._validate_product_data(values)
        return self.create(values)

    def update_product(self, product_id: int, values: dict) -> bool:
        """
        Update an existing product.

        Args:
            product_id: Product ID
            values: Fields to update

        Returns:
            True if successful

        Example:
            >>> service.update_product(1, {'list_price': 150.0})
        """
        self._validate_product_data(values)
        return self.write([product_id], values)

    def delete_product(self, product_id: int) -> bool:
        """
        Delete a product.

        Args:
            product_id: Product ID

        Returns:
            True if successful
        """
        return self.unlink([product_id])

    def get_product_by_id(
        self,
        product_id: int,
        fields: Optional[List[str]] = None
    ) -> Optional[dict]:
        """
        Get a single product by ID.

        Args:
            product_id: Product ID
            fields: List of fields to fetch

        Returns:
            Product dictionary or None if not found
        """
        fields = fields or self.DEFAULT_FIELDS
        return self.browse(product_id, fields)

    # Product variant methods
    def get_product_variants(self, template_id: int) -> List[dict]:
        """
        Get all variants of a product template.

        Args:
            template_id: Product template ID

        Returns:
            List of product variant dictionaries
        """
        return self.search_read(
            [['product_tmpl_id', '=', template_id]],
            self.DEFAULT_FIELDS
        )

    def get_product_template(self, product_id: int) -> Optional[dict]:
        """
        Get the product template for a product variant.

        Args:
            product_id: Product variant ID

        Returns:
            Product template dictionary or None
        """
        product = self.browse(product_id, ['product_tmpl_id'])
        if product and product.get('product_tmpl_id'):
            template_id = product['product_tmpl_id'][0]
            template_model = OdooModel(self.client, 'product.template')
            return template_model.browse(template_id)
        return None

    # Category methods
    def get_categories(self, parent_id: Optional[int] = None) -> List[dict]:
        """
        Get product categories.

        Args:
            parent_id: Parent category ID (None = root categories)

        Returns:
            List of category dictionaries
        """
        category_model = OdooModel(self.client, 'product.category')
        domain = []
        if parent_id is not None:
            domain = [['parent_id', '=', parent_id]]
        return category_model.search_read(
            domain,
            ['id', 'name', 'parent_id', 'child_id']
        )

    def assign_category(self, product_id: int, category_id: int) -> bool:
        """
        Assign a category to a product.

        Args:
            product_id: Product ID
            category_id: Category ID

        Returns:
            True if successful
        """
        return self.write([product_id], {'categ_id': category_id})

    # Advanced query methods
    def search_products(
        self,
        filters: dict,
        limit: int = 100,
        offset: int = 0,
        fields: Optional[List[str]] = None
    ) -> List[dict]:
        """
        Search products with filters.

        Args:
            filters: Dictionary of field:value pairs
            limit: Maximum results
            offset: Number of records to skip
            fields: Fields to fetch

        Returns:
            List of product dictionaries

        Example:
            >>> service.search_products({'type': 'product', 'list_price': ('>', 50)})
        """
        domain = []
        for field, value in filters.items():
            if isinstance(value, tuple):
                # Support for operators: ('>', 50)
                domain.append([field, value[0], value[1]])
            else:
                domain.append([field, '=', value])

        fields = fields or self.DEFAULT_FIELDS
        return self.search_read(domain, fields, offset=offset, limit=limit)

    def get_products_by_category(
        self,
        category_id: int,
        fields: Optional[List[str]] = None
    ) -> List[dict]:
        """
        Get all products in a category.

        Args:
            category_id: Category ID
            fields: Fields to fetch

        Returns:
            List of product dictionaries
        """
        fields = fields or self.DEFAULT_FIELDS
        return self.search_read(
            [['categ_id', '=', category_id]],
            fields
        )

    # Batch operations
    def bulk_create_products(self, products: List[dict]) -> List[int]:
        """
        Create multiple products.

        Args:
            products: List of product data dictionaries

        Returns:
            List of created product IDs

        Example:
            >>> products = [
            ...     {'name': 'Product 1', 'type': 'product'},
            ...     {'name': 'Product 2', 'type': 'service'}
            ... ]
            >>> ids = service.bulk_create_products(products)
        """
        created_ids = []
        for product_data in products:
            self._validate_product_data(product_data)
            product_id = self.create(product_data)
            created_ids.append(product_id)
        return created_ids

    def bulk_update_prices(self, updates: List[dict]) -> bool:
        """
        Bulk update product prices.

        Args:
            updates: List of {'id': product_id, 'list_price': price} dicts

        Returns:
            True if all updates successful

        Example:
            >>> updates = [
            ...     {'id': 1, 'list_price': 100.0},
            ...     {'id': 2, 'list_price': 200.0}
            ... ]
            >>> service.bulk_update_prices(updates)
        """
        for update in updates:
            if 'id' not in update:
                raise OdooValidationError("Each update must have an 'id' field")
            product_id = update.pop('id')
            self._validate_product_data(update)
            self.write([product_id], update)
        return True


class SaleOrderService(OdooModel):
    """
    Service for managing sale orders.

    Provides methods for:
    - Order lifecycle management
    - Order queries
    - Order line management
    """

    # Order states
    STATE_DRAFT = 'draft'
    STATE_SENT = 'sent'
    STATE_SALE = 'sale'
    STATE_DONE = 'done'
    STATE_CANCEL = 'cancel'

    VALID_STATES = [STATE_DRAFT, STATE_SENT, STATE_SALE, STATE_DONE, STATE_CANCEL]

    # Default fields
    DEFAULT_FIELDS = [
        'id', 'name', 'partner_id', 'date_order', 'state',
        'amount_total', 'amount_tax', 'amount_untaxed', 'order_line'
    ]

    def __init__(self, client: OdooClient):
        super().__init__(client, "sale.order")
        self.line_model = SaleOrderLineService(client)

    def _validate_order_data(self, data: dict) -> None:
        """
        Validate order data.

        Args:
            data: Order data dictionary

        Raises:
            OdooValidationError: If validation fails
        """
        # Check partner_id for create
        if 'id' not in data and 'partner_id' not in data:
            raise OdooValidationError("partner_id is required for creating orders")

        # Validate order lines
        if 'order_line' in data:
            for line in data['order_line']:
                if isinstance(line, tuple) and line[0] == 0:
                    # (0, 0, {values}) format
                    line_data = line[2]
                    if 'product_id' not in line_data:
                        raise OdooValidationError("product_id required in order line")
                    if 'product_uom_qty' in line_data and line_data['product_uom_qty'] <= 0:
                        raise OdooValidationError("Quantity must be positive")

    # Existing method (enhanced)
    def create_order(
        self,
        partner_id: int,
        order_lines: List[dict],
        confirm: bool = False
    ) -> int:
        """
        Create a sale order.

        Args:
            partner_id: Customer partner ID
            order_lines: List of dicts with keys: product_id, quantity, price_unit
            confirm: Whether to confirm the order immediately

        Returns:
            Created order ID

        Example:
            >>> order_id = service.create_order(
            ...     partner_id=1,
            ...     order_lines=[{
            ...         'product_id': 1,
            ...         'quantity': 2,
            ...         'price_unit': 100.0
            ...     }],
            ...     confirm=True
            ... )
        """
        line_values = []
        for line in order_lines:
            line_values.append(
                (0, 0, {
                    "product_id": line["product_id"],
                    "product_uom_qty": line["quantity"],
                    "price_unit": line.get("price_unit", 0.0),
                })
            )

        vals = {
            "partner_id": partner_id,
            "order_line": line_values,
        }

        self._validate_order_data(vals)
        order_id = self.create(vals)

        if confirm:
            self.confirm_order(order_id)

        return order_id

    # Order lifecycle methods
    def confirm_order(self, order_id: int) -> bool:
        """
        Confirm a sale order (draft -> sale).

        Args:
            order_id: Order ID

        Returns:
            True if successful
        """
        return self.call('action_confirm', [[order_id]], {})

    def cancel_order(self, order_id: int) -> bool:
        """
        Cancel a sale order.

        Args:
            order_id: Order ID

        Returns:
            True if successful
        """
        return self.call('action_cancel', [[order_id]], {})

    def mark_done(self, order_id: int) -> bool:
        """
        Mark order as done.

        Args:
            order_id: Order ID

        Returns:
            True if successful
        """
        return self.call('action_done', [[order_id]], {})

    # Order query methods
    def get_order_by_id(
        self,
        order_id: int,
        fields: Optional[List[str]] = None
    ) -> Optional[dict]:
        """
        Get a single order by ID.

        Args:
            order_id: Order ID
            fields: Fields to fetch

        Returns:
            Order dictionary or None if not found
        """
        fields = fields or self.DEFAULT_FIELDS
        return self.browse(order_id, fields)

    def get_orders_by_partner(
        self,
        partner_id: int,
        fields: Optional[List[str]] = None
    ) -> List[dict]:
        """
        Get all orders for a partner.

        Args:
            partner_id: Partner ID
            fields: Fields to fetch

        Returns:
            List of order dictionaries
        """
        fields = fields or self.DEFAULT_FIELDS
        return self.search_read(
            [['partner_id', '=', partner_id]],
            fields
        )

    def get_orders_by_state(
        self,
        state: str,
        fields: Optional[List[str]] = None
    ) -> List[dict]:
        """
        Get orders by state.

        Args:
            state: Order state (draft, sent, sale, done, cancel)
            fields: Fields to fetch

        Returns:
            List of order dictionaries

        Raises:
            OdooValidationError: If state is invalid
        """
        if state not in self.VALID_STATES:
            raise OdooValidationError(
                f"Invalid state: {state}. Must be one of: {', '.join(self.VALID_STATES)}"
            )

        fields = fields or self.DEFAULT_FIELDS
        return self.search_read([['state', '=', state]], fields)

    def get_order_with_lines(self, order_id: int) -> dict:
        """
        Get order with full line details.

        Args:
            order_id: Order ID

        Returns:
            Order dictionary with detailed order lines
        """
        order = self.get_order_by_id(order_id)
        if not order:
            return {}

        # Get detailed line information
        if 'order_line' in order and order['order_line']:
            line_ids = order['order_line']
            lines = self.line_model.read(
                line_ids,
                ['id', 'product_id', 'name', 'product_uom_qty', 'price_unit', 'price_subtotal']
            )
            order['order_lines_detail'] = lines

        return order

    # Order line management
    def add_order_line(
        self,
        order_id: int,
        product_id: int,
        qty: float,
        price: float
    ) -> int:
        """
        Add a line to an existing order.

        Args:
            order_id: Order ID
            product_id: Product ID
            qty: Quantity
            price: Unit price

        Returns:
            Created line ID
        """
        line_values = {
            'order_id': order_id,
            'product_id': product_id,
            'product_uom_qty': qty,
            'price_unit': price
        }
        return self.line_model.create(line_values)

    def update_order_line(self, line_id: int, values: dict) -> bool:
        """
        Update an order line.

        Args:
            line_id: Line ID
            values: Fields to update

        Returns:
            True if successful
        """
        return self.line_model.write([line_id], values)

    def remove_order_line(self, line_id: int) -> bool:
        """
        Remove an order line.

        Args:
            line_id: Line ID

        Returns:
            True if successful
        """
        return self.line_model.unlink([line_id])


class SaleOrderLineService(OdooModel):
    """Service for managing sale order lines."""

    def __init__(self, client: OdooClient):
        super().__init__(client, "sale.order.line")

