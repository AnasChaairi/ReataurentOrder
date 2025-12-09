# Restaurant Digital Ordering Platform - Frontend Development Backlog

## Project Overview
A Next.js-based frontend for a restaurant ordering platform with three user interfaces (Customer, Waiter, Admin), real-time updates, and responsive design for tablets and mobile devices.

**Tech Stack:** Next.js (React), TailwindCSS, WebSocket Client, Axios, Context/Redux, JWT Auth

---

## MILESTONE 1: Project Setup and Core Infrastructure

### Ticket #F1.1: Next.js Project Initialization and Structure
**Priority:** Critical
**Estimated Time:** 4 hours

**Description:**
Set up Next.js project with proper folder structure, TypeScript configuration, and development environment.

**Tasks:**
- Initialize Next.js project with TypeScript
- Set up folder structure: `/components`, `/pages`, `/hooks`, `/services`, `/contexts`, `/utils`, `/types`
- Configure `next.config.js` for environment variables
- Set up TailwindCSS with custom theme
- Configure ESLint and Prettier
- Create `.env.local` template file

**UI/UX Features:** N/A (Infrastructure)

**API Integration:** None

**Dependencies:** None

**Acceptance Criteria:**
- ✓ Next.js project runs with `npm run dev`
- ✓ TypeScript compilation works without errors
- ✓ TailwindCSS styles applied correctly
- ✓ Folder structure follows best practices
- ✓ ESLint and Prettier configured
- ✓ Environment variables load properly

---

### Ticket #F1.2: API Service Layer and Axios Configuration
**Priority:** Critical
**Estimated Time:** 5 hours

**Description:**
Create centralized API service layer with Axios instance, request/response interceptors, and error handling.

**Tasks:**
- Create Axios base instance with backend URL
- Implement request interceptor for JWT token injection
- Implement response interceptor for error handling
- Create API service modules (auth, menu, orders, tables, etc.)
- Handle token refresh logic
- Create error handling utilities

**UI/UX Features:** N/A (Infrastructure)

**API Integration:**
- Base URL configuration for all backend endpoints
- JWT token management in headers
- Token refresh endpoint: `POST /api/auth/refresh/`

**Dependencies:** Ticket #F1.1

**Acceptance Criteria:**
- ✓ Axios instance configured with base URL
- ✓ JWT tokens automatically attached to requests
- ✓ Token refresh works on 401 errors
- ✓ API errors handled gracefully
- ✓ Service modules organized by domain
- ✓ TypeScript types for API responses

---

### Ticket #F1.3: Authentication Context and JWT Management
**Priority:** Critical
**Estimated Time:** 6 hours

**Description:**
Implement authentication context with JWT token management, login/logout functionality, and user session persistence.

**Tasks:**
- Create AuthContext with React Context API
- Implement login, logout, and token refresh logic
- Store JWT tokens in httpOnly cookies or localStorage
- Create authentication state management
- Implement protected route wrapper component
- Add auto-logout on token expiration

**UI/UX Features:**
- Authentication state available globally
- Auto-redirect on unauthorized access
- Session persistence across page refreshes

**API Integration:**
- `POST /api/auth/login/` - User login
- `POST /api/auth/refresh/` - Refresh access token
- `POST /api/auth/logout/` - Logout and blacklist token
- `GET /api/auth/profile/` - Get current user profile

**Dependencies:** Ticket #F1.2

**Acceptance Criteria:**
- ✓ Users can login with email/password
- ✓ JWT tokens stored securely
- ✓ Protected routes redirect unauthenticated users
- ✓ User session persists on page reload
- ✓ Auto-logout on token expiration
- ✓ User role accessible from context
- ✓ Token refresh seamless to user

---

### Ticket #F1.4: Global State Management Setup
**Priority:** High
**Estimated Time:** 4 hours

**Description:**
Set up global state management for cart, notifications, and UI state using React Context or Redux.

**Tasks:**
- Create CartContext for order management
- Create NotificationContext for alerts
- Create UIContext for modals, toasts, loading states
- Implement context providers wrapper
- Create custom hooks for context consumption
- Add TypeScript types for all state

**UI/UX Features:**
- Global cart state accessible from any component
- Notification system for alerts and messages
- Loading states and modal management

**API Integration:** None (state management only)

**Dependencies:** Ticket #F1.1

**Acceptance Criteria:**
- ✓ Cart state persists across navigation
- ✓ Notifications display globally
- ✓ Loading states managed centrally
- ✓ Custom hooks simplify context usage
- ✓ TypeScript ensures type safety
- ✓ No prop drilling required

---

### Ticket #F1.5: Routing and Navigation Structure
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Set up Next.js routing structure with role-based navigation and protected routes.

**Tasks:**
- Create route structure for customer, waiter, admin
- Implement ProtectedRoute component with role checking
- Create navigation components for each role
- Set up route guards for role-based access
- Configure dynamic routing for tables/orders
- Create 404 and error pages

**UI/UX Features:**
- Role-specific navigation menus
- Breadcrumb navigation
- Protected routes based on user role
- Custom error pages

**API Integration:**
- User role from `GET /api/auth/profile/`

**Dependencies:** Ticket #F1.3

**Acceptance Criteria:**
- ✓ Routes organized by role
- ✓ Navigation adapts to user role
- ✓ Protected routes enforce access control
- ✓ Dynamic routes work (e.g., `/menu/:id`)
- ✓ 404 page displays for invalid routes
- ✓ Role-based redirects work correctly

---

### Ticket #F1.6: UI Component Library and Design System
**Priority:** High
**Estimated Time:** 6 hours

**Description:**
Create reusable UI components following a consistent design system.

**Tasks:**
- Create base components: Button, Input, Card, Modal, Badge
- Implement form components: Select, Checkbox, Radio, TextArea
- Create feedback components: Toast, Alert, Spinner
- Build layout components: Container, Grid, Flexbox utilities
- Create typography components
- Document component props with Storybook (optional)

**UI/UX Features:**
- Consistent button styles and states
- Form inputs with validation states
- Loading spinners and skeletons
- Toast notifications
- Responsive grid system

**API Integration:** None

**Dependencies:** Ticket #F1.1

