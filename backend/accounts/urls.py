from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    UserProfileView,
    UserProfileUpdateView,
    ChangePasswordView,
    LogoutView,
    AdminUserViewSet,
)

app_name = 'accounts'

# Router for admin user management
router = DefaultRouter()
router.register(r'admin/users', AdminUserViewSet, basename='admin-users')

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/register/', UserRegistrationView.as_view(), name='register'),

    # Profile management
    path('auth/profile/', UserProfileView.as_view(), name='profile'),
    path('auth/profile/update/', UserProfileUpdateView.as_view(), name='profile-update'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),

    # Admin user management
    path('', include(router.urls)),
]
