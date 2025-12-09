from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    UserRegistrationSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
    AdminUserCreateSerializer,
    AdminUserUpdateSerializer,
)
from .permissions import IsAdmin, IsOwnerOrAdmin

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view with additional user data."""
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    User registration endpoint.
    Only allows customer registration.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        """Create user and return tokens."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveAPIView):
    """Get current user's profile."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserProfileUpdateView(generics.UpdateAPIView):
    """Update current user's profile."""
    serializer_class = UserProfileUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    """Change user password."""
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            'message': 'Password changed successfully.'
        }, status=status.HTTP_200_OK)


class LogoutView(generics.GenericAPIView):
    """
    Logout view that blacklists the refresh token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {'message': 'Logout successful.'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin-only viewset for managing users.
    Supports CRUD operations for all user roles.
    """
    queryset = User.objects.all()
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    ordering_fields = ['created_at', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return AdminUserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AdminUserUpdateSerializer
        return UserSerializer

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Bulk create multiple users.
        Expects a list of user data.
        """
        if not isinstance(request.data, list):
            return Response(
                {'error': 'Expected a list of users.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = AdminUserCreateSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        users = serializer.save()

        return Response(
            UserSerializer(users, many=True).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user."""
        user = self.get_object()
        user.is_active = False
        user.save()

        return Response(
            {'message': f'User {user.email} has been deactivated.'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user."""
        user = self.get_object()
        user.is_active = True
        user.save()

        return Response(
            {'message': f'User {user.email} has been activated.'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get user statistics by role."""
        stats = {
            'total': User.objects.count(),
            'active': User.objects.filter(is_active=True).count(),
            'inactive': User.objects.filter(is_active=False).count(),
            'by_role': {
                'admin': User.objects.filter(role=User.Role.ADMIN).count(),
                'waiter': User.objects.filter(role=User.Role.WAITER).count(),
                'customer': User.objects.filter(role=User.Role.CUSTOMER).count(),
            }
        }

        return Response(stats, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def waiters(self, request):
        """Get all waiters with their statistics."""
        from tables.models import WaiterAssignment
        from orders.models import Order
        from django.db.models import Count, Sum, Q

        waiters = User.objects.filter(role=User.Role.WAITER)
        waiter_data = []

        for waiter in waiters:
            # Get active assignments
            active_assignments = WaiterAssignment.objects.filter(
                waiter=waiter,
                shift_end__isnull=True
            ).select_related('table')

            # Get order statistics
            orders_stats = Order.objects.filter(waiter=waiter).aggregate(
                total_orders=Count('id'),
                confirmed_orders=Count('id', filter=Q(status='CONFIRMED')),
                served_orders=Count('id', filter=Q(status='SERVED')),
                total_revenue=Sum('total_amount', filter=Q(status__in=['CONFIRMED', 'PREPARING', 'READY', 'SERVED']))
            )

            waiter_data.append({
                'id': waiter.id,
                'email': waiter.email,
                'first_name': waiter.first_name,
                'last_name': waiter.last_name,
                'full_name': waiter.get_full_name(),
                'is_active': waiter.is_active,
                'phone_number': str(waiter.phone_number) if waiter.phone_number else None,
                'created_at': waiter.created_at,
                'assigned_tables': [
                    {
                        'id': assignment.table.id,
                        'number': assignment.table.number,
                        'section': assignment.table.section,
                        'shift_start': assignment.shift_start
                    }
                    for assignment in active_assignments
                ],
                'statistics': {
                    'total_orders': orders_stats['total_orders'] or 0,
                    'confirmed_orders': orders_stats['confirmed_orders'] or 0,
                    'served_orders': orders_stats['served_orders'] or 0,
                    'total_revenue': float(orders_stats['total_revenue'] or 0),
                    'active_tables_count': active_assignments.count()
                }
            })

        return Response(waiter_data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete - deactivate instead of hard delete.
        """
        user = self.get_object()
        user.is_active = False
        user.save()

        return Response(
            {'message': f'User {user.email} has been deactivated.'},
            status=status.HTTP_200_OK
        )
