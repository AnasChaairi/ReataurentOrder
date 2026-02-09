"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { orderService } from "@/services/order.service";
import TableOverview from "@/components/waiter/TableOverview";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OrderSummary {
  id: number;
  order_number: string;
  status: string;
  table_number: string;
  total_amount: string;
  items_count: number;
  created_at: string;
  customer_notes: string;
}

export default function WaiterPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [pendingOrders, setPendingOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Redirect if not waiter
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user || !['WAITER', 'ADMIN'].includes(user.role))) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchPendingOrders = useCallback(async () => {
    try {
      const data = await orderService.getPendingOrders();
      setPendingOrders((data || []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        table_number: o.table_number || '?',
        total_amount: String(o.total_amount || 0),
        items_count: o.items_count || o.items?.length || 0,
        created_at: o.created_at,
        customer_notes: o.customer_notes || '',
      })));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast.error('Failed to load pending orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchPendingOrders();
  }, [user, fetchPendingOrders]);

  // WebSocket for real-time updates
  const handleWsMessage = useCallback((msg: any) => {
    if (msg.type === 'order_created') {
      fetchPendingOrders();
      toast.info(`New order: ${msg.order.order_number} (Table ${msg.order.table_number})`);
    } else if (msg.type === 'order_status_changed') {
      fetchPendingOrders();
    } else if (msg.type === 'order_cancelled') {
      fetchPendingOrders();
    }
  }, [fetchPendingOrders]);

  const wsPath = user ? `/ws/orders/waiter/${user.id}/` : '';
  const { isConnected } = useWebSocket(wsPath, {
    onMessage: handleWsMessage,
  });

  const handleApprove = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      await orderService.verifyOrder(orderId);
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success('Order confirmed');
    } catch (err) {
      console.error('Failed to verify:', err);
      toast.error('Failed to confirm order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId: number) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    setActionLoading(orderId);
    try {
      await orderService.rejectOrder(orderId, reason);
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success('Order rejected');
    } catch (err) {
      console.error('Failed to reject:', err);
      toast.error('Failed to reject order');
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4A3428] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#3B2316] text-white px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Waiter Dashboard</h1>
          <p className="text-sm text-gray-300">
            Welcome, {user?.first_name || 'Waiter'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <button
            onClick={fetchPendingOrders}
            className="px-4 py-2 bg-[#5C3D2E] rounded-lg text-sm hover:bg-[#4A3428] transition-colors"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Pending Orders */}
        <h2 className="text-xl font-bold text-[#3B2316] mb-4">
          Pending Orders ({pendingOrders.length})
        </h2>

        {pendingOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-gray-500 text-lg">No pending orders</p>
            <p className="text-gray-400 text-sm mt-2">New orders will appear here in real-time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-md p-5 flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-[#3B2316]">{order.order_number}</h3>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Table {order.table_number} &middot; {order.items_count} items &middot; {order.total_amount} DH
                  </p>
                  {order.customer_notes && (
                    <p className="text-sm text-orange-600 mt-1 italic">Note: {order.customer_notes}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleApprove(order.id)}
                    disabled={actionLoading === order.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50 min-h-[44px]"
                    aria-label={`Approve order ${order.order_number}`}
                  >
                    {actionLoading === order.id ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(order.id)}
                    disabled={actionLoading === order.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 min-h-[44px]"
                    aria-label={`Reject order ${order.order_number}`}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
