"""
Odoo Client Package

Provides XML-RPC integration with Odoo POS for:
- Connection management
- Product/Menu operations
- POS order creation
- Restaurant table/floor management
"""

from .client import OdooClient, OdooModel
from .config import OdooConfig
from .exceptions import (
    OdooIntegrationError,
    OdooConnectionError,
    OdooAuthenticationError,
    OdooAPIError,
    OdooValidationError,
    OdooRecordNotFoundError,
    OdooAccessDeniedError,
    OdooTransientError,
    OdooTimeoutError,
    OdooRateLimitError,
)
from .services import ProductService, SaleOrderService
from .pos_service import POSService

__all__ = [
    # Core client
    'OdooClient',
    'OdooModel',
    'OdooConfig',

    # Services
    'ProductService',
    'SaleOrderService',
    'POSService',

    # Exceptions
    'OdooIntegrationError',
    'OdooConnectionError',
    'OdooAuthenticationError',
    'OdooAPIError',
    'OdooValidationError',
    'OdooRecordNotFoundError',
    'OdooAccessDeniedError',
    'OdooTransientError',
    'OdooTimeoutError',
    'OdooRateLimitError',
]
