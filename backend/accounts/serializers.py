from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

from .models import UserProfile

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer that includes user role and info."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['role'] = user.role
        token['email'] = user.email
        token['full_name'] = user.get_full_name()
        if user.restaurant_id:
            token['restaurant_id'] = user.restaurant_id

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Add extra user info to response
        user_data = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'is_active': self.user.is_active,
        }
        if self.user.restaurant_id:
            user_data['restaurant'] = {
                'id': self.user.restaurant.id,
                'name': self.user.restaurant.name,
            }
        data['user'] = user_data

        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""

    class Meta:
        model = UserProfile
        fields = [
            'preferred_language',
            'dietary_preferences',
            'allergies',
            'employee_id',
            'shift_start',
            'shift_end',
        ]


class UserRestaurantSerializer(serializers.Serializer):
    """Inline serializer for restaurant info in user responses."""
    id = serializers.IntegerField()
    name = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""

    profile = UserProfileSerializer(read_only=True)
    restaurant_detail = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'avatar',
            'role',
            'restaurant',
            'restaurant_detail',
            'is_active',
            'created_at',
            'updated_at',
            'profile',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_active']

    def get_restaurant_detail(self, obj):
        if obj.restaurant:
            return {'id': obj.restaurant.id, 'name': obj.restaurant.name}
        return None


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'phone_number',
            'role',
        ]

    def validate(self, attrs):
        """Validate passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def validate_role(self, value):
        """Ensure regular registration only allows CUSTOMER role."""
        # Only allow CUSTOMER role for public registration
        # Admins and Waiters must be created by admin
        if value != User.Role.CUSTOMER:
            raise serializers.ValidationError(
                "Only customer registration is allowed through this endpoint."
            )
        return value

    def create(self, validated_data):
        """Create new user."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""

    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'phone_number',
            'avatar',
            'profile',
        ]

    def update(self, instance, validated_data):
        """Update user and profile."""
        profile_data = validated_data.pop('profile', None)

        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update profile fields
        if profile_data and hasattr(instance, 'profile'):
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password."""

    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate_old_password(self, value):
        """Validate old password is correct."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate(self, attrs):
        """Validate new passwords match."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {"new_password": "New password fields didn't match."}
            )
        return attrs

    def save(self):
        """Change user password."""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Serializer for admin creating users (can create any role)."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'email',
            'password',
            'first_name',
            'last_name',
            'phone_number',
            'role',
            'restaurant',
            'is_active',
        ]

    def create(self, validated_data):
        """Create new user with specified role."""
        password = validated_data.pop('password')
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin updating users."""

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'phone_number',
            'role',
            'restaurant',
            'is_active',
            'avatar',
        ]
