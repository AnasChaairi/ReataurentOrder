import api from '@/lib/api';
import { CreateOrderData, Order } from '@/types/order.types';
import { Cart } from '@/types/cart.types';

class OrderService {
  /**
   * Create an order from cart
   */
  async createOrder(cart: Cart, tableNumber: number, customerNotes?: string): Promise<Order> {
    const orderData: CreateOrderData = {
      table: tableNumber,
      items: cart.items.map((cartItem) => ({
        menu_item: cartItem.menuItem.id,
        variant: cartItem.variant?.id,
        addons: cartItem.addons.map((addon) => addon.addon.id),
        quantity: cartItem.quantity,
        special_instructions: cartItem.special_instructions,
      })),
      customer_notes: customerNotes,
    };

    const response = await api.post<Order>('/api/orders/', orderData);
    return response.data;
  }

  /**
   * Get orders with optional filters
   */
  async getOrders(params: Record<string, any> = {}): Promise<any> {
    const response = await api.get('/api/orders/', { params });
    return response.data;
  }

  /**
   * Get user's orders
   */
  async getMyOrders(): Promise<Order[]> {
    const response = await api.get<Order[]>('/api/orders/');
    return response.data;
  }

  /**
   * Get specific order by ID
   */
  async getOrder(orderId: number): Promise<Order> {
    const response = await api.get<Order>(`/api/orders/${orderId}/`);
    return response.data;
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const response = await api.get<Order>(`/api/orders/by-number/${orderNumber}/`);
    return response.data;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: number): Promise<Order> {
    const response = await api.post<Order>(`/api/orders/${orderId}/cancel/`);
    return response.data;
  }

  /**
   * Verify/confirm order (Waiter action)
   */
  async verifyOrder(orderId: number): Promise<Order> {
    const response = await api.post<Order>(`/api/orders/${orderId}/verify/`);
    return response.data;
  }

  /**
   * Reject order (Waiter action)
   */
  async rejectOrder(orderId: number, reason?: string): Promise<Order> {
    const response = await api.post<Order>(`/api/orders/${orderId}/reject/`, {
      rejection_reason: reason
    });
    return response.data;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    const response = await api.patch<Order>(`/api/orders/${orderId}/update_status/`, {
      status
    });
    return response.data;
  }

  /**
   * Modify a pending order
   */
  async modifyOrder(orderId: number, data: Partial<CreateOrderData>): Promise<Order> {
    const response = await api.put<Order>(`/api/orders/${orderId}/modify/`, data);
    return response.data;
  }

  /**
   * Get pending orders (for staff)
   */
  async getPendingOrders(): Promise<Order[]> {
    const response = await api.get<Order[]>('/api/orders/pending/');
    return response.data;
  }

  /**
   * Get order timeline/history
   */
  async getOrderTimeline(orderId: number): Promise<any[]> {
    const response = await api.get<any[]>(`/api/orders/${orderId}/timeline/`);
    return response.data;
  }

  /**
   * Get order statistics (Admin)
   */
  async getOrderStatistics(params?: {
    start_date?: string;
    end_date?: string;
    waiter_id?: number;
  }): Promise<any> {
    const response = await api.get('/api/orders/statistics/', { params });
    return response.data;
  }
}

export const orderService = new OrderService();
