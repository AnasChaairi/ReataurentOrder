"""
Celery Tasks for Odoo Integration

Async tasks for:
- Order synchronization to Odoo POS
- Menu synchronization from Odoo
- Table synchronization from Odoo
- Retry failed syncs
"""

import logging
from celery import shared_task
from django.utils import timezone
from django.db import models

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def sync_order_to_odoo(self, order_id: int, user_id: int = None):
    """
    Async task to push Django order to Odoo POS.

    Auto-retries on transient errors with exponential backoff.

    Args:
        order_id: Django Order ID
        user_id: User who triggered sync (None for automatic)

    Returns:
        Dict with 'status', 'odoo_order_id', 'sync_log_id'

    Raises:
        Exception: Re-raises exception to trigger Celery retry
    """
    from orders.models import Order
    from accounts.models import User
    from .django_services import OdooConnectionService, OdooOrderSyncService

    try:
        logger.info(f"Starting Odoo sync for order {order_id}")

        # Get order
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            logger.error(f"Order {order_id} not found")
            return {'status': 'error', 'message': 'Order not found'}

        # Get active Odoo config
        config = OdooConnectionService.get_active_config()
        if not config:
            logger.error("No active Odoo configuration found")
            return {'status': 'error', 'message': 'No active Odoo configuration'}

        # Check if auto-sync is enabled
        if not config.auto_sync_orders:
            logger.info(f"Auto-sync is disabled for config {config.name}")
            return {'status': 'skipped', 'message': 'Auto-sync disabled'}

        # Get user if provided
        user = None
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                logger.warning(f"User {user_id} not found, syncing without user")

        # Sync order
        service = OdooOrderSyncService(config)
        sync_log = service.sync_order_to_odoo(order, user)

        logger.info(f"Successfully synced order {order.order_number} to Odoo (ID: {sync_log.odoo_id})")

        return {
            'status': 'success',
            'odoo_order_id': sync_log.odoo_id,
            'sync_log_id': sync_log.id
        }

    except Exception as exc:
        logger.error(f"Failed to sync order {order_id} to Odoo: {exc}")

        # Retry with exponential backoff: 60s, 300s (5m), 900s (15m)
        retry_delay = 60 * (5 ** self.request.retries)
        logger.info(f"Scheduling retry in {retry_delay} seconds (attempt {self.request.retries + 1}/{self.max_retries})")

        raise self.retry(exc=exc, countdown=retry_delay)


@shared_task
def sync_menu_from_odoo():
    """
    Nightly task to synchronize menu from Odoo to Django.

    Fetches all POS-available products from Odoo and creates/updates
    Django menu items and categories.

    Returns:
        Dict with sync statistics
    """
    from .django_services import OdooConnectionService, OdooMenuSyncService

    try:
        logger.info("Starting nightly menu sync from Odoo")

        # Get active config
        config = OdooConnectionService.get_active_config()
        if not config:
            logger.warning("No active Odoo configuration found, skipping menu sync")
            return {'status': 'skipped', 'reason': 'No active configuration'}

        # Check if menu sync is enabled
        if not config.sync_menu_enabled:
            logger.info(f"Menu sync is disabled for config {config.name}")
            return {'status': 'skipped', 'reason': 'Menu sync disabled in configuration'}

        # Perform sync
        service = OdooMenuSyncService(config)
        result = service.sync_menu_from_odoo(user=None)

        logger.info(f"Menu sync completed successfully: {result}")
        return {
            'status': 'success',
            **result
        }

    except Exception as e:
        logger.error(f"Menu sync failed: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


@shared_task
def sync_tables_from_odoo():
    """
    Nightly task to synchronize tables from Odoo to Django.

    Fetches restaurant floors and tables from Odoo and creates/updates
    Django Table instances.

    Returns:
        Dict with sync statistics
    """
    from .django_services import OdooConnectionService, OdooTableSyncService

    try:
        logger.info("Starting nightly table sync from Odoo")

        # Get active config
        config = OdooConnectionService.get_active_config()
        if not config:
            logger.warning("No active Odoo configuration found, skipping table sync")
            return {'status': 'skipped', 'reason': 'No active configuration'}

        # Check if table sync is enabled
        if not config.sync_tables_enabled:
            logger.info(f"Table sync is disabled for config {config.name}")
            return {'status': 'skipped', 'reason': 'Table sync disabled in configuration'}

        # Perform sync
        service = OdooTableSyncService(config)
        result = service.sync_tables_from_odoo(user=None)

        logger.info(f"Table sync completed successfully: {result}")
        return {
            'status': 'success',
            **result
        }

    except Exception as e:
        logger.error(f"Table sync failed: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


@shared_task
def retry_failed_syncs():
    """
    Periodic task to retry failed synchronizations.

    Runs every 15 minutes. Finds syncs with status='RETRYING'
    that are ready for retry (next_retry_at <= now) and re-triggers them.

    Returns:
        Dict with number of syncs retried
    """
    from .models import OdooSyncLog

    try:
        logger.info("Checking for failed syncs to retry")

        # Get syncs ready for retry
        now = timezone.now()
        failed_syncs = OdooSyncLog.objects.filter(
            status='RETRYING',
            next_retry_at__lte=now,
            retry_count__lt=models.F('max_retries')
        ).select_related('order')

        retried_count = 0

        for sync_log in failed_syncs:
            logger.info(f"Retrying sync log {sync_log.id} (type: {sync_log.sync_type})")

            try:
                if sync_log.sync_type == 'ORDER_PUSH' and sync_log.order:
                    # Retry order sync
                    sync_order_to_odoo.apply_async(
                        args=[sync_log.order.id],
                        countdown=5  # Small delay to avoid immediate retry
                    )
                    retried_count += 1

                elif sync_log.sync_type == 'MENU_SYNC':
                    # Retry menu sync
                    sync_menu_from_odoo.apply_async(countdown=5)
                    retried_count += 1

                elif sync_log.sync_type == 'TABLE_SYNC':
                    # Retry table sync
                    sync_tables_from_odoo.apply_async(countdown=5)
                    retried_count += 1

            except Exception as e:
                logger.error(f"Failed to trigger retry for sync log {sync_log.id}: {e}")

        logger.info(f"Retry check completed. Retried {retried_count} syncs.")

        return {
            'status': 'success',
            'retried': retried_count
        }

    except Exception as e:
        logger.error(f"Failed to retry syncs: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e),
            'retried': 0
        }
