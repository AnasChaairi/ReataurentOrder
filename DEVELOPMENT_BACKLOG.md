# Restaurant Digital Ordering Platform - Development Backlog

## Project Overview
A Django-based restaurant ordering platform with Odoo POS integration, real-time notifications, and multi-role support (Admin/Waiter/Customer).

**Tech Stack:** Django + DRF, PostgreSQL, Django Channels, Celery + Redis, Docker

---

## MILESTONE 1: Project Setup and Environment Configuration

### Ticket #1.1: Initialize Django Project Structure
**Priority:** Critical
**Estimated Time:** 4 hours

**Description:**
Set up the base Django project with proper structure, including apps for authentication, menu, orders, tables, and Odoo integration.

**Tasks:**
- Create Django project with modular app structure
- Set up apps: `accounts`, `menu`, `orders`, `tables`, `odoo_integration`, `notifications`, `analytics`
- Configure Django settings for multiple environments (dev, staging, prod)
- Set up `.env` file structure for sensitive credentials
- Create `requirements.txt` with all dependencies

**Dependencies:** None

**Acceptance Criteria:**
- ✓ Django project runs with `python manage.py runserver`
- ✓ All apps are created and registered in `INSTALLED_APPS`
- ✓ Settings can load from environment variables
- ✓ Project structure follows Django best practices

---

### Ticket #1.2: Configure PostgreSQL Database
**Priority:** Critical
**Estimated Time:** 3 hours

**Description:**
Set up PostgreSQL database connection and configure database settings for development and production.

**Tasks:**
- Install and configure PostgreSQL locally
- Create database schema and user
- Configure Django database settings with connection pooling
- Set up database migrations directory structure
- Configure backup strategy

**Dependencies:** Ticket #1.1

**Acceptance Criteria:**
- ✓ PostgreSQL connection established successfully
- ✓ Django can run migrations without errors
- ✓ Database credentials stored securely in `.env`
- ✓ Connection pooling configured for production

---

### Ticket #1.3: Docker and Docker Compose Setup
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Create Docker containers for Django application, PostgreSQL, Redis, and Celery workers.

**Tasks:**
- Write `Dockerfile` for Django application
- Create `docker-compose.yml` with services: web, db, redis, celery, celery-beat
- Configure volume mounting for development
- Set up environment variable files for containers
- Configure Gunicorn for production container

**Dependencies:** Ticket #1.1, #1.2

**Acceptance Criteria:**
- ✓ All services start with `docker-compose up`
- ✓ Django application accessible on localhost
- ✓ PostgreSQL and Redis accessible from Django container
- ✓ Hot-reload works in development mode
- ✓ Production image builds successfully with Gunicorn

---

### Ticket #1.4: Celery and Redis Configuration
**Priority:** High
**Estimated Time:** 4 hours

**Description:**
Set up Celery for asynchronous task processing with Redis as message broker.

**Tasks:**
- Install and configure Celery
- Set up Redis as broker and result backend
- Create Celery configuration in Django settings
- Set up Celery Beat for scheduled tasks
- Create base task structure and logging

**Dependencies:** Ticket #1.3

**Acceptance Criteria:**
- ✓ Celery worker starts without errors
- ✓ Test task executes successfully
- ✓ Celery Beat scheduler works for periodic tasks
- ✓ Task results stored in Redis
- ✓ Error handling and retry logic configured

---

### Ticket #1.5: Logging and Sentry Integration
**Priority:** Medium
**Estimated Time:** 3 hours

**Description:**
Configure comprehensive logging and error tracking with Sentry.

**Tasks:**
- Set up Django logging configuration
- Configure log levels for different environments
- Integrate Sentry SDK for error tracking
- Create custom log formatters
- Set up log rotation and storage

**Dependencies:** Ticket #1.1

**Acceptance Criteria:**
- ✓ Application logs to console and file
- ✓ Different log levels work correctly (DEBUG, INFO, ERROR)
- ✓ Sentry captures exceptions in production
- ✓ Log files rotate automatically
- ✓ Sensitive data (passwords, tokens) excluded from logs

---

## MILESTONE 2: Authentication and User Role Management

### Ticket #2.1: Custom User Model with Roles
**Priority:** Critical
**Estimated Time:** 6 hours

**Description:**
Create a custom User model supporting three roles: Admin, Waiter, and Customer with role-based permissions.

**Tasks:**
- Create custom User model extending AbstractUser
- Add `role` field (ADMIN, WAITER, CUSTOMER)
- Create User profile model with additional fields (phone, avatar, etc.)
- Set up role-based permission groups
- Create database migrations

**API Endpoints:** N/A (Model layer)

**Dependencies:** Ticket #1.2

**Acceptance Criteria:**
- ✓ Custom User model created with role field
- ✓ Three permission groups exist: Admin, Waiter, Customer
- ✓ Users can be created with specific roles
- ✓ Migrations run successfully
- ✓ User admin panel configured

---

### Ticket #2.2: JWT Authentication Implementation
**Priority:** Critical
**Estimated Time:** 5 hours

**Description:**
Implement JWT-based authentication using djangorestframework-simplejwt.

**Tasks:**
- Install and configure `djangorestframework-simplejwt`
- Create JWT token generation and refresh logic
- Configure token expiration times
- Add custom claims (user role) to JWT payload
- Create token blacklist for logout

**API Endpoints:**
- `POST /api/auth/login/` - Login and get JWT tokens
- `POST /api/auth/refresh/` - Refresh access token
- `POST /api/auth/logout/` - Blacklist token

**Dependencies:** Ticket #2.1

**Acceptance Criteria:**
- ✓ Users can login and receive access + refresh tokens
- ✓ Access token expires after configured time
- ✓ Refresh token can generate new access token
- ✓ Logout invalidates tokens
- ✓ JWT payload includes user role

---

### Ticket #2.3: User Registration and Profile Management
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Create endpoints for user registration, profile viewing, and profile updates with role-specific validation.

**Tasks:**
- Create user registration serializer with validation
- Implement profile view and update endpoints
- Add password change functionality
- Implement email/phone uniqueness validation
- Create user avatar upload handling

