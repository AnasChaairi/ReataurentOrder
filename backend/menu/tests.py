"""
Tests for the menu app.
Covers: category/item CRUD, permissions, caching, slug generation.
"""
import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from restaurants.models import Restaurant
from menu.models import Category, MenuItem
from menu.cache import MenuCache

User = get_user_model()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def restaurant(db):
    return Restaurant.objects.create(name='Test Restaurant')


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email='admin@menu.test',
        password='Admin1234!',
        first_name='Admin',
        last_name='U',
        role=User.Role.ADMIN,
    )


@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        email='customer@menu.test',
        password='Customer1234!',
        first_name='Cust',
        last_name='U',
        role=User.Role.CUSTOMER,
    )


@pytest.fixture
def category(db, restaurant):
    return Category.objects.create(
        name='Starters',
        restaurant=restaurant,
        is_active=True,
    )


@pytest.fixture
def menu_item(db, category, restaurant):
    return MenuItem.objects.create(
        name='Soup',
        category=category,
        restaurant=restaurant,
        description='Hot soup',
        price=Decimal('9.99'),
        is_available=True,
    )


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def customer_client(api_client, customer_user, restaurant):
    customer_user.restaurant = restaurant
    customer_user.save()
    api_client.force_authenticate(user=customer_user)
    return api_client


# ---------------------------------------------------------------------------
# Category tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestCategoryAPI:
    list_url = '/api/menu/categories/'

    def test_list_categories_public(self, api_client, category):
        response = api_client.get(self.list_url)
        assert response.status_code == status.HTTP_200_OK

    def test_list_categories_filters_by_restaurant(self, api_client, category, restaurant):
        response = api_client.get(self.list_url, {'restaurant': restaurant.id})
        assert response.status_code == status.HTTP_200_OK
        slugs = [c['slug'] for c in response.data]
        assert category.slug in slugs

    def test_create_category_requires_admin(self, customer_client, restaurant):
        response = customer_client.post(self.list_url, {
            'name': 'Desserts',
            'restaurant': restaurant.id,
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_create_category(self, admin_client, restaurant):
        response = admin_client.post(self.list_url, {
            'name': 'Desserts',
            'restaurant': restaurant.id,
        })
        assert response.status_code == status.HTTP_201_CREATED
        assert Category.objects.filter(name='Desserts').exists()

    def test_slug_auto_generated(self, admin_client, restaurant):
        response = admin_client.post(self.list_url, {
            'name': 'Hot Drinks',
            'restaurant': restaurant.id,
        })
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['slug'] == 'hot-drinks'


# ---------------------------------------------------------------------------
# MenuItem tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestMenuItemAPI:
    list_url = '/api/menu/items/'

    def test_list_items_public(self, api_client, menu_item):
        response = api_client.get(self.list_url)
        assert response.status_code == status.HTTP_200_OK

    def test_list_hides_unavailable_from_customers(self, customer_client, category, restaurant):
        MenuItem.objects.create(
            name='Hidden Item',
            category=category,
            restaurant=restaurant,
            description='desc',
            price=Decimal('5.00'),
            is_available=False,
        )
        response = customer_client.get(self.list_url)
        names = [i['name'] for i in response.data.get('results', response.data)]
        assert 'Hidden Item' not in names

    def test_admin_sees_unavailable_items(self, admin_client, category, restaurant):
        MenuItem.objects.create(
            name='Admin Only Item',
            category=category,
            restaurant=restaurant,
            description='desc',
            price=Decimal('5.00'),
            is_available=False,
        )
        response = admin_client.get(self.list_url)
        names = [i['name'] for i in response.data.get('results', response.data)]
        assert 'Admin Only Item' in names

    def test_price_must_be_positive(self, admin_client, category, restaurant):
        response = admin_client.post(self.list_url, {
            'name': 'Bad Item',
            'category': category.id,
            'restaurant': restaurant.id,
            'description': 'desc',
            'price': '-1.00',
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Slug uniqueness / race-condition guard
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_slug_collision_gets_suffix(restaurant, category):
    """Two items with the same name in different restaurants must not collide."""
    restaurant2 = Restaurant.objects.create(name='Other Restaurant')
    category2 = Category.objects.create(name='Food', restaurant=restaurant2)

    item1 = MenuItem.objects.create(
        name='Burger', category=category, restaurant=restaurant,
        description='d', price=Decimal('10.00'),
    )
    item2 = MenuItem.objects.create(
        name='Burger', category=category2, restaurant=restaurant2,
        description='d', price=Decimal('10.00'),
    )
    # Both should have slugs and they should differ (one will get a suffix)
    assert item1.slug
    assert item2.slug
    # Under the same restaurant, a second item with same name gets a suffix
    item3 = MenuItem.objects.create(
        name='Burger', category=category, restaurant=restaurant,
        description='d', price=Decimal('10.00'),
    )
    assert item3.slug != item1.slug


# ---------------------------------------------------------------------------
# Cache invalidation
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_cache_invalidated_on_category_save(restaurant, category):
    """Saving a category should clear the cached category list."""
    MenuCache.set_category_list([{'id': 1}], restaurant_id=restaurant.id)
    assert MenuCache.get_category_list(restaurant_id=restaurant.id) is not None

    category.name = 'Updated Name'
    category.save()

    # Cache should be cleared
    assert MenuCache.get_category_list(restaurant_id=restaurant.id) is None


@pytest.mark.django_db
def test_cache_invalidated_on_menu_item_save(restaurant, menu_item):
    """Saving a menu item should clear the cached item list."""
    MenuCache.set_menu_item_list([{'id': 1}], restaurant_id=restaurant.id)
    assert MenuCache.get_menu_item_list(restaurant_id=restaurant.id) is not None

    menu_item.name = 'Updated Soup'
    menu_item.save()

    assert MenuCache.get_menu_item_list(restaurant_id=restaurant.id) is None
