from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from accounts.models import User
import qrcode
from io import BytesIO
from django.core.files import File
from PIL import Image


class Table(models.Model):
    """Restaurant table model"""

    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('OCCUPIED', 'Occupied'),
        ('RESERVED', 'Reserved'),
        ('CLEANING', 'Cleaning'),
    ]

    SECTION_CHOICES = [
        ('INDOOR', 'Indoor'),
        ('OUTDOOR', 'Outdoor'),
        ('VIP', 'VIP'),
        ('BAR', 'Bar'),
    ]

    number = models.CharField(
        max_length=10,
        unique=True,
        help_text="Table number or identifier (e.g., 'T1', 'A-5')"
    )
    capacity = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text="Maximum number of people"
    )
    section = models.CharField(
        max_length=20,
        choices=SECTION_CHOICES,
        default='INDOOR'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='AVAILABLE'
    )

    # QR Code for customer ordering
    qr_code = models.ImageField(
        upload_to='table_qr_codes/',
        blank=True,
        null=True
    )
    qr_code_data = models.CharField(
        max_length=255,
        blank=True,
        help_text="URL or data encoded in QR code"
    )

    # Additional information
    floor = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Floor number"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether table is active and available for use"
    )
    notes = models.TextField(
        blank=True,
        help_text="Special notes about this table (e.g., near window, accessible)"
    )

    # Odoo Integration
    odoo_floor_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="Odoo restaurant floor ID"
    )
    odoo_table_id = models.IntegerField(
        null=True,
        blank=True,
        unique=True,
        help_text="Odoo restaurant table ID"
    )
    odoo_last_synced = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last time this table was synced from Odoo"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Table"
        verbose_name_plural = "Tables"
        ordering = ['section', 'number']
        indexes = [
            models.Index(fields=['status', 'is_active']),
            models.Index(fields=['section']),
        ]

    def __str__(self):
        return f"Table {self.number} ({self.section})"

    def generate_qr_code(self, base_url):
        """Generate QR code for this table"""
        # Create QR code data (URL to menu for this table)
        self.qr_code_data = f"{base_url}/menu?table={self.number}"

        # Generate QR code image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(self.qr_code_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Save to file
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        file_name = f'table_{self.number}_qr.png'
        self.qr_code.save(file_name, File(buffer), save=False)
        buffer.close()

        self.save()

    def get_current_session(self):
        """Get current active session for this table"""
        return self.sessions.filter(end_time__isnull=True).first()

    def get_assigned_waiter(self):
        """Get currently assigned waiter for this table"""
        active_assignment = self.waiter_assignments.filter(
            shift_end__isnull=True
        ).select_related('waiter').first()

        return active_assignment.waiter if active_assignment else None


class WaiterAssignment(models.Model):
    """Assignment of waiters to tables for shifts"""

    waiter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='table_assignments',
        limit_choices_to={'role': 'WAITER'}
    )
    table = models.ForeignKey(
        Table,
        on_delete=models.CASCADE,
        related_name='waiter_assignments'
    )

    shift_start = models.DateTimeField(
        default=timezone.now,
        help_text="When this assignment starts"
    )
    shift_end = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this assignment ends (null if still active)"
    )

    notes = models.TextField(
        blank=True,
        help_text="Notes about this assignment"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Waiter Assignment"
        verbose_name_plural = "Waiter Assignments"
        ordering = ['-shift_start']
        indexes = [
            models.Index(fields=['waiter', 'shift_end']),
            models.Index(fields=['table', 'shift_end']),
        ]

    def __str__(self):
        status = "Active" if self.shift_end is None else "Ended"
        return f"{self.waiter.get_full_name()} - Table {self.table.number} ({status})"

    def is_active(self):
        """Check if this assignment is currently active"""
        return self.shift_end is None

    def end_shift(self):
        """End this assignment"""
        if self.shift_end is None:
            self.shift_end = timezone.now()
            self.save()

    def clean(self):
        """Validate assignment"""
        from django.core.exceptions import ValidationError

        # Check if waiter role is correct
        if self.waiter.role != 'WAITER':
            raise ValidationError('Assigned user must have WAITER role')

        # Check for overlapping active assignments for this table
        if self.shift_end is None:
            overlapping = WaiterAssignment.objects.filter(
                table=self.table,
                shift_end__isnull=True
            ).exclude(pk=self.pk)

            if overlapping.exists():
                raise ValidationError(
                    f'Table {self.table.number} already has an active waiter assignment'
                )


class TableSession(models.Model):
    """Customer session at a table from seating to checkout"""

    table = models.ForeignKey(
        Table,
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    customer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='table_sessions',
        help_text="Primary customer/account holder for this session"
    )

    customer_count = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text="Number of customers at the table"
    )

    start_time = models.DateTimeField(
        default=timezone.now,
        help_text="When customers were seated"
    )
    end_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When customers checked out (null if still active)"
    )

    # Session metadata
    session_notes = models.TextField(
        blank=True,
        help_text="Notes about this session (e.g., special occasion)"
    )
    rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Customer rating (1-5)"
    )
    feedback = models.TextField(
        blank=True,
        help_text="Customer feedback"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Table Session"
        verbose_name_plural = "Table Sessions"
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['table', 'end_time']),
            models.Index(fields=['start_time']),
        ]

    def __str__(self):
        status = "Active" if self.end_time is None else "Completed"
        return f"Session at Table {self.table.number} - {status}"

    def is_active(self):
        """Check if session is currently active"""
        return self.end_time is None

    def get_duration(self):
        """Get session duration in minutes"""
        if self.end_time:
            delta = self.end_time - self.start_time
        else:
            delta = timezone.now() - self.start_time
        return int(delta.total_seconds() / 60)

    def get_total_amount(self):
        """Get total amount for all orders in this session"""
        from decimal import Decimal
        total = Decimal('0.00')

        # Calculate from related orders
        for order in self.orders.all():
            total += order.total_amount

        return total

    def end_session(self):
        """End this session and update table status"""
        if self.end_time is None:
            self.end_time = timezone.now()
            self.save()

            # Update table status to cleaning
            self.table.status = 'CLEANING'
            self.table.save()

    def save(self, *args, **kwargs):
        """Auto-update table status when session starts/ends"""
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new and self.end_time is None:
            # New active session - mark table as occupied
            self.table.status = 'OCCUPIED'
            self.table.save()
