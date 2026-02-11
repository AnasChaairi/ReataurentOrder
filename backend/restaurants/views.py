from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdmin
from .models import Restaurant
from .serializers import RestaurantSerializer, RestaurantListSerializer


class RestaurantViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD for restaurants."""

    queryset = Restaurant.objects.select_related('owner', 'odoo_config')
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return RestaurantListSerializer
        return RestaurantSerializer

    @action(detail=True, methods=['post'])
    def assign_odoo_config(self, request, pk=None):
        """Assign an Odoo config to this restaurant."""
        restaurant = self.get_object()
        odoo_config_id = request.data.get('odoo_config_id')

        if odoo_config_id is None:
            # Unassign
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
