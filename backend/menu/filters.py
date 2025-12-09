import django_filters
from .models import MenuItem


class MenuItemFilter(django_filters.FilterSet):
    """
    Filter class for MenuItem to support advanced filtering
    """
    # Category filter
    category = django_filters.NumberFilter(field_name='category__id')
    category_slug = django_filters.CharFilter(field_name='category__slug')

    # Dietary filters
    is_vegetarian = django_filters.BooleanFilter()
    is_vegan = django_filters.BooleanFilter()
    is_gluten_free = django_filters.BooleanFilter()

    # Price range filter
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    # Preparation time filter
    max_prep_time = django_filters.NumberFilter(
        field_name='preparation_time',
        lookup_expr='lte'
    )

    # Availability filters
    is_available = django_filters.BooleanFilter()
    is_featured = django_filters.BooleanFilter()

    class Meta:
        model = MenuItem
        fields = [
            'category', 'category_slug',
            'is_vegetarian', 'is_vegan', 'is_gluten_free',
            'is_available', 'is_featured'
        ]
