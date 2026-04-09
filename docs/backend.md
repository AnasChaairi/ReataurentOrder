# Backend Documentation

## 1. Overview

The backend is a **Django REST Framework** API powering a multi-tenant restaurant ordering platform. It handles authentication, menu management, order lifecycle, real-time kitchen notifications, and ERP synchronization with Odoo.

**Core responsibilities:**
- JWT-based authentication with role-based access control
- Restaurant-scoped data isolation (multi-tenant)
- Order lifecycle management with real-time WebSocket updates
- Async task processing via Celery
- Odoo ERP synchronization for menu items, categories, and tables
- Admin analytics and reporting

---

## 2. Architecture

**Pattern:** REST API + WebSocket (event-driven for real-time features)

**Key technologies:**

| Layer | Technology |
|---|---|
| Framework | Django 5.0 + DRF 3.14 |
| Database | PostgreSQL 16 |
| Cache | Redis (django-redis) |
| Real-time | Django Channels 4 + Daphne (ASGI) |
| Task Queue | Celery 5 + Redis broker |
| Auth | JWT (simplejwt) via httpOnly cookies |
| API Docs | drf-spectacular (Swagger + ReDoc) |
| Monitoring | Sentry SDK |

**Servers:**
- `gunicorn` / `runserver` on port `8000` → handles HTTP
- `daphne` on port `8001` → handles WebSocket connections

---

## 3. Core Components

### `accounts`
Manages authentication and user roles.
- Custom `User` model with roles: `ADMIN`, `RESTAURANT_OWNER`, `WAITER`, `CUSTOMER`
- `CookieJWTAuthentication` — reads JWT from httpOnly cookies
- Token blacklisting on logout; auto-refresh on expiry
- Custom permission classes: `IsAdmin`, `IsAdminOrWaiter`, `IsCustomer`

### `restaurants`
Provides multi-tenant scoping.
- `Restaurant` model is the root tenant entity
- `RestaurantScopedMixin` — injected into ViewSets to automatically filter querysets by the current user's restaurant

### `menu`
Full menu catalog management.
- Models: `Category`, `MenuItem`, `MenuItemVariant`, `MenuItemAddon`, `MenuItemComboChoice`, `MenuItemImage`, `MenuItemReview`
- Items support variants (sizes), add-ons (extras), combo choices, and multiple images
- Cached via Redis; cache invalidated on write

### `orders`
Manages the full order lifecycle.
- `Order` status flow: `PENDING → CONFIRMED → PREPARING → READY → SERVED / CANCELLED`
- `OrderItem` links to menu items with selected variants and add-ons
- `OrderEvent` provides an append-only audit log for every state change
- Custom throttle: `OrderCreateRateThrottle` (10 requests/min)

### `tables`
Tracks physical restaurant tables and session state.
- `Table` — linked to Odoo floor for sync
- `WaiterAssignment` — which waiter serves which table
- `TableSession` — lifecycle tracking per dining session

### `notifications`
Pushes real-time updates via WebSocket.
- WebSocket consumers broadcast to channel groups:
  - `table_{id}` — tablet/customer devices at a table
  - `kitchen` — kitchen display system
  - `waiter_{id}` — individual waiter devices
- Service functions: `notify_order_created`, `notify_order_status_change`, `notify_order_cancelled`

### `odoo_integration`
Bidirectional sync with Odoo ERP.
- Django signals trigger async Celery sync tasks on model save
- Models carry `odoo_*_id` and `odoo_last_synced` fields
- Sync covers: categories, menu items, tables

### `analytics`
Admin-facing aggregation and reporting endpoints.
- Aggregates order data for dashboards
- Revenue, popular items, table turnover reports

---

## 4. Key Flows

### Customer places an order
1. Customer (tablet) POSTs to `/api/orders/`
2. `OrderCreateRateThrottle` checks rate limit
3. ViewSet validates via `OrderCreateSerializer`; wrapped in `@transaction.atomic`
4. `Order` + `OrderItem` records created in PostgreSQL
5. `notify_order_created` sends WebSocket message to `kitchen` and `waiter_{id}` groups
6. Celery task syncs order to Odoo asynchronously
7. `OrderEvent` row appended for audit

### Order status update (kitchen)
1. Kitchen staff PATCHes `/api/orders/{id}/` with new status
2. `notify_order_status_change` broadcasts to `table_{id}` and `waiter_{id}` groups
3. Frontend receives WebSocket message and updates UI in real-time
4. `OrderEvent` row appended

### Menu data request
1. Client GETs `/api/menu/categories/` or `/api/menu/items/`
2. `RestaurantScopedMixin` filters by restaurant
3. Redis cache checked; returns cached response if hit
4. On miss: DB query with `select_related` / `prefetch_related`, then cached

---

## 5. Data Layer

**Database:** PostgreSQL 16

**Key model relationships:**
```
Restaurant
  ├── User (accounts)
  ├── Table → WaiterAssignment, TableSession
  ├── Category → MenuItem
  │                 ├── MenuItemVariant
  │                 ├── MenuItemAddon
  │                 ├── MenuItemImage
  │                 └── MenuItemReview
  └── Order → OrderItem → OrderItemAddon
                └── OrderEvent (audit log)
```

**Encryption:** Sensitive fields use `django-encrypted-model-fields` (Fernet)

**Password hashing:** Argon2 (OWASP-recommended)

---

## 6. API Overview

```
/api/auth/          → login, register, logout, token refresh
/api/menu/          → categories, items, variants, addons
/api/orders/        → CRUD + status transitions
/api/tables/        → available tables, sessions, assignments
/api/notifications/ → WebSocket handshake, audit
/api/admin/         → analytics reports
/api/odoo/          → manual sync triggers
/api/              → restaurant info
/api/health/        → health check
/api/docs/          → Swagger UI (drf-spectacular)
```

**Pagination:** 20 items/page (configurable)

**Rate limits:**
- Anonymous: 30 req/min
- Authenticated: 120 req/min
- Login / Register: 5 req/min
- Order creation: 10 req/min

---

## 7. Minimal Code Examples

### Restaurant-scoped queryset
```python
class RestaurantScopedMixin:
    def get_queryset(self):
        return super().get_queryset().filter(
            restaurant=self.request.user.restaurant
        )
```

### WebSocket notification on order creation
```python
# In order creation view
channel_layer = get_channel_layer()
async_to_sync(channel_layer.group_send)(
    "kitchen",
    {"type": "order.created", "order": order_data}
)
```

### Role-based permission check
```python
class OrderViewSet(RestaurantScopedMixin, ModelViewSet):
    def get_permissions(self):
        if self.action == "create":
            return [IsCustomer()]
        if self.action in ["update", "partial_update"]:
            return [IsAdminOrWaiter()]
        return [IsAdmin()]
```

### Atomic order creation
```python
@transaction.atomic
def perform_create(self, serializer):
    order = serializer.save(restaurant=self.request.user.restaurant)
    log_order_event.delay(order.id, "created")  # Celery task
    notify_order_created(order)
```