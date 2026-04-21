import random
import string

from django.db import models
from django.contrib.auth.hashers import make_password, check_password


def generate_device_id():
    """Generate a short readable device ID, e.g. 'BRST-A4X2'."""
    chars = string.ascii_uppercase + string.digits
    segment = ''.join(random.choices(chars, k=4))
    return f'BRST-{segment}'


class DeviceProfile(models.Model):
    # Identity
    name = models.CharField(max_length=100, help_text="Human-readable label, e.g. 'Table 5 Tablet'")
    device_id = models.CharField(
        max_length=20,
        unique=True,
        default=generate_device_id,
        help_text='Auto-generated short code shown on login screen',
    )
    passcode_hash = models.CharField(
        max_length=128,
        blank=True,
        default='',
        help_text='Legacy — unused since login switched to device_id + table_number.',
    )

    # Ownership
    restaurant = models.ForeignKey(
        'restaurants.Restaurant',
        on_delete=models.CASCADE,
        related_name='devices',
    )

    # Optional table pre-assignment
    table = models.ForeignKey(
        'tables.Table',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='devices',
        help_text='Table this device is fixed to (optional)',
    )

    # Odoo override — null means inherit from restaurant.odoo_config
    odoo_config = models.ForeignKey(
        'odoo_integration.OdooConfig',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='devices',
        help_text='Override restaurant-level Odoo config (leave blank to inherit)',
    )

    # Menu filtering — empty means show all categories for the restaurant
    allowed_categories = models.ManyToManyField(
        'menu.Category',
        blank=True,
        related_name='devices',
        help_text='Restrict visible categories (empty = show all)',
    )

    # Lifecycle
    is_active = models.BooleanField(default=True)
    last_seen_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Device Profile'
        verbose_name_plural = 'Device Profiles'
        ordering = ['restaurant', 'name']
        indexes = [
            models.Index(fields=['device_id']),
            models.Index(fields=['restaurant', 'is_active']),
        ]

    def __str__(self):
        return f'{self.name} [{self.device_id}]'

    def set_passcode(self, raw_passcode: str) -> None:
        self.passcode_hash = make_password(raw_passcode)

    def check_passcode(self, raw_passcode: str) -> bool:
        return check_password(raw_passcode, self.passcode_hash)

    @property
    def effective_odoo_config(self):
        """Returns this device's odoo_config if set, else the restaurant's."""
        return self.odoo_config or getattr(self.restaurant, 'odoo_config', None)
