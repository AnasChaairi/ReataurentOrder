"""
Tests for the orders app.
Covers: creation, price calculation, status transitions, permissions,
        cancellation, and idempotency of status changes.
"""
import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status as http_status

from restaurants.models import Restaurant
from menu.models import Category, MenuItem
from tables.models import Table, TableSession
from orders.models import Order, OrderItem, OrderEvent

User = get_user_model()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def restaurant(db):
    return Restaurant.objects.create(name='Order Test Restaurant')


@pytest.fixture
def admin_user(db, restaurant):
    return User.objects.create_user(
        email='admin@orders.test',
        password='Admin1234!',
        first_name='Admin',
        last_name='U',
        role=User.Role.ADMIN,
        restaurant=restaurant,
    )


@pytest.fixture
def customer_user(db, restaurant):
    return User.objects.create_user(
        email='customer@orders.test',
        password='Customer1234!',
        first_name='Cust',
        last_name='U',
        role=User.Role.CUSTOMER,
        restaurant=restaurant,
    )


@pytest.fixture
def waiter_user(db, restaurant):
    return User.objects.create_user(
        email='waiter@orders.test',
        password='Waiter1234!',
        first_name='Waiter',
        last_name='U',
        role=User.Role.WAITER,
        restaurant=restaurant,
    )


@pytest.fixture
def category(db, restaurant):
    return Category.objects.create(name='Mains', restaurant=restaurant, is_active=True)


@pytest.fixture
def menu_item(db, category, restaurant):
    return MenuItem.objects.create(
        name='Pizza',
        category=category,
        restaurant=restaurant,
        description='Thin crust',
        price=Decimal('12.00'),
        is_available=True,
    )


@pytest.fixture
def table(db, restaurant):
    return Table.objects.create(
        number='T1',
        capacity=4,
        restaurant=restaurant,
        is_active=True,
    )


@pytest.fixture
def order(db, table, customer_user, restaurant):
    o = Order(
        table=table,
        customer=customer_user,
        restaurant=restaurant,
    )
    o.save()
    return o


@pytest.fixture
def order_with_item(db, order, menu_item):
    item = OrderItem.objects.create(
        order=order,
        menu_item=menu_item,
        quantity=2,
        addons_price=Decimal('0.00'),
    )
    order.calculate_totals()
    return order


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def customer_client(api_client, customer_user):
    api_client.force_authenticate(user=customer_user)
    return api_client


@pytest.fixture
def waiter_client(api_client, waiter_user):
    api_client.force_authenticate(user=waiter_user)
    return api_client


# ---------------------------------------------------------------------------
# Price calculation
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestPriceCalculation:

    def test_order_item_snapshots_price(self, order, menu_item):
        item = OrderItem.objects.create(
            order=order,
            menu_item=menu_item,
            quantity=1,
            addons_price=Decimal('0.00'),
        )
        assert item.base_price == menu_item.price
        assert item.unit_price == menu_item.price
        assert item.total_price == menu_item.price

    def test_order_item_quantity_multiplies_total(self, order, menu_item):
        item = OrderItem.objects.create(
            order=order,
            menu_item=menu_item,
            quantity=3,
            addons_price=Decimal('0.00'),
        )
        assert item.total_price == menu_item.price * 3

    def test_calculate_totals_includes_tax(self, order_with_item):
        """Total = subtotal + 10% tax."""
        order = order_with_item
        expected_subtotal = Decimal('24.00')  # 2 × 12.00
        expected_tax = expected_subtotal * Decimal('0.10')
        expected_total = expected_subtotal + expected_tax
        assert order.subtotal == expected_subtotal
        assert order.tax == expected_tax
        assert order.total_amount == expected_total

    def test_item_name_snapshotted(self, order, menu_item):
        item = OrderItem.objects.create(
            order=order,
            menu_item=menu_item,
            quantity=1,
            addons_price=Decimal('0.00'),
        )
        # Change the live menu item name — snapshot must not change
        menu_item.name = 'Renamed Pizza'
        menu_item.save()
        item.refresh_from_db()
        assert item.item_name == 'Pizza'


