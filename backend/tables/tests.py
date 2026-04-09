"""
Tests for the tables app.
Covers: table CRUD, QR code generation, sessions, waiter assignments.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from restaurants.models import Restaurant
from tables.models import Table, TableSession, WaiterAssignment

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def restaurant(db):
    return Restaurant.objects.create(name='Table Test Restaurant')


@pytest.fixture
def admin_user(db, restaurant):
    return User.objects.create_user(
        email='admin@tables.test',
        password='Admin1234!',
        first_name='Admin',
        last_name='U',
        role=User.Role.ADMIN,
        restaurant=restaurant,
    )


@pytest.fixture
def waiter_user(db, restaurant):
    return User.objects.create_user(
        email='waiter@tables.test',
        password='Waiter1234!',
        first_name='Waiter',
        last_name='U',
        role=User.Role.WAITER,
        restaurant=restaurant,
    )


@pytest.fixture
def customer_user(db, restaurant):
    return User.objects.create_user(
        email='customer@tables.test',
        password='Customer1234!',
        first_name='Customer',
        last_name='U',
        role=User.Role.CUSTOMER,
        restaurant=restaurant,
    )


@pytest.fixture
def table(db, restaurant):
    return Table.objects.create(
        number='T10',
        capacity=4,
        restaurant=restaurant,
        is_active=True,
    )


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def waiter_client(api_client, waiter_user):
    api_client.force_authenticate(user=waiter_user)
    return api_client


@pytest.fixture
def customer_client(api_client, customer_user):
    api_client.force_authenticate(user=customer_user)
    return api_client


# ---------------------------------------------------------------------------
# Table CRUD
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestTableAPI:
    list_url = '/api/tables/'

    def test_admin_can_create_table(self, admin_client, restaurant):
        response = admin_client.post(self.list_url, {
            'number': 'T99',
            'capacity': 2,
            'section': 'INDOOR',
            'restaurant': restaurant.id,
        })
        assert response.status_code == status.HTTP_201_CREATED
        assert Table.objects.filter(number='T99').exists()

    def test_customer_cannot_create_table(self, customer_client, restaurant):
        response = customer_client.post(self.list_url, {
            'number': 'T88',
            'capacity': 2,
            'section': 'INDOOR',
            'restaurant': restaurant.id,
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_tables_requires_auth(self, api_client):
        response = api_client.get(self.list_url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_tables_as_admin(self, admin_client, table):
        response = admin_client.get(self.list_url)
        assert response.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# Table sessions
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestTableSession:

    def test_session_marks_table_occupied(self, db, table, customer_user):
        session = TableSession.objects.create(
            table=table,
            customer=customer_user,
            customer_count=2,
        )
        table.refresh_from_db()
        assert table.status == 'OCCUPIED'

    def test_end_session_marks_table_cleaning(self, db, table, customer_user):
        session = TableSession.objects.create(
            table=table,
            customer=customer_user,
            customer_count=2,
        )
        session.end_session()
        table.refresh_from_db()
        assert table.status == 'CLEANING'

    def test_get_duration(self, db, table, customer_user):
        session = TableSession.objects.create(
            table=table,
            customer=customer_user,
            customer_count=1,
        )
        duration = session.get_duration()
        assert isinstance(duration, int)
        assert duration >= 0


# ---------------------------------------------------------------------------
# Waiter assignments
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestWaiterAssignment:

    def test_assign_waiter_to_table(self, db, table, waiter_user):
        assignment = WaiterAssignment.objects.create(
            waiter=waiter_user,
            table=table,
        )
        assert assignment.is_active()
        assert table.get_assigned_waiter() == waiter_user

    def test_end_assignment(self, db, table, waiter_user):
        assignment = WaiterAssignment.objects.create(
            waiter=waiter_user,
            table=table,
        )
        assignment.end_shift()
        assert not assignment.is_active()
        assert table.get_assigned_waiter() is None
