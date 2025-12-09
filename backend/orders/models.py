from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
from accounts.models import User
from tables.models import Table, TableSession
from menu.models import MenuItem, MenuItemVariant, MenuItemAddon


class Order(models.Model):
    """Customer order model"""

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('PREPARING', 'Preparing'),
        ('READY', 'Ready'),
        ('SERVED', 'Served'),
        ('CANCELLED', 'Cancelled'),
    ]

    # Relations
    table = models.ForeignKey(
        Table,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    session = models.ForeignKey(
        TableSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
        help_text="Table session this order belongs to"
    )
    customer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
        help_text="Customer who placed the order"
    )
    waiter = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='waiter_orders',
        limit_choices_to={'role': 'WAITER'},
        help_text="Waiter assigned to this order"
    )

    # Order details
    order_number = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        help_text="Auto-generated order number"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    # Pricing
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Sum of all item prices"
    )
    tax = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Tax amount"
    )
    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Discount amount"
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Final amount (subtotal + tax - discount)"
    )

    # Notes
    customer_notes = models.TextField(
        blank=True,
        help_text="Special instructions from customer"
    )
    waiter_notes = models.TextField(
        blank=True,
        help_text="Notes from waiter"
    )
    kitchen_notes = models.TextField(
        blank=True,
        help_text="Notes for kitchen"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    preparing_at = models.DateTimeField(null=True, blank=True)
    ready_at = models.DateTimeField(null=True, blank=True)
    served_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    # Odoo integration
    odoo_order_id = models.IntegerField(
        null=True,
        blank=True,
        unique=True,
        help_text="Odoo POS order ID"
    )
    synced_to_odoo = models.BooleanField(
        default=False,
        help_text="Whether order has been synced to Odoo"
    )
    odoo_sync_error = models.TextField(
        blank=True,
        help_text="Error message if Odoo sync failed"
    )

    class Meta:
        verbose_name = "Order"
        verbose_name_plural = "Orders"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['table', 'status']),
            models.Index(fields=['waiter', 'status']),
            models.Index(fields=['order_number']),
        ]

    def __str__(self):
        return f"Order {self.order_number} - Table {self.table.number}"

    def save(self, *args, **kwargs):
        """Auto-generate order number"""
        if not self.order_number:
            # Generate order number: ORD-YYYYMMDD-XXXXX
            from django.utils import timezone
            today = timezone.now().strftime('%Y%m%d')
            last_order = Order.objects.filter(
                order_number__startswith=f'ORD-{today}'
            ).order_by('-order_number').first()

            if last_order:
                last_num = int(last_order.order_number.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1

            self.order_number = f'ORD-{today}-{new_num:05d}'

        super().save(*args, **kwargs)

    def calculate_totals(self):
        """Calculate subtotal, tax, and total amount"""
        self.subtotal = sum(
            item.total_price for item in self.items.all()
        )
        
        # Tax calculation (e.g., 10%)
        tax_rate = Decimal('0.10')
        self.tax = self.subtotal * tax_rate

        # Total amount
        self.total_amount = self.subtotal + self.tax - self.discount

        self.save()

    def update_status(self, new_status, user=None):
        """Update order status with timestamp"""
        old_status = self.status
        self.status = new_status

        # Update corresponding timestamp
        now = timezone.now()
        if new_status == 'CONFIRMED':
            self.confirmed_at = now
        elif new_status == 'PREPARING':
            self.preparing_at = now
        elif new_status == 'READY':
            self.ready_at = now
        elif new_status == 'SERVED':
            self.served_at = now
        elif new_status == 'CANCELLED':
            self.cancelled_at = now

        self.save()

        # Create event log
        OrderEvent.objects.create(
            order=self,
            event_type='STATUS_CHANGE',
            actor=user,
            description=f'Status changed from {old_status} to {new_status}'
        )

    def can_cancel(self):
        """Check if order can be cancelled"""
        return self.status in ['PENDING', 'CONFIRMED']

    def can_modify(self):
        """Check if order can be modified"""
        return self.status == 'PENDING'


class OrderItem(models.Model):
    """Individual item in an order"""

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.PROTECT,
        related_name='order_items'
    )
    variant = models.ForeignKey(
        MenuItemVariant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_items',
        help_text="Selected variant (size) if applicable"
    )

    # Snapshot of prices at order time
    item_name = models.CharField(
        max_length=200,
        help_text="Snapshot of menu item name"
    )
    base_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Menu item price at order time"
    )
    variant_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Additional price for variant"
    )
    addons_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total price of all add-ons"
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Final price per unit (base + variant + addons)"
    )
    quantity = models.IntegerField(
        validators=[MinValueValidator(1)],
        default=1
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Unit price × quantity"
    )

    # Special instructions
    special_instructions = models.TextField(
        blank=True,
        help_text="Special preparation instructions"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Order Item"
        verbose_name_plural = "Order Items"
        ordering = ['created_at']

    def __str__(self):
        return f"{self.quantity}x {self.item_name}"

    def save(self, *args, **kwargs):
        """Calculate prices before saving"""
        # Snapshot item name
        if not self.item_name:
            self.item_name = self.menu_item.name

        # Snapshot base price
        if not self.base_price:
            self.base_price = self.menu_item.price

        # Calculate variant price
        if self.variant:
            self.variant_price = self.variant.price_modifier

        # Calculate unit price
        self.unit_price = self.base_price + self.variant_price + self.addons_price

        # Calculate total price
        self.total_price = self.unit_price * self.quantity

        super().save(*args, **kwargs)


class OrderItemAddon(models.Model):
    """Add-ons selected for an order item"""

    order_item = models.ForeignKey(
        OrderItem,
        on_delete=models.CASCADE,
        related_name='addons'
    )
    addon = models.ForeignKey(
        MenuItemAddon,
        on_delete=models.PROTECT
    )

    # Snapshot of addon at order time
    addon_name = models.CharField(max_length=100)
    addon_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    class Meta:
        verbose_name = "Order Item Add-on"
        verbose_name_plural = "Order Item Add-ons"

    def __str__(self):
        return f"{self.addon_name} (+${self.addon_price})"

    def save(self, *args, **kwargs):
        """Snapshot addon details"""
        if not self.addon_name:
            self.addon_name = self.addon.name
        if not self.addon_price:
            self.addon_price = self.addon.price

        super().save(*args, **kwargs)


class OrderEvent(models.Model):
    """Event log for order timeline tracking"""

    EVENT_TYPES = [
        ('CREATED', 'Order Created'),
        ('STATUS_CHANGE', 'Status Changed'),
        ('MODIFIED', 'Order Modified'),
        ('ITEM_ADDED', 'Item Added'),
        ('ITEM_REMOVED', 'Item Removed'),
        ('NOTE_ADDED', 'Note Added'),
        ('CANCELLED', 'Order Cancelled'),
        ('ODOO_SYNCED', 'Synced to Odoo'),
    ]

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='events'
    )
    event_type = models.CharField(
        max_length=20,
        choices=EVENT_TYPES
    )
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="User who triggered this event"
    )
    description = models.TextField(
        help_text="Description of what happened"
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional data about the event"
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Order Event"
        verbose_name_plural = "Order Events"
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.order.order_number} - {self.event_type}"
