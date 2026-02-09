"""
URL Configuration for Odoo Integration API

Routes:
- /api/odoo/configs/ - Odoo configuration management
- /api/odoo/sync-logs/ - Sync log viewing and retry
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OdooConfigViewSet, OdooSyncLogViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'configs', OdooConfigViewSet, basename='odoo-config')
router.register(r'sync-logs', OdooSyncLogViewSet, basename='odoo-sync-log')

urlpatterns = [
    path('', include(router.urls)),
]
