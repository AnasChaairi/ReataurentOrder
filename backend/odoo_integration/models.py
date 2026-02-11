"""
Odoo Integration Models

Models for managing Odoo POS connection and sync operations.
"""

from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from datetime import timedelta
from encrypted_model_fields.fields import EncryptedCharField


class OdooConfig(models.Model):
    """
    Odoo POS connection configuration.

    Admin can configure multiple Odoo connections, but only one can be active at a time.
    """

    # Connection Details
    name = models.CharField(
        max_length=100,
        help_text="Friendly name for this configuration"
    )
    is_active = models.BooleanField(
        default=False,
        help_text="Only one configuration can be active at a time"
    )
    url = models.URLField(
        max_length=255,
        help_text="Odoo server URL (e.g., http://localhost:10018)"
    )
    database = models.CharField(
        max_length=100,
        help_text="Odoo database name"
    )
    username = models.CharField(
        max_length=100,
        help_text="Odoo username (email)"
    )
    password = EncryptedCharField(
        max_length=255,
        help_text="Odoo password (encrypted)"
    )

    # POS Configuration
    pos_config_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="Selected Odoo POS configuration ID"
    )
    pos_config_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Name of the selected POS configuration"
    )

    # Connection Settings
    timeout = models.IntegerField(
        default=300,
        validators=[MinValueValidator(10)],
        help_text="Request timeout in seconds"
    )
    retry_attempts = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1)],
        help_text="Number of retry attempts for failed requests"
    )

    # Sync Settings
    auto_sync_orders = models.BooleanField(
        default=True,
        help_text="Automatically sync orders to Odoo when confirmed"
    )
    sync_menu_enabled = models.BooleanField(
        default=True,
        help_text="Enable nightly menu synchronization from Odoo"
    )
    sync_tables_enabled = models.BooleanField(
        default=True,
        help_text="Enable nightly table synchronization from Odoo"
    )

    # Connection Status
    last_test_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last time connection was tested"
    )
    last_test_success = models.BooleanField(
        default=False,
        help_text="Result of last connection test"
    )
    last_test_error = models.TextField(
        blank=True,
        help_text="Error message from last failed connection test"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Odoo Configuration"
        verbose_name_plural = "Odoo Configurations"
        ordering = ['-is_active', '-created_at']
        indexes = [
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        status = "Active" if self.is_active else "Inactive"
        return f"{self.name} ({status})"

    def save(self, *args, **kwargs):
        """Save configuration. Active enforcement is now per-restaurant via Restaurant.odoo_config."""
        super().save(*args, **kwargs)

    @property
    def decrypted_password(self):
        """Get decrypted password"""
        return self.password  # Fernet field handles decryption automatically


class OdooSyncLog(models.Model):
    """
    Audit trail for all Odoo synchronization operations.

    Tracks all sync attempts with full request/response data for debugging.
    """

    SYNC_TYPE_CHOICES = [
        ('ORDER_PUSH', 'Order Push'),
        ('MENU_SYNC', 'Menu Sync'),
        ('TABLE_SYNC', 'Table Sync'),
        ('MANUAL_RETRY', 'Manual Retry'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('RETRYING', 'Retrying'),
    ]

    # Type & Status
    sync_type = models.CharField(
        max_length=20,
        choices=SYNC_TYPE_CHOICES,
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
        db_index=True
    )

    # Relations
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='odoo_sync_logs',
        help_text="Order being synced (for ORDER_PUSH type)"
    )
    odoo_config = models.ForeignKey(
        OdooConfig,
        on_delete=models.CASCADE,
        related_name='sync_logs',
        help_text="Odoo configuration used for this sync"
    )
    triggered_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triggered_odoo_syncs',
        help_text="User who triggered this sync (null for automatic syncs)"
    )

    # Odoo Response
    odoo_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID of created/updated record in Odoo"
    )

    # Error Tracking
    error_message = models.TextField(
        blank=True,
        help_text="Error message if sync failed"
    )
    error_traceback = models.TextField(
        blank=True,
        help_text="Full error traceback for debugging"
    )

    # Retry Logic
    retry_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Number of retry attempts"
    )
    max_retries = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1)],
        help_text="Maximum number of retry attempts"
    )
    next_retry_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="When to retry this sync (for exponential backoff)"
    )

    # Audit Trail
    request_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Request data sent to Odoo"
    )
    response_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Response data received from Odoo"
    )

    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When sync completed (success or final failure)"
    )

    class Meta:
        verbose_name = "Odoo Sync Log"
        verbose_name_plural = "Odoo Sync Logs"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sync_type', 'status']),
            models.Index(fields=['order', 'status']),
            models.Index(fields=['status', 'next_retry_at']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        order_ref = f" (Order: {self.order.order_number})" if self.order else ""
        return f"{self.get_sync_type_display()} - {self.get_status_display()}{order_ref}"

    def mark_success(self, odoo_id: int, response_data: dict = None):
        """Mark sync as successful"""
        self.status = 'SUCCESS'
        self.odoo_id = odoo_id
        self.completed_at = timezone.now()
        if response_data:
            self.response_data = response_data
        self.save(update_fields=['status', 'odoo_id', 'completed_at', 'response_data'])

    def mark_failed(self, error_message: str, error_traceback: str = ''):
        """Mark sync as failed"""
        self.status = 'FAILED'
        self.error_message = error_message
        self.error_traceback = error_traceback
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'error_message', 'error_traceback', 'completed_at'])

    def can_retry(self) -> bool:
        """Check if sync can be retried"""
        return self.retry_count < self.max_retries and self.status in ['FAILED', 'RETRYING']

    def schedule_retry(self, delay_seconds: int = None):
        """
        Schedule retry with exponential backoff

        Args:
            delay_seconds: Custom delay, or use exponential backoff (60s, 300s, 900s)
        """
        if not self.can_retry():
            return

        self.retry_count += 1
        self.status = 'RETRYING'

        if delay_seconds is None:
            # Exponential backoff: 60s, 300s (5m), 900s (15m)
            delay_seconds = 60 * (5 ** (self.retry_count - 1))

        self.next_retry_at = timezone.now() + timedelta(seconds=delay_seconds)
        self.save(update_fields=['retry_count', 'status', 'next_retry_at'])
