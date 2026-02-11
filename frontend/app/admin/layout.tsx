"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAdmin } from "@/hooks/useAdmin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isOwner, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E5D4C1]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4A3428] border-t-transparent mb-4"></div>
          <p className="text-gray-700">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isOwner) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
