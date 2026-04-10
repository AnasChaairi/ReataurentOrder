from rest_framework import serializers
from .models import Restaurant


class RestaurantSerializer(serializers.ModelSerializer):
    """Full serializer for Restaurant CRUD."""
    owner_name = serializers.SerializerMethodField()
    odoo_config_name = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            'id', 'name', 'slug', 'owner', 'owner_name',
            'odoo_config', 'odoo_config_name',
            'address', 'phone', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def get_owner_name(self, obj):
        return obj.owner.get_full_name() if obj.owner else None

    def get_odoo_config_name(self, obj):
        return obj.odoo_config.name if obj.odoo_config else None


class RestaurantListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing restaurants."""
    owner_name = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'slug', 'owner', 'owner_name', 'odoo_config', 'is_active', 'created_at']

    def get_owner_name(self, obj):
        return obj.owner.get_full_name() if obj.owner else None
