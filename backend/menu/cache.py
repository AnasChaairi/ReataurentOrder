"""
Menu caching service for improving performance
"""
from django.core.cache import cache
from django.conf import settings
from .models import Category, MenuItem


class MenuCache:
    """Service for caching menu data"""

    # Cache keys
    CATEGORY_LIST_KEY = 'menu:categories:list'
    CATEGORY_DETAIL_KEY = 'menu:category:{slug}'
    MENU_ITEM_LIST_KEY = 'menu:items:list'
    MENU_ITEM_DETAIL_KEY = 'menu:item:{slug}'
    FEATURED_ITEMS_KEY = 'menu:items:featured'
    CATEGORY_ITEMS_KEY = 'menu:category:{slug}:items'

    # Cache timeouts (in seconds)
    DEFAULT_TIMEOUT = getattr(settings, 'MENU_CACHE_TIMEOUT', 60 * 60)  # 1 hour
    LIST_TIMEOUT = getattr(settings, 'MENU_LIST_CACHE_TIMEOUT', 60 * 30)  # 30 minutes
    DETAIL_TIMEOUT = getattr(settings, 'MENU_DETAIL_CACHE_TIMEOUT', 60 * 60)  # 1 hour

    @classmethod
    def get_category_list(cls, user=None):
        """Get cached category list"""
        cache_key = cls.CATEGORY_LIST_KEY

        # Add user role to key if filtering is needed
        if user and not getattr(user, 'is_admin', False):
            cache_key += ':active'

        return cache.get(cache_key)

    @classmethod
    def set_category_list(cls, data, user=None):
        """Cache category list"""
        cache_key = cls.CATEGORY_LIST_KEY

        if user and not getattr(user, 'is_admin', False):
            cache_key += ':active'

        cache.set(cache_key, data, cls.LIST_TIMEOUT)

    @classmethod
    def get_category_detail(cls, slug):
        """Get cached category details"""
        cache_key = cls.CATEGORY_DETAIL_KEY.format(slug=slug)
        return cache.get(cache_key)

    @classmethod
    def set_category_detail(cls, slug, data):
        """Cache category details"""
        cache_key = cls.CATEGORY_DETAIL_KEY.format(slug=slug)
        cache.set(cache_key, data, cls.DETAIL_TIMEOUT)

    @classmethod
    def get_menu_item_list(cls, user=None):
        """Get cached menu item list"""
        cache_key = cls.MENU_ITEM_LIST_KEY

        if user and not getattr(user, 'is_admin', False):
            cache_key += ':available'

        return cache.get(cache_key)

    @classmethod
    def set_menu_item_list(cls, data, user=None):
        """Cache menu item list"""
        cache_key = cls.MENU_ITEM_LIST_KEY

        if user and not getattr(user, 'is_admin', False):
            cache_key += ':available'

        cache.set(cache_key, data, cls.LIST_TIMEOUT)

    @classmethod
    def get_menu_item_detail(cls, slug):
        """Get cached menu item details"""
        cache_key = cls.MENU_ITEM_DETAIL_KEY.format(slug=slug)
        return cache.get(cache_key)

    @classmethod
    def set_menu_item_detail(cls, slug, data):
        """Cache menu item details"""
        cache_key = cls.MENU_ITEM_DETAIL_KEY.format(slug=slug)
        cache.set(cache_key, data, cls.DETAIL_TIMEOUT)

    @classmethod
    def get_featured_items(cls):
        """Get cached featured items"""
        return cache.get(cls.FEATURED_ITEMS_KEY)

    @classmethod
    def set_featured_items(cls, data):
        """Cache featured items"""
        cache.set(cls.FEATURED_ITEMS_KEY, data, cls.LIST_TIMEOUT)

    @classmethod
    def get_category_items(cls, category_slug):
        """Get cached items for a category"""
        cache_key = cls.CATEGORY_ITEMS_KEY.format(slug=category_slug)
        return cache.get(cache_key)

    @classmethod
    def set_category_items(cls, category_slug, data):
        """Cache items for a category"""
        cache_key = cls.CATEGORY_ITEMS_KEY.format(slug=category_slug)
        cache.set(cache_key, data, cls.LIST_TIMEOUT)

    @classmethod
    def invalidate_category(cls, category_slug=None):
        """Invalidate category cache"""
        if category_slug:
            # Invalidate specific category
            cache.delete(cls.CATEGORY_DETAIL_KEY.format(slug=category_slug))
            cache.delete(cls.CATEGORY_ITEMS_KEY.format(slug=category_slug))

        # Invalidate category lists
        cache.delete(cls.CATEGORY_LIST_KEY)
        cache.delete(cls.CATEGORY_LIST_KEY + ':active')

    @classmethod
    def invalidate_menu_item(cls, menu_item_slug=None, category_slug=None):
        """Invalidate menu item cache"""
        if menu_item_slug:
            # Invalidate specific menu item
            cache.delete(cls.MENU_ITEM_DETAIL_KEY.format(slug=menu_item_slug))

        # Invalidate menu item lists
        cache.delete(cls.MENU_ITEM_LIST_KEY)
        cache.delete(cls.MENU_ITEM_LIST_KEY + ':available')

        # Invalidate featured items
        cache.delete(cls.FEATURED_ITEMS_KEY)

        # Invalidate category items if category provided
        if category_slug:
            cache.delete(cls.CATEGORY_ITEMS_KEY.format(slug=category_slug))

    @classmethod
    def invalidate_all(cls):
        """Invalidate all menu cache"""
        # Try to use delete_pattern if available (Redis), otherwise delete specific keys
        try:
            cache.delete_pattern('menu:*')
        except AttributeError:
            # Fallback for cache backends that don't support delete_pattern (like LocMemCache)
            cache.delete_many([
                cls.CATEGORY_LIST_KEY,
                cls.CATEGORY_LIST_KEY + ':active',
                cls.MENU_ITEM_LIST_KEY,
                cls.MENU_ITEM_LIST_KEY + ':available',
                cls.FEATURED_ITEMS_KEY,
            ])

    @classmethod
    def warm_cache(cls):
        """
        Warm up cache with frequently accessed data
        This can be called on deployment or as a scheduled task
        """
        from .serializers import CategoryListSerializer, MenuItemListSerializer

        # Warm category cache
        categories = Category.objects.filter(is_active=True).order_by('order', 'name')
        category_data = CategoryListSerializer(categories, many=True).data
        cls.set_category_list(category_data, user=None)

        # Warm menu items cache
        menu_items = MenuItem.objects.select_related('category').prefetch_related(
            'variants', 'available_addons'
        ).filter(
            is_available=True,
            category__is_active=True
        )
        menu_item_data = MenuItemListSerializer(menu_items, many=True).data
        cls.set_menu_item_list(menu_item_data, user=None)

        # Warm featured items cache
        featured_items = menu_items.filter(is_featured=True)
        featured_data = MenuItemListSerializer(featured_items, many=True).data
        cls.set_featured_items(featured_data)

        return {
            'categories_cached': len(category_data),
            'menu_items_cached': len(menu_item_data),
            'featured_items_cached': len(featured_data)
        }
