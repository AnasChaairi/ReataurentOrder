from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomTokenObtainPairView,
    CookieTokenRefreshView,
    AuthStatusView,
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
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('me/', AuthStatusView.as_view(), name='auth-status'),

    # Profile management
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('profile/update/', UserProfileUpdateView.as_view(), name='profile-update'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),

    # Admin user management
    path('', include(router.urls)),
]
