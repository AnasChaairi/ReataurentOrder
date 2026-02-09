"""
Core Odoo XML-RPC client and base model class.

This module provides:
- OdooClient: XML-RPC client with authentication, retry logic, and error handling
- OdooModel: Base class for Odoo model operations (CRUD and more)
"""

import xmlrpc.client
import time
from typing import Any, Optional, Dict, List, Union
from urllib.parse import urljoin

from .config import OdooConfig
from .logger import OdooLogger, setup_logging
from .exceptions import (
    OdooConnectionError,
    OdooAuthenticationError,
    OdooAPIError,
    OdooAccessDeniedError,
    OdooValidationError,
    OdooRecordNotFoundError,
    OdooTimeoutError,
    OdooTransientError
)


class OdooClient:
    """
    Core Odoo XML-RPC client with authentication and connection management.

    Features:
    - XML-RPC connection to Odoo server
    - Authentication and session management
    - Automatic retry with exponential backoff
    - Error handling and exception mapping
    - Request/response logging
    """

    def __init__(self, config: OdooConfig, logger: Optional[OdooLogger] = None):
        """
        Initialize Odoo client.

        Args:
            config: OdooConfig instance
            logger: Optional OdooLogger instance (creates one if not provided)
        """
        # Validate config
        config.validate()

        self.config = config
        self.logger = logger or setup_logging(config)

        # Connection settings
        self.url = config.url
        self.db = config.database
        self.username = config.username
        self.password = config.password

        # Connection objects (lazy initialization)
        self._common: Optional[xmlrpc.client.ServerProxy] = None
        self._object: Optional[xmlrpc.client.ServerProxy] = None
        self._uid: Optional[int] = None

        # Statistics tracking
        self._request_count = 0
        self._error_count = 0

    @property
    def common(self) -> xmlrpc.client.ServerProxy:
        """
        Get common endpoint (lazy initialization).

        Returns:
            XML-RPC ServerProxy for common endpoint
        """
        if self._common is None:
            url = urljoin(self.url, '/xmlrpc/2/common')
            self._common = xmlrpc.client.ServerProxy(url, allow_none=True)
        return self._common

    @property
    def models(self) -> xmlrpc.client.ServerProxy:
        """
        Get models endpoint (lazy initialization).

        Returns:
            XML-RPC ServerProxy for object/models endpoint
        """
        if self._object is None:
            url = urljoin(self.url, '/xmlrpc/2/object')
            self._object = xmlrpc.client.ServerProxy(url, allow_none=True)
        return self._object

    @property
    def uid(self) -> int:
        """
        Get authenticated user ID (authenticate if needed).

        Returns:
            User ID (uid)

        Raises:
            OdooAuthenticationError: If authentication fails
        """
        if self._uid is None:
            self._uid = self.authenticate()
        return self._uid

    def authenticate(self) -> int:
        """
        Authenticate with Odoo server.

        Returns:
            User ID (uid)

        Raises:
            OdooAuthenticationError: If authentication fails
            OdooConnectionError: If cannot connect to server
        """
        try:
            self.logger.info(
                f"Authenticating to Odoo: {self.url}, db={self.db}, user={self.username}"
            )
            uid = self.common.authenticate(self.db, self.username, self.password, {})

            if not uid:
                raise OdooAuthenticationError(
                    f"Authentication failed for user {self.username} on database {self.db}"
                )

            self.logger.info(f"Successfully authenticated. UID: {uid}")
            return uid

        except xmlrpc.client.Fault as e:
            raise OdooAuthenticationError(
                f"Authentication fault: {e.faultString}"
            ) from e
        except Exception as e:
            raise OdooConnectionError(
                f"Failed to connect to Odoo: {str(e)}"
            ) from e

    def version(self) -> dict:
        """
        Get Odoo server version information.

        Returns:
            Dictionary with server version info

        Example:
            >>> client.version()
            {'server_version': '16.0', 'server_version_info': [16, 0, 0, ...], ...}
        """
        try:
            return self.common.version()
        except Exception as e:
            raise OdooConnectionError(
                f"Failed to get server version: {str(e)}"
            ) from e

    def call(
        self,
        model: str,
        method: str,
        args: list,
        kwargs: Optional[dict] = None
    ) -> Any:
        """
        Execute an Odoo model method with retry logic.

        Args:
            model: Odoo model name (e.g., 'product.product')
            method: Method name (e.g., 'search_read')
            args: Positional arguments as list
            kwargs: Keyword arguments as dict

        Returns:
            Method result

        Raises:
            OdooAPIError: For API errors
            OdooAccessDeniedError: For permission errors
            OdooValidationError: For validation errors
            OdooRecordNotFoundError: For missing records
            OdooTimeoutError: For timeout errors
            OdooConnectionError: For unexpected errors

        Example:
            >>> client.call('product.product', 'search', [[['type', '=', 'product']]], {'limit': 10})
            [1, 2, 3, 4, 5]
        """
        kwargs = kwargs or {}

        # Log request
        if self.config.log_requests:
            self.logger.log_request(model, method, args, kwargs)

        # Execute with retry logic
        return self._execute_with_retry(model, method, args, kwargs)

    def _execute_with_retry(
        self,
        model: str,
        method: str,
        args: list,
        kwargs: dict
    ) -> Any:
        """
        Execute API call with exponential backoff retry.

        Args:
            model: Odoo model name
            method: Method name
            args: Positional arguments
            kwargs: Keyword arguments

        Returns:
            Method result

        Raises:
            Various Odoo exceptions based on error type
        """
        last_error: Optional[Exception] = None

        for attempt in range(1, self.config.retry_attempts + 1):
            try:
                start_time = time.time()

                # Make the XML-RPC call
                result = self.models.execute_kw(
                    self.db,
                    self.uid,
                    self.password,
                    model,
                    method,
                    args,
                    kwargs
                )

                duration = time.time() - start_time
                self._request_count += 1

                # Log response
                if self.config.log_responses:
                    self.logger.log_response(model, method, result, duration)

                return result

            except xmlrpc.client.Fault as e:
                last_error = self._handle_fault(e, model, method)

                # Don't retry non-transient errors
                if not isinstance(last_error, OdooTransientError):
                    self._error_count += 1
                    raise last_error

                # Retry logic for transient errors
                if attempt < self.config.retry_attempts:
                    delay = self.config.retry_backoff_factor ** (attempt - 1)
                    self.logger.log_retry(attempt, self.config.retry_attempts, last_error, delay)
                    time.sleep(delay)
                    continue
                else:
                    self._error_count += 1
                    raise last_error

            except Exception as e:
                self._error_count += 1
                raise OdooConnectionError(
                    f"Unexpected error in {model}.{method}: {str(e)}"
                ) from e

        # Should never reach here, but just in case
        if last_error:
            raise last_error
        raise OdooConnectionError("Retry logic failed unexpectedly")

    def _handle_fault(
        self,
        fault: xmlrpc.client.Fault,
        model: str,
        method: str
    ) -> Exception:
        """
        Map XML-RPC faults to custom exceptions.

        Args:
            fault: XML-RPC fault
            model: Odoo model name
            method: Method name

        Returns:
            Appropriate custom exception
        """
        fault_str = fault.faultString.lower()

        # Parse common Odoo error patterns
        if 'access denied' in fault_str or 'accessdenied' in fault_str or 'accesserror' in fault_str:
            return OdooAccessDeniedError(
                f"Access denied to {model}.{method}: {fault.faultString}"
            )

        if 'validation' in fault_str or 'constraint' in fault_str or 'validationerror' in fault_str:
            return OdooValidationError(
                f"Validation error in {model}.{method}: {fault.faultString}"
            )

        if 'not found' in fault_str or 'missing' in fault_str or 'missingError' in fault_str:
            return OdooRecordNotFoundError(
                f"Record not found in {model}.{method}: {fault.faultString}"
            )

        if 'timeout' in fault_str:
            return OdooTimeoutError(
                f"Request timeout in {model}.{method}: {fault.faultString}"
            )

        # Generic API error
        return OdooAPIError(
            f"API error in {model}.{method}: {fault.faultString}",
            error_code=fault.faultCode,
            fault_string=fault.faultString
        )

    def test_connection(self) -> bool:
        """
        Test connection and authentication to Odoo.

        Returns:
            True if connection successful, False otherwise
        """
        try:
            version = self.version()
            uid = self.uid
            return uid is not None and uid > 0
        except Exception as e:
            self.logger.error(f"Connection test failed: {str(e)}")
            return False

    def get_stats(self) -> dict:
        """
        Get client statistics.

        Returns:
            Dictionary with statistics
        """
        return {
            'request_count': self._request_count,
            'error_count': self._error_count,
            'authenticated': self._uid is not None,
            'uid': self._uid
        }


