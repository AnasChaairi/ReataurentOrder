from django.db import models
from django.utils.text import slugify
from django.conf import settings


class Restaurant(models.Model):
    """Restaurant entity for multi-tenant support."""

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_restaurants',
        help_text="Restaurant owner account"
    )
    odoo_config = models.ForeignKey(
        'odoo_integration.OdooConfig',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='restaurants',
        help_text="Odoo POS configuration for this restaurant"
    )

    # Details
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=30, blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Restaurant"
        verbose_name_plural = "Restaurants"
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Restaurant.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
