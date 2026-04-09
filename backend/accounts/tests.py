"""
Tests for the accounts app.
Covers: registration, login, logout, token refresh, profile, permissions, role enforcement.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email='admin@test.com',
        password='Admin1234!',
        first_name='Admin',
        last_name='User',
        role=User.Role.ADMIN,
        is_staff=True,
        is_superuser=True,
    )


@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        email='customer@test.com',
        password='Customer1234!',
        first_name='John',
        last_name='Doe',
        role=User.Role.CUSTOMER,
    )


@pytest.fixture
def waiter_user(db):
    return User.objects.create_user(
        email='waiter@test.com',
        password='Waiter1234!',
        first_name='Jane',
        last_name='Smith',
        role=User.Role.WAITER,
    )


@pytest.fixture
def auth_client(api_client, customer_user):
    """API client authenticated as a customer (via force_authenticate)."""
    api_client.force_authenticate(user=customer_user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


# ---------------------------------------------------------------------------
# Registration tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestUserRegistration:
    url = '/api/auth/register/'

    def test_register_customer_success(self, api_client):
        payload = {
            'email': 'new@test.com',
            'password': 'NewUser1234!',
            'password_confirm': 'NewUser1234!',
            'first_name': 'New',
            'last_name': 'User',
            'phone_number': '+12125551234',
            'role': 'CUSTOMER',
        }
        response = api_client.post(self.url, payload)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['user']['role'] == 'CUSTOMER'
        assert User.objects.filter(email='new@test.com').exists()

    def test_register_rejects_admin_role(self, api_client):
        """Public registration must not allow ADMIN role."""
        payload = {
            'email': 'hacker@test.com',
            'password': 'Hacker1234!',
            'password_confirm': 'Hacker1234!',
            'first_name': 'Hacker',
            'last_name': 'Evil',
            'phone_number': '+12125550000',
            'role': 'ADMIN',
        }
        response = api_client.post(self.url, payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not User.objects.filter(email='hacker@test.com').exists()

    def test_register_rejects_waiter_role(self, api_client):
        payload = {
            'email': 'fakewaiter@test.com',
            'password': 'Waiter1234!',
            'password_confirm': 'Waiter1234!',
            'first_name': 'Fake',
            'last_name': 'Waiter',
            'phone_number': '+12125550001',
            'role': 'WAITER',
        }
        response = api_client.post(self.url, payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_mismatched_passwords(self, api_client):
        payload = {
            'email': 'mismatch@test.com',
            'password': 'Pass1234!',
            'password_confirm': 'Different1234!',
            'first_name': 'A',
            'last_name': 'B',
            'phone_number': '+12125550002',
        }
        response = api_client.post(self.url, payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_duplicate_email(self, api_client, customer_user):
        payload = {
            'email': customer_user.email,
            'password': 'Customer1234!',
            'password_confirm': 'Customer1234!',
            'first_name': 'Dup',
            'last_name': 'User',
            'phone_number': '+12125550003',
        }
        response = api_client.post(self.url, payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Login / Logout / Me tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAuthentication:
    login_url = '/api/auth/login/'
    logout_url = '/api/auth/logout/'
    me_url = '/api/auth/me/'

    def test_login_sets_cookies(self, api_client, customer_user):
        response = api_client.post(self.login_url, {
            'email': customer_user.email,
            'password': 'Customer1234!',
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access_token' in response.cookies
        assert 'refresh_token' in response.cookies
        assert response.cookies['access_token']['httponly']

    def test_login_wrong_password(self, api_client, customer_user):
        response = api_client.post(self.login_url, {
            'email': customer_user.email,
            'password': 'WrongPassword!',
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, api_client):
        response = api_client.post(self.login_url, {
            'email': 'nobody@test.com',
            'password': 'NoPass1234!',
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_ok(self, auth_client):
        response = auth_client.post(self.logout_url)
        assert response.status_code == status.HTTP_200_OK

    def test_me_returns_user(self, auth_client, customer_user):
        response = auth_client.get(self.me_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['email'] == customer_user.email

    def test_me_requires_auth(self, api_client):
        response = api_client.get(self.me_url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# Profile tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestUserProfile:
    profile_url = '/api/auth/profile/'
    update_url = '/api/auth/profile/update/'

    def test_get_profile(self, auth_client, customer_user):
        response = auth_client.get(self.profile_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == customer_user.email

    def test_update_profile_fields(self, auth_client):
        response = auth_client.put(self.update_url, {
            'first_name': 'Updated',
            'last_name': 'Name',
            'phone_number': '+12125559999',
        })
        assert response.status_code == status.HTTP_200_OK

    def test_profile_requires_auth(self, api_client):
        response = api_client.get(self.profile_url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# Admin user management
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAdminUserManagement:
    list_url = '/api/auth/admin/users/'

    def test_admin_can_list_users(self, admin_client, customer_user):
        response = admin_client.get(self.list_url)
        assert response.status_code == status.HTTP_200_OK

    def test_customer_cannot_list_users(self, auth_client):
        response = auth_client.get(self.list_url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_list_users(self, api_client):
        response = api_client.get(self.list_url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_admin_can_deactivate_user(self, admin_client, customer_user):
        url = f'{self.list_url}{customer_user.id}/deactivate/'
        response = admin_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        customer_user.refresh_from_db()
        assert not customer_user.is_active

    def test_admin_can_activate_user(self, admin_client, customer_user):
        customer_user.is_active = False
        customer_user.save()
        url = f'{self.list_url}{customer_user.id}/activate/'
        response = admin_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        customer_user.refresh_from_db()
        assert customer_user.is_active

    def test_user_profile_auto_created(self, customer_user):
        """UserProfile must be auto-created via signal."""
        assert hasattr(customer_user, 'profile')
        assert customer_user.profile is not None
