"""
Configuration management for Odoo integration.

Supports multiple configuration sources:
- Direct instantiation with parameters
- Environment variables
- YAML/JSON configuration files
"""

import os
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False


@dataclass
class OdooConfig:
    """
    Odoo connection configuration.

    Attributes:
        url: Odoo server URL (e.g., http://localhost:10018)
        database: Database name
        username: Username for authentication
        password: Password for authentication
        timeout: Request timeout in seconds (default: 300)
        retry_attempts: Number of retry attempts for transient errors (default: 3)
        retry_backoff_factor: Exponential backoff factor for retries (default: 2.0)
        log_level: Logging level (default: INFO)
        log_requests: Whether to log API requests (default: False)
        log_responses: Whether to log API responses (default: False)
    """
    url: str
    database: str
    username: str
    password: str
    timeout: int = 300
    retry_attempts: int = 3
    retry_backoff_factor: float = 2.0
    log_level: str = "INFO"
    log_requests: bool = False
    log_responses: bool = False

    @classmethod
    def from_env(cls) -> 'OdooConfig':
        """
        Load configuration from environment variables.

        Environment variables:
            ODOO_URL: Odoo server URL
            ODOO_DB: Database name
            ODOO_USERNAME: Username
            ODOO_PASSWORD: Password
            ODOO_TIMEOUT: Timeout in seconds (optional)
            ODOO_RETRY_ATTEMPTS: Retry attempts (optional)
            ODOO_RETRY_BACKOFF_FACTOR: Backoff factor (optional)
            ODOO_LOG_LEVEL: Log level (optional)
            ODOO_LOG_REQUESTS: Log requests (optional, true/false)
            ODOO_LOG_RESPONSES: Log responses (optional, true/false)

        Returns:
            OdooConfig instance

        Raises:
            ValueError: If required environment variables are missing
        """
        # Required fields
        url = os.getenv('ODOO_URL')
        database = os.getenv('ODOO_DB')
        username = os.getenv('ODOO_USERNAME')
        password = os.getenv('ODOO_PASSWORD')

        if not all([url, database, username, password]):
            missing = []
            if not url:
                missing.append('ODOO_URL')
            if not database:
                missing.append('ODOO_DB')
            if not username:
                missing.append('ODOO_USERNAME')
            if not password:
                missing.append('ODOO_PASSWORD')
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

        # Optional fields with defaults
        timeout = int(os.getenv('ODOO_TIMEOUT', '300'))
        retry_attempts = int(os.getenv('ODOO_RETRY_ATTEMPTS', '3'))
        retry_backoff_factor = float(os.getenv('ODOO_RETRY_BACKOFF_FACTOR', '2.0'))
        log_level = os.getenv('ODOO_LOG_LEVEL', 'INFO')
        log_requests = os.getenv('ODOO_LOG_REQUESTS', 'false').lower() in ('true', '1', 'yes')
        log_responses = os.getenv('ODOO_LOG_RESPONSES', 'false').lower() in ('true', '1', 'yes')

        return cls(
            url=url,
            database=database,
            username=username,
            password=password,
            timeout=timeout,
            retry_attempts=retry_attempts,
            retry_backoff_factor=retry_backoff_factor,
            log_level=log_level,
            log_requests=log_requests,
            log_responses=log_responses
        )

    @classmethod
    def from_file(cls, path: str) -> 'OdooConfig':
        """
        Load configuration from YAML or JSON file.

        File format (YAML):
            odoo:
              url: http://localhost:10018
              database: test-db
              username: test@gmail.com
              password: anas1234
              timeout: 300
              retry_attempts: 3
              logging:
                level: INFO
                log_requests: false
                log_responses: false

        File format (JSON):
            {
              "odoo": {
                "url": "http://localhost:10018",
                "database": "test-db",
                ...
              }
            }

        Args:
            path: Path to config file

        Returns:
            OdooConfig instance

        Raises:
            FileNotFoundError: If config file doesn't exist
            ValueError: If config file is invalid or missing required fields
        """
        file_path = Path(path)

        if not file_path.exists():
            raise FileNotFoundError(f"Config file not found: {path}")

        # Load file based on extension
        with open(file_path, 'r') as f:
            if file_path.suffix in ('.yaml', '.yml'):
                if not YAML_AVAILABLE:
                    raise ImportError(
                        "PyYAML is required to load YAML config files. "
                        "Install it with: pip install pyyaml"
                    )
                data = yaml.safe_load(f)
            elif file_path.suffix == '.json':
                data = json.load(f)
            else:
                raise ValueError(f"Unsupported config file format: {file_path.suffix}")

        # Extract odoo config section
        if 'odoo' not in data:
            raise ValueError("Config file must contain 'odoo' section")

        return cls.from_dict(data['odoo'])

    @classmethod
    def from_dict(cls, data: dict) -> 'OdooConfig':
        """
        Load configuration from dictionary.

        Args:
            data: Configuration dictionary

        Returns:
            OdooConfig instance

        Raises:
            ValueError: If required fields are missing
        """
        # Required fields
        url = data.get('url')
        database = data.get('database')
        username = data.get('username')
        password = data.get('password')

        if not all([url, database, username, password]):
            missing = []
            if not url:
                missing.append('url')
            if not database:
                missing.append('database')
            if not username:
                missing.append('username')
            if not password:
                missing.append('password')
            raise ValueError(f"Missing required fields: {', '.join(missing)}")

        # Optional fields
        timeout = data.get('timeout', 300)
        retry_attempts = data.get('retry_attempts', 3)
        retry_backoff_factor = data.get('retry_backoff_factor', 2.0)

        # Logging config (can be nested or flat)
        logging = data.get('logging', {})
        log_level = logging.get('level', data.get('log_level', 'INFO'))
        log_requests = logging.get('log_requests', data.get('log_requests', False))
        log_responses = logging.get('log_responses', data.get('log_responses', False))

        return cls(
            url=url,
            database=database,
            username=username,
            password=password,
            timeout=timeout,
            retry_attempts=retry_attempts,
            retry_backoff_factor=retry_backoff_factor,
            log_level=log_level,
            log_requests=log_requests,
            log_responses=log_responses
        )

    def validate(self) -> None:
        """
        Validate configuration.

        Raises:
            ValueError: If configuration is invalid
        """
        # Validate URL format
        try:
            parsed = urlparse(self.url)
            if not parsed.scheme or not parsed.netloc:
                raise ValueError(f"Invalid URL format: {self.url}")
        except Exception as e:
            raise ValueError(f"Invalid URL: {self.url} - {str(e)}")

        # Validate required string fields are not empty
        if not self.database.strip():
            raise ValueError("Database name cannot be empty")
        if not self.username.strip():
            raise ValueError("Username cannot be empty")
        if not self.password.strip():
            raise ValueError("Password cannot be empty")

        # Validate numeric fields
        if self.timeout <= 0:
            raise ValueError(f"Timeout must be positive, got: {self.timeout}")
        if self.retry_attempts < 0:
            raise ValueError(f"Retry attempts cannot be negative, got: {self.retry_attempts}")
        if self.retry_backoff_factor <= 0:
            raise ValueError(f"Backoff factor must be positive, got: {self.retry_backoff_factor}")

        # Validate log level
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if self.log_level.upper() not in valid_levels:
            raise ValueError(
                f"Invalid log level: {self.log_level}. "
                f"Must be one of: {', '.join(valid_levels)}"
            )

    def __repr__(self) -> str:
        """String representation with password masked."""
        return (
            f"OdooConfig(url='{self.url}', database='{self.database}', "
            f"username='{self.username}', password='***', "
            f"timeout={self.timeout}, retry_attempts={self.retry_attempts})"
        )
