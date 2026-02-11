"""
Data migration: Create a 'Default Restaurant' and assign all existing records to it.
"""
from django.db import migrations


def create_default_restaurant(apps, schema_editor):
    Restaurant = apps.get_model('restaurants', 'Restaurant')
    Table = apps.get_model('tables', 'Table')
    Category = apps.get_model('menu', 'Category')
    MenuItem = apps.get_model('menu', 'MenuItem')
    Order = apps.get_model('orders', 'Order')

    # Only create if there are existing records without a restaurant
    has_data = (
        Table.objects.filter(restaurant__isnull=True).exists()
        or Category.objects.filter(restaurant__isnull=True).exists()
        or MenuItem.objects.filter(restaurant__isnull=True).exists()
        or Order.objects.filter(restaurant__isnull=True).exists()
    )

    if not has_data:
        return

    restaurant = Restaurant.objects.create(
        name='Default Restaurant',
        slug='default-restaurant',
        is_active=True,
    )

    Table.objects.filter(restaurant__isnull=True).update(restaurant=restaurant)
    Category.objects.filter(restaurant__isnull=True).update(restaurant=restaurant)
    MenuItem.objects.filter(restaurant__isnull=True).update(restaurant=restaurant)
    Order.objects.filter(restaurant__isnull=True).update(restaurant=restaurant)


def reverse_default_restaurant(apps, schema_editor):
    Restaurant = apps.get_model('restaurants', 'Restaurant')
    Restaurant.objects.filter(slug='default-restaurant').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('restaurants', '0001_initial'),
        ('tables', '0003_table_restaurant_alter_table_number_and_more'),
        ('menu', '0003_category_restaurant_menuitem_restaurant_and_more'),
        ('orders', '0002_order_restaurant'),
    ]

    operations = [
        migrations.RunPython(create_default_restaurant, reverse_default_restaurant),
    ]