**Acceptance Criteria:**
- ✓ All base components created
- ✓ Components support variants and sizes
- ✓ Accessibility (ARIA) implemented
- ✓ Components responsive on mobile/tablet
- ✓ TypeScript props documented
- ✓ Dark mode support (optional)

---

## MILESTONE 2: Customer Interface Development

### Ticket #F2.1: Menu Browsing - Category Navigation
**Priority:** Critical
**Estimated Time:** 6 hours

**Description:**
Create menu category navigation with horizontal scrollable tabs or grid view.

**Tasks:**
- Fetch and display menu categories
- Create category card/tab components
- Implement active category highlighting
- Add category images and icons
- Create horizontal scroll for tablet view
- Add category filtering functionality

**UI/UX Features:**
- Horizontal scrollable category tabs
- Category images with names
- Active category highlight
- Touch-friendly navigation
- Responsive layout (grid on mobile, horizontal on tablet)

**API Integration:**
- `GET /api/menu/categories/` - Fetch all active categories

**Dependencies:** Ticket #F1.2, #F1.6

**Acceptance Criteria:**
- ✓ Categories load from API
- ✓ Category tabs scroll horizontally
- ✓ Active category visually distinct
- ✓ Images display properly
- ✓ Touch gestures work on tablets
- ✓ Loading state shows while fetching
- ✓ Empty state if no categories

---

### Ticket #F2.2: Menu Item Grid and Search
**Priority:** Critical
**Estimated Time:** 7 hours

**Description:**
Display menu items in a responsive grid with search and filter functionality.

**Tasks:**
- Create menu item card component
- Implement responsive grid layout (2-3 columns)
- Add search bar with debounced input
- Filter by category, dietary restrictions
- Display item image, name, price, description
- Add "unavailable" badge for out-of-stock items
- Implement infinite scroll or pagination

**UI/UX Features:**
- Grid of menu item cards with images
- Search bar at top
- Filter chips (vegetarian, vegan, etc.)
- Visual indicator for unavailable items
- Smooth scrolling and loading

**API Integration:**
- `GET /api/menu/items/` - Fetch menu items with filters
- Query params: `?category=<id>&search=<term>&is_vegetarian=true`

**Dependencies:** Ticket #F2.1

**Acceptance Criteria:**
- ✓ Items display in responsive grid
- ✓ Search filters items in real-time
- ✓ Category filter works
- ✓ Dietary filters (vegetarian, vegan) work
- ✓ Unavailable items clearly marked
- ✓ Images lazy-load for performance
- ✓ Empty state when no results

---

### Ticket #F2.3: Dish Detail Modal
**Priority:** High
**Estimated Time:** 6 hours

**Description:**
Create detailed view modal for menu items with variants, add-ons, and quantity selection.

**Tasks:**
- Create modal component with dish details
- Display full-size image, description, ingredients
- Show allergen information
- Implement variant selection (sizes)
- Create add-ons selection with checkboxes
- Add quantity selector (+/- buttons)
- Display dynamic price calculation
- "Add to Order" button

**UI/UX Features:**
- Full-screen modal on mobile, centered on tablet
- Large dish image
- Variant buttons (Small, Medium, Large)
- Add-ons with checkboxes and prices
- Quantity counter with +/- buttons
- Real-time price updates
- Close button

**API Integration:**
- `GET /api/menu/items/{id}/` - Fetch dish details
- `GET /api/menu/items/{id}/variants/` - Fetch variants
- `GET /api/menu/items/{id}/addons/` - Fetch available add-ons

**Dependencies:** Ticket #F2.2, #F1.4

**Acceptance Criteria:**
- ✓ Modal opens on item click
- ✓ All dish details displayed
- ✓ Variant selection updates price
- ✓ Add-ons selection updates price
- ✓ Quantity changes update price
- ✓ "Add to Order" adds to cart
- ✓ Modal closes after adding
- ✓ Accessible (keyboard nav, focus trap)

---

### Ticket #F2.4: Shopping Cart/Order Basket
**Priority:** Critical
**Estimated Time:** 7 hours

**Description:**
Implement shopping cart with item management, quantity updates, and order summary.

**Tasks:**
- Create cart drawer/sidebar component
- Display cart items with details
- Implement quantity update (+/- buttons)
- Add remove item functionality
- Show order summary with subtotal
- Add special instructions text area
- Create "Review Order" button
- Persist cart in local storage
- Show cart badge with item count

**UI/UX Features:**
- Slide-out cart drawer from right
- Cart icon with item count badge
- Item list with images and prices
- Quantity controls per item
- Remove item button
- Special instructions field
- Subtotal and total display
- Empty cart state

**API Integration:**
- No API calls (local state only)
- Data prepared for order submission

**Dependencies:** Ticket #F2.3, #F1.4

**Acceptance Criteria:**
- ✓ Cart drawer opens/closes smoothly
- ✓ Items display with full details
- ✓ Quantity updates work
- ✓ Remove item works
- ✓ Total calculates correctly
- ✓ Cart persists in local storage
- ✓ Badge shows item count
- ✓ Empty cart shows message
- ✓ Special instructions can be added

---

### Ticket #F2.5: Order Submission Flow
**Priority:** Critical
**Estimated Time:** 6 hours

**Description:**
Create order review and submission interface with validation and confirmation.

**Tasks:**
- Create order review page/modal
- Display complete order summary
- Show table number
- Add form validation
- Implement order submission
- Show loading state during submission
- Display success message with order number
- Handle submission errors
- Clear cart after successful submission

**UI/UX Features:**
- Order review screen
- Itemized order list
- Table number display
- "Confirm Order" button
- Loading spinner during submission
- Success message with animation
- Error handling with retry option

**API Integration:**
- `POST /api/orders/` - Create new order
  - Body: `{ table_id, items: [{ menu_item_id, variant_id, addon_ids, quantity, special_instructions }] }`

**Dependencies:** Ticket #F2.4

**Acceptance Criteria:**
- ✓ Order review shows all items
- ✓ Table number displayed
- ✓ Validation prevents empty orders
- ✓ Order submits successfully
- ✓ Success message shows order number
- ✓ Cart clears after submission
- ✓ Loading state during API call
- ✓ Errors display with clear messages
- ✓ User can retry on failure

---

### Ticket #F2.6: Real-Time Order Status Tracking
**Priority:** High
**Estimated Time:** 7 hours

**Description:**
Display real-time order status updates for customers with progress tracking.

