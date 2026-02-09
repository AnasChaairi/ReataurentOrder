"""
Django Service Layer for Odoo Integration

Wraps the raw Odoo client with Django-specific logic:
- Connection management from Django OdooConfig
- Order synchronization with Django Order model
- Menu synchronization from Odoo to Django
- Table synchronization from Odoo to Django
"""

import logging
import traceback
from typing import Optional, Dict, List
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.conf import settings

from .odoo_client import (
    OdooClient,
    OdooConfig as ClientConfig,
    POSService,
    ProductService,
    OdooConnectionError,
    OdooAuthenticationError,
    OdooAPIError,
    OdooValidationError,
)
from .models import OdooConfig, OdooSyncLog

logger = logging.getLogger(__name__)


class OdooConnectionService:
    """
    Manage Odoo connection from Django configuration.
    """

    @staticmethod
    def get_active_config() -> Optional[OdooConfig]:
        """Get the active Odoo configuration."""
        return OdooConfig.objects.filter(is_active=True).first()

    @staticmethod
    def get_client(config: OdooConfig) -> OdooClient:
        """
        Create Odoo client from Django configuration.

        Args:
            config: Django OdooConfig instance

        Returns:
            Configured OdooClient instance
        """
        client_config = ClientConfig(
            url=config.url,
            database=config.database,
            username=config.username,
            password=config.decrypted_password,
            timeout=config.timeout,
            retry_attempts=config.retry_attempts
        )
        return OdooClient(client_config)

    @staticmethod
    def test_connection(config: OdooConfig) -> Dict:
        """
        Test Odoo connection and update config status.

        Args:
            config: Django OdooConfig instance

        Returns:
            Dict with 'success' (bool), 'message' (str), 'version_info' (dict)
        """
        try:
            client = OdooConnectionService.get_client(config)

            if client.test_connection():
                version_info = client.version()

                # Update config status
                config.last_test_at = timezone.now()
                config.last_test_success = True
                config.last_test_error = ''
                config.save(update_fields=['last_test_at', 'last_test_success', 'last_test_error'])

                return {
                    'success': True,
                    'message': 'Connection successful',
                    'version_info': version_info
                }
            else:
                raise OdooConnectionError("Connection test failed")

        except (OdooConnectionError, OdooAuthenticationError, OdooAPIError) as e:
            # Update config status
            config.last_test_at = timezone.now()
            config.last_test_success = False
            config.last_test_error = str(e)
            config.save(update_fields=['last_test_at', 'last_test_success', 'last_test_error'])

            return {
                'success': False,
                'message': str(e),
                'version_info': None
            }


