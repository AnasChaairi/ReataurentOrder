from rest_framework import serializers

from menu.models import Category
from .models import DeviceProfile
from restaurants.models import Restaurant


class DeviceProfileSerializer(serializers.ModelSerializer):
    """Read serializer — includes computed/related fields."""
    allowed_category_ids = serializers.PrimaryKeyRelatedField(
        many=True, read_only=True, source='allowed_categories'
    )
    effective_odoo_config_id = serializers.SerializerMethodField()
    table_number = serializers.CharField(source='table.number', read_only=True, default=None)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)

    class Meta:
        model = DeviceProfile
        fields = [
            'id', 'name', 'device_id',
            'restaurant', 'restaurant_name',
            'table', 'table_number',
            'odoo_config', 'effective_odoo_config_id',
            'allowed_category_ids',
            'is_active', 'last_seen_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['device_id', 'last_seen_at', 'created_at', 'updated_at']

    def get_effective_odoo_config_id(self, obj):
        cfg = obj.effective_odoo_config
        return cfg.id if cfg else None


class DeviceProfileCreateSerializer(serializers.ModelSerializer):
    """Write serializer — accepts passcode plaintext, hashes on save."""
    passcode = serializers.CharField(
        write_only=True,
        min_length=4,
        max_length=6,
        help_text='4-6 digit numeric PIN',
    )
    allowed_category_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        source='allowed_categories',
        queryset=Category.objects.all(),
        required=False,
    )

    class Meta:
        model = DeviceProfile
        fields = [
            'name', 'restaurant', 'table', 'odoo_config',
            'allowed_category_ids', 'passcode', 'is_active',
        ]
        extra_kwargs = {
            'restaurant': {'required': False, 'allow_null': True},
        }

    def validate(self, attrs):
        # Auto-derive restaurant from odoo_config when not explicitly provided
        odoo_config = attrs.get('odoo_config')
        if odoo_config and not attrs.get('restaurant'):
            restaurant = Restaurant.objects.filter(odoo_config=odoo_config).first()
            if restaurant:
                attrs['restaurant'] = restaurant
            else:
                raise serializers.ValidationError(
                    {'odoo_config': 'No restaurant is linked to this Odoo configuration.'}
                )
        if not attrs.get('restaurant'):
            raise serializers.ValidationError(
                {'restaurant': 'Either provide a restaurant or an Odoo config linked to one.'}
            )
        return attrs

    def validate_passcode(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('Passcode must contain digits only.')
        return value

    def create(self, validated_data):
        passcode = validated_data.pop('passcode')
        device = super().create(validated_data)
        device.set_passcode(passcode)
        device.save(update_fields=['passcode_hash'])
        return device

    def update(self, instance, validated_data):
        passcode = validated_data.pop('passcode', None)
        instance = super().update(instance, validated_data)
        if passcode:
            instance.set_passcode(passcode)
            instance.save(update_fields=['passcode_hash'])
        return instance