**Tasks:**
- Create order status page
- Implement WebSocket connection for table
- Display order timeline/progress bar
- Show current status (pending, confirmed, preparing, ready, served)
- Update UI on status changes
- Show estimated time for next status
- Add visual progress indicators
- Display all items in order

**UI/UX Features:**
- Progress bar or stepper component
- Status labels with icons
- Real-time status updates (no refresh)
- Estimated time display
- Visual animations on status change
- Order item list
- Countdown timer (optional)

**API Integration:**
- `GET /api/orders/me/` - Fetch customer's orders
- `GET /api/orders/{id}/` - Get order details
- `ws://api/ws/customers/table/{table_id}/` - WebSocket for status updates

**Dependencies:** Ticket #F2.5, #F3.1 (WebSocket setup)

**Acceptance Criteria:**
- ✓ Order status displays correctly
- ✓ Progress bar reflects current status
- ✓ WebSocket connects successfully
- ✓ Status updates in real-time
- ✓ Visual feedback on status change
- ✓ All order items displayed
- ✓ Handles disconnection gracefully
- ✓ Reconnects automatically

---

### Ticket #F2.7: Customer Landing Page and Table Selection
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Create landing page for customers accessing via QR code with table identification.

**Tasks:**
- Create welcome/landing page
- Extract table ID from QR code URL
- Display table number
- Show restaurant branding
- Create "Start Ordering" button
- Handle invalid table IDs
- Store table context in session

**UI/UX Features:**
- Welcome screen with restaurant logo
- Table number display
- "Browse Menu" call-to-action button
- Error message for invalid tables
- Responsive design for all devices

**API Integration:**
- `GET /api/tables/{id}/` - Validate table ID
- `GET /api/tables/{id}/session/current/` - Get current table session

**Dependencies:** Ticket #F1.3

**Acceptance Criteria:**
- ✓ QR code URLs work correctly
- ✓ Table ID extracted from URL
- ✓ Table validation works
- ✓ Invalid tables show error
- ✓ Table number displayed
- ✓ "Start Ordering" navigates to menu
- ✓ Table context stored in session

---

## MILESTONE 3: Real-Time Communication Infrastructure

### Ticket #F3.1: WebSocket Client Setup and Connection Management
**Priority:** Critical
**Estimated Time:** 6 hours

**Description:**
Implement WebSocket client with connection management, authentication, and reconnection logic.

**Tasks:**
- Create WebSocket service/hook
- Implement JWT authentication for WebSocket
- Handle connection states (connecting, connected, disconnected)
- Implement auto-reconnection with exponential backoff
- Add heartbeat/ping-pong mechanism
- Create connection status indicator
- Handle connection errors

**UI/UX Features:**
- Connection status indicator (online/offline badge)
- Auto-reconnect notification
- Loading state during connection

**API Integration:**
- `ws://api/ws/notifications/` - Base WebSocket endpoint
- JWT token sent in connection handshake

**Dependencies:** Ticket #F1.3

**Acceptance Criteria:**
- ✓ WebSocket connects successfully
- ✓ JWT authentication works
- ✓ Connection states tracked
- ✓ Auto-reconnect on disconnect
- ✓ Exponential backoff implemented
- ✓ Connection status visible to user
- ✓ Errors logged and handled

---

### Ticket #F3.2: Notification System and Toast Component
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Create notification system with toast notifications for real-time alerts.

**Tasks:**
- Create toast notification component
- Implement notification queue
- Support different notification types (success, error, info, warning)
- Add auto-dismiss with configurable timeout
- Create notification sound (optional)
- Position notifications (top-right/bottom-right)
- Support action buttons in toasts

**UI/UX Features:**
- Toast notifications slide in from corner
- Color-coded by type
- Close button
- Auto-dismiss after 5 seconds
- Sound on important notifications
- Stacked notifications

**API Integration:**
- Receive notifications via WebSocket
- `GET /api/notifications/` - Fetch notification history

**Dependencies:** Ticket #F3.1

**Acceptance Criteria:**
- ✓ Toasts display correctly
- ✓ Multiple toasts stack properly
- ✓ Auto-dismiss works
- ✓ Manual dismiss works
- ✓ Colors match notification type
- ✓ Accessible (screen readers)
- ✓ Responsive on all devices

---

### Ticket #F3.3: Real-Time Event Handlers
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Implement event handlers for different WebSocket message types and dispatch actions.

**Tasks:**
- Create event handler registry
- Handle order status updates
- Handle new order notifications
- Handle waiter assignment updates
- Handle menu updates
- Dispatch to appropriate context/state
- Add logging for debugging

**UI/UX Features:**
- Automatic UI updates on events
- No manual refresh needed
- Visual feedback on updates

**API Integration:**
- WebSocket message types:
  - `order_status_updated`
  - `new_order`
  - `waiter_assigned`
  - `menu_item_updated`

**Dependencies:** Ticket #F3.1, #F3.2

**Acceptance Criteria:**
- ✓ All event types handled
- ✓ Events dispatch to correct handlers
- ✓ UI updates automatically
- ✓ Unknown events logged
- ✓ Error events handled
- ✓ State updates correctly
- ✓ No memory leaks

---

## MILESTONE 4: Waiter Dashboard Interface

### Ticket #F4.1: Waiter Dashboard - Table Overview
**Priority:** Critical
**Estimated Time:** 7 hours

**Description:**
Create waiter dashboard showing assigned tables and their current status.

**Tasks:**
- Create dashboard layout component
- Fetch assigned tables for logged-in waiter
- Display table cards with status
- Show table number, capacity, occupancy
- Indicate tables with pending orders (badge/highlight)
- Add table status colors (available, occupied, needs attention)
- Implement table filtering/sorting
- Show current session info per table

**UI/UX Features:**
- Grid of table cards
- Color-coded status indicators
- Badge for pending orders count
- Quick stats at top (total tables, active orders)
- Filter by status
- Responsive grid layout

**API Integration:**
- `GET /api/waiters/me/tables/` - Get assigned tables
- `GET /api/waiters/dashboard/` - Dashboard summary data

**Dependencies:** Ticket #F1.3, #F1.6

