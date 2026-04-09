from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import DeviceProfileViewSet

router = DefaultRouter()
router.register(r'devices', DeviceProfileViewSet, basename='devices')

urlpatterns = [
    path('', include(router.urls)),
]