**API Endpoints:**
- `POST /api/auth/register/` - Register new user
- `GET /api/auth/profile/` - Get current user profile
- `PUT /api/auth/profile/` - Update profile
- `POST /api/auth/change-password/` - Change password

**Dependencies:** Ticket #2.2

**Acceptance Criteria:**
- ✓ Users can register with email and password
- ✓ Registration validates unique email/phone
- ✓ Authenticated users can view their profile
- ✓ Users can update their profile information
- ✓ Password change requires old password verification
- ✓ Avatar images upload and resize properly

---

### Ticket #2.4: Role-Based Access Control (RBAC)
**Priority:** Critical
**Estimated Time:** 4 hours

**Description:**
Implement custom permission classes for role-based access control across all endpoints.

**Tasks:**
- Create custom DRF permission classes (IsAdmin, IsWaiter, IsCustomer)
- Implement permission decorators
- Create permission mixin classes
- Document permission requirements
- Add permission tests

**API Endpoints:** N/A (applies to all endpoints)

**Dependencies:** Ticket #2.1, #2.2

**Acceptance Criteria:**
- ✓ Custom permission classes created
- ✓ Admin-only endpoints reject non-admin users
- ✓ Waiters can only access assigned table data
- ✓ Customers can only view their own orders
- ✓ Permission denied returns 403 with clear message

---

### Ticket #2.5: User Management APIs (Admin Only)
**Priority:** Medium
**Estimated Time:** 5 hours

**Description:**
Create admin-only endpoints for managing users (waiters and customers).

**Tasks:**
- Create user list, create, update, delete endpoints
- Implement filtering by role and status
- Add search functionality (name, email)
- Create bulk user operations
- Add waiter-specific fields (assigned tables, shifts)

**API Endpoints:**
- `GET /api/admin/users/` - List all users (with filters)
- `POST /api/admin/users/` - Create new user
- `GET /api/admin/users/{id}/` - Get user details
- `PUT /api/admin/users/{id}/` - Update user
- `DELETE /api/admin/users/{id}/` - Deactivate user
- `POST /api/admin/users/bulk-create/` - Create multiple users

**Dependencies:** Ticket #2.4

**Acceptance Criteria:**
- ✓ Admin can view all users with pagination
- ✓ Admin can filter users by role and status
- ✓ Admin can create users with any role
- ✓ Admin can update user information
- ✓ Admin can deactivate/activate users
- ✓ Non-admin users receive 403 error

---

## MILESTONE 3: Menu and Category Management

### Ticket #3.1: Menu Category Model and APIs
**Priority:** High
**Estimated Time:** 4 hours

**Description:**
Create Category model with CRUD APIs for managing menu categories.

**Tasks:**
- Create Category model (name, description, image, order, active status)
- Add slug field for URL-friendly names
- Create category serializers
- Implement CRUD viewsets with permission control
- Add category image upload handling

**API Endpoints:**
- `GET /api/menu/categories/` - List active categories
- `POST /api/menu/categories/` - Create category (Admin)
- `GET /api/menu/categories/{id}/` - Get category details
- `PUT /api/menu/categories/{id}/` - Update category (Admin)
- `DELETE /api/menu/categories/{id}/` - Delete category (Admin)

**Dependencies:** Ticket #2.4

**Acceptance Criteria:**
- ✓ Categories have proper data structure
- ✓ Customers see only active categories
- ✓ Admin can create/update/delete categories
- ✓ Categories return in correct order
- ✓ Images upload and serve correctly
- ✓ Slug auto-generates from name

---

### Ticket #3.2: Menu Item (Dish) Model and APIs
**Priority:** High
**Estimated Time:** 6 hours

**Description:**
Create MenuItem model with full CRUD functionality for dishes.

**Tasks:**
- Create MenuItem model (name, description, price, category, image, availability)
- Add fields: preparation_time, ingredients, allergens, is_vegetarian, is_vegan
- Create serializers with nested category data
- Implement filtering by category, dietary restrictions
- Add search functionality (name, description)

**API Endpoints:**
- `GET /api/menu/items/` - List menu items (with filters)
- `POST /api/menu/items/` - Create menu item (Admin)
- `GET /api/menu/items/{id}/` - Get item details
- `PUT /api/menu/items/{id}/` - Update menu item (Admin)
- `PATCH /api/menu/items/{id}/availability/` - Toggle availability
- `DELETE /api/menu/items/{id}/` - Delete menu item (Admin)

**Dependencies:** Ticket #3.1

**Acceptance Criteria:**
- ✓ Menu items linked to categories
- ✓ Customers see only available items
- ✓ Filtering works (category, vegetarian, vegan, price range)
- ✓ Search returns relevant results
- ✓ Admin can toggle availability quickly
- ✓ Item images display properly
- ✓ Price stored as decimal with 2 decimal places

---

### Ticket #3.3: Menu Item Variants and Add-ons
**Priority:** Medium
**Estimated Time:** 5 hours

**Description:**
Support menu item variants (sizes) and add-ons (extras) with price modifiers.

**Tasks:**
- Create MenuItemVariant model (size, price_modifier)
- Create MenuItemAddon model (name, price, category)
- Link variants and add-ons to menu items
- Update serializers to include nested data
- Create APIs for managing variants and add-ons

**API Endpoints:**
- `GET /api/menu/items/{id}/variants/` - List variants
- `POST /api/menu/items/{id}/variants/` - Add variant (Admin)
- `GET /api/menu/items/{id}/addons/` - List available add-ons
- `POST /api/menu/addons/` - Create add-on (Admin)

**Dependencies:** Ticket #3.2

**Acceptance Criteria:**
- ✓ Items can have multiple variants (Small, Medium, Large)
- ✓ Each variant has base price + modifier
- ✓ Add-ons have individual prices
- ✓ Serializers return complete variant/add-on data
- ✓ Order items can reference specific variant/add-ons

---

### Ticket #3.4: Menu Caching and Performance Optimization
**Priority:** Medium
**Estimated Time:** 4 hours

**Description:**
Implement caching strategy for menu data to improve performance.

