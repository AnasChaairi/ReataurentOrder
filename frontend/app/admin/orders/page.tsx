"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { orderService } from "@/services/order.service";
import { Order } from "@/types/order.types";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PREPARING", label: "Preparing" },
  { value: "READY", label: "Ready" },
  { value: "SERVED", label: "Served" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-green-100 text-green-800",
  SERVED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const NEXT_STATUS: Record<string, string[]> = {
  CONFIRMED: ["PREPARING"],
  PREPARING: ["READY"],
  READY: ["SERVED"],
};

export default function OrdersManagement() {
  const { isLoading: authLoading } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters & pagination
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Stats
  const [stats, setStats] = useState<any>(null);

  // Expanded order
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, page_size: pageSize };
      if (statusFilter) params.status = statusFilter;
      const data = await orderService.getOrders(params);
      if (data.results) {
        setOrders(data.results);
        setTotalCount(data.count ?? data.results.length);
      } else if (Array.isArray(data)) {
        setOrders(data);
        setTotalCount(data.length);
      }
    } catch {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await orderService.getOrderStatistics();
      setStats(data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchOrders();
      fetchStats();
    }
  }, [authLoading, fetchOrders, fetchStats]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleVerify = async (orderId: number) => {
    try {
      await orderService.verifyOrder(orderId);
      setSuccess("Order verified");
      fetchOrders();
      fetchStats();
    } catch {
      setError("Failed to verify order");
    }
  };

  const handleReject = async (orderId: number) => {
    const reason = prompt("Rejection reason (optional):");
    try {
      await orderService.rejectOrder(orderId, reason || undefined);
      setSuccess("Order rejected");
      fetchOrders();
      fetchStats();
    } catch {
      setError("Failed to reject order");
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setSuccess(`Order updated to ${newStatus}`);
      fetchOrders();
      fetchStats();
    } catch {
      setError("Failed to update order status");
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#4A3428] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage customer orders
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 font-bold">x</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-2 font-bold">x</button>
        </div>
      )}

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 uppercase">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_orders ?? 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 uppercase">Today</p>
            <p className="text-2xl font-bold text-gray-900">{stats.today_orders ?? 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 uppercase">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending_orders ?? 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 uppercase">Revenue</p>
            <p className="text-2xl font-bold text-green-700">
              {stats.total_revenue != null
                ? `${Number(stats.total_revenue).toFixed(2)} dh`
                : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A3428] focus:outline-none text-sm"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {totalCount} order{totalCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-[#4A3428] border-t-transparent"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p className="text-lg mb-2">No orders found</p>
            <p className="text-sm">
              {statusFilter
                ? "Try changing the status filter."
                : "Orders will appear here once customers place them."}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr
                    className={`cursor-pointer hover:bg-gray-50 ${expandedId === order.id ? "bg-gray-50" : ""}`}
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.table_number ?? order.table ?? "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.items?.length ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {Number(order.total_amount).toFixed(2)} dh
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2" onClick={(e) => e.stopPropagation()}>
                      {order.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleVerify(order.id)}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleReject(order.id)}
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {NEXT_STATUS[order.status]?.map((ns) => (
                        <button
                          key={ns}
                          onClick={() => handleUpdateStatus(order.id, ns)}
                          className="px-2 py-1 bg-[#4A3428] text-white text-xs rounded hover:bg-[#3d2b20] transition-colors"
                        >
                          {ns}
                        </button>
                      ))}
                    </td>
                  </tr>

                  {/* Expanded order items */}
                  {expandedId === order.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-800 text-sm">Order Items</h4>
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr>
                                <th className="px-3 py-1 text-left text-xs text-gray-500">Item</th>
                                <th className="px-3 py-1 text-left text-xs text-gray-500">Qty</th>
                                <th className="px-3 py-1 text-left text-xs text-gray-500">Unit Price</th>
                                <th className="px-3 py-1 text-left text-xs text-gray-500">Total</th>
                                <th className="px-3 py-1 text-left text-xs text-gray-500">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {order.items?.map((item) => (
                                <tr key={item.id}>
                                  <td className="px-3 py-2 text-gray-900">{item.item_name}</td>
                                  <td className="px-3 py-2 text-gray-600">{item.quantity}</td>
                                  <td className="px-3 py-2 text-gray-600">{Number(item.unit_price).toFixed(2)} dh</td>
                                  <td className="px-3 py-2 text-gray-900 font-medium">{Number(item.total_price).toFixed(2)} dh</td>
                                  <td className="px-3 py-2 text-gray-500 text-xs">{item.special_instructions || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="flex gap-6 text-sm text-gray-600 pt-2 border-t">
                            <span>Subtotal: {Number(order.subtotal).toFixed(2)} dh</span>
                            <span>Tax: {Number(order.tax).toFixed(2)} dh</span>
                            {Number(order.discount) > 0 && (
                              <span>Discount: -{Number(order.discount).toFixed(2)} dh</span>
                            )}
                            <span className="font-semibold text-gray-900">
                              Total: {Number(order.total_amount).toFixed(2)} dh
                            </span>
                          </div>
                          {order.customer_notes && (
                            <p className="text-xs text-gray-500">
                              Customer notes: {order.customer_notes}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
