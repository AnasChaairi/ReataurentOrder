"""
Tests for the analytics app.
Covers: admin-only access, basic dashboard response shape.
"""
import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from restaurants.models import Restaurant

User = get_user_model()

DASHBOARD_URL = '/api/admin/dashboard/'


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def restaurant(db):
    return Restaurant.objects.create(name='Analytics Restaurant')


@pytest.fixture
def admin_user(db, restaurant):
    return User.objects.create_user(
        email='admin@analytics.test',
        password='Admin1234!',
        first_name='Admin',
        last_name='U',
        role=User.Role.ADMIN,
        restaurant=restaurant,
    )


@pytest.fixture
def customer_user(db, restaurant):
    return User.objects.create_user(
        email='customer@analytics.test',
        password='Customer1234!',
        first_name='Cust',
        last_name='U',
        role=User.Role.CUSTOMER,
        restaurant=restaurant,
    )


@pytest.mark.django_db
def test_dashboard_requires_auth(api_client):
    response = api_client.get(DASHBOARD_URL)
    assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.django_db
def test_dashboard_rejects_customers(api_client, customer_user):
    api_client.force_authenticate(user=customer_user)
    response = api_client.get(DASHBOARD_URL)
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_dashboard_returns_data_for_admin(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    response = api_client.get(DASHBOARD_URL)
    assert response.status_code == status.HTTP_200_OK
    # Response must include these top-level keys
    for key in ('total_orders', 'total_revenue', 'active_tables'):
        assert key in response.data, f"Missing key: {key}"
