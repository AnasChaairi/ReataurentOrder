"use client";

import Link from "next/link";

export default function AdminDashboard() {
  const stats = [
    { label: "Total Orders", value: "156", icon: "📦", color: "bg-blue-500" },
    { label: "Menu Items", value: "48", icon: "🍽️", color: "bg-green-500" },
    { label: "Active Users", value: "1,234", icon: "👥", color: "bg-purple-500" },
    { label: "Revenue", value: "$12,450", icon: "💰", color: "bg-yellow-500" },
  ];

  const quickActions = [
    { label: "Add Menu Item", href: "/admin/menu-items", icon: "➕", color: "bg-[#4A3428]" },
    { label: "View Orders", href: "/admin/orders", icon: "📋", color: "bg-[#4A3428]" },
    { label: "Manage Users", href: "/admin/users", icon: "⚙️", color: "bg-[#4A3428]" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to Baristas Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`${action.color} text-white p-4 rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-3`}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 pb-4 border-b">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600">✓</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium">New order received</p>
              <p className="text-gray-500 text-sm">Order #1234 - 2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 pb-4 border-b">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">👤</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium">New user registered</p>
              <p className="text-gray-500 text-sm">john@example.com - 15 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600">🍽️</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium">Menu item updated</p>
              <p className="text-gray-500 text-sm">Brownie Baristas - 1 hour ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
