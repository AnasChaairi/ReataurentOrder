"""
API ViewSets for Odoo Integration

Provides REST API endpoints for:
- Odoo configuration management (admin only)
- Sync log viewing and retry (admin only)
"""

import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from django.db.models import Count, Q

from accounts.permissions import IsAdmin, IsAdminOrRestaurantOwner
from .models import OdooConfig, OdooSyncLog
from .serializers import (
    OdooConfigSerializer,
    OdooConfigListSerializer,
    OdooSyncLogSerializer,
    OdooSyncLogListSerializer,
    POSConfigSelectionSerializer,
    SyncTriggerSerializer,
)
from .django_services import OdooConnectionService

logger = logging.getLogger(__name__)


class OdooConfigViewSet(viewsets.ModelViewSet):
    """
    Admin-only API for managing Odoo configurations.

    Provides:
    - CRUD operations for Odoo configs
    - Connection testing
    - POS selection
    - Manual sync triggers
    """

    queryset = OdooConfig.objects.all()
    serializer_class = OdooConfigSerializer
    permission_classes = [IsAuthenticated, IsAdminOrRestaurantOwner]
    filter_backends = [OrderingFilter]
    ordering_fields = ['created_at', 'name', 'is_active']
    ordering = ['-is_active', '-created_at']

    def get_queryset(self):
        queryset = OdooConfig.objects.all()
        user = self.request.user
        if user.is_authenticated and user.role == 'RESTAURANT_OWNER' and hasattr(user, 'restaurant_id') and user.restaurant_id:
            # RESTAURANT_OWNER sees only their restaurant's config
            queryset = queryset.filter(restaurants__id=user.restaurant_id)
        return queryset

    def get_serializer_class(self):
        """Use minimal serializer for list view"""
        if self.action == 'list':
            return OdooConfigListSerializer
        return OdooConfigSerializer

    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """
        Test connection to Odoo server.

        Updates config status and returns connection info.

        Returns:
            - success: Boolean
            - message: Status message
            - version_info: Odoo version information (if successful)
        """
        config = self.get_object()

        logger.info(f"Testing Odoo connection for config: {config.name}")

        try:
            result = OdooConnectionService.test_connection(config)

            if result['success']:
                logger.info(f"Connection test successful for {config.name}")
                return Response(result, status=status.HTTP_200_OK)
            else:
                logger.warning(f"Connection test failed for {config.name}: {result['message']}")
                return Response(result, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Connection test error for {config.name}: {e}")
            return Response({
                'success': False,
                'message': f"Connection test failed: {str(e)}",
                'version_info': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Activate this configuration (deactivates all others).

        Only one config can be active at a time.

        Returns:
            - status: 'activated'
            - message: Confirmation message
        """
        config = self.get_object()

        logger.info(f"Activating Odoo config: {config.name}")

        # Deactivate all other configs
        OdooConfig.objects.exclude(pk=config.pk).update(is_active=False)

        # Activate this config
        config.is_active = True
        config.save(update_fields=['is_active'])

        logger.info(f"Config {config.name} activated successfully")

        return Response({
            'status': 'activated',
            'message': f"Configuration '{config.name}' is now active"
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def get_pos_configs(self, request, pk=None):
        """
        Get available POS configurations from Odoo.

        Fetches list of POS configs from connected Odoo instance.

        Returns:
            - pos_configs: List of available POS configurations
        """
        config = self.get_object()

        logger.info(f"Fetching POS configs from Odoo for: {config.name}")

        try:
            from .odoo_client import POSService

            client = OdooConnectionService.get_client(config)
            pos_service = POSService(client)

            pos_configs = pos_service.get_pos_configs()

            logger.info(f"Found {len(pos_configs)} POS configs in Odoo")

            return Response({
                'pos_configs': pos_configs
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Failed to fetch POS configs: {e}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def select_pos_config(self, request, pk=None):
        """
        Select POS configuration to use for orders.

        Request body:
            - pos_config_id: Odoo POS configuration ID
            - pos_config_name: Optional POS configuration name

        Returns:
            - status: 'success'
            - message: Confirmation message
        """
        config = self.get_object()
        serializer = POSConfigSelectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        pos_config_id = serializer.validated_data['pos_config_id']
        pos_config_name = serializer.validated_data.get('pos_config_name', f"POS {pos_config_id}")

        logger.info(f"Selecting POS config {pos_config_id} for {config.name}")

        config.pos_config_id = pos_config_id
        config.pos_config_name = pos_config_name
        config.save(update_fields=['pos_config_id', 'pos_config_name'])

        return Response({
            'status': 'success',
            'message': f"POS configuration '{pos_config_name}' selected",
            'pos_config_id': pos_config_id,
            'pos_config_name': pos_config_name
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def sync_menu_now(self, request, pk=None):
        """
        Run immediate menu synchronization from Odoo (synchronous).

        Returns sync results directly so the admin can see what was synced.
        """
        config = self.get_object()

        logger.info(f"Running manual menu sync for config: {config.name}")

        try:
            from .django_services import OdooMenuSyncService

            service = OdooMenuSyncService(config)
            # Pass the first linked restaurant so category/item lookups are scoped
            restaurant = config.restaurants.first()
            result = service.sync_menu_from_odoo(user=request.user, restaurant=restaurant)

            logger.info(f"Menu sync completed: {result}")

            combos_msg = ""
            if result.get('combos_created', 0) or result.get('combos_updated', 0):
                combos_msg = (
                    f", {result.get('combos_created', 0)} combos created, "
                    f"{result.get('combos_updated', 0)} updated"
                )
            return Response({
                'status': 'success',
                'message': (
                    f"Menu sync complete: "
                    f"{result.get('categories_created', 0)} categories created, "
                    f"{result.get('categories_updated', 0)} updated, "
                    f"{result.get('items_created', 0)} items created, "
                    f"{result.get('items_updated', 0)} updated"
                    f"{combos_msg}."
                ),
                **result
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Menu sync failed: {e}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def sync_tables_now(self, request, pk=None):
        """
        Run immediate table synchronization from Odoo (synchronous).

        Returns sync results directly so the admin can see what was synced.
        """
        config = self.get_object()

        logger.info(f"Running manual table sync for config: {config.name}")

        try:
            from .django_services import OdooTableSyncService
            from restaurants.models import Restaurant

            # Resolve the restaurant linked to this Odoo config
            restaurant = Restaurant.objects.filter(odoo_config=config).first()
            if not restaurant:
                return Response({
                    'error': (
                        f"No restaurant is linked to Odoo config '{config.name}'. "
                        "Go to Restaurants → edit the restaurant → assign this Odoo config, then retry."
                    )
                }, status=status.HTTP_400_BAD_REQUEST)

            service = OdooTableSyncService(config)
            result = service.sync_tables_from_odoo(user=request.user, restaurant=restaurant)

            logger.info(f"Table sync completed: {result}")

            return Response({
                'status': 'success',
                'message': (
                    f"Table sync complete: "
                    f"{result.get('floors_synced', 0)} floors, "
                    f"{result.get('tables_created', 0)} tables created, "
                    f"{result.get('tables_updated', 0)} updated."
                ),
                **result
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Table sync failed: {e}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['get'])
    def verify_tables(self, request, pk=None):
        """
        Verify table sync status between Django and Odoo.

        Returns a report of:
        - Tables properly linked to Odoo
        - Tables missing Odoo mapping
        - Odoo tables not in Django
        """
        config = self.get_object()

        from tables.models import Table

        try:
            # Get Django tables
            all_tables = Table.objects.all()
            linked_tables = all_tables.filter(odoo_table_id__isnull=False)
            unlinked_tables = all_tables.filter(odoo_table_id__isnull=True, is_active=True)

            # Get Odoo tables
            client = OdooConnectionService.get_client(config)
            from .odoo_client import POSService
            pos_service = POSService(client)

            odoo_tables = []
            floors = pos_service.get_floors(config.pos_config_id)
            for floor in floors:
                tables = pos_service.get_tables(floor['id'])
                for t in tables:
                    t['floor_name'] = floor.get('name', f"Floor {floor['id']}")
                    odoo_tables.append(t)

            odoo_table_ids = {t['id'] for t in odoo_tables}
            django_odoo_ids = set(linked_tables.values_list('odoo_table_id', flat=True))

            # Tables in Odoo but not in Django
            missing_in_django = [
                {'id': t['id'], 'name': t.get('name', ''), 'floor': t.get('floor_name', '')}
                for t in odoo_tables if t['id'] not in django_odoo_ids
            ]

            # Tables in Django linked to Odoo IDs that no longer exist
            stale_ids = django_odoo_ids - odoo_table_ids
            stale_tables = linked_tables.filter(odoo_table_id__in=stale_ids)

            return Response({
                'summary': {
                    'total_django_tables': all_tables.count(),
                    'linked_to_odoo': linked_tables.count(),
                    'not_linked': unlinked_tables.count(),
                    'total_odoo_tables': len(odoo_tables),
                    'missing_in_django': len(missing_in_django),
                    'stale_in_django': stale_tables.count(),
                },
                'unlinked_tables': list(unlinked_tables.values('id', 'number', 'section', 'is_active')),
                'missing_in_django': missing_in_django,
                'stale_tables': list(stale_tables.values('id', 'number', 'odoo_table_id')),
                'linked_tables': list(linked_tables.values(
                    'id', 'number', 'odoo_table_id', 'odoo_floor_id', 'odoo_last_synced'
                )),
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Table verification failed: {e}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class OdooSyncLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only API for viewing and managing sync logs.

    Provides:
    - List/retrieve sync logs
    - Filter by type, status, order
    - Retry failed syncs
    - View sync statistics
    """

    queryset = OdooSyncLog.objects.all().select_related(
        'order',
        'odoo_config',
        'triggered_by'
    )
    serializer_class = OdooSyncLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['sync_type', 'status', 'order']
    ordering_fields = ['created_at', 'completed_at', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Use minimal serializer for list view"""
        if self.action == 'list':
            return OdooSyncLogListSerializer
        return OdooSyncLogSerializer

    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """
        Manually retry a failed synchronization.

        Only works for failed syncs that can be retried.

        Returns:
            - status: 'retry_triggered' or 'error'
            - task_id: Celery task ID (if successful)
            - message: Status message
        """
        sync_log = self.get_object()

        logger.info(f"Manual retry requested for sync log {sync_log.id}")

        # Check if can retry
        if not sync_log.can_retry():
            logger.warning(f"Sync log {sync_log.id} cannot be retried")
            return Response({
                'status': 'error',
                'message': f"Cannot retry: status is {sync_log.status} and retry count is {sync_log.retry_count}/{sync_log.max_retries}"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            if sync_log.sync_type == 'ORDER_PUSH' and sync_log.order:
                from .tasks import sync_order_to_odoo

                task = sync_order_to_odoo.apply_async(
                    args=[sync_log.order.id, request.user.id]
                )

                logger.info(f"Order sync retry triggered: {task.id}")

                return Response({
                    'status': 'retry_triggered',
                    'task_id': task.id,
                    'message': f"Retry triggered for order {sync_log.order.order_number}"
                }, status=status.HTTP_200_OK)

            elif sync_log.sync_type == 'MENU_SYNC':
                from .tasks import sync_menu_from_odoo

                task = sync_menu_from_odoo.apply_async()

                logger.info(f"Menu sync retry triggered: {task.id}")

                return Response({
                    'status': 'retry_triggered',
                    'task_id': task.id,
                    'message': 'Menu sync retry triggered'
                }, status=status.HTTP_200_OK)

            elif sync_log.sync_type == 'TABLE_SYNC':
                from .tasks import sync_tables_from_odoo

                task = sync_tables_from_odoo.apply_async()

                logger.info(f"Table sync retry triggered: {task.id}")

                return Response({
                    'status': 'retry_triggered',
                    'task_id': task.id,
                    'message': 'Table sync retry triggered'
                }, status=status.HTTP_200_OK)

            else:
                return Response({
                    'status': 'error',
                    'message': f"Cannot retry sync type: {sync_log.sync_type}"
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Failed to retry sync log {sync_log.id}: {e}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def failed(self, request):
        """
        Get all failed synchronizations.

        Returns list of sync logs with status='FAILED'.

        Returns:
            List of failed sync logs
        """
        failed_syncs = self.get_queryset().filter(status='FAILED')
        serializer = self.get_serializer(failed_syncs, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get synchronization statistics.

        Returns counts by sync type and status.

        Returns:
            - by_type: Counts grouped by sync type
            - by_status: Counts grouped by status
            - recent_failures: Count of failures in last 24 hours
            - success_rate: Overall success percentage
        """
        from django.utils import timezone
        from datetime import timedelta

        queryset = self.get_queryset()

        # Counts by type and status
        by_type_status = queryset.values('sync_type', 'status').annotate(
            count=Count('id')
        )

        # Group by type
        by_type = queryset.values('sync_type').annotate(
            count=Count('id')
        )

        # Group by status
        by_status = queryset.values('status').annotate(
            count=Count('id')
        )

        # Recent failures (last 24 hours)
        yesterday = timezone.now() - timedelta(days=1)
        recent_failures = queryset.filter(
            status='FAILED',
            created_at__gte=yesterday
        ).count()

        # Success rate
        total = queryset.count()
        successful = queryset.filter(status='SUCCESS').count()
        success_rate = round((successful / total * 100), 2) if total > 0 else 0

        return Response({
            'statistics': list(by_type_status),
            'by_type': list(by_type),
            'by_status': list(by_status),
            'recent_failures': recent_failures,
            'success_rate': success_rate,
            'total_syncs': total
        }, status=status.HTTP_200_OK)
