"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: "📊",
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
      name: "Waiters",
      href: "/admin/waiters",
      icon: "🧑‍🍳",
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: "👥",
    },
    {
      name: "Odoo Settings",
      href: "/admin/odoo-settings",
      icon: "⚙️",
    },
  ];

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

      <div className="mt-auto pt-8">
        <Link
          href="/"
          className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white transition-colors"
        >
          <span className="text-xl">🏠</span>
          <span>Back to Website</span>
        </Link>
      </div>
    </aside>
  );
}
