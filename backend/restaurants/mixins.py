"""
RestaurantScopedMixin — auto-filters querysets by restaurant.

ADMIN users see all records.
RESTAURANT_OWNER / staff users see only their restaurant's records.
"""
from django.contrib.auth import get_user_model

User = get_user_model()


class RestaurantScopedMixin:
    """
    Mixin for ViewSets that need restaurant-based query scoping.

    Apply to any ModelViewSet whose model has a `restaurant` FK.
    Override `get_queryset()` calling `super()` first, then chain extra filters.
    """

    def get_restaurant_queryset(self, queryset):
        """Filter queryset by restaurant based on user role."""
        user = self.request.user

        if not user.is_authenticated:
            return queryset

        # ADMIN sees everything
        if user.role == User.Role.ADMIN:
            return queryset

        # RESTAURANT_OWNER and staff see only their restaurant
        if hasattr(user, 'restaurant_id') and user.restaurant_id:
            return queryset.filter(restaurant_id=user.restaurant_id)

        return queryset
