"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { useAdmin } from "@/hooks/useAdmin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isOwner, isWaiter, isLoading } = useAdmin();

  // Loading — wait for auth check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-baristas-cream">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-baristas-brown-dark border-t-transparent mb-4" />
          <p className="text-baristas-brown font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  // Not authorized — useAdmin already redirected, render nothing while navigation happens
  if (!isAdmin && !isOwner && !isWaiter) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 px-6 flex items-center justify-end gap-3 bg-[#2D1810] text-white border-b border-black/20">
          <AdminNotificationBell />
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