class OdooOrderSyncService:
    """
    Synchronize Django orders to Odoo POS.
    """

    def __init__(self, config: OdooConfig):
        """
        Initialize service with Odoo configuration.

        Args:
            config: Django OdooConfig instance
        """
        self.config = config
        self.client = OdooConnectionService.get_client(config)
        self.pos_service = POSService(self.client)

    @transaction.atomic
    def sync_order_to_odoo(self, order, user=None) -> OdooSyncLog:
        """
        Push Django order to Odoo POS.

        Steps:
        1. Create sync log (PENDING)
        2. Get or open POS session
        3. Convert Django order to Odoo format
        4. Create POS order in Odoo
        5. Update Django order (odoo_order_id, synced_to_odoo)
        6. Create OrderEvent (ODOO_SYNCED)
        7. Mark sync log SUCCESS

        Args:
            order: Django Order instance
            user: User who triggered sync (None for automatic)

        Returns:
            OdooSyncLog instance

        Raises:
            Exception: If sync fails
        """
        from orders.models import OrderEvent

        # Create sync log
        sync_log = OdooSyncLog.objects.create(
            sync_type='ORDER_PUSH',
            status='PENDING',
            order=order,
            odoo_config=self.config,
            triggered_by=user,
            request_data={}
        )

        try:
            # Step 1: Get or open POS session
            pos_config_id = self.config.pos_config_id
            if not pos_config_id:
                raise OdooValidationError("No POS configuration selected")

            session = self.pos_service.get_open_session(pos_config_id)
            if not session:
                # Open new session
                session_id = self.pos_service.open_session(pos_config_id)
                logger.info(f"Opened new POS session: {session_id}")
            else:
                session_id = session['id']
                logger.info(f"Using existing POS session: {session_id}")

            # Step 2: Convert Django order to Odoo format
            order_data = self._convert_order_to_odoo_format(order, session_id)

            # Save request data to sync log
            sync_log.request_data = order_data
            sync_log.save(update_fields=['request_data'])

            # Step 3: Resolve Odoo table ID
            odoo_table_id = None
            if order.table:
                if order.table.odoo_table_id:
                    odoo_table_id = order.table.odoo_table_id
                    logger.info(
                        f"Order {order.order_number}: mapped Django table '{order.table.number}' "
                        f"(ID: {order.table.id}) -> Odoo table ID: {odoo_table_id}"
                    )
                else:
                    logger.warning(
                        f"Order {order.order_number}: Django table '{order.table.number}' "
                        f"(ID: {order.table.id}) has no odoo_table_id. "
                        f"Order will be created without table assignment in Odoo. "
                        f"Run table sync to fix this."
                    )
            else:
                logger.warning(
                    f"Order {order.order_number}: no table assigned. "
                    f"Order will be created without table assignment in Odoo."
                )

            # Step 4: Create POS order in Odoo
            logger.info(f"Creating POS order for Django order {order.order_number}")
            odoo_order_id = self.pos_service.create_pos_order(
                session_id=session_id,
                partner_id=order.customer.id if order.customer else None,
                order_lines=order_data['order_lines'],
                payments=order_data.get('payments', []),
                table_id=odoo_table_id,
                pos_reference=order.order_number
            )

            logger.info(f"Created Odoo POS order: {odoo_order_id}")

            # Step 5: Update Django order
            order.odoo_order_id = odoo_order_id
            order.synced_to_odoo = True
            order.odoo_sync_error = ''
            order.save(update_fields=['odoo_order_id', 'synced_to_odoo', 'odoo_sync_error'])

            # Step 6: Create OrderEvent
            OrderEvent.objects.create(
                order=order,
                event_type='ODOO_SYNCED',
                actor=user,
                description=f"Order synced to Odoo POS (Order ID: {odoo_order_id})",
                metadata={
                    'odoo_order_id': odoo_order_id,
                    'session_id': session_id,
                    'sync_log_id': sync_log.id
                }
            )

            # Step 7: Mark sync log as SUCCESS
            sync_log.mark_success(
                odoo_id=odoo_order_id,
                response_data={'odoo_order_id': odoo_order_id, 'session_id': session_id}
            )

            logger.info(f"Successfully synced order {order.order_number} to Odoo")
            return sync_log

        except Exception as e:
            # Mark sync log as FAILED
            error_msg = str(e)
            error_trace = traceback.format_exc()

            sync_log.mark_failed(error_msg, error_trace)

            # Update order error field
            order.odoo_sync_error = error_msg
            order.save(update_fields=['odoo_sync_error'])

            logger.error(f"Failed to sync order {order.order_number} to Odoo: {error_msg}")
            logger.debug(f"Traceback: {error_trace}")

            # Schedule retry if possible
            if sync_log.can_retry():
                sync_log.schedule_retry()
                logger.info(f"Scheduled retry for order {order.order_number} (attempt {sync_log.retry_count}/{sync_log.max_retries})")

            raise

    def _convert_order_to_odoo_format(self, order, session_id) -> Dict:
        """
        Convert Django Order to Odoo POS order format.

        Args:
            order: Django Order instance
            session_id: Odoo POS session ID

        Returns:
            Dict with 'order_lines' and optional 'payments'
        """
        order_lines = []

        for item in order.items.all():
            # Ensure item has Odoo product ID
            if not item.menu_item.odoo_product_id:
                raise OdooValidationError(
                    f"Menu item '{item.menu_item.name}' is not synced from Odoo (missing odoo_product_id)"
                )

            order_lines.append({
                'product_id': item.menu_item.odoo_product_id,
                'qty': float(item.quantity),
                'price_unit': float(item.unit_price),
            })

        # Note: Payments can be added later if needed
        # For now, we create orders without immediate payment
        return {
            'session_id': session_id,
            'order_lines': order_lines,
            'payments': [],  # Can be added later
        }


