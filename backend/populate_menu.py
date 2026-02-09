#!/usr/bin/env python
"""
Populate database with sample menu data for testing
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'restaurant_order.settings')
django.setup()

from menu.models import Category, MenuItem, MenuItemAddon
from decimal import Decimal

def populate_menu():
    """Create sample menu categories and items"""

    print("Creating categories...")

    # Create categories
    appetizers = Category.objects.create(
        name="Appetizers",
        description="Start your meal with our delicious appetizers",
        order=1,
        is_active=True
    )

    main_dishes = Category.objects.create(
        name="Main Dishes",
        description="Our signature main courses",
        order=2,
        is_active=True
    )

    desserts = Category.objects.create(
        name="Desserts",
        description="Sweet treats to finish your meal",
        order=3,
        is_active=True
    )

    beverages = Category.objects.create(
        name="Beverages",
        description="Refreshing drinks",
        order=4,
        is_active=True
    )

    print("Creating menu items...")

    # Appetizers
    MenuItem.objects.create(
        category=appetizers,
        name="Hummus with Pita",
        description="Creamy chickpea dip served with warm pita bread",
        price=Decimal("8.99"),
        is_vegetarian=True,
        is_vegan=True,
        is_gluten_free=False,
        preparation_time=5,
        is_available=True,
        is_featured=True
    )

    MenuItem.objects.create(
        category=appetizers,
        name="Bruschetta",
        description="Toasted bread topped with fresh tomatoes, basil, and olive oil",
        price=Decimal("7.50"),
        is_vegetarian=True,
        preparation_time=10,
        is_available=True
    )

    MenuItem.objects.create(
        category=appetizers,
        name="Buffalo Wings",
        description="Spicy chicken wings served with blue cheese dip",
        price=Decimal("12.99"),
        preparation_time=15,
        is_available=True
    )

    # Main Dishes
    grilled_salmon = MenuItem.objects.create(
        category=main_dishes,
        name="Grilled Salmon",
        description="Fresh Atlantic salmon grilled to perfection with lemon butter sauce",
        price=Decimal("24.99"),
        is_gluten_free=True,
        preparation_time=20,
        is_available=True,
        is_featured=True
    )

    pasta = MenuItem.objects.create(
        category=main_dishes,
        name="Pasta Carbonara",
        description="Classic Italian pasta with creamy sauce, bacon, and parmesan",
        price=Decimal("16.99"),
        preparation_time=18,
        is_available=True
    )

    MenuItem.objects.create(
        category=main_dishes,
        name="Vegetarian Pizza",
        description="Wood-fired pizza with fresh vegetables and mozzarella",
        price=Decimal("14.99"),
        is_vegetarian=True,
        preparation_time=25,
        is_available=True,
        is_featured=True
    )

    MenuItem.objects.create(
        category=main_dishes,
        name="Beef Burger",
        description="Juicy beef patty with lettuce, tomato, onion, and special sauce",
        price=Decimal("13.99"),
        preparation_time=15,
        is_available=True
    )

    # Desserts
    MenuItem.objects.create(
        category=desserts,
        name="Chocolate Lava Cake",
        description="Warm chocolate cake with a molten center, served with vanilla ice cream",
        price=Decimal("9.99"),
        is_vegetarian=True,
        preparation_time=12,
        is_available=True,
        is_featured=True
    )

    MenuItem.objects.create(
        category=desserts,
        name="Tiramisu",
        description="Classic Italian dessert with espresso-soaked ladyfingers and mascarpone",
        price=Decimal("8.50"),
        is_vegetarian=True,
        preparation_time=5,
        is_available=True
    )

    MenuItem.objects.create(
        category=desserts,
        name="Crème Brûlée",
        description="Rich custard topped with caramelized sugar",
        price=Decimal("7.99"),
        is_vegetarian=True,
        is_gluten_free=True,
        preparation_time=8,
        is_available=True
    )

    # Beverages
    MenuItem.objects.create(
        category=beverages,
        name="Fresh Lemonade",
        description="Homemade lemonade with fresh lemons",
        price=Decimal("4.50"),
        is_vegetarian=True,
        is_vegan=True,
        is_gluten_free=True,
        preparation_time=3,
        is_available=True
    )

    MenuItem.objects.create(
        category=beverages,
        name="Cappuccino",
        description="Espresso with steamed milk and foam",
        price=Decimal("4.99"),
        is_vegetarian=True,
        is_gluten_free=True,
        preparation_time=5,
        is_available=True
    )

    MenuItem.objects.create(
        category=beverages,
        name="Iced Tea",
        description="Refreshing iced tea",
        price=Decimal("3.50"),
        is_vegetarian=True,
        is_vegan=True,
        is_gluten_free=True,
        preparation_time=2,
        is_available=True
    )

    print("Creating addons...")

    # Create some addons
    extra_cheese = MenuItemAddon.objects.create(
        name="Extra Cheese",
        category="TOPPING",
        description="Additional cheese",
        price=Decimal("1.50"),
        is_available=True
    )

    bacon = MenuItemAddon.objects.create(
        name="Bacon",
        category="TOPPING",
        description="Crispy bacon strips",
        price=Decimal("2.00"),
        is_available=True
    )

    garlic_sauce = MenuItemAddon.objects.create(
        name="Garlic Sauce",
        category="SAUCE",
        description="Creamy garlic sauce",
        price=Decimal("0.99"),
        is_available=True
    )

    # Link addons to menu items
    extra_cheese.menu_items.add(pasta)
    bacon.menu_items.add(grilled_salmon, pasta)
    garlic_sauce.menu_items.add(grilled_salmon, pasta)

    print("✓ Database populated successfully!")
    print(f"  - {Category.objects.count()} categories created")
    print(f"  - {MenuItem.objects.count()} menu items created")
    print(f"  - {MenuItemAddon.objects.count()} addons created")

if __name__ == '__main__':
    # Clear existing data
    print("Clearing existing menu data...")
    MenuItemAddon.objects.all().delete()
    MenuItem.objects.all().delete()
    Category.objects.all().delete()

    # Populate with new data
    populate_menu()
