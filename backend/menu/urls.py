from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    MenuItemViewSet,
    MenuItemVariantViewSet,
    MenuItemAddonViewSet,
    warm_cache_view,
    invalidate_cache_view,
    import_menu_view,
    export_menu_view
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'items', MenuItemViewSet, basename='menuitem')
router.register(r'variants', MenuItemVariantViewSet, basename='menuitemvariant')
router.register(r'addons', MenuItemAddonViewSet, basename='menuitemaddon')

urlpatterns = [
    path('', include(router.urls)),
    # Cache management endpoints (Admin only)
    path('admin/cache/warm/', warm_cache_view, name='warm-cache'),
    path('admin/cache/invalidate/', invalidate_cache_view, name='invalidate-cache'),
    # Import/Export endpoints (Admin only)
    path('admin/import/', import_menu_view, name='import-menu'),
    path('admin/export/', export_menu_view, name='export-menu'),
]
