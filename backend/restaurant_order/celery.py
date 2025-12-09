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
    'sync-menu-from-odoo-nightly': {
        'task': 'odoo_integration.tasks.sync_menu_from_odoo',
        'schedule': crontab(hour=2, minute=0),  # Run at 2 AM daily
    },
    'cleanup-old-notifications': {
        'task': 'notifications.tasks.cleanup_old_notifications',
        'schedule': crontab(hour=3, minute=0),  # Run at 3 AM daily
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
