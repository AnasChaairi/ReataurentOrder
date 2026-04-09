"""
Project-wide pytest configuration.

Provides shared fixtures used across all apps.
"""
import django
import pytest

# ---------------------------------------------------------------------------
# Ensure pytest-asyncio works with Django ORM
# ---------------------------------------------------------------------------

pytest_plugins = []


@pytest.fixture(scope='session')
def django_db_setup():
    """Use the test database configured by pytest-django."""
    pass


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()
