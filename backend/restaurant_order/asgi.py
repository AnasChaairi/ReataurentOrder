"""
ASGI config for restaurant_order project.
Exposes the ASGI callable as a module-level variable named ``application``.
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'restaurant_order.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Import websocket routing and auth middleware after Django setup
from notifications.routing import websocket_urlpatterns
from restaurant_order.ws_auth_middleware import JWTCookieAuthMiddleware

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTCookieAuthMiddleware(
            URLRouter(
                websocket_urlpatterns
            )
        )
    ),
})
