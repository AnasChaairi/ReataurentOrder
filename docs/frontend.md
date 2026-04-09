# Frontend Documentation

## 1. Overview

The frontend is a **Next.js 16** TypeScript application providing role-differentiated interfaces for a restaurant ordering platform. It serves four distinct user experiences from a single codebase.

**Core responsibilities:**
- Tablet ordering flow for customers (table selection → menu → checkout)
- Kitchen Display System (KDS) for kitchen staff
- Waiter management dashboard
- Admin analytics panel
- Real-time order status updates via WebSocket

---

## 2. Architecture

**Framework:** Next.js 16 (App Router)  
**Language:** TypeScript 5 (strict mode)

| Concern | Solution |
|---|---|
| Global state | Zustand stores |
| Shared context | React Context API |
| Forms | React Hook Form + Zod |
| HTTP | Axios (single instance, httpOnly cookies) |
| Real-time | Native WebSocket via `useWebSocket` hook |
| UI primitives | Radix UI + Tailwind CSS |
| Animations | Framer Motion |
| Notifications | Sonner (toast) |

**Build pipeline:** Tailwind CSS + PostCSS → Next.js bundler → Docker (Nginx reverse proxy in production)

---

## 3. Core Components

### Pages (`app/`)

| Route | Audience | Purpose |
|---|---|---|
| `/` | All | Landing / home |
| `/select-table` | Customer (tablet) | Table selection before ordering |
| `/menu` | Customer | Browse menu, add to cart |
| `/checkout` | Customer | Review cart, place order |
| `/orders` | Customer | Live order status tracking |
| `/kitchen` | Kitchen staff | Kitchen Display System |
| `/waiter` | Waiters | Table and order management |
| `/admin` | Admin | Analytics and reporting |
| `/settings` | Auth users | Profile settings |
| `/auth/*` | All | Login / register |

### State: Zustand Stores

- **`useCart`** — cart items, quantities, total price
- **`useAdmin`** — admin dashboard filters and selected report
- **`useIdleTimer`** — inactivity detection, triggers auto-logout on tablets
- **`useWebSocket`** — WebSocket connection state and message dispatch

### State: React Contexts

- **`AuthContext`** — current user, auth status, role
- **`CartContext`** — cart operations exposed to component tree
- **`OrderContext`** — active orders, polling/WebSocket sync
- **`TableContext`** — currently selected table
- **`TabletContext`** — tablet session lifecycle

> Contexts wrap the full app in `app/layout.tsx` in this order: Auth → Table → Order → Cart → Tablet

### Reusable Components (`components/`)

| Directory | Examples |
|---|---|
| `ui/` | Button, Input, Dialog, Tabs, Skeleton, Toast |
| `tablet/` | TabletMenuGrid, TabletCart, TabletFloatingCart, TabletHeader |
| `kitchen/` | OrderCard, KitchenDisplay |
| `waiter/` | Waiter assignment UI |
| `admin/` | AdminSidebar, ReportCards |
| `cart/` | CartSidebar, CartItem, CartSummary |
| `layout/` | Header, Footer |

---

## 4. User Flows

### Customer ordering (tablet)
1. Tablet loads `/select-table` → user picks a table → `TableContext` stores selection
2. Redirected to `/menu` → `menu.service.ts` fetches categories + items
3. User adds items (with variants/add-ons) → `useCart` updates in real-time
4. User taps checkout → `/checkout` renders cart summary
5. Confirm → `order.service.ts` POSTs to `/api/orders/`
6. Redirect to `/orders` → WebSocket receives status updates from backend

### Kitchen staff (KDS)
1. Staff opens `/kitchen` → `useWebSocket` subscribes to `kitchen` group
2. Incoming order WebSocket message → new `OrderCard` appears
3. Staff changes status → PATCH to `/api/orders/{id}/` → triggers `notify_order_status_change`
4. Customer's `/orders` page updates in real-time

### Admin analytics
1. Admin opens `/admin` → `useAdmin` store initialized
2. `admin.service.ts` (or analytics service) fetches aggregated data
3. `AdminSidebar` handles report selection
4. `ReportCards` render revenue, popular items, table stats

---

## 5. API Integration

### Axios instance (`lib/api.ts`)

```ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,   // sends httpOnly JWT cookies automatically
});
```

**Response interceptor:**
- On `401` → queues request, attempts token refresh via `/api/auth/token/refresh/`
- On refresh success → replays queued requests
- On refresh failure → clears auth state, redirects to login
- `silent: true` flag on a request → suppresses error toasts (for optional calls)

### Service layer (`services/`)

Each service maps directly to a backend resource:

```ts
// order.service.ts
export const createOrder = (data: OrderCreatePayload) =>
  api.post<Order>("/api/orders/", data);

export const getOrders = () =>
  api.get<PaginatedResponse<Order>>("/api/orders/");
```

Services are called from pages and hooks — components never call `api` directly.

### WebSocket (`hooks/useWebSocket.ts`)

```ts
const { subscribe, unsubscribe } = useWebSocket();

// In a component
useEffect(() => {
  subscribe("kitchen", (message) => {
    if (message.type === "order.created") addOrder(message.order);
  });
  return () => unsubscribe("kitchen");
}, []);
```

WebSocket URL: `NEXT_PUBLIC_WS_URL` env var (e.g. `ws://localhost:8001`)

---

## 6. Minimal Code Examples

### Cart store (Zustand)
```ts
const useCart = create<CartState>((set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  clearCart: () => set({ items: [] }),
}));
```

### Form with Zod validation
```ts
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { register, handleSubmit } = useForm({ resolver: zodResolver(schema) });
```

### Protected route pattern
```tsx
// In a page component
const { user } = useAuth();
if (!user || user.role !== "KITCHEN") return <Redirect to="/auth/login" />;
```

### Idle timer for tablet auto-reset
```ts
useIdleTimer({
  timeout: 5 * 60 * 1000,  // 5 minutes
  onIdle: () => {
    clearCart();
    router.push("/select-table");
  },
});
```

---

## 7. Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000   # Backend HTTP base URL
NEXT_PUBLIC_WS_URL=ws://localhost:8001      # Backend WebSocket URL
```

---

## 8. Testing

- **Framework:** Vitest + React Testing Library
- **Run:** `npm run test`
- **Type check:** `npm run type-check` (tsc --noEmit)
- **Lint:** `npm run lint` (ESLint)
