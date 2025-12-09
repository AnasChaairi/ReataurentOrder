from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TableViewSet,
    WaiterAssignmentViewSet,
    TableSessionViewSet,
    waiter_dashboard,
    my_assigned_tables
)

router = DefaultRouter()
router.register(r'tables', TableViewSet, basename='table')
router.register(r'assignments', WaiterAssignmentViewSet, basename='waiter-assignment')
router.register(r'sessions', TableSessionViewSet, basename='table-session')

urlpatterns = [
    path('', include(router.urls)),
    path('waiters/dashboard/', waiter_dashboard, name='waiter-dashboard'),
    path('waiters/me/tables/', my_assigned_tables, name='my-tables'),
]
