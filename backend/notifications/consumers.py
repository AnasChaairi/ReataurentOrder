import logging

from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)

# Roles that may connect to the kitchen group
_KITCHEN_ROLES = {'ADMIN', 'RESTAURANT_OWNER', 'WAITER'}


def _is_authenticated(scope) -> bool:
    user = scope.get('user')
    return user is not None and user.is_authenticated


def _user_role(scope) -> str:
    user = scope.get('user')
    return getattr(user, 'role', '') if user else ''


def _user_id(scope) -> int | None:
    user = scope.get('user')
    return getattr(user, 'id', None) if user else None


class OrderNotificationConsumer(AsyncJsonWebsocketConsumer):
    """WebSocket consumer for real-time order notifications.

    Groups:
    - table_{id}      : tablet gets order status updates (any authenticated user)
    - kitchen         : kitchen display — ADMIN / RESTAURANT_OWNER / WAITER only
    - waiter_{id}     : waiter gets notifications for assigned tables (own ID only)

    All connections require a valid JWT access_token cookie.
    """

    async def connect(self):
        if not _is_authenticated(self.scope):
            logger.warning('WebSocket rejected: unauthenticated connection attempt')
            await self.close(code=4001)
            return

        self.notification_type = self.scope['url_route']['kwargs'].get('type', '')
        self.target_id = self.scope['url_route']['kwargs'].get('id', '')
        role = _user_role(self.scope)
        uid = _user_id(self.scope)
        is_device = getattr(self.scope.get('user'), 'is_device', False)

        if self.notification_type == 'table':
            # Allow both regular users and device sessions to subscribe to table updates
            self.group_name = f'table_{self.target_id}'

        elif self.notification_type == 'kitchen':
            # Only staff may listen to kitchen orders
            if role not in _KITCHEN_ROLES:
                logger.warning(
                    'WebSocket rejected: user %s (role=%s) cannot join kitchen group', uid, role
                )
                await self.close(code=4003)
                return
            self.group_name = 'kitchen'

        elif self.notification_type == 'waiter':
            # Waiters may only subscribe to their own notifications;
            # admins and restaurant owners may subscribe to any waiter group.
            if role == 'WAITER' and str(uid) != str(self.target_id):
                logger.warning(
                    'WebSocket rejected: waiter %s tried to join waiter_%s group',
                    uid,
                    self.target_id,
                )
                await self.close(code=4003)
                return
            if role not in _KITCHEN_ROLES:
                logger.warning(
                    'WebSocket rejected: user %s (role=%s) cannot join waiter group', uid, role
                )
                await self.close(code=4003)
                return
            self.group_name = f'waiter_{self.target_id}'

        else:
            await self.close(code=4004)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info('WebSocket connected: user=%s group=%s', uid, self.group_name)

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            logger.info('WebSocket disconnected: group=%s code=%s', self.group_name, close_code)

    async def receive_json(self, content, **kwargs):
        # Clients can send ping to keep connection alive
        if content.get('type') == 'ping':
            await self.send_json({'type': 'pong'})

    # --- Event handlers for channel_layer group_send messages ---

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
