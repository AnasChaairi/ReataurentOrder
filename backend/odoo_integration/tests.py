"""
Tests for the odoo_integration app.
Covers: OdooSyncLog retry logic, OdooConfig admin access, task dispatch.
"""
import pytest
from decimal import Decimal
from unittest.mock import patch, MagicMock
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from restaurants.models import Restaurant
from odoo_integration.models import OdooConfig, OdooSyncLog

User = get_user_model()


@pytest.fixture
def restaurant(db):
    return Restaurant.objects.create(name='Odoo Test Restaurant')


@pytest.fixture
def odoo_config(db, restaurant):
    config = OdooConfig.objects.create(
        name='Test Odoo',
        url='http://odoo.test',
        database='test_db',
        username='admin',
        password='secret',
        is_active=True,
        auto_sync_orders=True,
    )
    restaurant.odoo_config = config
    restaurant.save()
    return config


@pytest.fixture
def admin_user(db, restaurant):
    return User.objects.create_user(
        email='admin@odoo.test',
        password='Admin1234!',
        first_name='Admin',
        last_name='U',
        role=User.Role.ADMIN,
        restaurant=restaurant,
    )


# ---------------------------------------------------------------------------
# OdooSyncLog retry logic
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestOdooSyncLogRetry:

    def test_can_retry_when_below_max(self, db, odoo_config):
        log = OdooSyncLog.objects.create(
            sync_type='ORDER_PUSH',
            status='FAILED',
            odoo_config=odoo_config,
            retry_count=1,
            max_retries=3,
        )
        assert log.can_retry()

    def test_cannot_retry_when_at_max(self, db, odoo_config):
        log = OdooSyncLog.objects.create(
            sync_type='ORDER_PUSH',
            status='FAILED',
            odoo_config=odoo_config,
            retry_count=3,
            max_retries=3,
        )
        assert not log.can_retry()

    def test_schedule_retry_sets_next_retry_at(self, db, odoo_config):
        log = OdooSyncLog.objects.create(
            sync_type='ORDER_PUSH',
            status='FAILED',
            odoo_config=odoo_config,
            retry_count=0,
            max_retries=3,
        )
        log.schedule_retry()
        log.refresh_from_db()
        assert log.next_retry_at is not None
        assert log.status == 'RETRYING'
        assert log.retry_count == 1

    def test_mark_success(self, db, odoo_config):
        log = OdooSyncLog.objects.create(
            sync_type='ORDER_PUSH',
            status='PENDING',
            odoo_config=odoo_config,
        )
        log.mark_success(odoo_id=42)
        assert log.status == 'SUCCESS'
        assert log.odoo_id == 42
        assert log.completed_at is not None

    def test_mark_failed(self, db, odoo_config):
        log = OdooSyncLog.objects.create(
            sync_type='ORDER_PUSH',
            status='PENDING',
            odoo_config=odoo_config,
        )
        log.mark_failed(error_message='Connection refused')
        assert log.status == 'FAILED'
        assert 'Connection refused' in log.error_message


# ---------------------------------------------------------------------------
# Odoo settings API
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestOdooSettingsAPI:
    url = '/api/odoo/settings/'

    def test_admin_can_list_configs(self, db, odoo_config, admin_user):
        client = APIClient()
        client.force_authenticate(user=admin_user)
        response = client.get(self.url)
        assert response.status_code == status.HTTP_200_OK

    def test_unauthenticated_cannot_access(self, db, odoo_config):
        client = APIClient()
        response = client.get(self.url)
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# Celery task dispatch (unit test with mocked Celery)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_order_create_dispatches_celery_task(restaurant, odoo_config):
    """Creating an order via the API enqueues the Celery sync task, not a blocking call."""
    from django.contrib.auth import get_user_model
    from rest_framework.test import APIClient
    from menu.models import Category, MenuItem
    from tables.models import Table

    User = get_user_model()
    category = Category.objects.create(name='Test', restaurant=restaurant, is_active=True)
    item = MenuItem.objects.create(
        name='Item', category=category, restaurant=restaurant,
        description='d', price=Decimal('10.00'), is_available=True,
    )
    table = Table.objects.create(number='O1', capacity=2, restaurant=restaurant)

    with patch('odoo_integration.tasks.sync_order_to_odoo.delay') as mock_delay:
        client = APIClient()
        response = client.post('/api/orders/', {
            'table': table.id,
            'items': [{'menu_item': item.id, 'quantity': 1}],
        }, format='json')

    assert response.status_code == status.HTTP_201_CREATED
    # The task must have been enqueued (delay called), not executed synchronously
    mock_delay.assert_called_once()
