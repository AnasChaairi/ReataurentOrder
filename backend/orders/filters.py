import django_filters
from .models import Order


class OrderFilter(django_filters.FilterSet):
    """Filter class for Order model"""
    
    # Status filter
    status = django_filters.ChoiceFilter(choices=Order.STATUS_CHOICES)
    
    # Table filter
    table = django_filters.NumberFilter(field_name='table__id')
    table_number = django_filters.CharFilter(field_name='table__number')
    
    # Waiter filter
    waiter = django_filters.NumberFilter(field_name='waiter__id')
    
    # Customer filter
    customer = django_filters.NumberFilter(field_name='customer__id')
    
    # Date filters
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte'
    )
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte'
    )
    
    # Amount filters
    min_amount = django_filters.NumberFilter(
        field_name='total_amount',
        lookup_expr='gte'
    )
    max_amount = django_filters.NumberFilter(
        field_name='total_amount',
        lookup_expr='lte'
    )
    
    # Odoo sync filter
    synced_to_odoo = django_filters.BooleanFilter()
    
    class Meta:
        model = Order
        fields = [
            'status', 'table', 'waiter', 'customer',
            'synced_to_odoo'
        ]
