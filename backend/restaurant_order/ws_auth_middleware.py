"""
WebSocket JWT Authentication Middleware

Reads the access_token httpOnly cookie from the WebSocket handshake request
and authenticates the user the same way CookieJWTAuthentication does for HTTP.

Usage in asgi.py:
    from restaurant_order.ws_auth_middleware import JWTCookieAuthMiddleware
    application = ProtocolTypeRouter({
        "websocket": JWTCookieAuthMiddleware(URLRouter(...))
    })
"""

from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async


@database_sync_to_async
def _get_user_from_token(raw_token: str):
    """Validate a JWT access token and return the corresponding User or AnonymousUser."""
    from rest_framework_simplejwt.tokens import AccessToken
    from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
    from django.contrib.auth import get_user_model

    User = get_user_model()
    try:
        token = AccessToken(raw_token)
        user_id = token.get('user_id')
        if user_id is None:
            return AnonymousUser()
        return User.objects.get(id=user_id, is_active=True)
    except (InvalidToken, TokenError, User.DoesNotExist):
        return AnonymousUser()


class JWTCookieAuthMiddleware(BaseMiddleware):
    """
    Authenticate WebSocket connections via the access_token httpOnly cookie.

    Sets scope['user'] to the authenticated User instance, or AnonymousUser
    if the token is absent, invalid, or expired.
    """

    async def __call__(self, scope, receive, send):
        close_old_connections()

        # Extract cookies from the handshake headers
        headers = dict(scope.get('headers', []))
        cookie_header = headers.get(b'cookie', b'').decode('utf-8', errors='replace')

        raw_token = None
        for part in cookie_header.split(';'):
            part = part.strip()
            if part.startswith('access_token='):
                raw_token = part[len('access_token='):]
                break

        if raw_token:
            scope['user'] = await _get_user_from_token(raw_token)
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)
