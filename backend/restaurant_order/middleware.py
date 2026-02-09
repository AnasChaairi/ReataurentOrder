import logging
import time

logger = logging.getLogger('django.request')


class RequestLoggingMiddleware:
    """Log method, path, status, duration, and user for every API request."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.monotonic()

        response = self.get_response(request)

        duration_ms = (time.monotonic() - start_time) * 1000
        user = getattr(request, 'user', None)
        user_str = str(user) if user and user.is_authenticated else 'anonymous'

        logger.info(
            '%s %s %s %.0fms user=%s',
            request.method,
            request.get_full_path(),
            response.status_code,
            duration_ms,
            user_str,
        )

        return response