**Tasks:**
- Set up Redis caching for menu queries
- Cache category list and item list
- Implement cache invalidation on updates
- Add database query optimization (select_related, prefetch_related)
- Create cache warming task

**API Endpoints:** N/A (optimization layer)

**Dependencies:** Ticket #3.2, #1.4

**Acceptance Criteria:**
- ✓ Menu list queries use cache
- ✓ Cache invalidates on menu updates
- ✓ Database queries optimized (N+1 problem solved)
- ✓ Cache warm-up runs on deployment
- ✓ Response times improved by >50%

---

### Ticket #3.5: Menu Import/Export Functionality
**Priority:** Low
**Estimated Time:** 4 hours

**Description:**
Allow admin to import/export menu data via CSV/JSON files.

**Tasks:**
- Create CSV import parser for bulk menu creation
- Implement data validation during import
- Create export functionality (CSV and JSON)
- Add error handling and reporting
- Create management command for CLI import

**API Endpoints:**
- `POST /api/admin/menu/import/` - Import menu data
- `GET /api/admin/menu/export/` - Export menu data

**Dependencies:** Ticket #3.2

**Acceptance Criteria:**
- ✓ CSV file imports categories and items
- ✓ Import validates data and reports errors
- ✓ Export generates downloadable file
- ✓ Images handled properly during import
- ✓ Management command works from CLI

---

## MILESTONE 4: Table and Waiter Assignment

### Ticket #4.1: Table Management Model and APIs
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Create Table model with status tracking and assignment functionality.

**Tasks:**
- Create Table model (number, capacity, section, status, QR code)
- Add status field (available, occupied, reserved, cleaning)
- Generate unique QR codes for each table
- Create CRUD APIs for table management
- Add table filtering by section and status

**API Endpoints:**
- `GET /api/tables/` - List all tables (with status)
- `POST /api/tables/` - Create table (Admin)
- `GET /api/tables/{id}/` - Get table details
- `PUT /api/tables/{id}/` - Update table (Admin)
- `PATCH /api/tables/{id}/status/` - Update status
- `GET /api/tables/{id}/qr-code/` - Get QR code image

**Dependencies:** Ticket #2.4

**Acceptance Criteria:**
- ✓ Tables have unique numbers/identifiers
- ✓ QR codes generated and linked to tables
- ✓ Status updates reflect in real-time
- ✓ Admin can view table layout
- ✓ QR code scanning leads to menu for that table
- ✓ Capacity validation works

---

### Ticket #4.2: Waiter-Table Assignment System
**Priority:** High
**Estimated Time:** 6 hours

**Description:**
Implement system for assigning waiters to specific tables and managing assignments.

**Tasks:**
- Create WaiterAssignment model (waiter, table, shift_start, shift_end)
- Support multiple table assignments per waiter
- Create assignment APIs with validation
- Prevent duplicate assignments
- Add shift management functionality

**API Endpoints:**
- `POST /api/waiters/assign/` - Assign waiter to table (Admin)
- `GET /api/waiters/{id}/tables/` - Get waiter's assigned tables
- `GET /api/tables/{id}/waiter/` - Get table's assigned waiter
- `DELETE /api/waiters/assign/{id}/` - Remove assignment
- `GET /api/waiters/assignments/active/` - List active assignments

**Dependencies:** Ticket #4.1, #2.5

**Acceptance Criteria:**
- ✓ Admin can assign waiters to tables
- ✓ Waiters can see their assigned tables
- ✓ One table assigned to one waiter per shift
- ✓ Assignment includes shift timing
- ✓ Auto-deactivate assignments after shift ends
- ✓ Validation prevents conflicts

---

### Ticket #4.3: Table Session Management
**Priority:** Medium
**Estimated Time:** 4 hours

**Description:**
Track customer sessions at tables from seating to checkout.

**Tasks:**
- Create TableSession model (table, start_time, end_time, customer_count)
- Link sessions to orders
- Auto-start session when first order placed
- Track session duration
- Create session history

**API Endpoints:**
- `POST /api/tables/{id}/session/start/` - Start session
- `POST /api/tables/{id}/session/end/` - End session
- `GET /api/tables/{id}/session/current/` - Get active session
- `GET /api/tables/{id}/sessions/history/` - Session history

**Dependencies:** Ticket #4.1

**Acceptance Criteria:**
- ✓ Session starts when customers seated
- ✓ Session tracks all orders
- ✓ Session ends at checkout
- ✓ Duration calculated automatically
- ✓ History maintains past sessions
- ✓ Table status syncs with session state

---

### Ticket #4.4: Waiter Dashboard and Assignment View
**Priority:** Medium
**Estimated Time:** 5 hours

**Description:**
Create API endpoints for waiter dashboard showing assigned tables and orders.

**Tasks:**
- Create waiter dashboard endpoint with aggregated data
- Show assigned tables with current status
- Display pending orders requiring action
- Add order count and revenue per table
- Include shift information

**API Endpoints:**
- `GET /api/waiters/dashboard/` - Waiter dashboard data
- `GET /api/waiters/me/tables/` - My assigned tables
- `GET /api/waiters/me/orders/pending/` - Orders needing attention

**Dependencies:** Ticket #4.2

**Acceptance Criteria:**
- ✓ Waiter sees only their assigned tables
- ✓ Dashboard shows real-time order status
- ✓ Pending orders highlighted
- ✓ Table occupancy status visible
- ✓ Shift information displayed
- ✓ Response includes counts and summaries

---

## MILESTONE 5: Order Management Workflow

### Ticket #5.1: Order and OrderItem Models
**Priority:** Critical
**Estimated Time:** 6 hours

**Description:**
Create Order and OrderItem models with status tracking and business logic.

**Tasks:**
- Create Order model (table, customer, waiter, status, timestamps)
- Create OrderItem model (order, menu_item, variant, add-ons, quantity, price)
- Add status field (pending, confirmed, preparing, ready, served, cancelled)
- Implement price calculation logic
- Add order validation rules

**API Endpoints:** N/A (Model layer)

**Dependencies:** Ticket #3.2, #4.1

**Acceptance Criteria:**
- ✓ Order links to table and waiter
- ✓ OrderItems store snapshot of prices
- ✓ Status transitions follow workflow rules
- ✓ Total amount calculated correctly
- ✓ Timestamps track status changes
- ✓ Soft delete for cancelled orders

