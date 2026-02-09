"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { orderService } from "@/services/order.service";
import OrderCard from "@/components/kitchen/OrderCard";
import { toast } from "sonner";

interface OrderItem {
  name: string;
  quantity: number;
  special_instructions?: string;
}

interface KitchenOrder {
  id: number;
  order_number: string;
  status: string;
  table_number: string;
  items: OrderItem[];
  items_count: number;
  customer_notes: string;
  total_amount: string;
  created_at: string;
}

const COLUMNS = [
  { key: 'PENDING', label: 'Pending', color: 'bg-yellow-500' },
  { key: 'CONFIRMED', label: 'Confirmed', color: 'bg-blue-500' },
  { key: 'PREPARING', label: 'Preparing', color: 'bg-orange-500' },
  { key: 'READY', label: 'Ready', color: 'bg-green-500' },
];

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch all active orders
  const fetchOrders = useCallback(async () => {
    try {
      const response = await orderService.getOrders({});
      const activeOrders = (response.results || response).filter(
        (o: any) => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status)
      );
      setOrders(activeOrders.map(mapOrder));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // WebSocket for real-time updates
  const handleWsMessage = useCallback((msg: any) => {
    if (msg.type === 'order_created') {
      setOrders(prev => {
        const exists = prev.find(o => o.order_number === msg.order.order_number);
        if (exists) return prev;
        return [mapWsOrder(msg.order), ...prev];
      });
      toast.success(`New order: ${msg.order.order_number} (Table ${msg.order.table_number})`);
      // Play notification sound
      try {
        audioRef.current?.play();
      } catch {}
    } else if (msg.type === 'order_status_changed') {
      setOrders(prev =>
        prev.map(o =>
          o.order_number === msg.order.order_number
            ? { ...o, status: msg.new_status }
            : o
        ).filter(o => !['SERVED', 'CANCELLED'].includes(o.status))
      );
    } else if (msg.type === 'order_cancelled') {
      setOrders(prev => prev.filter(o => o.order_number !== msg.order.order_number));
      toast.info(`Order ${msg.order.order_number} cancelled`);
    }
  }, []);

  const { isConnected } = useWebSocket('/ws/orders/kitchen/', {
    onMessage: handleWsMessage,
    onConnect: () => toast.success('Connected to kitchen feed'),
    onDisconnect: () => toast.error('Disconnected from kitchen feed'),
  });

  const handleAdvance = async (orderId: number, newStatus: string) => {
    setUpdatingIds(prev => new Set(prev).add(orderId));
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId ? { ...o, status: newStatus } : o
        ).filter(o => !['SERVED', 'CANCELLED'].includes(o.status))
      );
      toast.success(`Order updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4A3428] border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Loading kitchen display...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#3B2316] text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Kitchen Display</h1>
        <div className="flex items-center gap-4">
          <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm">{isConnected ? 'Live' : 'Disconnected'}</span>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-[#5C3D2E] rounded-lg text-sm hover:bg-[#4A3428] transition-colors"
            aria-label="Refresh orders"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="p-4 grid grid-cols-4 gap-4 h-[calc(100vh-72px)]">
        {COLUMNS.map(col => {
          const colOrders = orders.filter(o => o.status === col.key);
          return (
            <div key={col.key} className="flex flex-col">
              <div className={`${col.color} text-white px-4 py-2 rounded-t-lg flex justify-between items-center`}>
                <h2 className="font-bold">{col.label}</h2>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                  {colOrders.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto bg-gray-50 rounded-b-lg p-3 space-y-3">
                {colOrders.length === 0 ? (
                  <p className="text-gray-400 text-center text-sm py-8">No orders</p>
                ) : (
                  colOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAdvance={handleAdvance}
                      isUpdating={updatingIds.has(order.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notification sound */}
      <audio ref={audioRef} preload="none">
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
}

function mapOrder(o: any): KitchenOrder {
  return {
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    table_number: o.table_number || o.table?.number || '?',
    items: (o.items || []).map((i: any) => ({
      name: i.item_name || i.name,
      quantity: i.quantity,
      special_instructions: i.special_instructions,
    })),
    items_count: o.items_count || o.items?.length || 0,
    customer_notes: o.customer_notes || '',
    total_amount: String(o.total_amount || 0),
    created_at: o.created_at,
  };
}

function mapWsOrder(o: any): KitchenOrder {
  return {
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    table_number: o.table_number || '?',
    items: o.items || [],
    items_count: o.items_count || o.items?.length || 0,
    customer_notes: o.customer_notes || '',
    total_amount: String(o.total_amount || 0),
    created_at: o.created_at,
  };
}
