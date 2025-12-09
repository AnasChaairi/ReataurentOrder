"""
Menu import/export functionality
"""
import csv
import json
from io import StringIO, BytesIO
from django.http import HttpResponse
from django.db import transaction
from .models import Category, MenuItem, MenuItemVariant, MenuItemAddon
from decimal import Decimal


class MenuExporter:
    """Service for exporting menu data"""

    @staticmethod
    def export_to_csv():
        """Export menu to CSV format"""
        output = StringIO()
        writer = csv.writer(output)

        # Write headers
        writer.writerow([
            'Category', 'Item Name', 'Description', 'Price',
            'Is Vegetarian', 'Is Vegan', 'Is Gluten Free',
            'Preparation Time', 'Ingredients', 'Allergens',
            'Calories', 'Is Available', 'Is Featured'
        ])

        # Write menu items
        menu_items = MenuItem.objects.select_related('category').all()
        for item in menu_items:
            writer.writerow([
                item.category.name,
                item.name,
                item.description,
                str(item.price),
                item.is_vegetarian,
                item.is_vegan,
                item.is_gluten_free,
                item.preparation_time,
                item.ingredients or '',
                item.allergens or '',
                item.calories or '',
                item.is_available,
                item.is_featured
            ])

        return output.getvalue()

    @staticmethod
    def export_to_json():
        """Export menu to JSON format"""
        data = {
            'categories': [],
            'menu_items': [],
            'variants': [],
            'addons': []
        }

        # Export categories
        for category in Category.objects.all():
            data['categories'].append({
                'name': category.name,
                'description': category.description,
                'order': category.order,
                'is_active': category.is_active
            })

        # Export menu items
        for item in MenuItem.objects.select_related('category').all():
            data['menu_items'].append({
                'category': item.category.name,
                'name': item.name,
                'description': item.description,
                'price': str(item.price),
                'is_vegetarian': item.is_vegetarian,
                'is_vegan': item.is_vegan,
                'is_gluten_free': item.is_gluten_free,
                'preparation_time': item.preparation_time,
                'ingredients': item.ingredients,
                'allergens': item.allergens,
                'calories': item.calories,
                'is_available': item.is_available,
                'is_featured': item.is_featured
            })

        # Export variants
        for variant in MenuItemVariant.objects.select_related('menu_item').all():
            data['variants'].append({
                'menu_item': variant.menu_item.name,
                'name': variant.name,
                'size': variant.size,
                'price_modifier': str(variant.price_modifier),
                'is_available': variant.is_available
            })

        # Export add-ons
        for addon in MenuItemAddon.objects.all():
            menu_item_names = [item.name for item in addon.menu_items.all()]
            data['addons'].append({
                'name': addon.name,
                'category': addon.category,
                'description': addon.description,
                'price': str(addon.price),
                'is_available': addon.is_available,
                'menu_items': menu_item_names
            })

        return json.dumps(data, indent=2)