class OdooMenuSyncService:
    """
    Synchronize menu items FROM Odoo TO Django.
    """

    def __init__(self, config: OdooConfig):
        """
        Initialize service with Odoo configuration.

        Args:
            config: Django OdooConfig instance
        """
        self.config = config
        self.client = OdooConnectionService.get_client(config)
        self.product_service = ProductService(self.client)

    @transaction.atomic
    def sync_menu_from_odoo(self, user=None) -> Dict:
        """
        Pull products from Odoo and update Django menu.

        Returns:
            Dict with sync statistics:
            {
                'categories_created': N,
                'categories_updated': M,
                'items_created': K,
                'items_updated': L,
                'sync_log_id': ID
            }
        """
        from menu.models import Category, MenuItem

        # Create sync log
        sync_log = OdooSyncLog.objects.create(
            sync_type='MENU_SYNC',
            status='PENDING',
            odoo_config=self.config,
            triggered_by=user
        )

        try:
            stats = {
                'categories_created': 0,
                'categories_updated': 0,
                'items_created': 0,
                'items_updated': 0,
            }

            # Fetch all products from Odoo
            logger.info("Fetching products from Odoo...")
            products = self.product_service.get_all_products(
                fields=['id', 'name', 'list_price', 'categ_id', 'type', 'available_in_pos']
            )

            # Filter only POS-available products
            pos_products = [p for p in products if p.get('available_in_pos', False)]
            logger.info(f"Found {len(pos_products)} POS-available products in Odoo")

            # Step 1: Sync categories
            category_map = {}  # Map Odoo category ID -> Django Category
            for product in pos_products:
                if product.get('categ_id'):
                    odoo_cat_id = product['categ_id'][0]  # [id, 'name']
                    odoo_cat_name = product['categ_id'][1]

                    if odoo_cat_id not in category_map:
                        # Create or update category
                        category, created = Category.objects.update_or_create(
                            odoo_category_id=odoo_cat_id,
                            defaults={
                                'name': odoo_cat_name,
                                'odoo_last_synced': timezone.now(),
                            }
                        )
                        category_map[odoo_cat_id] = category

                        if created:
                            stats['categories_created'] += 1
                        else:
                            stats['categories_updated'] += 1

            # Step 2: Sync menu items
            for product in pos_products:
                odoo_product_id = product['id']
                odoo_cat_id = product.get('categ_id', [None])[0]

                # Get Django category
                category = category_map.get(odoo_cat_id)
                if not category:
                    # Use default category
                    category, _ = Category.objects.get_or_create(
                        name='Uncategorized',
                        defaults={'odoo_last_synced': timezone.now()}
                    )

                # Create or update menu item
                defaults = {
                    'name': product['name'],
                    'price': Decimal(str(product.get('list_price', 0))),
                    'category': category,
                    'is_available': product.get('available_in_pos', True),
                    'odoo_last_synced': timezone.now(),
                }

                # Create minimal description if not exists
                item, created = MenuItem.objects.update_or_create(
                    odoo_product_id=odoo_product_id,
                    defaults=defaults
                )

                # Set description if newly created and empty
                if created and not item.description:
                    item.description = f"Synced from Odoo: {product['name']}"
                    item.save(update_fields=['description'])

                if created:
                    stats['items_created'] += 1
                else:
                    stats['items_updated'] += 1

            # Mark sync log as SUCCESS
            sync_log.mark_success(
                odoo_id=len(pos_products),
                response_data=stats
            )

            logger.info(f"Menu sync completed: {stats}")
            stats['sync_log_id'] = sync_log.id
            return stats

        except Exception as e:
            error_msg = str(e)
            error_trace = traceback.format_exc()

            sync_log.mark_failed(error_msg, error_trace)
            logger.error(f"Menu sync failed: {error_msg}")
            logger.debug(f"Traceback: {error_trace}")

            raise


