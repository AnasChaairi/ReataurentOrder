"""
Serializers for Odoo Integration API

Handles serialization/deserialization for:
- Odoo configuration management
- Sync log viewing and filtering
"""

from rest_framework import serializers
from .models import OdooConfig, OdooSyncLog


class OdooConfigSerializer(serializers.ModelSerializer):
    """
    Full serializer for Odoo configuration.

    Used for create/update operations. Password is write-only
    and never returned in responses.
    """

    password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'},
        help_text="Odoo password (encrypted in database)"
    )

    class Meta:
        model = OdooConfig
        fields = [
            'id',
            'name',
            'is_active',
            'url',
            'database',
            'username',
            'password',
            'pos_config_id',
            'pos_config_name',
            'timeout',
            'retry_attempts',
            'auto_sync_orders',
            'sync_menu_enabled',
            'sync_tables_enabled',
            'last_test_at',
            'last_test_success',
            'last_test_error',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'last_test_at',
            'last_test_success',
            'last_test_error',
            'created_at',
            'updated_at',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }


class OdooConfigListSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for listing Odoo configurations.

    Used for list views. Excludes sensitive data and verbose fields.
    """

    status = serializers.SerializerMethodField()

    class Meta:
        model = OdooConfig
        fields = [
            'id',
            'name',
            'is_active',
            'url',
            'database',
            'pos_config_name',
            'status',
            'last_test_success',
            'last_test_at',
        ]

    def get_status(self, obj):
        """Get human-readable status"""
        if not obj.last_test_at:
            return 'untested'
        elif obj.last_test_success:
            return 'connected'
        else:
            return 'error'


class OdooSyncLogSerializer(serializers.ModelSerializer):
    """
    Full serializer for sync logs.

    Includes all details for viewing individual sync operations.
    """

    # Related object names
    order_number = serializers.CharField(
        source='order.order_number',
        read_only=True,
        allow_null=True
    )
    config_name = serializers.CharField(
        source='odoo_config.name',
        read_only=True
    )
    triggered_by_name = serializers.SerializerMethodField()

    # Computed fields
    sync_type_display = serializers.CharField(
        source='get_sync_type_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    can_retry = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()

    class Meta:
        model = OdooSyncLog
        fields = [
            'id',
            'sync_type',
            'sync_type_display',
            'status',
            'status_display',
            'order',
            'order_number',
            'odoo_config',
            'config_name',
            'triggered_by',
            'triggered_by_name',
            'odoo_id',
            'error_message',
            'error_traceback',
            'retry_count',
            'max_retries',
            'next_retry_at',
            'can_retry',
            'request_data',
            'response_data',
            'created_at',
            'completed_at',
            'duration',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'completed_at',
        ]

    def get_triggered_by_name(self, obj):
        """Get name of user who triggered sync"""
        if obj.triggered_by:
            return obj.triggered_by.get_full_name() or obj.triggered_by.email
        return 'Automatic'

    def get_can_retry(self, obj):
        """Check if sync can be retried"""
        return obj.can_retry()

    def get_duration(self, obj):
        """Get sync duration in seconds"""
        if obj.completed_at and obj.created_at:
            delta = obj.completed_at - obj.created_at
            return round(delta.total_seconds(), 2)
        return None


class OdooSyncLogListSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for listing sync logs.

    Used for list views. Excludes verbose fields like request/response data.
    """

    order_number = serializers.CharField(
        source='order.order_number',
        read_only=True,
        allow_null=True
    )
    sync_type_display = serializers.CharField(
        source='get_sync_type_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )

    class Meta:
        model = OdooSyncLog
        fields = [
            'id',
            'sync_type',
            'sync_type_display',
            'status',
            'status_display',
            'order',
            'order_number',
            'odoo_id',
            'error_message',
            'retry_count',
            'max_retries',
            'created_at',
            'completed_at',
        ]


class POSConfigSelectionSerializer(serializers.Serializer):
    """
    Serializer for selecting POS configuration from Odoo.

    Used when admin needs to select which POS to use.
    """

    pos_config_id = serializers.IntegerField(
        required=True,
        help_text="Odoo POS configuration ID"
    )
    pos_config_name = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Odoo POS configuration name (optional)"
    )


class SyncTriggerSerializer(serializers.Serializer):
    """
    Serializer for manually triggering sync operations.

    Used for manual sync triggers from admin.
    """

    force = serializers.BooleanField(
        default=False,
        required=False,
        help_text="Force sync even if recently synced"
    )