---

### Ticket #5.2: Order Creation API (Customer)
**Priority:** Critical
**Estimated Time:** 6 hours

**Description:**
Allow customers to create orders with items from their table.

**Tasks:**
- Create order creation endpoint with validation
- Validate menu item availability
- Calculate prices with variants and add-ons
- Associate order with customer's table
- Send notification to assigned waiter
- Handle concurrent order creation

**API Endpoints:**
- `POST /api/orders/` - Create new order
- `GET /api/orders/me/` - Get my orders
- `GET /api/orders/{id}/` - Get order details

**Dependencies:** Ticket #5.1, #4.3

**Acceptance Criteria:**
- ✓ Customers can create orders from menu
- ✓ Order includes multiple items with quantities
- ✓ Variants and add-ons properly recorded
- ✓ Prices locked at order time
- ✓ Assigned waiter receives notification
- ✓ Validation prevents invalid items
- ✓ Order total calculated correctly

---

### Ticket #5.3: Order Verification by Waiter
**Priority:** Critical
**Estimated Time:** 5 hours

**Description:**
Enable waiters to review and confirm customer orders before sending to kitchen.

**Tasks:**
- Create order verification endpoint
- Allow item modifications (quantity, remove items)
- Add waiter notes field
- Implement confirmation action
- Trigger kitchen notification on confirmation
- Update order status

**API Endpoints:**
- `GET /api/orders/pending/` - List orders needing confirmation
- `POST /api/orders/{id}/verify/` - Verify/confirm order
- `PUT /api/orders/{id}/modify/` - Modify order items
- `POST /api/orders/{id}/reject/` - Reject order with reason

**Dependencies:** Ticket #5.2

**Acceptance Criteria:**
- ✓ Waiters see pending orders for their tables
- ✓ Waiters can modify order before confirmation
- ✓ Confirmation changes status to "confirmed"
- ✓ Rejection notifies customer with reason
- ✓ Waiter notes saved with order
- ✓ Kitchen notification sent on confirmation

---

### Ticket #5.4: Order Status Management
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Implement status update workflow with role-based permissions.

**Tasks:**
- Create status update endpoint with validation
- Define allowed status transitions
- Role-based status update permissions
- Status change history logging
- Timestamp tracking for each status
- Customer notification on status changes

**API Endpoints:**
- `PATCH /api/orders/{id}/status/` - Update order status
- `GET /api/orders/{id}/history/` - Status change history
- `POST /api/orders/{id}/cancel/` - Cancel order

**Dependencies:** Ticket #5.3

**Acceptance Criteria:**
- ✓ Status transitions follow defined workflow
- ✓ Waiters can update to preparing/ready/served
- ✓ Customers can cancel pending orders only
- ✓ History tracks all status changes with timestamps
- ✓ Invalid transitions rejected with error
- ✓ Real-time updates to customer and waiter

---

### Ticket #5.5: Order Listing and Filtering
**Priority:** Medium
**Estimated Time:** 4 hours

**Description:**
Create comprehensive order listing with filtering and search capabilities.

**Tasks:**
- Implement order list endpoint with pagination
- Add filters: status, table, date range, waiter
- Create search by order number or customer
- Add sorting options
- Optimize queries with select_related/prefetch_related

**API Endpoints:**
- `GET /api/orders/` - List orders (with filters)
- `GET /api/orders/table/{table_id}/` - Orders by table
- `GET /api/orders/waiter/{waiter_id}/` - Orders by waiter
- `GET /api/orders/stats/` - Order statistics

**Dependencies:** Ticket #5.4

**Acceptance Criteria:**
- ✓ Orders paginated properly
- ✓ All filters work correctly
- ✓ Search returns relevant results
- ✓ Sorting works (date, status, table)
- ✓ Queries optimized (no N+1)
- ✓ Role-based filtering applied automatically

---

### Ticket #5.6: Order Timeline and Activity Tracking
**Priority:** Low
**Estimated Time:** 3 hours

**Description:**
Track and display complete order timeline with all events and actions.

**Tasks:**
- Create OrderEvent model (order, event_type, actor, timestamp, notes)
- Log all order actions (created, modified, status changes)
- Create timeline API endpoint
- Include actor information (who did what)
- Add event filtering

**API Endpoints:**
- `GET /api/orders/{id}/timeline/` - Complete order timeline

**Dependencies:** Ticket #5.4

**Acceptance Criteria:**
- ✓ All order events logged automatically
- ✓ Timeline shows chronological events
- ✓ Actor (user) information included
- ✓ Event descriptions are clear
- ✓ Timestamps accurate and formatted
- ✓ Notes/reasons included where applicable

---

## MILESTONE 6: Odoo POS Integration Layer

### Ticket #6.1: Odoo Connection Configuration
**Priority:** Critical
**Estimated Time:** 5 hours

**Description:**
Set up Odoo XML-RPC connection with credential management and connection testing.

**Tasks:**
- Create OdooConfig model (URL, database, username, password, encrypted)
- Implement XML-RPC client wrapper
- Add connection testing functionality
- Implement credential encryption
- Create admin UI for Odoo settings
- Add connection health monitoring

**API Endpoints:**
- `POST /api/admin/odoo/configure/` - Save Odoo credentials
- `GET /api/admin/odoo/config/` - Get current config (masked)
- `POST /api/admin/odoo/test-connection/` - Test connection

**Dependencies:** Ticket #1.5

**Acceptance Criteria:**
- ✓ Odoo credentials stored securely
- ✓ XML-RPC connection established
- ✓ Test connection validates credentials
- ✓ Password encrypted in database
- ✓ Connection errors logged properly
- ✓ Health check endpoint works

---

### Ticket #6.2: Menu Sync from Odoo POS
**Priority:** High
**Estimated Time:** 8 hours

**Description:**
Pull menu items and categories from Odoo POS and sync with local database.

**Tasks:**
- Create Odoo product fetching service
- Map Odoo products to MenuItem model
- Map Odoo categories to Category model
- Handle product variants and pricing
- Implement incremental sync (only changes)
- Create sync history tracking

