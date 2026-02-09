import logging

from django.db import connection
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Basic health check - confirms the service is running."""
    return Response({'status': 'ok'})


@api_view(['GET'])
@permission_classes([AllowAny])
def readiness_check(request):
    """Readiness check - verifies DB, Redis, and Celery are accessible."""
    checks = {}

    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        checks['database'] = 'ok'
    except Exception as e:
        logger.error('Database health check failed: %s', e)
        checks['database'] = 'error'

    # Redis/Cache check
    try:
        cache.set('health_check', 'ok', timeout=10)
        val = cache.get('health_check')
        checks['cache'] = 'ok' if val == 'ok' else 'error'
    except Exception as e:
        logger.error('Cache health check failed: %s', e)
        checks['cache'] = 'error'

    # Celery check
    try:
        from restaurant_order.celery import app as celery_app
        inspector = celery_app.control.inspect(timeout=2)
        ping_result = inspector.ping()
        checks['celery'] = 'ok' if ping_result else 'unavailable'
    except Exception as e:
        logger.error('Celery health check failed: %s', e)
        checks['celery'] = 'unavailable'

    all_ok = all(v == 'ok' for v in checks.values() if v != 'unavailable')
    status_code = status.HTTP_200_OK if all_ok else status.HTTP_503_SERVICE_UNAVAILABLE

    return Response(
        {'status': 'ready' if all_ok else 'degraded', 'checks': checks},
        status=status_code,
    )
