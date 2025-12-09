# Restaurant Order API - Endpoint Reference

## Authentication & User Management (Milestone 2 - ✓ Completed)

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new customer account |
| POST | `/api/auth/login/` | Login and get JWT tokens |
| POST | `/api/auth/refresh/` | Refresh access token |

### Authenticated User Endpoints

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/api/auth/logout/` | Logout and blacklist token | Authenticated |
| GET | `/api/auth/profile/` | Get current user profile | Authenticated |
| PUT | `/api/auth/profile/update/` | Update user profile | Authenticated |
| POST | `/api/auth/change-password/` | Change password | Authenticated |

### Admin User Management Endpoints

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/auth/admin/users/` | List all users (filterable) | Admin Only |
| POST | `/api/auth/admin/users/` | Create new user (any role) | Admin Only |
| GET | `/api/auth/admin/users/{id}/` | Get user details | Admin Only |
| PUT | `/api/auth/admin/users/{id}/` | Update user | Admin Only |
| PATCH | `/api/auth/admin/users/{id}/` | Partial update user | Admin Only |
| DELETE | `/api/auth/admin/users/{id}/` | Deactivate user | Admin Only |
| POST | `/api/auth/admin/users/bulk-create/` | Bulk create users | Admin Only |
| POST | `/api/auth/admin/users/{id}/activate/` | Activate user | Admin Only |
| POST | `/api/auth/admin/users/{id}/deactivate/` | Deactivate user | Admin Only |
| GET | `/api/auth/admin/users/statistics/` | User statistics | Admin Only |

---

## Menu Management (Milestone 3 - Pending)

### Categories

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/menu/categories/` | List active categories | All Users |
| POST | `/api/menu/categories/` | Create category | Admin |
| GET | `/api/menu/categories/{id}/` | Get category details | All Users |
| PUT | `/api/menu/categories/{id}/` | Update category | Admin |
| DELETE | `/api/menu/categories/{id}/` | Delete category | Admin |

### Menu Items

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/menu/items/` | List menu items (filtered) | All Users |
| POST | `/api/menu/items/` | Create menu item | Admin |
| GET | `/api/menu/items/{id}/` | Get item details | All Users |
| PUT | `/api/menu/items/{id}/` | Update menu item | Admin |
| PATCH | `/api/menu/items/{id}/availability/` | Toggle availability | Admin |
| DELETE | `/api/menu/items/{id}/` | Delete menu item | Admin |

### Variants & Add-ons

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/menu/items/{id}/variants/` | List variants | All Users |
| POST | `/api/menu/items/{id}/variants/` | Add variant | Admin |
| GET | `/api/menu/items/{id}/addons/` | List add-ons | All Users |
| POST | `/api/menu/addons/` | Create add-on | Admin |

### Import/Export

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/api/admin/menu/import/` | Import menu data | Admin |
| GET | `/api/admin/menu/export/` | Export menu data | Admin |

---

## Table Management (Milestone 4 - Pending)

### Tables

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/tables/` | List all tables | Authenticated |
| POST | `/api/tables/` | Create table | Admin |
| GET | `/api/tables/{id}/` | Get table details | Authenticated |
| PUT | `/api/tables/{id}/` | Update table | Admin |
| PATCH | `/api/tables/{id}/status/` | Update table status | Waiter/Admin |
| GET | `/api/tables/{id}/qr-code/` | Get QR code | Authenticated |

### Table Sessions

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/api/tables/{id}/session/start/` | Start session | Waiter/Admin |
| POST | `/api/tables/{id}/session/end/` | End session | Waiter/Admin |
| GET | `/api/tables/{id}/session/current/` | Get active session | Authenticated |
| GET | `/api/tables/{id}/sessions/history/` | Session history | Waiter/Admin |

### Waiter Assignment

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/api/waiters/assign/` | Assign waiter to table | Admin |
| GET | `/api/waiters/{id}/tables/` | Get waiter's tables | Waiter/Admin |
| GET | `/api/tables/{id}/waiter/` | Get table's waiter | Authenticated |
| DELETE | `/api/waiters/assign/{id}/` | Remove assignment | Admin |
| GET | `/api/waiters/assignments/active/` | List active assignments | Admin |

### Waiter Dashboard

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/waiters/dashboard/` | Waiter dashboard data | Waiter |
| GET | `/api/waiters/me/tables/` | My assigned tables | Waiter |
| GET | `/api/waiters/me/orders/pending/` | Pending orders | Waiter |

---

## Order Management (Milestone 5 - Pending)

### Orders

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/api/orders/` | Create new order | Customer |
| GET | `/api/orders/` | List orders (filtered) | Role-based |
| GET | `/api/orders/me/` | Get my orders | Customer |
| GET | `/api/orders/{id}/` | Get order details | Owner/Waiter/Admin |
| GET | `/api/orders/table/{table_id}/` | Orders by table | Waiter/Admin |
| GET | `/api/orders/waiter/{waiter_id}/` | Orders by waiter | Admin |
| GET | `/api/orders/stats/` | Order statistics | Admin |

### Order Verification & Status

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/orders/pending/` | Pending orders | Waiter/Admin |
| POST | `/api/orders/{id}/verify/` | Verify/confirm order | Waiter |
| PUT | `/api/orders/{id}/modify/` | Modify order items | Waiter |
| POST | `/api/orders/{id}/reject/` | Reject order | Waiter |
| PATCH | `/api/orders/{id}/status/` | Update order status | Waiter/Admin |
| POST | `/api/orders/{id}/cancel/` | Cancel order | Owner/Admin |