**Acceptance Criteria:**
- ✓ Dashboard displays assigned tables
- ✓ Table statuses accurate
- ✓ Pending orders highlighted
- ✓ Quick stats displayed
- ✓ Filtering works
- ✓ Responsive on tablets
- ✓ Empty state if no tables assigned

---

### Ticket #F4.2: Real-Time Order Notifications for Waiters
**Priority:** Critical
**Estimated Time:** 6 hours

**Description:**
Implement real-time notifications when customers place orders, with audio and visual alerts.

**Tasks:**
- Connect to waiter-specific WebSocket channel
- Create notification modal/alert component
- Display new order details in notification
- Play notification sound
- Show badge count of pending orders
- Create notification history panel
- Mark notifications as read
- Auto-open order verification modal

**UI/UX Features:**
- Pop-up notification on new order
- Audio alert sound
- Badge on dashboard icon
- Notification bell icon with count
- Click to view order details
- Notification list panel

**API Integration:**
- `ws://api/ws/waiters/{waiter_id}/` - Waiter WebSocket channel
- Receives: `{ type: 'new_order', order_id, table_number, items }`
- `GET /api/notifications/` - Fetch notification history
- `PATCH /api/notifications/{id}/read/` - Mark as read

**Dependencies:** Ticket #F3.1, #F4.1

**Acceptance Criteria:**
- ✓ WebSocket connects for waiter
- ✓ Notifications received in real-time
- ✓ Sound plays on new order
- ✓ Badge count updates
- ✓ Notification displays order info
- ✓ Clicking opens order details
- ✓ Notifications persist until read
- ✓ History panel accessible

---

### Ticket #F4.3: Order Verification and Modification Interface
**Priority:** Critical
**Estimated Time:** 7 hours

**Description:**
Create interface for waiters to review, modify, and confirm customer orders.

**Tasks:**
- Create order verification modal
- Display complete order details
- Show customer special instructions
- Allow quantity modifications
- Allow item removal
- Add waiter notes field
- Create "Confirm Order" button
- Create "Reject Order" with reason
- Show table and customer info

**UI/UX Features:**
- Full-screen or large modal
- Order items list with edit controls
- Quantity +/- buttons
- Remove item button
- Text area for waiter notes
- Text area for rejection reason
- Confirm and Reject buttons
- Loading state during submission

**API Integration:**
- `GET /api/orders/pending/` - List pending orders
- `GET /api/orders/{id}/` - Get order details
- `PUT /api/orders/{id}/modify/` - Modify order items
- `POST /api/orders/{id}/verify/` - Confirm order
- `POST /api/orders/{id}/reject/` - Reject order with reason

**Dependencies:** Ticket #F4.2

**Acceptance Criteria:**
- ✓ Order details display completely
- ✓ Items can be modified
- ✓ Quantity updates work
- ✓ Items can be removed
- ✓ Waiter notes can be added
- ✓ Order confirms successfully
- ✓ Rejection requires reason
- ✓ Customer notified after action
- ✓ Modal closes after submission
- ✓ Validation prevents empty orders

---

### Ticket #F4.4: Order Status Management for Waiters
**Priority:** High
**Estimated Time:** 6 hours

**Description:**
Allow waiters to update order status through the workflow (confirmed → preparing → ready → served).

**Tasks:**
- Create order list view for confirmed orders
- Display current status per order
- Create status update buttons
- Implement status transition validation
- Show status update confirmation
- Add batch status update (multiple orders)
- Filter orders by status
- Show order timestamps

**UI/UX Features:**
- List/table view of orders
- Status badge/chip per order
- Action buttons for next status
- Confirmation dialog for status change
- Bulk selection checkboxes
- Filter dropdown for status
- Sort by time/table

**API Integration:**
- `GET /api/orders/` - List orders with filters
- `PATCH /api/orders/{id}/status/` - Update order status
  - Body: `{ status: 'preparing' | 'ready' | 'served' }`

**Dependencies:** Ticket #F4.3

**Acceptance Criteria:**
- ✓ Orders list displays correctly
- ✓ Current status shown per order
- ✓ Status can be updated
- ✓ Invalid transitions prevented
- ✓ Confirmation required for changes
- ✓ Batch update works
- ✓ Filters work correctly
- ✓ Real-time updates from WebSocket
- ✓ Optimistic UI updates

---

### Ticket #F4.5: Waiter Profile and Shift Information
**Priority:** Low
**Estimated Time:** 4 hours

**Description:**
Display waiter profile information and current shift details.

**Tasks:**
- Create profile page/section
- Display waiter name, photo, contact
- Show current shift times
- Display assigned tables for shift
- Show performance metrics (orders handled, revenue)
- Allow profile picture upload
- Add shift history view

**UI/UX Features:**
- Profile card with photo
- Shift information panel
- Assigned tables list
- Performance stats cards
- Profile edit modal
- Avatar upload

**API Integration:**
- `GET /api/auth/profile/` - Get waiter profile
- `PUT /api/auth/profile/` - Update profile
- `GET /api/waiters/assignments/active/` - Current shift assignments
- `GET /api/admin/analytics/waiters/{id}/` - Waiter performance stats

**Dependencies:** Ticket #F4.1

**Acceptance Criteria:**
- ✓ Profile information displays
- ✓ Current shift shown
- ✓ Assigned tables listed
- ✓ Performance stats accurate
- ✓ Profile can be edited
- ✓ Avatar upload works
- ✓ Shift history accessible

---

## MILESTONE 5: Admin Panel Development

### Ticket #F5.1: Admin Dashboard - Overview and Analytics
**Priority:** High
**Estimated Time:** 8 hours

**Description:**
Create admin dashboard with key metrics, charts, and restaurant performance overview.

**Tasks:**
- Create dashboard layout with widgets
- Display total orders, revenue, table occupancy
- Show order count by status
- Create revenue chart (daily/weekly/monthly)
- Display top-selling menu items chart
- Show active tables and waiters
- Add date range selector
- Implement real-time updates for live metrics

**UI/UX Features:**
- Grid layout with stat cards
- Line/bar charts for revenue
- Pie chart for order distribution
- Top items list with images
- Date range picker
- Auto-refresh every 30 seconds
- Responsive dashboard grid

**API Integration:**
- `GET /api/admin/analytics/revenue/` - Revenue data with date range
- `GET /api/admin/analytics/sales-summary/` - Sales summary
- `GET /api/admin/analytics/menu-performance/` - Top items
- `GET /api/orders/stats/` - Order statistics

