from django.contrib import admin
from .models import Order, OrderItem, OrderItemAddon, OrderEvent


class OrderItemAddonInline(admin.TabularInline):
    model = OrderItemAddon
    extra = 0
    fields = ['addon', 'addon_name', 'addon_price']
    readonly_fields = ['addon_name', 'addon_price']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = [
        'menu_item', 'variant', 'quantity', 'unit_price',
        'total_price', 'special_instructions'
    ]
    readonly_fields = ['unit_price', 'total_price']


class OrderEventInline(admin.TabularInline):
    model = OrderEvent
    extra = 0
    fields = ['event_type', 'actor', 'description', 'timestamp']
    readonly_fields = ['event_type', 'actor', 'description', 'timestamp']
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number', 'table', 'customer', 'waiter',
        'status', 'total_amount', 'synced_to_odoo', 'created_at'
    ]
    list_filter = ['status', 'synced_to_odoo', 'created_at']
    search_fields = ['order_number', 'customer__email', 'table__number']
    ordering = ['-created_at']
    inlines = [OrderItemInline, OrderEventInline]
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order_number', 'table', 'session', 'customer', 'waiter', 'status')
        }),
        ('Pricing', {
            'fields': ('subtotal', 'tax', 'discount', 'total_amount')
        }),
        ('Notes', {
            'fields': ('customer_notes', 'waiter_notes', 'kitchen_notes')
        }),
        ('Timestamps', {
            'fields': (
                'created_at', 'confirmed_at', 'preparing_at',
                'ready_at', 'served_at', 'cancelled_at'
            ),
            'classes': ('collapse',)
        }),
        ('Odoo Integration', {
            'fields': ('odoo_order_id', 'synced_to_odoo', 'odoo_sync_error'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = [
        'order_number', 'created_at', 'confirmed_at', 'preparing_at',
        'ready_at', 'served_at', 'cancelled_at'
    ]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = [
        'order', 'menu_item', 'variant', 'quantity',
        'unit_price', 'total_price'
    ]
    list_filter = ['order__status', 'created_at']
    search_fields = ['order__order_number', 'menu_item__name']
    inlines = [OrderItemAddonInline]


@admin.register(OrderEvent)
class OrderEventAdmin(admin.ModelAdmin):
    list_display = ['order', 'event_type', 'actor', 'timestamp']
    list_filter = ['event_type', 'timestamp']
    search_fields = ['order__order_number', 'description']
    ordering = ['-timestamp']
