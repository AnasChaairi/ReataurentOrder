import random
import string

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsAdmin
from restaurants.mixins import RestaurantScopedMixin
from .models import DeviceProfile
from .serializers import DeviceProfileSerializer, DeviceProfileCreateSerializer


class DeviceProfileViewSet(RestaurantScopedMixin, viewsets.ModelViewSet):
    """Admin-only CRUD for device profiles."""
    queryset = DeviceProfile.objects.select_related(
        'restaurant', 'table', 'odoo_config'
    ).prefetch_related('allowed_categories')
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return DeviceProfileCreateSerializer
        return DeviceProfileSerializer

    def get_queryset(self):
        return self.get_restaurant_queryset(
            DeviceProfile.objects.select_related(
                'restaurant', 'table', 'odoo_config'
            ).prefetch_related('allowed_categories')
        )

    @action(detail=True, methods=['post'])
    def regenerate_passcode(self, request, pk=None):
        """Generate a new random 6-digit passcode. Returns it plaintext once."""
        device = self.get_object()
        new_passcode = ''.join(random.choices(string.digits, k=6))
        device.set_passcode(new_passcode)
        device.save(update_fields=['passcode_hash', 'updated_at'])
        return Response({'passcode': new_passcode})

    @action(detail=True, methods=['post'])
    def set_passcode(self, request, pk=None):
        """Admin sets a specific 4-6 digit passcode."""
        passcode = request.data.get('passcode', '')
        if not (4 <= len(passcode) <= 6) or not passcode.isdigit():
            return Response(
                {'error': 'Passcode must be 4-6 digits.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        device = self.get_object()
        device.set_passcode(passcode)
        device.save(update_fields=['passcode_hash', 'updated_at'])
        return Response({'message': 'Passcode updated.'})

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle is_active on a device profile."""
        device = self.get_object()
        device.is_active = not device.is_active
        device.save(update_fields=['is_active', 'updated_at'])
        return Response({'is_active': device.is_active})