class OdooModel:
    """
    Base class for Odoo model interactions.

    Provides common CRUD operations:
    - search: Find record IDs
    - read: Read record data
    - search_read: Combined search + read
    - create: Create new records
    - write: Update existing records
    - unlink: Delete records
    - call: Call custom model methods

    Subclasses should:
    - Call super().__init__(client, model_name)
    - Add business-specific methods
    - Add validation logic
    """

    def __init__(self, client: OdooClient, model: str):
        """
        Initialize model wrapper.

        Args:
            client: OdooClient instance
            model: Odoo model name (e.g., 'product.product')
        """
        self.client = client
        self.model = model
        self.logger = client.logger

    def search(
        self,
        domain: List[Union[tuple, list]],
        offset: int = 0,
        limit: Optional[int] = None,
        order: Optional[str] = None
    ) -> List[int]:
        """
        Search for records matching domain.

        Args:
            domain: Search domain in Odoo format
            offset: Number of records to skip
            limit: Maximum records to return
            order: Sort order (e.g., 'name ASC')

        Returns:
            List of record IDs

        Example:
            >>> model.search([['active', '=', True]], limit=10)
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        """
        kwargs: Dict[str, Any] = {'offset': offset}
        if limit is not None:
            kwargs['limit'] = limit
        if order is not None:
            kwargs['order'] = order

        return self.client.call(self.model, 'search', [domain], kwargs)

    def read(
        self,
        ids: List[int],
        fields: Optional[List[str]] = None
    ) -> List[dict]:
        """
        Read record data.

        Args:
            ids: List of record IDs
            fields: List of field names (None = all fields)

        Returns:
            List of record dictionaries

        Example:
            >>> model.read([1, 2], ['id', 'name', 'email'])
            [{'id': 1, 'name': 'Product 1', 'email': 'p1@example.com'}, ...]
        """
        if not ids:
            return []

        kwargs: Dict[str, Any] = {}
        if fields is not None:
            kwargs['fields'] = fields

        return self.client.call(self.model, 'read', [ids], kwargs)

    def search_read(
        self,
        domain: List[Union[tuple, list]],
        fields: Optional[List[str]] = None,
        offset: int = 0,
        limit: Optional[int] = None,
        order: Optional[str] = None
    ) -> List[dict]:
        """
        Combined search and read operation (more efficient).

        Args:
            domain: Search domain
            fields: List of field names
            offset: Number of records to skip
            limit: Maximum records to return
            order: Sort order

        Returns:
            List of record dictionaries

        Example:
            >>> model.search_read([['active', '=', True]], ['id', 'name'], limit=100)
            [{'id': 1, 'name': 'Record 1'}, {'id': 2, 'name': 'Record 2'}, ...]
        """
        kwargs: Dict[str, Any] = {'offset': offset}
        if fields is not None:
            kwargs['fields'] = fields
        if limit is not None:
            kwargs['limit'] = limit
        if order is not None:
            kwargs['order'] = order

        return self.client.call(self.model, 'search_read', [domain], kwargs)

    def create(self, values: dict) -> int:
        """
        Create a new record.

        Args:
            values: Field values for new record

        Returns:
            ID of created record

        Example:
            >>> model.create({'name': 'New Product', 'type': 'product'})
            123
        """
        return self.client.call(self.model, 'create', [values])

    def write(self, ids: List[int], values: dict) -> bool:
        """
        Update existing records.

        Args:
            ids: List of record IDs to update
            values: Field values to update

        Returns:
            True if successful

        Example:
            >>> model.write([1, 2], {'active': False})
            True
        """
        if not ids:
            return True

        return self.client.call(self.model, 'write', [ids, values])

    def unlink(self, ids: List[int]) -> bool:
        """
        Delete records.

        Args:
            ids: List of record IDs to delete

        Returns:
            True if successful

        Example:
            >>> model.unlink([1, 2, 3])
            True
        """
        if not ids:
            return True

        return self.client.call(self.model, 'unlink', [ids])

    def call(self, method: str, args: list, kwargs: Optional[dict] = None) -> Any:
        """
        Call a custom model method.

        Args:
            method: Method name
            args: Positional arguments
            kwargs: Keyword arguments

        Returns:
            Method result

        Example:
            >>> model.call('action_confirm', [[order_id]], {})
            True
        """
        return self.client.call(self.model, method, args, kwargs)

    def browse(
        self,
        record_id: int,
        fields: Optional[List[str]] = None
    ) -> Optional[dict]:
        """
        Read a single record by ID.

        Args:
            record_id: Record ID
            fields: List of field names

        Returns:
            Record dictionary or None if not found

        Example:
            >>> model.browse(1, ['id', 'name'])
            {'id': 1, 'name': 'Product 1'}
        """
        records = self.read([record_id], fields)
        return records[0] if records else None

    def search_count(self, domain: List[Union[tuple, list]]) -> int:
        """
        Count records matching domain.

        Args:
            domain: Search domain

        Returns:
            Number of matching records

        Example:
            >>> model.search_count([['active', '=', True]])
            42
        """
        return self.client.call(self.model, 'search_count', [domain])

    def exists(self, ids: List[int]) -> List[int]:
        """
        Check which IDs exist.

        Args:
            ids: List of record IDs

        Returns:
            List of existing IDs

        Example:
            >>> model.exists([1, 2, 999])
            [1, 2]
        """
        if not ids:
            return []

        return self.client.call(self.model, 'exists', [ids])

    def fields_get(
        self,
        fields: Optional[List[str]] = None,
        attributes: Optional[List[str]] = None
    ) -> dict:
        """
        Get field definitions for the model.

        Args:
            fields: List of field names (None = all fields)
            attributes: List of attributes to return

        Returns:
            Dictionary of field definitions

        Example:
            >>> model.fields_get(['name', 'email'])
            {'name': {'type': 'char', 'string': 'Name', ...}, ...}
        """
        args: List[Any] = []
        kwargs: Dict[str, Any] = {}

        if fields is not None:
            args.append(fields)
        if attributes is not None:
            kwargs['attributes'] = attributes

        return self.client.call(self.model, 'fields_get', args, kwargs)