**API Endpoints:**
- `POST /api/admin/odoo/sync/menu/` - Trigger menu sync
- `GET /api/admin/odoo/sync/history/` - Sync history
- `GET /api/admin/odoo/sync/status/` - Current sync status

**Dependencies:** Ticket #6.1, #3.2

**Acceptance Criteria:**
- ✓ Products fetched from Odoo successfully
- ✓ Categories created/updated in local DB
- ✓ Menu items created/updated with correct data
- ✓ Prices synchronized accurately
- ✓ Sync status tracked and logged
- ✓ Errors handled gracefully with rollback
- ✓ Incremental sync only updates changes

---

### Ticket #6.3: Scheduled Menu Sync with Celery
**Priority:** High
**Estimated Time:** 4 hours

**Description:**
Automate nightly menu synchronization using Celery Beat.

**Tasks:**
- Create Celery task for menu sync
- Configure Celery Beat schedule (nightly)
- Add sync retry logic on failure
- Implement notification on sync completion/failure
- Add admin controls (pause/resume/force sync)

**API Endpoints:**
- `POST /api/admin/odoo/sync/schedule/` - Update sync schedule
- `POST /api/admin/odoo/sync/trigger/` - Force sync now

**Dependencies:** Ticket #6.2, #1.4

**Acceptance Criteria:**
- ✓ Sync runs automatically at configured time
- ✓ Failed syncs retry with exponential backoff
- ✓ Admin receives notification on failure
- ✓ Manual trigger works immediately
- ✓ Sync can be paused/resumed
- ✓ Concurrent syncs prevented

---

### Ticket #6.4: Order Push to Odoo POS
**Priority:** Critical
**Estimated Time:** 8 hours

**Description:**
Send confirmed orders from Django to Odoo POS for kitchen and billing.

**Tasks:**
- Create order push service to Odoo
- Map Order model to Odoo POS order format
- Handle order items with variants
- Create Odoo order via XML-RPC
- Store Odoo order reference in local Order
- Implement retry logic for failed pushes

**API Endpoints:**
- `POST /api/orders/{id}/push-to-odoo/` - Manually push order
- `GET /api/orders/{id}/odoo-status/` - Check Odoo sync status

**Dependencies:** Ticket #6.1, #5.3

**Acceptance Criteria:**
- ✓ Confirmed orders pushed to Odoo automatically
- ✓ Order items mapped correctly
- ✓ Customer information included
- ✓ Odoo order ID stored locally
- ✓ Failed pushes queued for retry
- ✓ Waiter notified of sync success/failure
- ✓ Price and quantity match exactly

---

### Ticket #6.5: Payment Recording Sync
**Priority:** High
**Estimated Time:** 6 hours

**Description:**
Sync payment information between Django and Odoo POS.

**Tasks:**
- Create Payment model (order, method, amount, status, odoo_payment_id)
- Implement payment push to Odoo
- Support multiple payment methods (cash, card, split)
- Update order status after payment
- Sync payment status from Odoo
- Handle partial payments

**API Endpoints:**
- `POST /api/orders/{id}/payments/` - Record payment
- `GET /api/orders/{id}/payments/` - List order payments
- `POST /api/payments/{id}/sync/` - Sync payment with Odoo

**Dependencies:** Ticket #6.4

**Acceptance Criteria:**
- ✓ Payments recorded locally and in Odoo
- ✓ Multiple payment methods supported
- ✓ Split payments handled correctly
- ✓ Payment status synced from Odoo
- ✓ Order marked as paid when complete
- ✓ Partial payments tracked
- ✓ Odoo payment reference stored

---

### Ticket #6.6: Bidirectional Sync Error Handling
**Priority:** Medium
**Estimated Time:** 5 hours

**Description:**
Comprehensive error handling and recovery for Odoo sync operations.

**Tasks:**
- Create SyncError model to log failures
- Implement queue for failed sync operations
- Add manual retry functionality
- Create admin dashboard for sync errors
- Implement alerting for critical failures
- Add sync reconciliation tool

**API Endpoints:**
- `GET /api/admin/odoo/errors/` - List sync errors
- `POST /api/admin/odoo/errors/{id}/retry/` - Retry failed sync
- `GET /api/admin/odoo/reconcile/` - Data reconciliation report

**Dependencies:** Ticket #6.2, #6.4, #6.5

**Acceptance Criteria:**
- ✓ All sync errors logged with details
- ✓ Failed operations can be retried
- ✓ Admin dashboard shows error summary
- ✓ Critical errors trigger notifications
- ✓ Reconciliation identifies discrepancies
- ✓ Error details include stack traces

---

## MILESTONE 7: Real-Time Notifications (Django Channels)

### Ticket #7.1: Django Channels Setup and WebSocket Configuration
**Priority:** High
**Estimated Time:** 6 hours

**Description:**
Set up Django Channels with WebSocket support for real-time communication.

**Tasks:**
- Install and configure Django Channels
- Set up ASGI application
- Configure channel layers with Redis
- Create WebSocket routing
- Update Docker configuration for Daphne
- Add WebSocket authentication

**API Endpoints:**
- `ws://api/ws/notifications/` - WebSocket connection

**Dependencies:** Ticket #1.4, #2.2

**Acceptance Criteria:**
- ✓ Django Channels installed and configured
- ✓ WebSocket connections establish successfully
- ✓ Redis channel layer working
- ✓ ASGI server (Daphne) running in Docker
- ✓ JWT authentication works for WebSocket
- ✓ Connection/disconnection handled properly

---

### Ticket #7.2: Notification System Architecture
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Create notification models and delivery infrastructure.

**Tasks:**
- Create Notification model (user, type, title, message, read status)
- Define notification types (new_order, order_confirmed, status_change, etc.)
- Create notification creation service
- Implement user-specific notification channels
- Add notification persistence and history
- Create notification read/unread tracking

**API Endpoints:**
- `GET /api/notifications/` - List user notifications
- `PATCH /api/notifications/{id}/read/` - Mark as read
- `POST /api/notifications/mark-all-read/` - Mark all read
- `DELETE /api/notifications/{id}/` - Delete notification

