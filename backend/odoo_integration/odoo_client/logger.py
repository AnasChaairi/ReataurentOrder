"""
Logging infrastructure for Odoo integration.

Provides structured logging with request/response tracking, error logging,
and sensitive data sanitization.
"""

import logging
import time
from typing import Any, Optional, Dict
from datetime import datetime


class OdooLogger:
    """
    Structured logger for Odoo operations.

    Features:
    - Request/response logging with timing
    - Error logging with context
    - Retry attempt logging
    - Sensitive data sanitization
    """

    def __init__(self, name: str = 'odoo_integration', level: str = 'INFO'):
        """
        Initialize logger.

        Args:
            name: Logger name
            level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        """
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, level.upper()))

        # Add console handler if no handlers exist
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)

        # Prevent propagation to avoid duplicate logs
        self.logger.propagate = False

    def _sanitize_data(self, data: Any) -> Any:
        """
        Sanitize sensitive data from logs.

        Args:
            data: Data to sanitize

        Returns:
            Sanitized data with sensitive fields masked
        """
        if not isinstance(data, (dict, list)):
            return data

        if isinstance(data, dict):
            sanitized = {}
            sensitive_keys = {'password', 'passwd', 'pwd', 'api_key', 'token', 'secret'}

            for key, value in data.items():
                if isinstance(key, str) and key.lower() in sensitive_keys:
                    sanitized[key] = '***'
                elif isinstance(value, (dict, list)):
                    sanitized[key] = self._sanitize_data(value)
                else:
                    sanitized[key] = value
            return sanitized

        if isinstance(data, list):
            return [self._sanitize_data(item) for item in data]

        return data

    def _truncate_data(self, data: Any, max_length: int = 500) -> str:
        """
        Convert data to string and truncate if too long.

        Args:
            data: Data to convert
            max_length: Maximum length

        Returns:
            Truncated string representation
        """
        data_str = str(data)
        if len(data_str) > max_length:
            return data_str[:max_length] + f'... (truncated, total length: {len(data_str)})'
        return data_str

    def log_request(
        self,
        model: str,
        method: str,
        args: list,
        kwargs: dict,
        request_id: Optional[str] = None
    ) -> None:
        """
        Log an outgoing Odoo API request.

        Args:
            model: Odoo model name
            method: Method name
            args: Positional arguments
            kwargs: Keyword arguments
            request_id: Optional request ID for correlation
        """
        sanitized_args = self._sanitize_data(args)
        sanitized_kwargs = self._sanitize_data(kwargs)

        message = f"API Request: {model}.{method}"
        if request_id:
            message += f" [ID: {request_id}]"

        self.logger.debug(
            f"{message} | Args: {self._truncate_data(sanitized_args)} | "
            f"Kwargs: {self._truncate_data(sanitized_kwargs)}"
        )

    def log_response(
        self,
        model: str,
        method: str,
        response: Any,
        duration: float,
        request_id: Optional[str] = None
    ) -> None:
        """
        Log an Odoo API response.

        Args:
            model: Odoo model name
            method: Method name
            response: Response data
            duration: Request duration in seconds
            request_id: Optional request ID for correlation
        """
        message = f"API Response: {model}.{method} | Duration: {duration:.3f}s"
        if request_id:
            message += f" [ID: {request_id}]"

        # Determine response summary based on type
        if isinstance(response, list):
            summary = f"List with {len(response)} items"
            if response and len(response) <= 3:
                summary += f": {self._truncate_data(response, 200)}"
        elif isinstance(response, dict):
            summary = f"Dict with {len(response)} keys"
        elif isinstance(response, bool):
            summary = f"Success: {response}"
        elif isinstance(response, int):
            summary = f"ID: {response}"
        else:
            summary = self._truncate_data(response, 200)

        self.logger.debug(f"{message} | Response: {summary}")

    def log_error(
        self,
        error: Exception,
        context: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None
    ) -> None:
        """
        Log an error with full context.

        Args:
            error: Exception that occurred
            context: Additional context information
            request_id: Optional request ID for correlation
        """
        message = f"Error: {type(error).__name__}: {str(error)}"
        if request_id:
            message += f" [ID: {request_id}]"

        if context:
            sanitized_context = self._sanitize_data(context)
            message += f" | Context: {sanitized_context}"

        self.logger.error(message, exc_info=True)

    def log_retry(
        self,
        attempt: int,
        max_attempts: int,
        error: Exception,
        delay: float,
        request_id: Optional[str] = None
    ) -> None:
        """
        Log a retry attempt.

        Args:
            attempt: Current attempt number
            max_attempts: Maximum attempts
            error: Error that triggered retry
            delay: Delay before retry in seconds
            request_id: Optional request ID for correlation
        """
        message = (
            f"Retry attempt {attempt}/{max_attempts} after {delay:.2f}s | "
            f"Error: {type(error).__name__}: {str(error)}"
        )
        if request_id:
            message += f" [ID: {request_id}]"

        self.logger.warning(message)

    def info(self, message: str) -> None:
        """Log info message."""
        self.logger.info(message)

    def debug(self, message: str) -> None:
        """Log debug message."""
        self.logger.debug(message)

    def warning(self, message: str) -> None:
        """Log warning message."""
        self.logger.warning(message)

    def error(self, message: str, exc_info: bool = False) -> None:
        """Log error message."""
        self.logger.error(message, exc_info=exc_info)


def setup_logging(config: 'OdooConfig') -> OdooLogger:  # type: ignore
    """
    Configure logging based on config.

    Args:
        config: OdooConfig instance

    Returns:
        Configured OdooLogger instance
    """
    from .config import OdooConfig

    return OdooLogger(
        name='odoo_integration',
        level=config.log_level
    )