class OdooTableSyncService:
    """
    Synchronize restaurant tables FROM Odoo TO Django.
    """

    def __init__(self, config: OdooConfig):
        """
        Initialize service with Odoo configuration.

        Args:
            config: Django OdooConfig instance
        """
        self.config = config
        self.client = OdooConnectionService.get_client(config)
        self.pos_service = POSService(self.client)

    @transaction.atomic
    def sync_tables_from_odoo(self, user=None) -> Dict:
        """
        Pull floors and tables from Odoo and update Django tables.

        Returns:
            Dict with sync statistics:
            {
                'floors_synced': N,
                'tables_created': M,
                'tables_updated': K,
                'tables_skipped': L,
                'sync_log_id': ID
            }
        """
        from tables.models import Table

        # Create sync log
        sync_log = OdooSyncLog.objects.create(
            sync_type='TABLE_SYNC',
            status='PENDING',
            odoo_config=self.config,
            triggered_by=user
        )

        try:
            stats = {
                'floors_synced': 0,
                'tables_created': 0,
                'tables_updated': 0,
                'tables_skipped': 0,
                'errors': [],
            }

            # Fetch floors from Odoo
            pos_config_id = self.config.pos_config_id
            if not pos_config_id:
                raise OdooValidationError("No POS configuration selected. Please select a POS config first.")

            logger.info(f"Fetching floors and tables from Odoo (POS config: {pos_config_id})...")

            floors = self.pos_service.get_floors(pos_config_id)
            if not floors:
                logger.warning("No floors found in Odoo. Check that the POS config has restaurant floors configured.")
                sync_log.mark_success(
                    odoo_id=0,
                    response_data={**stats, 'warning': 'No floors found in Odoo'}
                )
                stats['sync_log_id'] = sync_log.id
                return stats

            stats['floors_synced'] = len(floors)
            logger.info(f"Found {len(floors)} floors in Odoo")

            synced_odoo_table_ids = []

            # Sync tables for each floor
            for floor in floors:
                floor_id = floor['id']
                floor_name = floor.get('name', f'Floor {floor_id}')

                # Get tables for this floor
                tables = self.pos_service.get_tables(floor_id)
                logger.info(f"Floor '{floor_name}' (ID: {floor_id}): {len(tables)} tables")

                for table in tables:
                    odoo_table_id = table['id']
                    table_name = table.get('name', f'Table {odoo_table_id}')
                    table_seats = table.get('seats', 4)

                    # Map floor name to Django section
                    section = self._map_floor_to_section(floor_name)

                    try:
                        # First, check if a Django table already exists with this odoo_table_id
                        existing_by_odoo_id = Table.objects.filter(odoo_table_id=odoo_table_id).first()

                        if existing_by_odoo_id:
                            # Update existing mapped table
                            existing_by_odoo_id.number = table_name
                            existing_by_odoo_id.capacity = table_seats
                            existing_by_odoo_id.section = section
                            existing_by_odoo_id.odoo_floor_id = floor_id
                            existing_by_odoo_id.odoo_last_synced = timezone.now()
                            existing_by_odoo_id.is_active = True
                            existing_by_odoo_id.save()
                            stats['tables_updated'] += 1
                            logger.debug(f"Updated table '{table_name}' (Odoo ID: {odoo_table_id})")
                        else:
                            # Check if a table with this name already exists (manual table)
                            existing_by_name = Table.objects.filter(number=table_name).first()

                            if existing_by_name and existing_by_name.odoo_table_id is None:
                                # Link existing manual table to Odoo
                                existing_by_name.odoo_table_id = odoo_table_id
                                existing_by_name.odoo_floor_id = floor_id
                                existing_by_name.capacity = table_seats
                                existing_by_name.section = section
                                existing_by_name.odoo_last_synced = timezone.now()
                                existing_by_name.save()
                                stats['tables_updated'] += 1
                                logger.info(f"Linked existing table '{table_name}' to Odoo ID: {odoo_table_id}")
                            elif existing_by_name and existing_by_name.odoo_table_id != odoo_table_id:
                                # Name conflict: another Odoo table has this name
                                # Append Odoo ID to make unique
                                unique_name = f"{table_name}-{odoo_table_id}"
                                Table.objects.create(
                                    number=unique_name,
                                    capacity=table_seats,
                                    section=section,
                                    odoo_table_id=odoo_table_id,
                                    odoo_floor_id=floor_id,
                                    odoo_last_synced=timezone.now(),
                                    is_active=True,
                                )
                                stats['tables_created'] += 1
                                logger.warning(
                                    f"Name conflict for '{table_name}': created as '{unique_name}' "
                                    f"(Odoo ID: {odoo_table_id})"
                                )
                            else:
                                # Create new table
                                Table.objects.create(
                                    number=table_name,
                                    capacity=table_seats,
                                    section=section,
                                    odoo_table_id=odoo_table_id,
                                    odoo_floor_id=floor_id,
                                    odoo_last_synced=timezone.now(),
                                    is_active=True,
                                )
                                stats['tables_created'] += 1
                                logger.info(f"Created table '{table_name}' (Odoo ID: {odoo_table_id})")

                        synced_odoo_table_ids.append(odoo_table_id)

                    except Exception as table_error:
                        error_msg = f"Failed to sync table '{table_name}' (Odoo ID: {odoo_table_id}): {table_error}"
                        logger.error(error_msg)
                        stats['tables_skipped'] += 1
                        stats['errors'].append(error_msg)

            # Deactivate tables that no longer exist in Odoo
            if synced_odoo_table_ids:
                stale_tables = Table.objects.filter(
                    odoo_table_id__isnull=False
                ).exclude(
                    odoo_table_id__in=synced_odoo_table_ids
                )
                stale_count = stale_tables.update(is_active=False)
                if stale_count > 0:
                    logger.info(f"Deactivated {stale_count} tables no longer in Odoo")
                    stats['tables_deactivated'] = stale_count

            # Remove errors list from stats if empty (cleaner response)
            if not stats['errors']:
                del stats['errors']

            # Mark sync log as SUCCESS
            sync_log.mark_success(
                odoo_id=stats['tables_created'] + stats['tables_updated'],
                response_data=stats
            )

            logger.info(f"Table sync completed: {stats}")
            stats['sync_log_id'] = sync_log.id
            return stats

        except Exception as e:
            error_msg = str(e)
            error_trace = traceback.format_exc()

            sync_log.mark_failed(error_msg, error_trace)
            logger.error(f"Table sync failed: {error_msg}")
            logger.debug(f"Traceback: {error_trace}")

            raise

    def _map_floor_to_section(self, floor_name: str) -> str:
        """
        Map Odoo floor name to Django Table section.

        Args:
            floor_name: Odoo floor name

        Returns:
            Django section choice (INDOOR, OUTDOOR, VIP, BAR)
        """
        floor_lower = floor_name.lower()

        if 'outdoor' in floor_lower or 'terrace' in floor_lower or 'patio' in floor_lower:
            return 'OUTDOOR'
        elif 'vip' in floor_lower or 'private' in floor_lower:
            return 'VIP'
        elif 'bar' in floor_lower:
            return 'BAR'
        else:
            return 'INDOOR'