**Dependencies:** Ticket #7.1

**Acceptance Criteria:**
- ✓ Notifications stored in database
- ✓ Users receive only their notifications
- ✓ Read/unread status tracked
- ✓ Notification history maintained
- ✓ Different notification types supported
- ✓ Old notifications auto-archived

---

### Ticket #7.3: Waiter Real-Time Order Notifications
**Priority:** Critical
**Estimated Time:** 6 hours

**Description:**
Send real-time notifications to waiters when new orders are placed at their tables.

**Tasks:**
- Create order notification consumer
- Trigger notification on order creation
- Send WebSocket message to assigned waiter
- Include order details and table info
- Play notification sound (client-side trigger)
- Show notification badge count

**API Endpoints:**
- `ws://api/ws/waiters/{waiter_id}/` - Waiter WebSocket channel

**Dependencies:** Ticket #7.2, #5.2

**Acceptance Criteria:**
- ✓ Waiter receives notification instantly
- ✓ Notification includes order summary
- ✓ Only assigned waiter notified
- ✓ WebSocket message formatted correctly
- ✓ Badge count updates in real-time
- ✓ Notification persists if waiter offline

---

### Ticket #7.4: Customer Order Status Updates
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Send real-time updates to customers when their order status changes.

**Tasks:**
- Create customer notification consumer
- Trigger notification on status changes
- Send WebSocket message to customer
- Include estimated time for next status
- Support multiple customers per table
- Add progress indicator updates

**API Endpoints:**
- `ws://api/ws/customers/table/{table_id}/` - Table WebSocket channel

**Dependencies:** Ticket #7.2, #5.4

**Acceptance Criteria:**
- ✓ Customers notified on status changes
- ✓ All customers at table receive updates
- ✓ Notification shows current status
- ✓ Estimated times included when available
- ✓ Progress bar updates automatically
- ✓ Works for multiple orders per table

---

### Ticket #7.5: Admin Real-Time Dashboard Updates
**Priority:** Medium
**Estimated Time:** 4 hours

**Description:**
Provide real-time updates to admin dashboard for monitoring restaurant operations.

**Tasks:**
- Create admin broadcast channel
- Send updates on new orders, status changes
- Broadcast table occupancy changes
- Include revenue updates
- Add alert notifications for issues
- Implement dashboard event stream

**API Endpoints:**
- `ws://api/ws/admin/dashboard/` - Admin dashboard channel

**Dependencies:** Ticket #7.2

**Acceptance Criteria:**
- ✓ Admin sees real-time order flow
- ✓ Table status updates automatically
- ✓ Revenue counter updates live
- ✓ Alerts appear for urgent issues
- ✓ Multiple admin users supported
- ✓ Historical data loads on connection

---

### Ticket #7.6: Notification Preferences and Settings
**Priority:** Low
**Estimated Time:** 3 hours

**Description:**
Allow users to configure their notification preferences.

**Tasks:**
- Create NotificationPreference model
- Add settings for notification types (email, push, in-app)
- Create preference update API
- Respect do-not-disturb schedules
- Add notification grouping options
- Implement quiet hours

**API Endpoints:**
- `GET /api/notifications/preferences/` - Get preferences
- `PUT /api/notifications/preferences/` - Update preferences

**Dependencies:** Ticket #7.2

**Acceptance Criteria:**
- ✓ Users can enable/disable notification types
- ✓ Quiet hours respected
- ✓ Critical notifications always delivered
- ✓ Preferences persist across sessions
- ✓ Default preferences set on user creation
- ✓ Notification channels respect preferences

---

## MILESTONE 8: Analytics and Reporting

### Ticket #8.1: Sales Analytics and Revenue Reports
**Priority:** Medium
**Estimated Time:** 6 hours

**Description:**
Generate sales reports with revenue breakdowns by time period.

**Tasks:**
- Create analytics service for aggregations
- Calculate daily/weekly/monthly revenue
- Track average order value
- Calculate revenue by time of day
- Support date range filtering
- Export reports to CSV/PDF

**API Endpoints:**
- `GET /api/admin/analytics/revenue/` - Revenue report
- `GET /api/admin/analytics/sales-summary/` - Sales summary
- `GET /api/admin/analytics/export/` - Export report

**Dependencies:** Ticket #5.5

**Acceptance Criteria:**
- ✓ Revenue calculated accurately
- ✓ Reports filterable by date range
- ✓ Breakdowns by day/week/month work
- ✓ Average order value calculated
- ✓ Peak hours identified
- ✓ Export functionality works
- ✓ Charts/graphs data provided

---

### Ticket #8.2: Menu Item Performance Analytics
**Priority:** Medium
**Estimated Time:** 5 hours

**Description:**
Track and report on menu item popularity and performance.

**Tasks:**
- Calculate total orders per menu item
- Track revenue per menu item
- Identify top-selling items
- Find low-performing items
- Calculate item popularity trends
- Support category-level analytics

**API Endpoints:**
- `GET /api/admin/analytics/menu-performance/` - Item performance
- `GET /api/admin/analytics/top-items/` - Best sellers
- `GET /api/admin/analytics/category-performance/` - Category stats

**Dependencies:** Ticket #8.1

**Acceptance Criteria:**
- ✓ Order count per item accurate
- ✓ Revenue per item calculated
- ✓ Top 10 items identified
- ✓ Low performers flagged
- ✓ Trends shown over time
- ✓ Category totals aggregated
- ✓ Filterable by date range

---

### Ticket #8.3: Waiter Performance Metrics
**Priority:** Low
**Estimated Time:** 4 hours

**Description:**
Track waiter performance metrics for management review.

**Tasks:**
- Calculate orders handled per waiter
- Track average order confirmation time
- Calculate revenue per waiter
- Monitor customer feedback scores
- Track table turnover rate
- Generate waiter leaderboard

**API Endpoints:**
- `GET /api/admin/analytics/waiters/` - Waiter performance
- `GET /api/admin/analytics/waiters/{id}/` - Individual waiter stats

**Dependencies:** Ticket #8.1

