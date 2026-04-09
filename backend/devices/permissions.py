from rest_framework.permissions import BasePermission

from .authentication import AnonymousDevice


class IsDeviceAuthenticated(BasePermission):
    """Grants access only to requests authenticated via a device token."""
    message = 'Device authentication required.'

    def has_permission(self, request, view):
        return isinstance(request.user, AnonymousDevice)


class IsAdminOrDevice(BasePermission):
    """Grants access to ADMIN users OR authenticated devices."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if isinstance(user, AnonymousDevice):
            return True
        return getattr(user, 'role', None) == 'ADMIN'
