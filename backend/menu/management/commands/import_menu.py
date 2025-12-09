"""
Management command to import menu from CSV or JSON file
Usage:
  python manage.py import_menu --file menu.csv
  python manage.py import_menu --file menu.json
"""
from django.core.management.base import BaseCommand, CommandError
from menu.import_export import MenuImporter
from menu.cache import MenuCache
import os


class Command(BaseCommand):
    help = 'Import menu data from CSV or JSON file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            required=True,
            help='Path to the CSV or JSON file to import'
        )

    def handle(self, *args, **options):
        """Execute the command"""
        file_path = options['file']

        # Check if file exists
        if not os.path.exists(file_path):
            raise CommandError(f'File not found: {file_path}')

        # Determine file type
        file_extension = file_path.split('.')[-1].lower()

        if file_extension not in ['csv', 'json']:
            raise CommandError('Unsupported file format. Use CSV or JSON.')

        self.stdout.write(self.style.WARNING(f'Importing menu from {file_path}...'))

        try:
            # Open and import file
            with open(file_path, 'rb') as f:
                if file_extension == 'csv':
                    results = MenuImporter.import_from_csv(f)
                else:
                    results = MenuImporter.import_from_json(f)

            # Display results
            if results['success']:
                self.stdout.write(
                    self.style.SUCCESS('✓ Menu imported successfully!')
                )

                if file_extension == 'csv':
                    self.stdout.write(
                        f"  - Items created: {results['created']}\n"
                        f"  - Items updated: {results['updated']}"
                    )
                else:
                    self.stdout.write(
                        f"  - Categories created: {results['created']['categories']}\n"
                        f"  - Menu items created: {results['created']['items']}\n"
                        f"  - Variants created: {results['created']['variants']}\n"
                        f"  - Add-ons created: {results['created']['addons']}\n"
                        f"  - Categories updated: {results['updated']['categories']}\n"
                        f"  - Menu items updated: {results['updated']['items']}\n"
                        f"  - Variants updated: {results['updated']['variants']}\n"
                        f"  - Add-ons updated: {results['updated']['addons']}"
                    )

                # Invalidate cache
                MenuCache.invalidate_all()
                self.stdout.write(self.style.SUCCESS('✓ Cache invalidated'))

            else:
                self.stdout.write(
                    self.style.ERROR('✗ Import failed with errors:')
                )
                for error in results['errors']:
                    self.stdout.write(f"  - {error}")

        except Exception as e:
            raise CommandError(f'Import failed: {str(e)}')
