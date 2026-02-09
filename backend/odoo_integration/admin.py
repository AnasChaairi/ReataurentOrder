"""
Django Admin Configuration for Odoo Integration

Provides admin interface for:
- Odoo configuration management
- Sync log viewing and monitoring
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import OdooConfig, OdooSyncLog


@admin.register(OdooConfig)
class OdooConfigAdmin(admin.ModelAdmin):
    """
    Admin interface for Odoo configurations.

    Features:
    - List view with status indicators
    - Connection testing
    - Activation/deactivation
    - Organized fieldsets
    """

    list_display = [
        'name',
        'is_active_badge',
        'url',
        'database',
        'pos_config_name',
        'connection_status',
        'last_test_at',
        'auto_sync_orders',
    ]

    list_filter = [
        'is_active',
        'last_test_success',
        'auto_sync_orders',
        'sync_menu_enabled',
        'sync_tables_enabled',
    ]

    search_fields = [
        'name',
        'url',
        'database',
        'username',
        'pos_config_name',
    ]

    readonly_fields = [
        'last_test_at',
        'last_test_success',
        'last_test_error',
        'created_at',
        'updated_at',
        'connection_status_detail',
    ]

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'is_active')
        }),
        ('Connection Details', {
            'fields': ('url', 'database', 'username', 'password'),
            'description': 'Odoo server connection credentials'
        }),
        ('POS Configuration', {
            'fields': ('pos_config_id', 'pos_config_name'),
            'description': 'Selected Point of Sale configuration from Odoo'
        }),
        ('Sync Settings', {
            'fields': (
                'auto_sync_orders',
                'sync_menu_enabled',
                'sync_tables_enabled',
            ),
            'description': 'Enable/disable automatic synchronization features'
        }),
        ('Connection Settings', {
            'fields': ('timeout', 'retry_attempts'),
            'classes': ('collapse',),
        }),
        ('Connection Status', {
            'fields': (
                'connection_status_detail',
                'last_test_at',
                'last_test_success',
                'last_test_error',
            ),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def is_active_badge(self, obj):
        """Display active status as colored badge"""
        if obj.is_active:
            return format_html(
                '<span style="color: green; font-weight: bold;">● Active</span>'
            )
        return format_html(
            '<span style="color: gray;">○ Inactive</span>'
        )
    is_active_badge.short_description = 'Status'

    def connection_status(self, obj):
        """Display connection test status with color"""
        if not obj.last_test_at:
            return format_html(
                '<span style="color: gray;">Not tested</span>'
            )
        elif obj.last_test_success:
            return format_html(
                '<span style="color: green;">✓ Connected</span>'
            )
        else:
            return format_html(
                '<span style="color: red;">✗ Error</span>'
            )
    connection_status.short_description = 'Connection'

    def connection_status_detail(self, obj):
        """Display detailed connection status"""
        if not obj.last_test_at:
            return format_html(
                '<p><strong>Status:</strong> Not tested</p>'
                '<p>Click "Test Connection" in the API to verify credentials.</p>'
            )
        elif obj.last_test_success:
            time_since = timezone.now() - obj.last_test_at
            hours_ago = int(time_since.total_seconds() / 3600)
            return format_html(
                '<p style="color: green;"><strong>Status:</strong> ✓ Connected</p>'
                '<p><strong>Last tested:</strong> {} hours ago</p>',
                hours_ago
            )
        else:
            return format_html(
                '<p style="color: red;"><strong>Status:</strong> ✗ Connection Failed</p>'
                '<p><strong>Error:</strong> {}</p>',
                obj.last_test_error[:200]
            )
    connection_status_detail.short_description = 'Connection Status'

    def save_model(self, request, obj, form, change):
        """
        Custom save to handle activation logic.

        Ensures only one config is active at a time.
        """
        if obj.is_active:
            # Deactivate all other configs
            OdooConfig.objects.exclude(pk=obj.pk).update(is_active=False)

        super().save_model(request, obj, form, change)

        # Log action
        action = 'Updated' if change else 'Created'
        self.message_user(
            request,
            f'{action} Odoo configuration: {obj.name}'
        )


@admin.register(OdooSyncLog)
class OdooSyncLogAdmin(admin.ModelAdmin):
    """
    Admin interface for sync logs.

    Features:
    - Read-only view of all syncs
    - Filtering by type, status, date
    - Detailed error viewing
    - Link to related orders
    """

    list_display = [
        'id',
        'sync_type_badge',
        'status_badge',
        'order_link',
        'odoo_id',
        'retry_info',
        'created_at',
        'duration',
    ]

    list_filter = [
        'sync_type',
        'status',
        'created_at',
        ('odoo_config', admin.RelatedOnlyFieldListFilter),
    ]

    search_fields = [
        'order__order_number',
        'error_message',
        'odoo_id',
    ]

    readonly_fields = [
        'sync_type',
        'status',
        'order',
        'order_link',
        'odoo_config',
        'triggered_by',
        'odoo_id',
        'error_message',
        'error_traceback',
        'retry_count',
        'max_retries',
        'next_retry_at',
        'request_data',
        'response_data',
        'created_at',
        'completed_at',
        'duration_detail',
    ]

    fieldsets = (
        ('Sync Information', {
            'fields': (
                'sync_type',
                'status',
                'order_link',
                'odoo_config',
                'triggered_by',
            )
        }),
        ('Odoo Response', {
            'fields': ('odoo_id', 'response_data'),
        }),
        ('Error Details', {
            'fields': ('error_message', 'error_traceback'),
            'classes': ('collapse',),
        }),
        ('Retry Information', {
            'fields': (
                'retry_count',
                'max_retries',
                'next_retry_at',
            ),
        }),
        ('Request/Response Data', {
            'fields': ('request_data',),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'completed_at', 'duration_detail'),
        }),
    )

    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        """Sync logs are created automatically, not manually"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of sync logs for audit trail"""
        return False

    def sync_type_badge(self, obj):
        """Display sync type with color coding"""
        colors = {
            'ORDER_PUSH': '#2196F3',  # Blue
            'MENU_SYNC': '#4CAF50',   # Green
            'TABLE_SYNC': '#FF9800',  # Orange
            'MANUAL_RETRY': '#9C27B0',  # Purple
        }
        color = colors.get(obj.sync_type, '#666')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_sync_type_display()
        )
    sync_type_badge.short_description = 'Type'

    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'PENDING': '#FFC107',   # Amber
            'SUCCESS': '#4CAF50',   # Green
            'FAILED': '#F44336',    # Red
            'RETRYING': '#FF9800',  # Orange
        }
        color = colors.get(obj.status, '#666')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def order_link(self, obj):
        """Link to related order in admin"""
        if obj.order:
            url = reverse('admin:orders_order_change', args=[obj.order.id])
            return format_html(
                '<a href="{}">{}</a>',
                url,
                obj.order.order_number
            )
        return '-'
    order_link.short_description = 'Order'

    def retry_info(self, obj):
        """Display retry information"""
        if obj.retry_count > 0:
            return f"{obj.retry_count}/{obj.max_retries}"
        return '-'
    retry_info.short_description = 'Retries'

    def duration(self, obj):
        """Display sync duration"""
        if obj.completed_at and obj.created_at:
            delta = obj.completed_at - obj.created_at
            seconds = delta.total_seconds()
            if seconds < 1:
                return f"{int(seconds * 1000)}ms"
            elif seconds < 60:
                return f"{seconds:.1f}s"
            else:
                return f"{int(seconds / 60)}m {int(seconds % 60)}s"
        return '-'
    duration.short_description = 'Duration'

    def duration_detail(self, obj):
        """Display detailed duration information"""
        if obj.completed_at and obj.created_at:
            delta = obj.completed_at - obj.created_at
            return format_html(
                '<p><strong>Started:</strong> {}</p>'
                '<p><strong>Completed:</strong> {}</p>'
                '<p><strong>Duration:</strong> {}</p>',
                obj.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                obj.completed_at.strftime('%Y-%m-%d %H:%M:%S'),
                self.duration(obj)
            )
        elif obj.created_at:
            return format_html(
                '<p><strong>Started:</strong> {}</p>'
                '<p><strong>Status:</strong> Still running...</p>',
                obj.created_at.strftime('%Y-%m-%d %H:%M:%S')
            )
        return '-'
    duration_detail.short_description = 'Duration Details'
