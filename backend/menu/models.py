from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg, Count
from decimal import Decimal


class Category(models.Model):
    """Menu category model for organizing menu items"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    order = models.IntegerField(default=0, help_text="Display order (lower numbers first)")
    is_active = models.BooleanField(default=True)

    # Odoo Integration
    odoo_category_id = models.IntegerField(
        null=True,
        blank=True,
        unique=True,
        help_text="Odoo product category ID"
    )
    odoo_last_synced = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last time this category was synced from Odoo"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """Auto-generate slug from name if not provided"""
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class MenuItem(models.Model):
    """Menu item (dish) model"""
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='items'
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    image = models.ImageField(upload_to='menu_items/', blank=True, null=True)

    # Dietary information
    is_vegetarian = models.BooleanField(default=False)
    is_vegan = models.BooleanField(default=False)
    is_gluten_free = models.BooleanField(default=False)

    # Additional information
    preparation_time = models.IntegerField(
        help_text="Preparation time in minutes",
        default=15
    )
    ingredients = models.TextField(blank=True, null=True)
    allergens = models.CharField(max_length=255, blank=True, null=True)
    calories = models.IntegerField(blank=True, null=True)

    # Availability
    is_available = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    # Odoo integration
    odoo_product_id = models.IntegerField(blank=True, null=True, unique=True)
    odoo_last_synced = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last time this item was synced from Odoo"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Menu Item"
        verbose_name_plural = "Menu Items"
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['category', 'is_available']),
            models.Index(fields=['is_featured']),
        ]

    def __str__(self):
        return f"{self.name} ({self.category.name})"

    def save(self, *args, **kwargs):
        """Auto-generate slug from name if not provided"""
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while MenuItem.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def get_average_rating(self):
        """Calculate average rating from reviews"""
        result = self.reviews.aggregate(avg_rating=Avg('rating'))
        return round(result['avg_rating'], 1) if result['avg_rating'] else 0

    def get_review_count(self):
        """Get total number of reviews"""
        return self.reviews.count()


class MenuItemVariant(models.Model):
    """Menu item variants (e.g., Small, Medium, Large)"""
    SIZE_CHOICES = [
        ('SMALL', 'Small'),
        ('MEDIUM', 'Medium'),
        ('LARGE', 'Large'),
        ('EXTRA_LARGE', 'Extra Large'),
    ]

    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.CASCADE,
        related_name='variants'
    )
    name = models.CharField(max_length=50)
    size = models.CharField(max_length=20, choices=SIZE_CHOICES, blank=True)
    price_modifier = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Additional price for this variant (can be negative for discounts)"
    )
    is_available = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Menu Item Variant"
        verbose_name_plural = "Menu Item Variants"
        ordering = ['menu_item', 'price_modifier']
        unique_together = ['menu_item', 'name']

    def __str__(self):
        return f"{self.menu_item.name} - {self.name}"

    def get_final_price(self):
        """Calculate final price with modifier"""
        return self.menu_item.price + self.price_modifier


class MenuItemAddon(models.Model):
    """Add-ons/extras that can be added to menu items"""
    ADDON_CATEGORY_CHOICES = [
        ('TOPPING', 'Topping'),
        ('SAUCE', 'Sauce'),
        ('SIDE', 'Side'),
        ('DRINK', 'Drink'),
        ('EXTRA', 'Extra'),
    ]

    name = models.CharField(max_length=100)
    category = models.CharField(
        max_length=20,
        choices=ADDON_CATEGORY_CHOICES,
        default='EXTRA'
    )
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    is_available = models.BooleanField(default=True)

    # Link to menu items that can have this addon
    menu_items = models.ManyToManyField(
        MenuItem,
        related_name='available_addons',
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Menu Item Add-on"
        verbose_name_plural = "Menu Item Add-ons"
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} (+${self.price})"


class MenuItemImage(models.Model):
    """Multiple images for menu items (gallery support)"""
    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='menu_items/gallery/')
    alt_text = models.CharField(max_length=255, blank=True)
    order = models.IntegerField(
        default=0,
        help_text="Display order (lower numbers first)"
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Mark as primary/thumbnail image"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Menu Item Image"
        verbose_name_plural = "Menu Item Images"
        ordering = ['menu_item', 'order', '-is_primary']
        indexes = [
            models.Index(fields=['menu_item', 'is_primary']),
        ]

    def __str__(self):
        return f"Image for {self.menu_item.name} (Order: {self.order})"

    def save(self, *args, **kwargs):
        """Ensure only one primary image per menu item"""
        if self.is_primary:
            # Set all other images for this menu item to non-primary
            MenuItemImage.objects.filter(
                menu_item=self.menu_item,
                is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class MenuItemReview(models.Model):
    """Customer reviews and ratings for menu items"""
    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='menu_reviews'
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars"
    )
    comment = models.TextField(blank=True)

    # Moderation
    is_approved = models.BooleanField(
        default=True,
        help_text="Admin can hide inappropriate reviews"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Menu Item Review"
        verbose_name_plural = "Menu Item Reviews"
        ordering = ['-created_at']
        unique_together = ['menu_item', 'user']
        indexes = [
            models.Index(fields=['menu_item', 'is_approved']),
            models.Index(fields=['rating']),
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.menu_item.name} ({self.rating}★)"
