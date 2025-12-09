from django.contrib import admin
from .models import Category, MenuItem, MenuItemVariant, MenuItemAddon, MenuItemImage, MenuItemReview


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin interface for Category model"""
    list_display = ['name', 'slug', 'order', 'is_active', 'items_count', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['order', 'name']

    def items_count(self, obj):
        """Display count of items in category"""
        return obj.items.count()
    items_count.short_description = 'Items'


class MenuItemVariantInline(admin.TabularInline):
    """Inline admin for MenuItem Variants"""
    model = MenuItemVariant
    extra = 1
    fields = ['name', 'size', 'price_modifier', 'is_available']


class MenuItemAddonInline(admin.TabularInline):
    """Inline admin for MenuItem Add-ons"""
    model = MenuItemAddon.menu_items.through
    extra = 1
    verbose_name = "Available Add-on"
    verbose_name_plural = "Available Add-ons"


class MenuItemImageInline(admin.TabularInline):
    """Inline admin for MenuItem Images"""
    model = MenuItemImage
    extra = 1
    fields = ['image', 'alt_text', 'order', 'is_primary']
    ordering = ['order', '-is_primary']


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    """Admin interface for MenuItem model"""
    list_display = [
        'name', 'category', 'price', 'is_vegetarian', 'is_vegan',
        'is_gluten_free', 'is_available', 'is_featured', 'created_at'
    ]
    list_filter = [
        'category', 'is_vegetarian', 'is_vegan', 'is_gluten_free',
        'is_available', 'is_featured', 'created_at'
    ]
    search_fields = ['name', 'description', 'ingredients']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [MenuItemImageInline, MenuItemVariantInline, MenuItemAddonInline]
    ordering = ['category', 'name']

    fieldsets = (
        ('Basic Information', {
            'fields': ('category', 'name', 'slug', 'description', 'price', 'image')
        }),
        ('Dietary Information', {
            'fields': ('is_vegetarian', 'is_vegan', 'is_gluten_free')
        }),
        ('Additional Details', {
            'fields': ('preparation_time', 'ingredients', 'allergens', 'calories')
        }),
        ('Availability & Features', {
            'fields': ('is_available', 'is_featured')
        }),
        ('Odoo Integration', {
            'fields': ('odoo_product_id',),
            'classes': ('collapse',)
        }),
    )


@admin.register(MenuItemVariant)
class MenuItemVariantAdmin(admin.ModelAdmin):
    """Admin interface for MenuItem Variant model"""
    list_display = ['menu_item', 'name', 'size', 'price_modifier', 'get_final_price', 'is_available']
    list_filter = ['size', 'is_available', 'menu_item__category']
    search_fields = ['menu_item__name', 'name']
    ordering = ['menu_item', 'price_modifier']

    def get_final_price(self, obj):
        """Display final price"""
        return f"${obj.get_final_price()}"
    get_final_price.short_description = 'Final Price'


@admin.register(MenuItemAddon)
class MenuItemAddonAdmin(admin.ModelAdmin):
    """Admin interface for MenuItem Add-on model"""
    list_display = ['name', 'category', 'price', 'is_available', 'item_count']
    list_filter = ['category', 'is_available', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['menu_items']
    ordering = ['category', 'name']

    def item_count(self, obj):
        """Display count of menu items this addon is available for"""
        return obj.menu_items.count()
    item_count.short_description = 'Menu Items'


@admin.register(MenuItemImage)
class MenuItemImageAdmin(admin.ModelAdmin):
    """Admin interface for MenuItem Image model"""
    list_display = ['menu_item', 'alt_text', 'order', 'is_primary', 'created_at']
    list_filter = ['is_primary', 'created_at', 'menu_item__category']
    search_fields = ['menu_item__name', 'alt_text']
    ordering = ['menu_item', 'order', '-is_primary']
    list_editable = ['order', 'is_primary']


@admin.register(MenuItemReview)
class MenuItemReviewAdmin(admin.ModelAdmin):
    """Admin interface for MenuItem Review model"""
    list_display = ['menu_item', 'user', 'rating', 'is_approved', 'created_at']
    list_filter = ['rating', 'is_approved', 'created_at', 'menu_item__category']
    search_fields = ['menu_item__name', 'user__email', 'user__first_name', 'user__last_name', 'comment']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    list_editable = ['is_approved']

    fieldsets = (
        ('Review Information', {
            'fields': ('menu_item', 'user', 'rating', 'comment')
        }),
        ('Moderation', {
            'fields': ('is_approved',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
