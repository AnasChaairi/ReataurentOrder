"""
Celery configuration for restaurant_order project.
"""
import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'restaurant_order.settings')

app = Celery('restaurant_order')

# Load config from Django settings with CELERY namespace
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()

# Configure periodic tasks
app.conf.beat_schedule = {
    # Odoo Integration - Menu Sync
    'sync-menu-from-odoo-nightly': {
        'task': 'odoo_integration.tasks.sync_menu_from_odoo',
        'schedule': crontab(hour=2, minute=0),  # 2 AM daily
    },
    # Odoo Integration - Table Sync
    'sync-tables-from-odoo-nightly': {
        'task': 'odoo_integration.tasks.sync_tables_from_odoo',
        'schedule': crontab(hour=2, minute=30),  # 2:30 AM daily
    },
    # Odoo Integration - Retry Failed Syncs
    'retry-failed-odoo-syncs': {
        'task': 'odoo_integration.tasks.retry_failed_syncs',
        'schedule': crontab(minute='*/15'),  # Every 15 minutes
    },
    # Notifications Cleanup
    'cleanup-old-notifications': {
        'task': 'notifications.tasks.cleanup_old_notifications',
        'schedule': crontab(hour=3, minute=0),  # 3 AM daily
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
