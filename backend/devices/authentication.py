"""
Device token authentication for tablet/kiosk sessions.

Device sessions use a separate signed JWT stored in a 'device_token' httpOnly
cookie, distinct from the existing 'access_token' user cookie. DRF tries
authenticators in order; CookieJWTAuthentication runs first (user login), this
runs second (device login).
"""
import jwt

from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

DEVICE_TOKEN_COOKIE = 'device_token'
DEVICE_TOKEN_TYPE = 'device'


class DeviceToken:
    """Lightweight wrapper around the decoded device JWT payload."""

    def __init__(self, payload: dict):
        self.payload = payload

    @property
    def device_id(self) -> str:
        return self.payload['device_id']

    @property
    def device_pk(self) -> int:
        return self.payload['device_pk']

    @property
    def restaurant_id(self) -> int:
        return self.payload['restaurant_id']

    @property
    def table_id(self):
        return self.payload.get('table_id')

    @property
    def allowed_category_ids(self) -> list:
        return self.payload.get('allowed_category_ids', [])

    @property
    def odoo_config_id(self):
        return self.payload.get('odoo_config_id')


class AnonymousDevice:
    """
    Stand-in for request.user when a device token is present.
    Passes DRF's IsAuthenticated check (is_authenticated=True) while
    being clearly distinguishable from a real User instance.
    """
    is_authenticated = True
    is_anonymous = False
    is_device = True
    id = None
    role = 'DEVICE'

    def __init__(self, device_token: DeviceToken):
        self.device_token = device_token

    @property
    def restaurant_id(self):
        return self.device_token.restaurant_id

    # Prevent attribute errors from generic code that inspects user.is_admin etc.
    @property
    def is_admin(self):
        return False

    @property
    def is_staff(self):
        return False

    @property
    def is_superuser(self):
        return False


class DeviceTokenAuthentication(BaseAuthentication):
    """
    Reads a signed device JWT from the 'device_token' httpOnly cookie.
    Returns (AnonymousDevice, DeviceToken) if valid, None if cookie absent.
    Raises AuthenticationFailed for invalid/expired tokens.
    """

    def authenticate(self, request):
        raw = request.COOKIES.get(DEVICE_TOKEN_COOKIE)
        if raw is None:
            return None  # Let next authenticator (CookieJWTAuthentication) handle it

        try:
            payload = jwt.decode(
                raw,
                settings.SECRET_KEY,
                algorithms=['HS256'],
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Device token has expired.')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid device token.')

        if payload.get('type') != DEVICE_TOKEN_TYPE:
            return None  # Not a device token

        device_token = DeviceToken(payload)
        return AnonymousDevice(device_token), device_token
