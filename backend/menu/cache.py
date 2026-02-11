"""
Menu caching service for improving performance.
Cache keys are scoped by restaurant ID.
"""
from django.core.cache import cache
from django.conf import settings
from .models import Category, MenuItem


class MenuCache:
    """Service for caching menu data, scoped by restaurant."""

    # Cache key templates — {rid} is restaurant ID (0 for global/unscoped)
    CATEGORY_LIST_KEY = 'menu:r{rid}:categories:list'
    CATEGORY_DETAIL_KEY = 'menu:r{rid}:category:{slug}'
    MENU_ITEM_LIST_KEY = 'menu:r{rid}:items:list'
    MENU_ITEM_DETAIL_KEY = 'menu:r{rid}:item:{slug}'
    FEATURED_ITEMS_KEY = 'menu:r{rid}:items:featured'
    CATEGORY_ITEMS_KEY = 'menu:r{rid}:category:{slug}:items'

    # Cache timeouts (in seconds)
    DEFAULT_TIMEOUT = getattr(settings, 'MENU_CACHE_TIMEOUT', 60 * 60)  # 1 hour
    LIST_TIMEOUT = getattr(settings, 'MENU_LIST_CACHE_TIMEOUT', 60 * 30)  # 30 minutes
    DETAIL_TIMEOUT = getattr(settings, 'MENU_DETAIL_CACHE_TIMEOUT', 60 * 60)  # 1 hour

    @staticmethod
    def _rid(user=None, restaurant_id=None):
        """Get restaurant ID for cache key."""
        if restaurant_id:
            return restaurant_id
        if user and hasattr(user, 'restaurant_id') and user.restaurant_id:
            return user.restaurant_id
        return 0

    @classmethod
    def get_category_list(cls, user=None, restaurant_id=None):
        rid = cls._rid(user, restaurant_id)
        cache_key = cls.CATEGORY_LIST_KEY.format(rid=rid)
        if user and not getattr(user, 'is_admin', False):
            cache_key += ':active'
        return cache.get(cache_key)

    @classmethod
    def set_category_list(cls, data, user=None, restaurant_id=None):
        rid = cls._rid(user, restaurant_id)
        cache_key = cls.CATEGORY_LIST_KEY.format(rid=rid)
        if user and not getattr(user, 'is_admin', False):
            cache_key += ':active'
        cache.set(cache_key, data, cls.LIST_TIMEOUT)

    @classmethod
    def get_category_detail(cls, slug, restaurant_id=0):
        cache_key = cls.CATEGORY_DETAIL_KEY.format(rid=restaurant_id, slug=slug)
        return cache.get(cache_key)

    @classmethod
    def set_category_detail(cls, slug, data, restaurant_id=0):
        cache_key = cls.CATEGORY_DETAIL_KEY.format(rid=restaurant_id, slug=slug)
        cache.set(cache_key, data, cls.DETAIL_TIMEOUT)

    @classmethod
    def get_menu_item_list(cls, user=None, restaurant_id=None):
        rid = cls._rid(user, restaurant_id)
        cache_key = cls.MENU_ITEM_LIST_KEY.format(rid=rid)
        if user and not getattr(user, 'is_admin', False):
            cache_key += ':available'
        return cache.get(cache_key)

    @classmethod
    def set_menu_item_list(cls, data, user=None, restaurant_id=None):
        rid = cls._rid(user, restaurant_id)
        cache_key = cls.MENU_ITEM_LIST_KEY.format(rid=rid)
        if user and not getattr(user, 'is_admin', False):
            cache_key += ':available'
        cache.set(cache_key, data, cls.LIST_TIMEOUT)

    @classmethod
    def get_menu_item_detail(cls, slug, restaurant_id=0):
        cache_key = cls.MENU_ITEM_DETAIL_KEY.format(rid=restaurant_id, slug=slug)
        return cache.get(cache_key)

    @classmethod
    def set_menu_item_detail(cls, slug, data, restaurant_id=0):
        cache_key = cls.MENU_ITEM_DETAIL_KEY.format(rid=restaurant_id, slug=slug)
        cache.set(cache_key, data, cls.DETAIL_TIMEOUT)

    @classmethod
    def get_featured_items(cls, restaurant_id=0):
        return cache.get(cls.FEATURED_ITEMS_KEY.format(rid=restaurant_id))

    @classmethod
    def set_featured_items(cls, data, restaurant_id=0):
        cache.set(cls.FEATURED_ITEMS_KEY.format(rid=restaurant_id), data, cls.LIST_TIMEOUT)

    @classmethod
    def get_category_items(cls, category_slug, restaurant_id=0):
        cache_key = cls.CATEGORY_ITEMS_KEY.format(rid=restaurant_id, slug=category_slug)
        return cache.get(cache_key)

    @classmethod
    def set_category_items(cls, category_slug, data, restaurant_id=0):
        cache_key = cls.CATEGORY_ITEMS_KEY.format(rid=restaurant_id, slug=category_slug)
        cache.set(cache_key, data, cls.LIST_TIMEOUT)

    @classmethod
    def invalidate_category(cls, category_slug=None, restaurant_id=0):
        rid = restaurant_id
        if category_slug:
            cache.delete(cls.CATEGORY_DETAIL_KEY.format(rid=rid, slug=category_slug))
            cache.delete(cls.CATEGORY_ITEMS_KEY.format(rid=rid, slug=category_slug))
        cache.delete(cls.CATEGORY_LIST_KEY.format(rid=rid))
        cache.delete(cls.CATEGORY_LIST_KEY.format(rid=rid) + ':active')

    @classmethod
    def invalidate_menu_item(cls, menu_item_slug=None, category_slug=None, restaurant_id=0):
        rid = restaurant_id
        if menu_item_slug:
            cache.delete(cls.MENU_ITEM_DETAIL_KEY.format(rid=rid, slug=menu_item_slug))
        cache.delete(cls.MENU_ITEM_LIST_KEY.format(rid=rid))
        cache.delete(cls.MENU_ITEM_LIST_KEY.format(rid=rid) + ':available')
        cache.delete(cls.FEATURED_ITEMS_KEY.format(rid=rid))
        if category_slug:
            cache.delete(cls.CATEGORY_ITEMS_KEY.format(rid=rid, slug=category_slug))

    @classmethod
    def invalidate_all(cls):
        """Invalidate all menu cache"""
        try:
            cache.delete_pattern('menu:*')
        except AttributeError:
            # Fallback for cache backends that don't support delete_pattern
            pass

    @classmethod
    def warm_cache(cls, restaurant_id=0):
        """
        Warm up cache with frequently accessed data.
        """
        from .serializers import CategoryListSerializer, MenuItemListSerializer

        cat_qs = Category.objects.filter(is_active=True).order_by('order', 'name')
        if restaurant_id:
            cat_qs = cat_qs.filter(restaurant_id=restaurant_id)

        category_data = CategoryListSerializer(cat_qs, many=True).data
        cls.set_category_list(category_data, restaurant_id=restaurant_id)

        item_qs = MenuItem.objects.select_related('category').prefetch_related(
            'variants', 'available_addons'
        ).filter(is_available=True, category__is_active=True)
        if restaurant_id:
            item_qs = item_qs.filter(restaurant_id=restaurant_id)

        menu_item_data = MenuItemListSerializer(item_qs, many=True).data
        cls.set_menu_item_list(menu_item_data, restaurant_id=restaurant_id)

        featured_items = item_qs.filter(is_featured=True)
        featured_data = MenuItemListSerializer(featured_items, many=True).data
        cls.set_featured_items(featured_data, restaurant_id=restaurant_id)

        return {
            'categories_cached': len(category_data),
            'menu_items_cached': len(menu_item_data),
            'featured_items_cached': len(featured_data)
        }