### Order History & Timeline

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/orders/{id}/history/` | Status change history | Owner/Waiter/Admin |
| GET | `/api/orders/{id}/timeline/` | Complete order timeline | Owner/Waiter/Admin |

---

## Odoo Integration (Milestone 6 - Pending)

### Configuration

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/api/admin/odoo/configure/` | Save Odoo credentials | Admin |
| GET | `/api/admin/odoo/config/` | Get current config | Admin |
| POST | `/api/admin/odoo/test-connection/` | Test connection | Admin |

### Menu Sync

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/api/admin/odoo/sync/menu/` | Trigger menu sync | Admin |
| GET | `/api/admin/odoo/sync/history/` | Sync history | Admin |
| GET | `/api/admin/odoo/sync/status/` | Current sync status | Admin |
| POST | `/api/admin/odoo/sync/schedule/` | Update sync schedule | Admin |
| POST | `/api/admin/odoo/sync/trigger/` | Force sync now | Admin |

### Order & Payment Sync

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/api/orders/{id}/push-to-odoo/` | Push order to Odoo | Admin |
| GET | `/api/orders/{id}/odoo-status/` | Check Odoo sync | Admin |
| POST | `/api/orders/{id}/payments/` | Record payment | Waiter/Admin |
| GET | `/api/orders/{id}/payments/` | List order payments | Authenticated |
| POST | `/api/payments/{id}/sync/` | Sync payment | Admin |

### Error Handling

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/admin/odoo/errors/` | List sync errors | Admin |
| POST | `/api/admin/odoo/errors/{id}/retry/` | Retry failed sync | Admin |
| GET | `/api/admin/odoo/reconcile/` | Reconciliation report | Admin |

---

## Notifications (Milestone 7 - Pending)

### WebSocket Connections

| Protocol | Endpoint | Description | Permission |
|----------|----------|-------------|------------|
| WS | `/ws/notifications/` | General notifications | Authenticated |
| WS | `/ws/waiters/{waiter_id}/` | Waiter notifications | Waiter |
| WS | `/ws/customers/table/{table_id}/` | Table notifications | Customer |
| WS | `/ws/admin/dashboard/` | Admin dashboard | Admin |

### HTTP Notification Endpoints

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/notifications/` | List user notifications | Authenticated |
| PATCH | `/api/notifications/{id}/read/` | Mark as read | Authenticated |
| POST | `/api/notifications/mark-all-read/` | Mark all read | Authenticated |
| DELETE | `/api/notifications/{id}/` | Delete notification | Authenticated |

### Notification Preferences

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/notifications/preferences/` | Get preferences | Authenticated |
| PUT | `/api/notifications/preferences/` | Update preferences | Authenticated |

---

## Analytics & Reporting (Milestone 8 - Pending)

### Revenue Analytics

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/admin/analytics/revenue/` | Revenue report | Admin |
| GET | `/api/admin/analytics/sales-summary/` | Sales summary | Admin |
| GET | `/api/admin/analytics/export/` | Export report | Admin |

### Menu Performance

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/admin/analytics/menu-performance/` | Item performance | Admin |
| GET | `/api/admin/analytics/top-items/` | Best sellers | Admin |
| GET | `/api/admin/analytics/category-performance/` | Category stats | Admin |

### Waiter Performance

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/admin/analytics/waiters/` | Waiter performance | Admin |
| GET | `/api/admin/analytics/waiters/{id}/` | Individual stats | Admin |

### Table Analytics

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/admin/analytics/tables/` | Table analytics | Admin |
| GET | `/api/admin/analytics/occupancy/` | Occupancy report | Admin |

### Custom Reports

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/api/admin/reports/create/` | Create custom report | Admin |
| GET | `/api/admin/reports/` | List saved reports | Admin |
| POST | `/api/admin/reports/{id}/schedule/` | Schedule report | Admin |
| GET | `/api/admin/reports/{id}/generate/` | Generate report | Admin |

---

## API Documentation

### Swagger/OpenAPI

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schema/` | OpenAPI schema (JSON) |
| GET | `/api/docs/` | Swagger UI |
| GET | `/api/redoc/` | ReDoc UI |

---

## Permission Levels

- **Public**: No authentication required
- **Authenticated**: Any logged-in user
- **Customer**: Customer role only
- **Waiter**: Waiter role only
- **Admin**: Admin role only
- **Owner**: Resource owner or admin
- **Role-based**: Different access based on user role

## HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **204 No Content**: Successful deletion
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Permission denied
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

## Common Query Parameters

- `?search=<query>` - Search across specified fields
- `?ordering=<field>` - Sort by field (prefix with `-` for descending)
- `?page=<number>` - Pagination
- `?page_size=<number>` - Items per page
- `?<field>=<value>` - Filter by field value

## Example Authorization Header

```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```
