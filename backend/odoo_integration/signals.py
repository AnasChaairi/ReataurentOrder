"""
Django Signals for Odoo Integration

Signal handlers for automatic synchronization:
- Auto-sync orders to Odoo when confirmed by waiters
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from orders.models import Order
from .models import OdooConfig

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Order)
def sync_confirmed_order_to_odoo(sender, instance, created, **kwargs):
    """
    Auto-sync order to Odoo when status changes to CONFIRMED.

    New order creation sync is handled directly in OrderViewSet.perform_create().
    This signal only handles the CONFIRMED status change (e.g. waiter confirmation).
    """
    # Skip newly created orders — handled by the view
    if created:
        return

    # Only sync when status is CONFIRMED
    if instance.status != 'CONFIRMED':
        return

    # Skip if already synced to Odoo
    if instance.synced_to_odoo:
        logger.debug(f"Order {instance.order_number} already synced to Odoo (ID: {instance.odoo_order_id})")
        return

    # Check if there's an active Odoo configuration
    try:
        config = OdooConfig.objects.filter(is_active=True).first()
    except Exception as e:
        logger.error(f"Failed to get Odoo config: {e}")
        return

    if not config:
        logger.warning(
            f"No active Odoo configuration found. Order {instance.order_number} will not be synced automatically."
        )
        return

    # Check if auto-sync is enabled
    if not config.auto_sync_orders:
        logger.info(
            f"Auto-sync is disabled for Odoo config '{config.name}'. "
            f"Order {instance.order_number} will not be synced automatically."
        )
        return

    # Validate that all order items have Odoo product IDs
    try:
        missing_odoo_items = instance.items.filter(
            menu_item__odoo_product_id__isnull=True
        )

        if missing_odoo_items.exists():
            # Get list of menu items without Odoo IDs
            missing_items = [
                item.menu_item.name
                for item in missing_odoo_items.select_related('menu_item')
            ]

            error_msg = (
                f"Cannot sync order {instance.order_number} to Odoo: "
                f"The following menu items are not synced from Odoo: {', '.join(missing_items)}"
            )

            logger.warning(error_msg)

            # Update order with error message
            instance.odoo_sync_error = error_msg
            instance.save(update_fields=['odoo_sync_error'])

            return

    except Exception as e:
        logger.error(f"Failed to validate order items for Odoo sync: {e}")
        return

    # All checks passed - trigger async sync
    logger.info(
        f"Order {instance.order_number} confirmed and ready for Odoo sync. "
        f"Triggering async task..."
    )

    try:
        from .tasks import sync_order_to_odoo

        # Trigger async sync with 5 second delay
        # Delay ensures database transaction is fully committed
        task = sync_order_to_odoo.apply_async(
            args=[instance.id],
            countdown=5  # 5 second delay
        )

        logger.info(
            f"Odoo sync task triggered for order {instance.order_number} (task ID: {task.id})"
        )

    except Exception as e:
        logger.error(f"Failed to trigger Odoo sync task for order {instance.order_number}: {e}")
        instance.odoo_sync_error = f"Failed to trigger sync: {str(e)}"
        instance.save(update_fields=['odoo_sync_error'])
