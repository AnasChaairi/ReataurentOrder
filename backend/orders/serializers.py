from rest_framework import serializers
from decimal import Decimal
from .models import Order, OrderItem, OrderItemAddon, OrderEvent
from menu.models import MenuItem, MenuItemVariant, MenuItemAddon
from tables.models import Table


class OrderItemAddonSerializer(serializers.ModelSerializer):
    """Serializer for order item add-ons"""
    
    class Meta:
        model = OrderItemAddon
        fields = ['id', 'addon', 'addon_name', 'addon_price']
        read_only_fields = ['addon_name', 'addon_price']


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""
    addons = OrderItemAddonSerializer(many=True, read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True, allow_null=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'menu_item', 'variant', 'item_name', 'base_price',
            'variant_price', 'addons_price', 'unit_price', 'quantity',
            'total_price', 'special_instructions', 'combo_selections',
            'addons', 'variant_name'
        ]
        read_only_fields = [
            'item_name', 'base_price', 'variant_price', 'addons_price',
            'unit_price', 'total_price'
        ]


class OrderItemCreateSerializer(serializers.Serializer):
    """Serializer for creating order items"""
    menu_item = serializers.PrimaryKeyRelatedField(queryset=MenuItem.objects.all())
    variant = serializers.PrimaryKeyRelatedField(
        queryset=MenuItemVariant.objects.all(),
        required=False,
        allow_null=True
    )
    addons = serializers.PrimaryKeyRelatedField(
        queryset=MenuItemAddon.objects.all(),
        many=True,
        required=False
    )
    quantity = serializers.IntegerField(min_value=1, default=1)
    special_instructions = serializers.CharField(required=False, allow_blank=True)
    combo_selections = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )

    def validate(self, data):
        """Validate menu item availability"""
        menu_item = data.get('menu_item')
        
        if not menu_item.is_available:
            raise serializers.ValidationError(
                f"{menu_item.name} is currently not available"
            )
        
        # Validate variant belongs to menu item
        variant = data.get('variant')
        if variant and variant.menu_item != menu_item:
            raise serializers.ValidationError(
                "Selected variant does not belong to this menu item"
            )
        
        return data


class OrderSerializer(serializers.ModelSerializer):
    """Full serializer for orders"""
    items = OrderItemSerializer(many=True, read_only=True)
    table_number = serializers.CharField(source='table.number', read_only=True)
    customer_name = serializers.SerializerMethodField()
    waiter_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)
    can_modify = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'table', 'table_number', 'session',
            'customer', 'customer_name', 'waiter', 'waiter_name',
            'status', 'status_display', 'items',
            'subtotal', 'tax', 'discount', 'total_amount',
            'customer_notes', 'waiter_notes', 'kitchen_notes',
            'created_at', 'updated_at', 'confirmed_at', 'preparing_at',
            'ready_at', 'served_at', 'cancelled_at',
            'can_cancel', 'can_modify', 'synced_to_odoo',
            'odoo_order_id', 'odoo_sync_error'
        ]
        read_only_fields = [
            'order_number', 'subtotal', 'tax', 'total_amount',
            'created_at', 'updated_at', 'confirmed_at', 'preparing_at',
            'ready_at', 'served_at', 'cancelled_at', 'synced_to_odoo',
            'odoo_order_id', 'odoo_sync_error'
        ]

    def get_customer_name(self, obj):
        return obj.customer.get_full_name() if obj.customer else None

    def get_waiter_name(self, obj):
        return obj.waiter.get_full_name() if obj.waiter else None


class OrderListSerializer(serializers.ModelSerializer):
    """Simplified serializer for order lists"""
    table_number = serializers.CharField(source='table.number', read_only=True)
    items_count = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'table', 'table_number', 'status',
            'status_display', 'total_amount', 'items_count', 'created_at'
        ]

    def get_items_count(self, obj):
        return obj.items.count()


