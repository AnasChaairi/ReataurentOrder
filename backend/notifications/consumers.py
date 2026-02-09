import json
import logging

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)


class OrderNotificationConsumer(AsyncJsonWebsocketConsumer):
    """WebSocket consumer for real-time order notifications.

    Groups:
    - table_{id}: tablet gets order status updates
    - kitchen: kitchen display gets new orders and status changes
    - waiter_{id}: waiter gets notifications for assigned tables
    """

    async def connect(self):
        self.notification_type = self.scope['url_route']['kwargs'].get('type', '')
        self.target_id = self.scope['url_route']['kwargs'].get('id', '')

        if self.notification_type == 'table':
            self.group_name = f'table_{self.target_id}'
        elif self.notification_type == 'kitchen':
            self.group_name = 'kitchen'
        elif self.notification_type == 'waiter':
            self.group_name = f'waiter_{self.target_id}'
        else:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name,
        )
        await self.accept()

        logger.info('WebSocket connected: group=%s', self.group_name)

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name,
            )
            logger.info('WebSocket disconnected: group=%s', self.group_name)

    async def receive_json(self, content, **kwargs):
        # Clients can send ping to keep connection alive
        msg_type = content.get('type', '')
        if msg_type == 'ping':
            await self.send_json({'type': 'pong'})

    # --- Event handlers for group_send messages ---

    async def order_created(self, event):
        """New order created."""
        await self.send_json({
            'type': 'order_created',
            'order': event['order'],
        })

    async def order_status_changed(self, event):
        """Order status updated."""
        await self.send_json({
            'type': 'order_status_changed',
            'order': event['order'],
            'old_status': event.get('old_status', ''),
            'new_status': event.get('new_status', ''),
        })

    async def order_cancelled(self, event):
        """Order cancelled."""
        await self.send_json({
            'type': 'order_cancelled',
            'order': event['order'],
            'reason': event.get('reason', ''),
        })

    async def notification(self, event):
        """Generic notification."""
        await self.send_json({
            'type': 'notification',
            'message': event.get('message', ''),
            'data': event.get('data', {}),
        })
