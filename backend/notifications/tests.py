"""
Tests for the notifications app.
Covers: WebSocket consumer authentication and group-access rules.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model

from notifications.consumers import OrderNotificationConsumer

User = get_user_model()


def _make_scope(user, notification_type, target_id=''):
    return {
        'type': 'websocket',
        'url_route': {'kwargs': {'type': notification_type, 'id': target_id}},
        'user': user,
        'headers': [],
    }


def _make_consumer(scope):
    consumer = OrderNotificationConsumer()
    consumer.scope = scope
    consumer.channel_layer = AsyncMock()
    consumer.channel_name = 'test_channel'
    consumer.base_send = AsyncMock()
    return consumer


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_anonymous_connection_rejected(db):
    scope = _make_scope(AnonymousUser(), 'kitchen')
    consumer = _make_consumer(scope)
    consumer.close = AsyncMock()
    await consumer.connect()
    consumer.close.assert_called_once_with(code=4001)


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_customer_cannot_join_kitchen(db):
    user = await User.objects.acreate(
        email='customer_ws@test.com',
        first_name='C',
        last_name='U',
        role=User.Role.CUSTOMER,
    )
    scope = _make_scope(user, 'kitchen')
    consumer = _make_consumer(scope)
    consumer.close = AsyncMock()
    await consumer.connect()
    consumer.close.assert_called_once_with(code=4003)


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_waiter_can_join_kitchen(db):
    user = await User.objects.acreate(
        email='waiter_ws@test.com',
        first_name='W',
        last_name='U',
        role=User.Role.WAITER,
    )
    scope = _make_scope(user, 'kitchen')
    consumer = _make_consumer(scope)
    consumer.close = AsyncMock()
    consumer.accept = AsyncMock()
    consumer.channel_layer.group_add = AsyncMock()
    await consumer.connect()
    consumer.accept.assert_called_once()
    assert consumer.group_name == 'kitchen'


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_waiter_cannot_join_other_waiter_group(db):
    user = await User.objects.acreate(
        email='waiter_ws2@test.com',
        first_name='W',
        last_name='U',
        role=User.Role.WAITER,
    )
    # waiter with id X cannot subscribe to waiter_{X+1}
    wrong_id = str(user.id + 999)
    scope = _make_scope(user, 'waiter', target_id=wrong_id)
    consumer = _make_consumer(scope)
    consumer.close = AsyncMock()
    await consumer.connect()
    consumer.close.assert_called_once_with(code=4003)


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_waiter_can_join_own_group(db):
    user = await User.objects.acreate(
        email='waiter_ws3@test.com',
        first_name='W',
        last_name='U',
        role=User.Role.WAITER,
    )
    scope = _make_scope(user, 'waiter', target_id=str(user.id))
    consumer = _make_consumer(scope)
    consumer.close = AsyncMock()
    consumer.accept = AsyncMock()
    consumer.channel_layer.group_add = AsyncMock()
    await consumer.connect()
    consumer.accept.assert_called_once()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_any_authenticated_user_can_join_table_group(db):
    user = await User.objects.acreate(
        email='cust_table@test.com',
        first_name='C',
        last_name='U',
        role=User.Role.CUSTOMER,
    )
    scope = _make_scope(user, 'table', target_id='5')
    consumer = _make_consumer(scope)
    consumer.close = AsyncMock()
    consumer.accept = AsyncMock()
    consumer.channel_layer.group_add = AsyncMock()
    await consumer.connect()
    consumer.accept.assert_called_once()
    assert consumer.group_name == 'table_5'
