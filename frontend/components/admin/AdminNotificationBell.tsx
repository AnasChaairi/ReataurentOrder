"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Tablet, MapPin, Hash, X } from "lucide-react";
import { toast } from "sonner";
import { useWebSocket } from "@/hooks/useWebSocket";

interface OrderNotification {
  id: number;
  order_number: string;
  table_number: string;
  device_id: string | null;
  device_name: string | null;
  total_amount: string;
  items_count: number;
  created_at: string;
  read: boolean;
}

const STORAGE_KEY = "admin:order-notifications";
const MAX_ITEMS = 25;

function loadStored(): OrderNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

function persist(items: OrderNotification[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_ITEMS)),
    );
  } catch {}
}

function formatRelative(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const diff = Math.max(0, Date.now() - ts);
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleString();
}

export function AdminNotificationBell() {
  const [items, setItems] = useState<OrderNotification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    setItems(loadStored());
  }, []);

  // Persist any change
  useEffect(() => {
    persist(items);
  }, [items]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMessage = useCallback((msg: any) => {
    if (msg.type !== "order_created" || !msg.order) return;
    const o = msg.order;
    const entry: OrderNotification = {
      id: o.id,
      order_number: o.order_number,
      table_number: o.table_number,
      device_id: o.device_id ?? null,
      device_name: o.device_name ?? null,
      total_amount: o.total_amount,
      items_count: o.items_count ?? 0,
      created_at: o.created_at ?? new Date().toISOString(),
      read: false,
    };

    setItems((prev) => {
      if (prev.some((n) => n.id === entry.id)) return prev;
      return [entry, ...prev].slice(0, MAX_ITEMS);
    });

    const origin = entry.device_id
      ? `Device ${entry.device_id} · Table ${entry.table_number}`
      : `Table ${entry.table_number}`;
    toast.success(`New order ${entry.order_number}`, { description: origin });
  }, []);

  useWebSocket("/ws/orders/kitchen/", {
    onMessage: handleMessage,
    reconnect: true,
  });

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items]);

  const markAllRead = () =>
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));

  const clearAll = () => setItems([]);

  const removeOne = (id: number) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) markAllRead();
        }}
        aria-label="Order notifications"
        className="relative p-2 rounded-lg text-gray-300 hover:bg-[#3d2b20] hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] bg-white text-gray-900 rounded-xl shadow-2xl ring-1 ring-black/5 overflow-hidden z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div>
              <h3 className="font-semibold text-baristas-brown-dark">New orders</h3>
              <p className="text-xs text-gray-500">
                {items.length === 0
                  ? "Nothing yet — you're up to date"
                  : `${items.length} recent`}
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y">
            {items.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-400">
                Waiting for orders…
              </div>
            )}
            {items.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                  n.read ? "" : "bg-amber-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/admin/orders`}
                    onClick={() => setOpen(false)}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="w-3.5 h-3.5 text-baristas-brown" />
                      <span className="font-mono text-sm font-semibold text-baristas-brown-dark truncate">
                        {n.order_number}
                      </span>
                      <span className="ml-auto text-xs text-gray-400 shrink-0">
                        {formatRelative(n.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Table {n.table_number}
                      </span>
                      {n.device_id && (
                        <span className="inline-flex items-center gap-1">
                          <Tablet className="w-3 h-3" />
                          {n.device_id}
                        </span>
                      )}
                      <span className="ml-auto font-semibold text-baristas-brown-dark">
                        ${n.total_amount}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={() => removeOne(n.id)}
                    className="p-1 text-gray-300 hover:text-red-500 rounded"
                    aria-label="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