**Dependencies:** Ticket #F1.3, #F1.6

**Acceptance Criteria:**
- ✓ Dashboard displays key metrics
- ✓ Charts render correctly
- ✓ Date range filter works
- ✓ Data updates automatically
- ✓ Top items display with images
- ✓ Responsive on different screens
- ✓ Loading states during data fetch
- ✓ Empty states handled

---

### Ticket #F5.2: Menu Management - Category CRUD Interface
**Priority:** Critical
**Estimated Time:** 7 hours

**Description:**
Create interface for creating, editing, and deleting menu categories.

**Tasks:**
- Create category list view with table/grid
- Implement add category form/modal
- Create edit category functionality
- Add delete with confirmation
- Implement category image upload
- Add reordering/drag-and-drop (optional)
- Show active/inactive toggle
- Add form validation

**UI/UX Features:**
- Table view with action buttons
- "Add Category" button
- Modal form for create/edit
- Image upload with preview
- Delete confirmation dialog
- Active/inactive toggle switch
- Drag handles for reordering
- Form validation errors

**API Integration:**
- `GET /api/menu/categories/` - List all categories
- `POST /api/menu/categories/` - Create category
  - Body: `{ name, description, image, order, active }`
- `PUT /api/menu/categories/{id}/` - Update category
- `DELETE /api/menu/categories/{id}/` - Delete category

**Dependencies:** Ticket #F5.1

**Acceptance Criteria:**
- ✓ Categories list displays
- ✓ Can create new category
- ✓ Can edit existing category
- ✓ Can delete with confirmation
- ✓ Image upload works
- ✓ Validation prevents invalid data
- ✓ Active toggle works
- ✓ Changes reflect immediately
- ✓ Error messages clear

---

### Ticket #F5.3: Menu Management - Menu Item CRUD Interface
**Priority:** Critical
**Estimated Time:** 9 hours

**Description:**
Create comprehensive interface for managing menu items with variants and add-ons.

**Tasks:**
- Create menu items list view with filters
- Implement add menu item form
- Create edit menu item functionality
- Add delete with confirmation
- Implement image upload
- Create variant management (sizes/prices)
- Create add-ons management
- Add availability toggle
- Implement form validation
- Support dietary tags (vegetarian, vegan, etc.)

**UI/UX Features:**
- Filterable table/grid view
- Multi-step form or tabbed form
- Image upload with crop/resize
- Variant section with dynamic fields
- Add-ons multi-select
- Availability toggle
- Dietary restriction checkboxes
- Rich text editor for description
- Price input with currency
- Save and cancel buttons

**API Integration:**
- `GET /api/menu/items/` - List menu items with filters
- `POST /api/menu/items/` - Create menu item
  - Body: `{ name, description, price, category_id, image, is_vegetarian, is_vegan, ingredients, allergens }`
- `PUT /api/menu/items/{id}/` - Update menu item
- `DELETE /api/menu/items/{id}/` - Delete item
- `PATCH /api/menu/items/{id}/availability/` - Toggle availability
- `POST /api/menu/items/{id}/variants/` - Add variant
- `POST /api/menu/addons/` - Create add-on

**Dependencies:** Ticket #F5.2

**Acceptance Criteria:**
- ✓ Items list with filters and search
- ✓ Can create menu item with all fields
- ✓ Can edit existing items
- ✓ Can delete with confirmation
- ✓ Image upload and preview works
- ✓ Variants can be added/removed
- ✓ Add-ons can be managed
- ✓ Availability toggle works
- ✓ Validation comprehensive
- ✓ Form handles errors gracefully
- ✓ Changes save successfully

---

### Ticket #F5.4: Table Management Interface
**Priority:** High
**Estimated Time:** 6 hours

**Description:**
Create interface for managing restaurant tables and their status.

**Tasks:**
- Create table list/grid view
- Implement add table form
- Create edit table functionality
- Add delete with confirmation
- Display table status (available, occupied, reserved)
- Show QR code for each table
- Add QR code download/print
- Implement table search/filter
- Show current session info

**UI/UX Features:**
- Grid view of table cards
- "Add Table" button
- Modal form for create/edit
- Status badge on each table
- QR code display modal
- Download/print QR button
- Filter by section/status
- Visual floor layout (optional)

**API Integration:**
- `GET /api/tables/` - List all tables
- `POST /api/tables/` - Create table
  - Body: `{ number, capacity, section, status }`
- `PUT /api/tables/{id}/` - Update table
- `DELETE /api/tables/{id}/` - Delete table
- `GET /api/tables/{id}/qr-code/` - Get QR code image
- `PATCH /api/tables/{id}/status/` - Update status

**Dependencies:** Ticket #F5.1

**Acceptance Criteria:**
- ✓ Tables list displays correctly
- ✓ Can create new table
- ✓ Can edit table details
- ✓ Can delete table
- ✓ QR code displays and downloads
- ✓ Status updates work
- ✓ Filter and search work
- ✓ Current session shown
- ✓ Validation prevents duplicates

---

### Ticket #F5.5: Waiter Assignment Interface
**Priority:** High
**Estimated Time:** 6 hours

**Description:**
Create interface for assigning waiters to tables and managing shifts.

**Tasks:**
- Create assignment management view
- Display list of waiters
- Show assigned tables per waiter
- Implement drag-and-drop table assignment
- Create assignment form (waiter + table + shift)
- Add bulk assignment functionality
- Display shift schedules
- Show active assignments only

**UI/UX Features:**
- Two-column layout (waiters | tables)
- Drag-and-drop assignment
- Assignment modal form
- Shift time pickers
- Bulk assignment checkboxes
- Active assignments filter
- Visual connection between waiter and tables

**API Integration:**
- `GET /api/waiters/assignments/active/` - List active assignments
- `POST /api/waiters/assign/` - Assign waiter to table
  - Body: `{ waiter_id, table_id, shift_start, shift_end }`
- `DELETE /api/waiters/assign/{id}/` - Remove assignment
- `GET /api/admin/users/?role=waiter` - List waiters
- `GET /api/tables/` - List tables

**Dependencies:** Ticket #F5.4, #F5.6

