"""
Management command to warm up menu cache
Usage: python manage.py warm_menu_cache
"""
from django.core.management.base import BaseCommand
from menu.cache import MenuCache


class Command(BaseCommand):
    help = 'Warm up menu cache with frequently accessed data'

    def handle(self, *args, **options):
        """Execute the command"""
        self.stdout.write(self.style.WARNING('Warming up menu cache...'))

        try:
            result = MenuCache.warm_cache()

            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Cache warmed successfully!\n'
                    f'  - Categories cached: {result["categories_cached"]}\n'
                    f'  - Menu items cached: {result["menu_items_cached"]}\n'
                    f'  - Featured items cached: {result["featured_items_cached"]}'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Error warming cache: {str(e)}')
            )