class MenuImporter:
    """Service for importing menu data"""

    @staticmethod
    def import_from_csv(csv_file):
        """
        Import menu from CSV file
        Returns: dict with success status and messages
        """
        results = {
            'success': True,
            'created': 0,
            'updated': 0,
            'errors': []
        }

        try:
            # Read CSV file
            csv_data = csv_file.read().decode('utf-8')
            csv_reader = csv.DictReader(StringIO(csv_data))

            with transaction.atomic():
                for row_num, row in enumerate(csv_reader, start=2):
                    try:
                        # Get or create category
                        category, created = Category.objects.get_or_create(
                            name=row['Category'].strip(),
                            defaults={'is_active': True}
                        )

                        # Parse boolean values
                        is_vegetarian = row.get('Is Vegetarian', '').lower() in ['true', '1', 'yes']
                        is_vegan = row.get('Is Vegan', '').lower() in ['true', '1', 'yes']
                        is_gluten_free = row.get('Is Gluten Free', '').lower() in ['true', '1', 'yes']
                        is_available = row.get('Is Available', 'true').lower() in ['true', '1', 'yes']
                        is_featured = row.get('Is Featured', '').lower() in ['true', '1', 'yes']

                        # Parse numeric values
                        price = Decimal(row['Price'].strip())
                        prep_time = int(row.get('Preparation Time', '15'))
                        calories = int(row['Calories']) if row.get('Calories', '').strip() else None

                        # Create or update menu item
                        menu_item, created = MenuItem.objects.update_or_create(
                            name=row['Item Name'].strip(),
                            defaults={
                                'category': category,
                                'description': row.get('Description', '').strip(),
                                'price': price,
                                'is_vegetarian': is_vegetarian,
                                'is_vegan': is_vegan,
                                'is_gluten_free': is_gluten_free,
                                'preparation_time': prep_time,
                                'ingredients': row.get('Ingredients', '').strip(),
                                'allergens': row.get('Allergens', '').strip(),
                                'calories': calories,
                                'is_available': is_available,
                                'is_featured': is_featured
                            }
                        )

                        if created:
                            results['created'] += 1
                        else:
                            results['updated'] += 1

                    except Exception as e:
                        results['errors'].append(f"Row {row_num}: {str(e)}")

                # If there are errors, rollback
                if results['errors']:
                    results['success'] = False
                    transaction.set_rollback(True)

        except Exception as e:
            results['success'] = False
            results['errors'].append(f"File error: {str(e)}")

        return results

    @staticmethod
    def import_from_json(json_file):
        """
        Import menu from JSON file
        Returns: dict with success status and messages
        """
        results = {
            'success': True,
            'created': {'categories': 0, 'items': 0, 'variants': 0, 'addons': 0},
            'updated': {'categories': 0, 'items': 0, 'variants': 0, 'addons': 0},
            'errors': []
        }

        try:
            # Parse JSON file
            json_data = json.load(json_file)

            with transaction.atomic():
                # Import categories
                for cat_data in json_data.get('categories', []):
                    try:
                        category, created = Category.objects.update_or_create(
                            name=cat_data['name'],
                            defaults={
                                'description': cat_data.get('description', ''),
                                'order': cat_data.get('order', 0),
                                'is_active': cat_data.get('is_active', True)
                            }
                        )
                        if created:
                            results['created']['categories'] += 1
                        else:
                            results['updated']['categories'] += 1
                    except Exception as e:
                        results['errors'].append(f"Category '{cat_data.get('name')}': {str(e)}")

                # Import menu items
                for item_data in json_data.get('menu_items', []):
                    try:
                        category = Category.objects.get(name=item_data['category'])
                        menu_item, created = MenuItem.objects.update_or_create(
                            name=item_data['name'],
                            defaults={
                                'category': category,
                                'description': item_data.get('description', ''),
                                'price': Decimal(item_data['price']),
                                'is_vegetarian': item_data.get('is_vegetarian', False),
                                'is_vegan': item_data.get('is_vegan', False),
                                'is_gluten_free': item_data.get('is_gluten_free', False),
                                'preparation_time': item_data.get('preparation_time', 15),
                                'ingredients': item_data.get('ingredients', ''),
                                'allergens': item_data.get('allergens', ''),
                                'calories': item_data.get('calories'),
                                'is_available': item_data.get('is_available', True),
                                'is_featured': item_data.get('is_featured', False)
                            }
                        )
                        if created:
                            results['created']['items'] += 1
                        else:
                            results['updated']['items'] += 1
                    except Exception as e:
                        results['errors'].append(f"Menu item '{item_data.get('name')}': {str(e)}")

                # Import variants
                for variant_data in json_data.get('variants', []):
                    try:
                        menu_item = MenuItem.objects.get(name=variant_data['menu_item'])
                        variant, created = MenuItemVariant.objects.update_or_create(
                            menu_item=menu_item,
                            name=variant_data['name'],
                            defaults={
                                'size': variant_data.get('size', ''),
                                'price_modifier': Decimal(variant_data['price_modifier']),
                                'is_available': variant_data.get('is_available', True)
                            }
                        )
                        if created:
                            results['created']['variants'] += 1
                        else:
                            results['updated']['variants'] += 1
                    except Exception as e:
                        results['errors'].append(f"Variant '{variant_data.get('name')}': {str(e)}")

                # Import add-ons
                for addon_data in json_data.get('addons', []):
                    try:
                        addon, created = MenuItemAddon.objects.update_or_create(
                            name=addon_data['name'],
                            defaults={
                                'category': addon_data.get('category', 'EXTRA'),
                                'description': addon_data.get('description', ''),
                                'price': Decimal(addon_data['price']),
                                'is_available': addon_data.get('is_available', True)
                            }
                        )

                        # Assign to menu items
                        if 'menu_items' in addon_data:
                            menu_items = MenuItem.objects.filter(
                                name__in=addon_data['menu_items']
                            )
                            addon.menu_items.set(menu_items)

                        if created:
                            results['created']['addons'] += 1
                        else:
                            results['updated']['addons'] += 1
                    except Exception as e:
                        results['errors'].append(f"Add-on '{addon_data.get('name')}': {str(e)}")

                # If there are errors, rollback
                if results['errors']:
                    results['success'] = False
                    transaction.set_rollback(True)

        except Exception as e:
            results['success'] = False
            results['errors'].append(f"File error: {str(e)}")

        return results