**Acceptance Criteria:**
- ✓ Waiters and tables displayed
- ✓ Can assign waiter to table
- ✓ Drag-and-drop works
- ✓ Shift times can be set
- ✓ Can remove assignments
- ✓ Bulk assignment works
- ✓ Visual feedback on assignment
- ✓ Validation prevents conflicts
- ✓ Changes save successfully

---

### Ticket #F5.6: User Management Interface
**Priority:** High
**Estimated Time:** 7 hours

**Description:**
Create interface for managing users (admins, waiters, customers) with role assignment.

**Tasks:**
- Create user list table with filters
- Implement add user form
- Create edit user functionality
- Add delete/deactivate user
- Implement role selection (Admin/Waiter/Customer)
- Add password reset functionality
- Show user status (active/inactive)
- Implement search and filtering
- Display user statistics

**UI/UX Features:**
- Table view with pagination
- "Add User" button
- Modal form for create/edit
- Role dropdown/radio buttons
- Status toggle
- Search by name/email
- Filter by role
- Action menu per user
- Confirmation dialogs

**API Integration:**
- `GET /api/admin/users/` - List all users with filters
- `POST /api/admin/users/` - Create user
  - Body: `{ email, password, first_name, last_name, role, phone }`
- `PUT /api/admin/users/{id}/` - Update user
- `DELETE /api/admin/users/{id}/` - Deactivate user
- `POST /api/admin/users/bulk-create/` - Bulk create

**Dependencies:** Ticket #F5.1

**Acceptance Criteria:**
- ✓ Users list with pagination
- ✓ Can create new user
- ✓ Can edit user details
- ✓ Can deactivate user
- ✓ Role assignment works
- ✓ Search and filters work
- ✓ Validation prevents duplicates
- ✓ Password requirements enforced
- ✓ Bulk operations work
- ✓ Changes reflect immediately

---

### Ticket #F5.7: Odoo Sync Management Interface
**Priority:** Medium
**Estimated Time:** 6 hours

**Description:**
Create interface for managing Odoo POS connection and sync operations.

**Tasks:**
- Create Odoo settings page
- Display connection status
- Create credentials form (URL, database, username, password)
- Add "Test Connection" button
- Show sync history table
- Display last sync time and status
- Add "Sync Now" button for manual sync
- Show sync errors with details
- Configure sync schedule

**UI/UX Features:**
- Settings form with masked password
- Connection status indicator
- Test connection button with feedback
- Sync history table
- Manual sync trigger button
- Error details expandable
- Schedule configuration (time picker)
- Loading states during sync

**API Integration:**
- `GET /api/admin/odoo/config/` - Get current config (masked)
- `POST /api/admin/odoo/configure/` - Save credentials
  - Body: `{ url, database, username, password }`
- `POST /api/admin/odoo/test-connection/` - Test connection
- `GET /api/admin/odoo/sync/history/` - Sync history
- `POST /api/admin/odoo/sync/trigger/` - Force sync now
- `POST /api/admin/odoo/sync/schedule/` - Update schedule
- `GET /api/admin/odoo/errors/` - List sync errors

**Dependencies:** Ticket #F5.1

**Acceptance Criteria:**
- ✓ Connection settings can be configured
- ✓ Test connection works
- ✓ Sync history displays
- ✓ Manual sync triggers successfully
- ✓ Errors display with details
- ✓ Schedule can be configured
- ✓ Status updates in real-time
- ✓ Passwords masked/encrypted
- ✓ Success/error notifications shown

---

## MILESTONE 6: Testing and Quality Assurance

### Ticket #F6.1: Unit Testing Setup and Component Tests
**Priority:** High
**Estimated Time:** 6 hours

**Description:**
Set up Jest and React Testing Library with component unit tests.

**Tasks:**
- Configure Jest with Next.js
- Set up React Testing Library
- Create test utilities and helpers
- Write tests for UI components (Button, Input, Modal, etc.)
- Test form validation
- Mock API calls
- Configure coverage reporting

**UI/UX Features:** N/A (Testing)

**API Integration:** Mocked API responses

**Dependencies:** Ticket #F1.6

**Acceptance Criteria:**
- ✓ Jest configured and running
- ✓ All base components have tests
- ✓ Form validation tested
- ✓ API calls mocked
- ✓ Test coverage > 80% for components
- ✓ Tests run in CI pipeline
- ✓ Coverage reports generated

---

### Ticket #F6.2: Integration Tests for User Flows
**Priority:** Medium
**Estimated Time:** 7 hours

**Description:**
Create integration tests for critical user workflows.

**Tasks:**
- Test customer order flow (browse → add to cart → submit)
- Test waiter verification flow
- Test admin menu management flow
- Test authentication flow
- Mock API responses
- Test WebSocket interactions
- Use MSW (Mock Service Worker)

**UI/UX Features:** N/A (Testing)

**API Integration:** All endpoints mocked with MSW

**Dependencies:** Ticket #F6.1

**Acceptance Criteria:**
- ✓ Customer flow tested end-to-end
- ✓ Waiter flow tested
- ✓ Admin flows tested
- ✓ Auth flow tested
- ✓ WebSocket mocked and tested
- ✓ All critical paths covered
- ✓ Tests stable and reliable

---

### Ticket #F6.3: E2E Testing with Playwright/Cypress
**Priority:** Medium
**Estimated Time:** 8 hours

**Description:**
Set up end-to-end testing with real browser automation.

**Tasks:**
- Set up Playwright or Cypress
- Create E2E tests for customer journey
- Create E2E tests for waiter workflow
- Create E2E tests for admin operations
- Test across browsers (Chrome, Firefox, Safari)
- Test on mobile viewports
- Configure E2E tests in CI

**UI/UX Features:** N/A (Testing)

**API Integration:** Tests against real backend (staging)

**Dependencies:** Ticket #F6.2

**Acceptance Criteria:**
- ✓ E2E framework configured
- ✓ Customer journey tested
- ✓ Waiter workflow tested
- ✓ Admin operations tested
- ✓ Tests run on multiple browsers
- ✓ Mobile viewports tested
- ✓ E2E tests in CI pipeline
- ✓ Screenshots on failure

---

### Ticket #F6.4: Accessibility Testing and Improvements
**Priority:** Medium
**Estimated Time:** 5 hours

**Description:**
Ensure application meets WCAG 2.1 AA accessibility standards.