class OrderCreateSerializer(serializers.Serializer):
    """Serializer for creating orders"""
    table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())
    items = OrderItemCreateSerializer(many=True)
    customer_notes = serializers.CharField(required=False, allow_blank=True)

    def validate_table(self, value):
        """Validate table is available"""
        if not value.is_active:
            raise serializers.ValidationError("Table is not active")
        return value

    def validate_items(self, value):
        """Ensure at least one item"""
        if not value:
            raise serializers.ValidationError("Order must have at least one item")
        return value

    def create(self, validated_data):
        """Create order with items"""
        from django.db import transaction

        items_data = validated_data.pop('items')
        user = self.context['request'].user
        customer = user if user.is_authenticated and getattr(user, 'role', None) == 'CUSTOMER' else None
        table = validated_data['table']

        # Get active session for table
        session = table.get_current_session()

        # Get assigned waiter
        waiter = table.get_assigned_waiter()

        with transaction.atomic():
            # Create order
            order = Order.objects.create(
                table=table,
                session=session,
                customer=customer,
                waiter=waiter,
                customer_notes=validated_data.get('customer_notes', ''),
            )

            # Create order items
            for item_data in items_data:
                menu_item = item_data['menu_item']
                variant = item_data.get('variant')
                addons = item_data.get('addons', [])
                quantity = item_data.get('quantity', 1)
                instructions = item_data.get('special_instructions', '')
                combo_selections = item_data.get('combo_selections', [])

                # Calculate addons price
                addons_price = sum(addon.price for addon in addons)

                # Create order item
                order_item = OrderItem.objects.create(
                    order=order,
                    menu_item=menu_item,
                    variant=variant,
                    addons_price=addons_price,
                    quantity=quantity,
                    special_instructions=instructions,
                    combo_selections=combo_selections,
                )

                # Create addon entries
                for addon in addons:
                    OrderItemAddon.objects.create(
                        order_item=order_item,
                        addon=addon
                    )

            # Calculate totals
            order.calculate_totals()

            # Create event
            OrderEvent.objects.create(
                order=order,
                event_type='CREATED',
                actor=customer,
                description=f'Order created with {len(items_data)} items'
            )

        return order


class OrderStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating order status"""
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_status(self, value):
        """Validate status transition"""
        order = self.context.get('order')
        current_status = order.status
        
        # Define allowed transitions
        allowed_transitions = {
            'PENDING': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['PREPARING', 'CANCELLED'],
            'PREPARING': ['READY'],
            'READY': ['SERVED'],
            'SERVED': [],
            'CANCELLED': []
        }
        
        if value not in allowed_transitions.get(current_status, []):
            raise serializers.ValidationError(
                f"Cannot change status from {current_status} to {value}"
            )
        
        return value


class OrderModifySerializer(serializers.Serializer):
    """Serializer for modifying pending orders"""
    items = OrderItemCreateSerializer(many=True)

    def validate(self, data):
        """Validate order can be modified"""
        order = self.context.get('order')
        
        if not order.can_modify():
            raise serializers.ValidationError(
                "Order cannot be modified in current status"
            )
        
        if not data.get('items'):
            raise serializers.ValidationError(
                "Order must have at least one item"
            )
        
        return data


class OrderPublicItemSerializer(serializers.ModelSerializer):
    """Limited serializer for public order item view"""

    class Meta:
        model = OrderItem
        fields = ['item_name', 'quantity']


class OrderPublicSerializer(serializers.ModelSerializer):
    """Limited serializer for public order lookup - no sensitive data"""
    items = OrderPublicItemSerializer(many=True, read_only=True)
    table_number = serializers.CharField(source='table.number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_number', 'status', 'status_display', 'table_number',
            'items', 'total_amount', 'created_at'
        ]


class OrderEventSerializer(serializers.ModelSerializer):
    """Serializer for order events"""
    actor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderEvent
        fields = [
            'id', 'event_type', 'actor', 'actor_name',
            'description', 'metadata', 'timestamp'
        ]

    def get_actor_name(self, obj):
        return obj.actor.get_full_name() if obj.actor else 'System'


# Import Table here to avoid circular import
from tables.models import Table
