"""
URL configuration for restaurant_order project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from .health import health_check, readiness_check

urlpatterns = [
    path('admin/', admin.site.urls),

    # Health checks
    path('api/health/', health_check, name='health-check'),
    path('api/health/ready/', readiness_check, name='readiness-check'),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/menu/', include('menu.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/tables/', include('tables.urls')),
    path('api/waiters/', include('tables.urls')),  # Waiter-specific endpoints
    path('api/notifications/', include('notifications.urls')),
    path('api/admin/', include('analytics.urls')),
    path('api/odoo/', include('odoo_integration.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
