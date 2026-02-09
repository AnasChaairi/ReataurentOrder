from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class IsAdmin(permissions.BasePermission):
    """Permission check for Admin role."""

    message = "Only admin users can access this resource."

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.ADMIN
        )


class IsWaiter(permissions.BasePermission):
    """Permission check for Waiter role."""

    message = "Only waiter users can access this resource."

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.WAITER
        )


class IsCustomer(permissions.BasePermission):
    """Permission check for Customer role."""

    message = "Only customer users can access this resource."

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.CUSTOMER
        )


class IsAdminOrWaiter(permissions.BasePermission):
    """Permission check for Admin or Waiter roles."""

    message = "Only admin or waiter users can access this resource."

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in [User.Role.ADMIN, User.Role.WAITER]
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission check for resource owner or admin.
    Object-level permission to only allow owners of an object or admins to access it.
    """

    message = "You can only access your own resources."

    def has_object_permission(self, request, view, obj):
        # Admin can access everything
        if request.user.role == User.Role.ADMIN:
            return True

        # Check if obj is a User instance
        if isinstance(obj, User):
            return obj == request.user

        # Check if obj has a user attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user

        return False


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission to only allow admins to edit.
    Read-only access for all authenticated users.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.ADMIN
        )


class IsWaiterForAssignedTable(permissions.BasePermission):
    """
    Permission to check if waiter is assigned to the table.
    Used for order management and table-specific operations.
    """

    message = "You can only access resources for your assigned tables."

    def has_object_permission(self, request, view, obj):
        # Admin can access everything
        if request.user.role == User.Role.ADMIN:
            return True

        # Waiter can only access their assigned tables
        if request.user.role == User.Role.WAITER:
            # Check if obj has a table attribute
            if hasattr(obj, 'table'):
                # Import here to avoid circular import
                from tables.models import WaiterAssignment
                return WaiterAssignment.objects.filter(
                    waiter=request.user,
                    table=obj.table,
                    shift_end__isnull=True
                ).exists()

        return False
