"""
Custom exceptions for Odoo integration.

This module defines a hierarchy of exceptions for clear error handling
throughout the Odoo integration library.
"""

from typing import Optional


class OdooIntegrationError(Exception):
    """Base exception for all Odoo integration errors."""
    pass


class OdooConnectionError(OdooIntegrationError):
    """Failed to connect to Odoo server."""
    pass


class OdooAuthenticationError(OdooIntegrationError):
    """Authentication with Odoo server failed."""
    pass


class OdooAPIError(OdooIntegrationError):
    """Generic API call error."""

    def __init__(
        self,
        message: str,
        error_code: Optional[int] = None,
        fault_string: Optional[str] = None
    ):
        super().__init__(message)
        self.error_code = error_code
        self.fault_string = fault_string


class OdooValidationError(OdooIntegrationError):
    """Validation error (missing required fields, invalid data, etc.)."""
    pass


class OdooRecordNotFoundError(OdooIntegrationError):
    """Requested record(s) not found."""
    pass


class OdooAccessDeniedError(OdooIntegrationError):
    """Access denied to resource."""
    pass


# Transient errors (can be retried)
class OdooTransientError(OdooIntegrationError):
    """Base class for transient errors that can be retried."""
    pass


class OdooTimeoutError(OdooTransientError):
    """Request timeout."""
    pass


class OdooRateLimitError(OdooTransientError):
    """Rate limit exceeded."""
    pass
