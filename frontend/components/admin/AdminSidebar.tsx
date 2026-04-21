"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";

interface MenuItem {
  name: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { isAdmin, isOwner } = useAdmin();
  const { logout } = useAuth();

  const allMenuItems: MenuItem[] = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: "📊",
    },
    {
      name: isOwner ? "My Restaurant" : "Restaurants",
      href: "/admin/restaurants",
      icon: "🏪",
    },
    {
      name: "Menu Items",
      href: "/admin/menu-items",
      icon: "🍽️",
    },
    {
      name: "Categories",
      href: "/admin/categories",
      icon: "📁",
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: "📦",
    },
    {
      name: "Tables",
      href: "/admin/tables",
      icon: "🪑",
    },
{
      name: "Users",
      href: "/admin/users",
      icon: "👥",
      adminOnly: true,
    },
    {
      name: "Devices",
      href: "/admin/devices",
      icon: "📱",
      adminOnly: true,
    },
    {
      name: "Odoo Settings",
      href: "/admin/odoo-settings",
      icon: "⚙️",
    },
  ];

  // Filter items based on role
  const menuItems = allMenuItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside className="w-64 bg-[#2D1810] text-white min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">BARISTAS</h1>
        <p className="text-sm text-gray-400">Admin Dashboard</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#4A3428] text-white'
                  : 'text-gray-300 hover:bg-[#3d2b20] hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8 space-y-1">
        <Link
          href="/"
          className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white transition-colors"
        >
          <span className="text-xl">🏠</span>
          <span>Back to Website</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#3d2b20] hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
