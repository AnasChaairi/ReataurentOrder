// Order related type definitions

export interface CreateOrderItemAddon {
  addon: number; // addon ID
}

export interface CreateOrderItem {
  menu_item: number;
  variant?: number;
  addons: CreateOrderItemAddon[];
  quantity: number;
  special_instructions?: string;
}

export interface CreateOrderData {
  table: number;
  items: CreateOrderItem[];
  customer_notes?: string;
}

export interface OrderItem {
  id: number;
  menu_item: number;
  item_name: string;
  variant?: number;
  base_price: number;
  variant_price: number;
  addons_price: number;
  unit_price: number;
  quantity: number;
  total_price: number;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  table: number;
  customer?: number;
  waiter?: number;
  order_number: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  subtotal: number;
  tax: number;
  discount: number;
  total_amount: number;
  customer_notes?: string;
  waiter_notes?: string;
  kitchen_notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  preparing_at?: string;
  ready_at?: string;
  served_at?: string;
  cancelled_at?: string;
}
