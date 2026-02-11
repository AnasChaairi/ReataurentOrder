"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface UserItem {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  role: string;
  restaurant: number | null;
  restaurant_detail?: { id: number; name: string } | null;
  is_active: boolean;
  created_at: string;
}

const ROLES = [
  { value: "ADMIN", label: "Admin", color: "bg-purple-100 text-purple-800" },
  { value: "RESTAURANT_OWNER", label: "Restaurant Owner", color: "bg-blue-100 text-blue-800" },
  { value: "CUSTOMER", label: "Customer", color: "bg-gray-100 text-gray-800" },
];

function getRoleBadge(role: string) {
  const r = ROLES.find((x) => x.value === role);
  return r ? r : { value: role, label: role, color: "bg-gray-100 text-gray-800" };
}

export default function UsersManagement() {
  const { isAdmin, isLoading: authLoading } = useAdmin();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    role: "CUSTOMER",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Restaurants dropdown for owner assignment
  const [restaurants, setRestaurants] = useState<{ id: number; name: string }[]>([]);
  const [formRestaurant, setFormRestaurant] = useState<number | "">("");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/auth/admin/users/");
      const data = response.data;
      setUsers(Array.isArray(data) ? data : data.results ?? []);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRestaurants = useCallback(async () => {
    try {
      const response = await api.get("/api/restaurants/");
      const data = response.data;
      setRestaurants(Array.isArray(data) ? data : data.results ?? []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/admin");
      return;
    }
    if (!authLoading && isAdmin) {
      fetchUsers();
      fetchRestaurants();
    }
  }, [authLoading, isAdmin, router, fetchUsers, fetchRestaurants]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const resetForm = () => {
    setForm({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      phone_number: "",
      role: "CUSTOMER",
      is_active: true,
    });
    setFormRestaurant("");
    setFormErrors({});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormErrors({});

    try {
      const payload: Record<string, unknown> = { ...form };
      if (formRestaurant) {
        payload.restaurant = Number(formRestaurant);
      }
      await api.post("/api/auth/admin/users/", payload);
      resetForm();
      setShowCreate(false);
      setSuccess("User created successfully");
      fetchUsers();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        const fieldErrors: Record<string, string> = {};
        for (const [key, val] of Object.entries(data)) {
          fieldErrors[key] = Array.isArray(val) ? val.join(" ") : String(val);
        }
        setFormErrors(fieldErrors);
      } else {
        setError("Failed to create user");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (user: UserItem) => {
    try {
      await api.patch(`/api/auth/admin/users/${user.id}/`, {
        is_active: !user.is_active,
      });
      setSuccess(
        `${user.first_name || user.email} is now ${user.is_active ? "deactivated" : "active"}`
      );
      fetchUsers();
    } catch {
      setError("Failed to update user");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#4A3428] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage system users and create new accounts
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreate(!showCreate);
            if (showCreate) resetForm();
          }}
          className="px-4 py-2 bg-[#4A3428] text-white rounded-lg hover:bg-[#3d2b20] transition-colors"
        >
          {showCreate ? "Cancel" : "+ New User"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 font-bold">
            x
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-2 font-bold">
            x
          </button>
        </div>
      )}

      {/* Create User Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-6 bg-white rounded-lg shadow border border-gray-200"
        >
          <h2 className="text-lg font-semibold mb-4">Create User</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A3428] focus:outline-none"
                placeholder="user@example.com"
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A3428] focus:outline-none"
                placeholder="Min 8 characters"
              />
              {formErrors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.password}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A3428] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A3428] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={form.phone_number}
                onChange={(e) =>
                  setForm({ ...form, phone_number: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A3428] focus:outline-none"
                placeholder="+1 234 567 890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A3428] focus:outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            {form.role === "RESTAURANT_OWNER" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant
                </label>
                <select
                  value={formRestaurant}
                  onChange={(e) =>
                    setFormRestaurant(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A3428] focus:outline-none"
                >
                  <option value="">-- Select restaurant --</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {formErrors.non_field_errors && (
            <p className="text-red-500 text-sm mt-3">
              {formErrors.non_field_errors}
            </p>
          )}

          <button
            type="submit"
            disabled={creating || !form.email || !form.password}
            className="mt-4 px-6 py-2 bg-[#4A3428] text-white rounded-lg hover:bg-[#3d2b20] disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating..." : "Create User"}
          </button>
        </form>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Restaurant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const badge = getRoleBadge(user.role);
              return (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">
                      {user.first_name || user.last_name
                        ? `${user.first_name} ${user.last_name}`.trim()
                        : "--"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.restaurant_detail?.name || (
                      <span className="text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`px-3 py-1 text-xs rounded font-medium ${
                        user.is_active
                          ? "bg-red-50 text-red-700 hover:bg-red-100"
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                      } transition-colors`}
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
