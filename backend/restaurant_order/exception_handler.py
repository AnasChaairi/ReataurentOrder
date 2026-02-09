import logging

from django.conf import settings
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Custom DRF exception handler that strips internal details in production."""
    response = drf_exception_handler(exc, context)

    if response is not None:
        return response

    # Unhandled exceptions - log full details, return safe message
    logger.exception(
        'Unhandled exception in %s',
        context.get('view', 'unknown'),
        exc_info=exc,
    )

    if settings.DEBUG:
        error_detail = str(exc)
    else:
        error_detail = 'An internal error occurred. Please try again later.'

    return Response(
        {'error': error_detail},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
