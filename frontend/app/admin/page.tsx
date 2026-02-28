"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, UtensilsCrossed, Users, DollarSign, Clock, CheckCircle, ChefHat, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { useAdmin } from "@/hooks/useAdmin";

interface OrderStats {
  total_orders: number;
  today_orders: number;
  pending_count: number;
  preparing_count: number;
  ready_count: number;
  today_revenue: number;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  by_role: {
    admin: number;
    waiter: number;
    customer: number;
    restaurant_owner?: number;
  };
}

interface RecentOrder {
  id: number;
  order_number: string;
  table_number: string;
  status: string;
  status_display: string;
  total_amount: string;
  items_count: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-orange-100 text-orange-700",
  READY: "bg-green-100 text-green-700",
  SERVED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminDashboard() {
  const { isAdmin } = useAdmin();
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [menuCount, setMenuCount] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const requests: Promise<any>[] = [
        api.get<OrderStats>("/api/orders/statistics/"),
        api.get<{ count: number }>("/api/menu/items/?page_size=1"),
        api.get<{ results: RecentOrder[] }>("/api/orders/?ordering=-created_at&page_size=5"),
      ];
      // User statistics endpoint is admin-only — skip for waiters/owners
      if (isAdmin) {
        requests.push(api.get<UserStats>("/api/auth/admin/users/statistics/"));
      }

      const results = await Promise.allSettled(requests);

      if (results[0].status === "fulfilled") setOrderStats(results[0].value.data);
      if (results[1].status === "fulfilled") setMenuCount(results[1].value.data.count);
      if (results[2].status === "fulfilled") setRecentOrders(results[2].value.data.results ?? []);
      if (isAdmin && results[3]?.status === "fulfilled") setUserStats(results[3].value.data);
    } finally {
      setIsLoading(false);
      setLastRefreshed(new Date());
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const stats = [
    {
      label: "Total Orders",
      value: orderStats ? orderStats.total_orders.toLocaleString() : "—",
      sub: orderStats ? `${orderStats.today_orders} today` : undefined,
      icon: ShoppingBag,
      color: "bg-blue-500",
      light: "bg-blue-50 text-blue-600",
    },
    {
      label: "Menu Items",
      value: menuCount !== null ? menuCount.toLocaleString() : "—",
      icon: UtensilsCrossed,
      color: "bg-green-500",
      light: "bg-green-50 text-green-600",
    },
    {
      label: "Active Users",
      value: userStats ? userStats.active.toLocaleString() : "—",
      sub: userStats ? `${userStats.total} total` : undefined,
      icon: Users,
      color: "bg-purple-500",
      light: "bg-purple-50 text-purple-600",
    },
    {
      label: "Today's Revenue",
      value: orderStats ? `$${Number(orderStats.today_revenue).toFixed(2)}` : "—",
      icon: DollarSign,
      color: "bg-yellow-500",
      light: "bg-yellow-50 text-yellow-600",
    },
  ];

  const quickActions = [
    { label: "Add Menu Item", href: "/admin/menu-items", icon: UtensilsCrossed },
    { label: "View Orders", href: "/admin/orders", icon: ShoppingBag },
    { label: "Manage Users", href: "/admin/users", icon: Users },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                <div className={`${stat.light} w-10 h-10 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className={`text-3xl font-bold text-gray-900 ${isLoading ? "animate-pulse" : ""}`}>
                {stat.value}
              </p>
              {stat.sub && (
                <p className="text-gray-400 text-xs mt-1">{stat.sub}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Order Status Row */}
      {orderStats && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Order Status</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-700">{orderStats.pending_count}</p>
                <p className="text-xs text-yellow-600">Pending</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <ChefHat className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-700">{orderStats.preparing_count}</p>
                <p className="text-xs text-orange-600">Preparing</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">{orderStats.ready_count}</p>
                <p className="text-xs text-green-600">Ready</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-[#4A3428] hover:underline font-medium">
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-[#4A3428]/10 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-4 h-4 text-[#4A3428]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {order.order_number} — Table {order.table_number}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {order.items_count} item{order.items_count !== 1 ? "s" : ""} · {timeAgo(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {order.status_display}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            <Link href="/admin/users" className="text-sm text-[#4A3428] hover:underline font-medium">
              Manage →
            </Link>
          </div>

          {isLoading || !userStats ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Total", value: userStats.total, color: "bg-gray-100 text-gray-700" },
                { label: "Active", value: userStats.active, color: "bg-green-100 text-green-700" },
                { label: "Inactive", value: userStats.inactive, color: "bg-red-100 text-red-700" },
                { label: "Admins", value: userStats.by_role.admin ?? 0, color: "bg-purple-100 text-purple-700" },
                { label: "Waiters", value: userStats.by_role.waiter ?? 0, color: "bg-blue-100 text-blue-700" },
                { label: "Customers", value: userStats.by_role.customer ?? 0, color: "bg-yellow-100 text-yellow-700" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{row.label}</span>
                  <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${row.color}`}>
                    {row.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="bg-[#4A3428] text-white p-4 rounded-lg hover:bg-[#3D2117] transition-colors flex items-center gap-3"
              >
                <Icon className="w-5 h-5 opacity-80" />
                <span className="font-medium">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