**Tasks:**
- Run axe-core accessibility tests
- Add ARIA labels and roles
- Test keyboard navigation
- Test screen reader compatibility
- Fix color contrast issues
- Add focus indicators
- Test with accessibility tools

**UI/UX Features:**
- Proper ARIA labels
- Keyboard navigation support
- Focus indicators
- Alt text for images
- Semantic HTML

**API Integration:** None

**Dependencies:** All UI tickets

**Acceptance Criteria:**
- ✓ Zero critical accessibility violations
- ✓ Keyboard navigation works throughout
- ✓ Screen reader tested
- ✓ Color contrast meets WCAG AA
- ✓ Focus indicators visible
- ✓ Forms accessible
- ✓ axe-core tests pass

---

### Ticket #F6.5: Performance Optimization and Testing
**Priority:** High
**Estimated Time:** 6 hours

**Description:**
Optimize application performance and measure key metrics.

**Tasks:**
- Run Lighthouse performance audits
- Optimize images (lazy loading, WebP)
- Implement code splitting
- Add bundle size analysis
- Optimize rendering (React.memo, useMemo)
- Reduce bundle size
- Measure Core Web Vitals
- Add performance monitoring

**UI/UX Features:**
- Faster page loads
- Smooth animations
- Optimized images
- Skeleton loaders

**API Integration:** Performance monitoring for API calls

**Dependencies:** All feature tickets

**Acceptance Criteria:**
- ✓ Lighthouse score > 90
- ✓ First Contentful Paint < 1.5s
- ✓ Time to Interactive < 3s
- ✓ Bundle size optimized
- ✓ Images lazy-loaded
- ✓ Code split by route
- ✓ Core Web Vitals green
- ✓ Performance monitoring active

---

## MILESTONE 7: Deployment and Production

### Ticket #F7.1: Production Build Configuration
**Priority:** High
**Estimated Time:** 4 hours

**Description:**
Configure Next.js for production builds with optimization.

**Tasks:**
- Configure production environment variables
- Set up .env.production
- Configure image optimization
- Enable compression
- Configure security headers
- Set up CSP (Content Security Policy)
- Configure caching strategies

**UI/UX Features:** N/A (Build configuration)

**API Integration:** Production API URLs

**Dependencies:** All feature tickets

**Acceptance Criteria:**
- ✓ Production build succeeds
- ✓ Environment variables configured
- ✓ Images optimized
- ✓ Compression enabled
- ✓ Security headers set
- ✓ CSP configured
- ✓ Build size optimized

---

### Ticket #F7.2: Vercel/Netlify Deployment Setup
**Priority:** High
**Estimated Time:** 5 hours

**Description:**
Deploy application to Vercel or Netlify with CI/CD pipeline.

**Tasks:**
- Create deployment configuration
- Set up environment variables on platform
- Configure custom domain (if available)
- Set up SSL certificates
- Configure redirects and rewrites
- Set up preview deployments for PRs
- Configure deploy hooks

**UI/UX Features:** N/A (Deployment)

**API Integration:** Connect to production backend

**Dependencies:** Ticket #F7.1

**Acceptance Criteria:**
- ✓ Application deployed successfully
- ✓ Environment variables set
- ✓ Custom domain configured (if applicable)
- ✓ SSL working (HTTPS)
- ✓ Preview deployments work
- ✓ Auto-deploy on main branch
- ✓ Rollback capability available

---

### Ticket #F7.3: Error Tracking and Monitoring Setup
**Priority:** High
**Estimated Time:** 4 hours

**Description:**
Implement error tracking with Sentry or similar service.

**Tasks:**
- Set up Sentry or LogRocket
- Configure error boundaries
- Track API errors
- Track WebSocket errors
- Set up performance monitoring
- Configure user feedback widget
- Set up alert notifications

**UI/UX Features:**
- Error boundaries with user-friendly messages
- User feedback widget for reporting issues

**API Integration:** Error tracking for API failures

**Dependencies:** Ticket #F7.2

**Acceptance Criteria:**
- ✓ Error tracking configured
- ✓ Errors logged to service
- ✓ Source maps uploaded
- ✓ Performance tracked
- ✓ Alerts configured
- ✓ User feedback widget works
- ✓ Error boundaries display fallback UI

---

### Ticket #F7.4: Analytics and User Behavior Tracking
**Priority:** Low
**Estimated Time:** 3 hours

**Description:**
Implement analytics to track user behavior and application usage.

**Tasks:**
- Set up Google Analytics or similar
- Track page views
- Track button clicks and interactions
- Track order completions
- Create custom events
- Set up conversion funnels
- Configure privacy-compliant tracking

**UI/UX Features:**
- Cookie consent banner (GDPR compliance)

**API Integration:** Analytics for API success/failure rates

**Dependencies:** Ticket #F7.2

**Acceptance Criteria:**
- ✓ Analytics tracking configured
- ✓ Page views tracked
- ✓ Custom events tracked
- ✓ Conversion funnels set up
- ✓ Privacy compliant
- ✓ Cookie consent implemented
- ✓ Analytics dashboard accessible

---

### Ticket #F7.5: Documentation and Deployment Guide
**Priority:** Medium
**Estimated Time:** 4 hours

**Description:**
Create comprehensive documentation for development and deployment.

**Tasks:**
- Write README.md with setup instructions
- Document environment variables
- Create deployment guide
- Document component architecture
- Write API integration guide
- Create troubleshooting guide
- Document testing procedures

**UI/UX Features:** N/A (Documentation)

**API Integration:** Document all API endpoints used

**Dependencies:** All tickets

**Acceptance Criteria:**
- ✓ README comprehensive
- ✓ Setup instructions clear
- ✓ Environment variables documented
- ✓ Deployment guide complete
- ✓ Architecture documented
- ✓ Troubleshooting guide helpful
- ✓ Testing procedures documented

---

## MILESTONE 8: Additional Features and Polish

### Ticket #F8.1: Dark Mode Support
**Priority:** Low
**Estimated Time:** 5 hours

**Description:**
Implement dark mode theme with toggle functionality.

**Tasks:**
- Create dark theme color palette
- Implement theme context
- Add theme toggle button
- Update all components for dark mode
- Persist theme preference
- Add system preference detection

**UI/UX Features:**
- Dark/light theme toggle
- Smooth theme transition
- Theme persists across sessions