**Acceptance Criteria:**
- ✓ Orders per waiter counted
- ✓ Confirmation times calculated
- ✓ Revenue attributed to waiters
- ✓ Performance scores computed
- ✓ Leaderboard rankings accurate
- ✓ Historical trends available
- ✓ Exportable to CSV

---

### Ticket #8.4: Table Occupancy and Turnover Analytics
**Priority:** Low
**Estimated Time:** 4 hours

**Description:**
Analyze table usage patterns and turnover rates.

**Tasks:**
- Calculate average table occupancy duration
- Track table turnover rate
- Identify peak occupancy hours
- Calculate revenue per table
- Monitor table efficiency
- Support section-level analytics

**API Endpoints:**
- `GET /api/admin/analytics/tables/` - Table analytics
- `GET /api/admin/analytics/occupancy/` - Occupancy report

**Dependencies:** Ticket #8.1, #4.3

**Acceptance Criteria:**
- ✓ Average duration calculated
- ✓ Turnover rate accurate
- ✓ Peak hours identified
- ✓ Revenue per table computed
- ✓ Section comparisons available
- ✓ Efficiency metrics provided
- ✓ Visual timeline available

---

### Ticket #8.5: Custom Reports and Dashboard
**Priority:** Low
**Estimated Time:** 5 hours

**Description:**
Allow admins to create custom reports with flexible parameters.

**Tasks:**
- Create report builder interface (API)
- Support custom date ranges
- Allow multiple metric combinations
- Save report templates
- Schedule automated report generation
- Email report delivery

**API Endpoints:**
- `POST /api/admin/reports/create/` - Create custom report
- `GET /api/admin/reports/` - List saved reports
- `POST /api/admin/reports/{id}/schedule/` - Schedule report
- `GET /api/admin/reports/{id}/generate/` - Generate report

**Dependencies:** Ticket #8.1, #8.2, #8.3, #8.4

**Acceptance Criteria:**
- ✓ Custom reports created with parameters
- ✓ Reports saved as templates
- ✓ Scheduled reports run automatically
- ✓ Reports delivered via email
- ✓ Multiple metrics combined
- ✓ Export in multiple formats
- ✓ Dashboard displays key metrics

---

## MILESTONE 9: Testing and Quality Assurance

### Ticket #9.1: Unit Testing Framework Setup
**Priority:** High
**Estimated Time:** 4 hours

**Description:**
Set up pytest with Django, configure test database, and create test utilities.

**Tasks:**
- Install pytest and pytest-django
- Configure pytest.ini and conftest.py
- Set up test database configuration
- Create test fixtures and factories
- Set up coverage reporting
- Add pre-commit hooks for tests

**Dependencies:** Ticket #1.1

**Acceptance Criteria:**
- ✓ pytest runs successfully
- ✓ Test database creates/destroys properly
- ✓ Fixtures available for common objects
- ✓ Coverage reports generate
- ✓ Tests run in isolated environment
- ✓ Pre-commit hook runs tests

---

### Ticket #9.2: Authentication and User Tests
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Comprehensive tests for authentication, JWT, and user management.

**Tasks:**
- Test user registration and validation
- Test JWT login/logout/refresh
- Test role-based permissions
- Test password change functionality
- Test profile updates
- Test token expiration and blacklisting

**Dependencies:** Ticket #9.1, #2.3, #2.4

**Acceptance Criteria:**
- ✓ All auth endpoints tested
- ✓ Permission classes tested
- ✓ Edge cases covered
- ✓ Invalid inputs handled
- ✓ Token lifecycle tested
- ✓ Test coverage > 90%

---

### Ticket #9.3: Menu and Order Model Tests
**Priority:** High
**Estimated Time:** 6 hours

**Description:**
Test menu CRUD operations, order creation, and business logic.

**Tasks:**
- Test menu item CRUD operations
- Test category management
- Test order creation with validation
- Test price calculations
- Test order status transitions
- Test concurrent order handling

**Dependencies:** Ticket #9.1, #3.2, #5.2

**Acceptance Criteria:**
- ✓ All menu endpoints tested
- ✓ Order workflow tested completely
- ✓ Price calculations verified
- ✓ Status transitions validated
- ✓ Edge cases covered
- ✓ Test coverage > 85%

---

### Ticket #9.4: Odoo Integration Tests
**Priority:** Medium
**Estimated Time:** 6 hours

**Description:**
Test Odoo integration with mocked XML-RPC calls.

**Tasks:**
- Mock Odoo XML-RPC responses
- Test menu sync functionality
- Test order push to Odoo
- Test payment sync
- Test error handling and retries
- Test connection failures

**Dependencies:** Ticket #9.1, #6.2, #6.4, #6.5

**Acceptance Criteria:**
- ✓ Odoo client mocked properly
- ✓ Menu sync tested end-to-end
- ✓ Order push tested with various scenarios
- ✓ Error handling verified
- ✓ Retry logic tested
- ✓ Connection failures handled
- ✓ Test coverage > 80%

---

### Ticket #9.5: WebSocket and Real-Time Tests
**Priority:** Medium
**Estimated Time:** 5 hours

**Description:**
Test Django Channels consumers and WebSocket functionality.

**Tasks:**
- Set up WebSocket test client
- Test WebSocket connection and authentication
- Test notification delivery
- Test channel layers with Redis
- Test concurrent connections
- Test disconnection handling

**Dependencies:** Ticket #9.1, #7.1, #7.3, #7.4

**Acceptance Criteria:**
- ✓ WebSocket connections tested
- ✓ Authentication tested
- ✓ Notifications delivered correctly
- ✓ Channel layers work in tests
- ✓ Multiple connections handled
- ✓ Disconnections graceful
- ✓ Test coverage > 75%

---

### Ticket #9.6: Integration and End-to-End Tests
**Priority:** Medium
**Estimated Time:** 6 hours

**Description:**
Test complete workflows from order creation to Odoo sync.

**Tasks:**
- Test complete order workflow (customer → waiter → kitchen → Odoo)
- Test table assignment and session flow
- Test notification delivery across roles
- Test payment flow end-to-end
- Test analytics calculations
- Use Docker Compose for integration tests

**Dependencies:** Ticket #9.2, #9.3, #9.4, #9.5