# ---------------------------------------------------------------------------
# Order creation via API
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestOrderCreation:
    url = '/api/orders/'

    def test_create_order_anonymous(self, api_client, table, menu_item):
        """Anonymous (tablet) users can place orders."""
        payload = {
            'table': table.id,
            'items': [{'menu_item': menu_item.id, 'quantity': 1}],
        }
        response = api_client.post(self.url, payload, format='json')
        assert response.status_code == http_status.HTTP_201_CREATED
        assert Order.objects.filter(table=table).exists()

    def test_create_order_generates_order_number(self, api_client, table, menu_item):
        payload = {
            'table': table.id,
            'items': [{'menu_item': menu_item.id, 'quantity': 1}],
        }
        response = api_client.post(self.url, payload, format='json')
        assert response.status_code == http_status.HTTP_201_CREATED
        order_number = response.data['order_number']
        assert order_number.startswith('ORD-')

    def test_create_order_empty_items_rejected(self, api_client, table):
        payload = {'table': table.id, 'items': []}
        response = api_client.post(self.url, payload, format='json')
        assert response.status_code == http_status.HTTP_400_BAD_REQUEST

    def test_create_order_unavailable_item_rejected(self, api_client, table, category, restaurant):
        unavailable = MenuItem.objects.create(
            name='Sold Out',
            category=category,
            restaurant=restaurant,
            description='d',
            price=Decimal('5.00'),
            is_available=False,
        )
        payload = {
            'table': table.id,
            'items': [{'menu_item': unavailable.id, 'quantity': 1}],
        }
        response = api_client.post(self.url, payload, format='json')
        assert response.status_code == http_status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Status transitions
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestOrderStatusTransitions:

    def test_pending_to_confirmed(self, order_with_item, waiter_client):
        url = f'/api/orders/{order_with_item.id}/verify/'
        response = waiter_client.post(url)
        assert response.status_code == http_status.HTTP_200_OK
        order_with_item.refresh_from_db()
        assert order_with_item.status == 'CONFIRMED'

    def test_customer_cannot_verify(self, order_with_item, customer_client):
        url = f'/api/orders/{order_with_item.id}/verify/'
        response = customer_client.post(url)
        assert response.status_code == http_status.HTTP_403_FORBIDDEN

    def test_cannot_verify_non_pending(self, order_with_item, waiter_client):
        order_with_item.status = 'CONFIRMED'
        order_with_item.save()
        url = f'/api/orders/{order_with_item.id}/verify/'
        response = waiter_client.post(url)
        assert response.status_code == http_status.HTTP_400_BAD_REQUEST

    def test_update_status_creates_event(self, order_with_item, waiter_client):
        url = f'/api/orders/{order_with_item.id}/verify/'
        waiter_client.post(url)
        assert OrderEvent.objects.filter(
            order=order_with_item,
            event_type='STATUS_CHANGE',
        ).exists()


# ---------------------------------------------------------------------------
# Cancellation
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestOrderCancellation:

    def test_customer_can_cancel_own_pending_order(self, order_with_item, customer_client):
        url = f'/api/orders/{order_with_item.id}/cancel/'
        response = customer_client.post(url, {'reason': 'Changed my mind'})
        assert response.status_code == http_status.HTTP_200_OK
        order_with_item.refresh_from_db()
        assert order_with_item.status == 'CANCELLED'

    def test_cannot_cancel_served_order(self, order_with_item, customer_client):
        order_with_item.status = 'SERVED'
        order_with_item.save()
        url = f'/api/orders/{order_with_item.id}/cancel/'
        response = customer_client.post(url)
        assert response.status_code == http_status.HTTP_400_BAD_REQUEST

    def test_customer_cannot_cancel_other_customers_order(self, db, order_with_item, restaurant, table, api_client):
        other = User.objects.create_user(
            email='other@test.com',
            password='Other1234!',
            first_name='Other',
            last_name='U',
            role=User.Role.CUSTOMER,
        )
        api_client.force_authenticate(user=other)
        url = f'/api/orders/{order_with_item.id}/cancel/'
        response = api_client.post(url)
        assert response.status_code == http_status.HTTP_403_FORBIDDEN


# ---------------------------------------------------------------------------
# Permission isolation
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestOrderPermissions:

    def test_customer_only_sees_own_orders(self, order_with_item, customer_client, db, restaurant, table, category):
        """Customer list must not include other customers' orders."""
        other_customer = User.objects.create_user(
            email='other2@test.com',
            password='Other1234!',
            first_name='Other',
            last_name='U',
            role=User.Role.CUSTOMER,
        )
        other_order = Order.objects.create(table=table, customer=other_customer, restaurant=restaurant)
        other_order.save()

        response = customer_client.get('/api/orders/')
        ids = [o['id'] for o in response.data.get('results', response.data)]
        assert order_with_item.id in ids
        assert other_order.id not in ids

    def test_unauthenticated_cannot_list_orders(self, api_client):
        response = api_client.get('/api/orders/')
        assert response.status_code == http_status.HTTP_200_OK
        # Returns empty queryset for unauthenticated users, not 401
        results = response.data.get('results', response.data)
        assert len(results) == 0