**API Integration:** None

**Dependencies:** Ticket #F1.6

**Acceptance Criteria:**
- ✓ Dark mode works throughout app
- ✓ Toggle switches themes
- ✓ Theme preference persists
- ✓ System preference detected
- ✓ All components support both themes
- ✓ Smooth transitions
- ✓ Accessible in both modes

---

### Ticket #F8.2: Multi-language Support (i18n)
**Priority:** Low
**Estimated Time:** 8 hours

**Description:**
Implement internationalization for multiple languages.

**Tasks:**
- Set up next-i18next or similar
- Create language files (EN, FR, AR, etc.)
- Translate all UI text
- Add language selector
- Format dates/numbers by locale
- Handle RTL for Arabic
- Persist language preference

**UI/UX Features:**
- Language selector dropdown
- All text translatable
- RTL support for Arabic
- Locale-specific formatting

**API Integration:** None (frontend only, or backend returns localized strings)

**Dependencies:** All UI tickets

**Acceptance Criteria:**
- ✓ Multiple languages supported
- ✓ Language switcher works
- ✓ All text translated
- ✓ RTL works for Arabic
- ✓ Dates/numbers formatted correctly
- ✓ Language preference persists
- ✓ No hardcoded text remains

---

### Ticket #F8.3: Offline Mode and PWA Features
**Priority:** Low
**Estimated Time:** 6 hours

**Description:**
Implement Progressive Web App features with offline capability.

**Tasks:**
- Configure service worker
- Create offline fallback page
- Implement caching strategies
- Add manifest.json
- Enable "Add to Home Screen"
- Cache menu data for offline viewing
- Queue orders when offline (sync when online)

**UI/UX Features:**
- Offline indicator
- Cached menu browsing offline
- "Add to Home Screen" prompt
- App-like experience

**API Integration:**
- Background sync for orders
- Cache API responses

**Dependencies:** Ticket #F7.1

**Acceptance Criteria:**
- ✓ Service worker registered
- ✓ Offline page works
- ✓ Menu cached for offline viewing
- ✓ Orders queued when offline
- ✓ Manifest configured
- ✓ "Add to Home Screen" works
- ✓ Lighthouse PWA score > 90

---

### Ticket #F8.4: Advanced Filtering and Search
**Priority:** Low
**Estimated Time:** 5 hours

**Description:**
Enhance menu browsing with advanced filters and search.

**Tasks:**
- Add price range slider filter
- Implement multi-select dietary filters
- Add preparation time filter
- Create advanced search (ingredients, allergens)
- Add sort options (price, popularity, name)
- Persist filter state in URL
- Add "Clear Filters" button

**UI/UX Features:**
- Filter sidebar/drawer
- Price range slider
- Multi-select checkboxes
- Search with autocomplete
- Sort dropdown
- Active filter chips
- URL reflects filters

**API Integration:**
- `GET /api/menu/items/?price_min=<>&price_max=<>&is_vegetarian=true&sort=price`

**Dependencies:** Ticket #F2.2

**Acceptance Criteria:**
- ✓ All filters work correctly
- ✓ Filters combine properly (AND logic)
- ✓ Sort options work
- ✓ Filters persist in URL
- ✓ Clear filters works
- ✓ UI responsive on mobile
- ✓ Search autocompletes

---

### Ticket #F8.5: Customer Feedback and Rating System
**Priority:** Low
**Estimated Time:** 6 hours

**Description:**
Allow customers to rate dishes and provide feedback.

**Tasks:**
- Create rating component (stars)
- Add feedback form after order served
- Display average ratings on menu items
- Create review submission
- Add photo upload to reviews (optional)
- Display recent reviews
- Admin moderation interface

**UI/UX Features:**
- Star rating component
- Feedback text area
- Review cards with ratings
- Photo upload for reviews
- Average rating display

**API Integration:**
- `POST /api/menu/items/{id}/reviews/` - Submit review
  - Body: `{ rating, comment, photos }`
- `GET /api/menu/items/{id}/reviews/` - Get reviews
- `GET /api/menu/items/{id}/` - Item with average rating

**Dependencies:** Ticket #F2.3

**Acceptance Criteria:**
- ✓ Customers can rate dishes
- ✓ Reviews submitted successfully
- ✓ Average ratings calculated
- ✓ Ratings display on menu items
- ✓ Reviews moderated by admin
- ✓ Photos can be uploaded
- ✓ Recent reviews visible

---

## Summary

**Total Estimated Time:** ~280 hours (approximately 35-40 working days for one frontend developer)

**Milestone Breakdown:**
1. **Project Setup:** ~30 hours (6 tickets)
2. **Customer Interface:** ~44 hours (7 tickets)
3. **Real-Time Communication:** ~16 hours (3 tickets)
4. **Waiter Dashboard:** ~30 hours (5 tickets)
5. **Admin Panel:** ~55 hours (7 tickets)
6. **Testing & QA:** ~32 hours (5 tickets)
7. **Deployment:** ~20 hours (5 tickets)
8. **Additional Features:** ~30 hours (5 tickets)

**Total Tickets:** 43 detailed frontend tickets

**Critical Path:**
- Milestones 1 → 2 → 4 → 5 are essential
- Milestone 3 (WebSocket) required for real-time features
- Milestones 6-8 can be done in parallel or iteratively

**Recommended Team:**
- 2 frontend developers can complete core features (Milestones 1-5) in 6-8 weeks
- Add 2-3 weeks for testing, deployment, and polish (Milestones 6-7)
- Additional features (Milestone 8) optional based on timeline

**Technology Decisions:**
- **State Management:** React Context for simple state, consider Redux if complexity grows
- **Styling:** TailwindCSS recommended for rapid development
- **Charts:** Recharts or Chart.js for analytics
- **Testing:** Jest + React Testing Library + Playwright
- **Deployment:** Vercel (recommended for Next.js) or Netlify

**Integration Points with Backend:**
All tickets include specific API endpoints that map to the backend development backlog, ensuring seamless integration between frontend and backend teams.

**Notes:**
- Tablet-first design approach recommended (most usage on tablets)
- Mobile responsive as secondary priority
- WebSocket reconnection logic critical for reliability
- Image optimization important for menu browsing performance
- Ensure proper error handling for offline scenarios
