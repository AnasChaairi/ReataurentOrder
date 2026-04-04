from django.contrib.auth import get_user_model
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdmin, IsAdminOrRestaurantOwner
from .models import Restaurant
from .serializers import RestaurantSerializer, RestaurantListSerializer

User = get_user_model()


class RestaurantViewSet(viewsets.ModelViewSet):
    """CRUD for restaurants — admins see all, owners see their own."""

    queryset = Restaurant.objects.select_related('owner', 'odoo_config')
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated, IsAdminOrRestaurantOwner]
    ordering = ['name']

    def get_permissions(self):
        if self.action in ('create', 'destroy', 'sync_menu', 'sync_tables', 'assign_odoo_config'):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated(), IsAdminOrRestaurantOwner()]

    def get_queryset(self):
        user = self.request.user
        qs = Restaurant.objects.select_related('owner', 'odoo_config')
        if user.role == User.Role.ADMIN:
            return qs
        if user.role == User.Role.RESTAURANT_OWNER:
            from django.db.models import Q
            return qs.filter(Q(owner=user) | Q(id=user.restaurant_id))
        return qs.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return RestaurantListSerializer
        return RestaurantSerializer

    @action(detail=True, methods=['get'])
    def staff(self, request, pk=None):
        """List users assigned to this restaurant."""
        restaurant = self.get_object()
        staff_members = User.objects.filter(restaurant=restaurant).values(
            'id', 'email', 'first_name', 'last_name', 'role', 'is_active'
        )
        return Response(list(staff_members))

    @action(detail=True, methods=['post'], url_path='assign_staff')
    def assign_staff(self, request, pk=None):
        """Assign or remove a user from this restaurant."""
        restaurant = self.get_object()
        user_id = request.data.get('user_id')
        action_type = request.data.get('action')  # 'assign' or 'remove'

        if not user_id or action_type not in ('assign', 'remove'):
            return Response(
                {'error': 'Provide user_id and action (assign/remove)'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if action_type == 'assign':
            target_user.restaurant = restaurant
            target_user.save(update_fields=['restaurant'])
            return Response({'message': f'{target_user.email} assigned to {restaurant.name}'})
        else:
            if target_user.restaurant_id != restaurant.id:
                return Response(
                    {'error': 'User is not assigned to this restaurant'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            target_user.restaurant = None
            target_user.save(update_fields=['restaurant'])
            return Response({'message': f'{target_user.email} removed from {restaurant.name}'})

    @action(detail=True, methods=['post'])
    def assign_odoo_config(self, request, pk=None):
        """Assign an Odoo config to this restaurant."""
        restaurant = self.get_object()
        odoo_config_id = request.data.get('odoo_config_id')

        if odoo_config_id is None:
            restaurant.odoo_config = None
            restaurant.save(update_fields=['odoo_config'])
            return Response({'message': 'Odoo config unassigned'})

        from odoo_integration.models import OdooConfig
        try:
            config = OdooConfig.objects.get(pk=odoo_config_id)
        except OdooConfig.DoesNotExist:
            return Response(
                {'error': 'Odoo config not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        restaurant.odoo_config = config
        restaurant.save(update_fields=['odoo_config'])

        return Response({
            'message': f'Odoo config "{config.name}" assigned to {restaurant.name}',
        })

    @action(detail=True, methods=['post'])
    def sync_menu(self, request, pk=None):
        """Trigger menu sync for this restaurant."""
        restaurant = self.get_object()

        if not restaurant.odoo_config:
            return Response(
                {'error': 'No Odoo config assigned to this restaurant'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from odoo_integration.django_services import OdooMenuSyncService
            service = OdooMenuSyncService(restaurant.odoo_config)
            result = service.sync_menu_from_odoo(user=request.user, restaurant=restaurant)
            return Response({'status': 'success', **result})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def sync_tables(self, request, pk=None):
        """Trigger table sync for this restaurant."""
        restaurant = self.get_object()

        if not restaurant.odoo_config:
            return Response(
                {'error': 'No Odoo config assigned to this restaurant'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from odoo_integration.django_services import OdooTableSyncService
            service = OdooTableSyncService(restaurant.odoo_config)
            result = service.sync_tables_from_odoo(user=request.user, restaurant=restaurant)
            return Response({'status': 'success', **result})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
