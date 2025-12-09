"""
Signals for menu app to handle cache invalidation
"""
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from .models import Category, MenuItem, MenuItemVariant, MenuItemAddon
from .cache import MenuCache


@receiver(post_save, sender=Category)
def invalidate_category_cache_on_save(sender, instance, created, **kwargs):
    """Invalidate category cache when a category is created or updated"""
    MenuCache.invalidate_category(category_slug=instance.slug)


@receiver(post_delete, sender=Category)
def invalidate_category_cache_on_delete(sender, instance, **kwargs):
    """Invalidate category cache when a category is deleted"""
    MenuCache.invalidate_category(category_slug=instance.slug)


@receiver(post_save, sender=MenuItem)
def invalidate_menu_item_cache_on_save(sender, instance, created, **kwargs):
    """Invalidate menu item cache when an item is created or updated"""
    MenuCache.invalidate_menu_item(
        menu_item_slug=instance.slug,
        category_slug=instance.category.slug
    )


@receiver(post_delete, sender=MenuItem)
def invalidate_menu_item_cache_on_delete(sender, instance, **kwargs):
    """Invalidate menu item cache when an item is deleted"""
    MenuCache.invalidate_menu_item(
        menu_item_slug=instance.slug,
        category_slug=instance.category.slug
    )


@receiver(post_save, sender=MenuItemVariant)
@receiver(post_delete, sender=MenuItemVariant)
def invalidate_variant_cache(sender, instance, **kwargs):
    """Invalidate cache when variants are modified"""
    MenuCache.invalidate_menu_item(
        menu_item_slug=instance.menu_item.slug,
        category_slug=instance.menu_item.category.slug
    )


@receiver(post_save, sender=MenuItemAddon)
@receiver(post_delete, sender=MenuItemAddon)
def invalidate_addon_cache(sender, instance, **kwargs):
    """Invalidate cache when add-ons are modified"""
    # Since add-ons can be linked to multiple items, invalidate all
    MenuCache.invalidate_all()


@receiver(m2m_changed, sender=MenuItemAddon.menu_items.through)
def invalidate_addon_assignment_cache(sender, instance, action, **kwargs):
    """Invalidate cache when add-ons are assigned/removed from menu items"""
    if action in ['post_add', 'post_remove', 'post_clear']:
        MenuCache.invalidate_all()