**Acceptance Criteria:**
- ✓ Complete workflows tested
- ✓ Multi-role interactions verified
- ✓ Integration tests run in Docker
- ✓ All services integrated properly
- ✓ Data consistency verified
- ✓ Performance acceptable
- ✓ Tests run in CI pipeline

---

### Ticket #9.7: CI/CD Pipeline Setup
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Set up continuous integration pipeline with automated testing.

**Tasks:**
- Create GitHub Actions/GitLab CI configuration
- Run tests on every commit/PR
- Generate and publish coverage reports
- Run linting and code quality checks
- Build Docker images in CI
- Add deployment to staging on merge

**Dependencies:** Ticket #9.1

**Acceptance Criteria:**
- ✓ CI pipeline runs on commits
- ✓ All tests execute automatically
- ✓ Coverage reports generated
- ✓ Linting enforced
- ✓ Docker builds succeed
- ✓ Failed builds block merges
- ✓ Staging deploys automatically

---

## MILESTONE 10: Deployment and Production Setup

### Ticket #10.1: Production Environment Configuration
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Configure production settings, environment variables, and security.

**Tasks:**
- Create production settings file
- Configure environment-specific settings
- Set up secrets management
- Configure CORS and CSRF protection
- Set up SSL/TLS certificates
- Configure static file serving

**Dependencies:** Ticket #1.1

**Acceptance Criteria:**
- ✓ Production settings separated
- ✓ All secrets in environment variables
- ✓ DEBUG=False in production
- ✓ CORS configured correctly
- ✓ HTTPS enforced
- ✓ Static files served efficiently
- ✓ Security headers configured

---

### Ticket #10.2: Database Migration and Backup Strategy
**Priority:** Critical
**Estimated Time:** 4 hours

**Description:**
Set up database migration process and automated backups.

**Tasks:**
- Create migration deployment script
- Set up automated daily backups
- Configure point-in-time recovery
- Test backup restoration process
- Document migration procedures
- Set up backup monitoring

**Dependencies:** Ticket #1.2

**Acceptance Criteria:**
- ✓ Migrations run safely in production
- ✓ Daily backups automated
- ✓ Backups stored securely off-site
- ✓ Restoration tested and documented
- ✓ Backup failures trigger alerts
- ✓ Retention policy configured

---

### Ticket #10.3: Production Docker Configuration
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Optimize Docker setup for production deployment.

**Tasks:**
- Create production Dockerfile
- Optimize image size
- Configure Docker Compose for production
- Set up health checks
- Configure resource limits
- Set up log aggregation

**Dependencies:** Ticket #1.3, #10.1

**Acceptance Criteria:**
- ✓ Production image optimized
- ✓ Multi-stage builds used
- ✓ Health checks working
- ✓ Resource limits set
- ✓ Logs forwarded to aggregator
- ✓ Secrets managed securely
- ✓ Containers restart on failure

---

### Ticket #10.4: Load Balancing and Scaling Setup
**Priority:** Medium
**Estimated Time:** 6 hours

**Description:**
Configure load balancing and horizontal scaling capabilities.

**Tasks:**
- Set up NGINX as reverse proxy
- Configure load balancing for multiple app instances
- Set up WebSocket load balancing
- Configure auto-scaling rules
- Test horizontal scaling
- Monitor resource usage

**Dependencies:** Ticket #10.3

**Acceptance Criteria:**
- ✓ NGINX proxy configured
- ✓ Multiple app instances work
- ✓ WebSocket connections load balanced
- ✓ Auto-scaling triggers work
- ✓ No downtime during scaling
- ✓ Sessions handled correctly
- ✓ Monitoring shows resource usage

---

### Ticket #10.5: Monitoring and Alerting Setup
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Set up comprehensive monitoring and alerting for production.

**Tasks:**
- Configure application performance monitoring (APM)
- Set up server monitoring (CPU, memory, disk)
- Create custom health check endpoints
- Configure alerting rules
- Set up log monitoring and analysis
- Create operations dashboard

**Dependencies:** Ticket #10.3

**Acceptance Criteria:**
- ✓ APM tracking all requests
- ✓ Server metrics collected
- ✓ Health endpoints responding
- ✓ Alerts configured for critical issues
- ✓ Logs searchable and analyzable
- ✓ Dashboard shows system status
- ✓ Alert notifications working

---

### Ticket #10.6: Production Deployment and Documentation
**Priority:** High
**Estimated Time:** 6 hours

**Description:**
Deploy to production and create comprehensive deployment documentation.

**Tasks:**
- Create deployment runbook
- Document rollback procedures
- Set up zero-downtime deployment
- Create troubleshooting guide
- Document environment variables
- Create API documentation with Swagger/OpenAPI

**Dependencies:** Ticket #10.1, #10.2, #10.3, #10.4, #10.5

**Acceptance Criteria:**
- ✓ Application deployed to production
- ✓ Runbook covers all procedures
- ✓ Rollback tested and documented
- ✓ Zero-downtime deployment works
- ✓ Troubleshooting guide comprehensive
- ✓ All environment variables documented
- ✓ API documentation generated and accessible

---

## Summary

**Total Estimated Time:** ~290 hours (approximately 36-40 working days for one developer)

**Milestone Breakdown:**
1. Project Setup: ~19 hours
2. Authentication: ~25 hours
3. Menu Management: ~23 hours
4. Tables & Waiters: ~20 hours
5. Order Workflow: ~30 hours
6. Odoo Integration: ~36 hours
7. Real-Time Notifications: ~29 hours
8. Analytics: ~24 hours
9. Testing: ~37 hours
10. Deployment: ~31 hours

**Critical Path:** Milestones 1 → 2 → 3 → 5 → 6 are blocking and should be prioritized.

**Recommended Team:** 2-3 developers working in parallel can complete this in 8-10 weeks.

**Notes:**
- Story points can be derived as: 1 hour = 0.125 points (if using 8-point scale)
- Consider starting Milestones 3 and 4 in parallel after Milestone 2
- Odoo integration testing may require access to Odoo POS test environment
- Real-time features require thorough testing across devices
- Security review recommended before production deployment
