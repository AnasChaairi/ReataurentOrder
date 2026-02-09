import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)


def _get_order_data(order):
    """Serialize order data for WebSocket messages."""
    return {
        'id': order.id,
        'order_number': order.order_number,
        'status': order.status,
        'table_id': order.table_id,
        'table_number': order.table.number,
        'total_amount': str(order.total_amount),
        'items_count': order.items.count(),
        'items': [
            {
                'name': item.item_name,
                'quantity': item.quantity,
                'special_instructions': item.special_instructions,
            }
            for item in order.items.all()
        ],
        'customer_notes': order.customer_notes,
        'created_at': order.created_at.isoformat() if order.created_at else None,
    }


def notify_order_created(order):
    """Notify kitchen and waiter when a new order is created."""
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    order_data = _get_order_data(order)

    # Notify kitchen
    async_to_sync(channel_layer.group_send)(
        'kitchen',
        {
            'type': 'order_created',
            'order': order_data,
        },
    )

    # Notify assigned waiter
    if order.waiter_id:
        async_to_sync(channel_layer.group_send)(
            f'waiter_{order.waiter_id}',
            {
                'type': 'order_created',
                'order': order_data,
            },
        )

    logger.info('Sent order_created notifications for %s', order.order_number)


def notify_order_status_change(order, old_status, new_status):
    """Notify relevant groups when order status changes."""
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    order_data = _get_order_data(order)

    message = {
        'type': 'order_status_changed',
        'order': order_data,
        'old_status': old_status,
        'new_status': new_status,
    }

    # Notify the table (tablet)
    async_to_sync(channel_layer.group_send)(
        f'table_{order.table_id}',
        message,
    )

    # Notify kitchen
    async_to_sync(channel_layer.group_send)(
        'kitchen',
        message,
    )

    # Notify assigned waiter
    if order.waiter_id:
        async_to_sync(channel_layer.group_send)(
            f'waiter_{order.waiter_id}',
            message,
        )

    logger.info(
        'Sent order_status_changed notifications for %s: %s -> %s',
        order.order_number, old_status, new_status,
    )


def notify_order_cancelled(order, reason=''):
    """Notify relevant groups when order is cancelled."""
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    order_data = _get_order_data(order)

    message = {
        'type': 'order_cancelled',
        'order': order_data,
        'reason': reason,
    }

    # Notify table, kitchen, and waiter
    async_to_sync(channel_layer.group_send)(
        f'table_{order.table_id}',
        message,
    )
    async_to_sync(channel_layer.group_send)(
        'kitchen',
        message,
    )
    if order.waiter_id:
        async_to_sync(channel_layer.group_send)(
            f'waiter_{order.waiter_id}',
            message,
        )

    logger.info('Sent order_cancelled notifications for %s', order.order_number)
