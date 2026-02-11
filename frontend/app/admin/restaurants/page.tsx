"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useRouter } from "next/navigation";
import { restaurantService } from "@/services/restaurant.service";
import { Restaurant, RestaurantListItem } from "@/types/restaurant.types";
import api from "@/lib/api";

interface UserOption {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface OdooConfigOption {
  id: number;
  name: string;
  is_active: boolean;
  url: string;
  pos_config_name: string;
}

export default function RestaurantsPage() {
  const { isAdmin, isLoading: authLoading } = useAdmin();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<RestaurantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formOwner, setFormOwner] = useState<number | "">("");
  const [creating, setCreating] = useState(false);

  // Users and Odoo configs for dropdowns
  const [users, setUsers] = useState<UserOption[]>([]);
  const [odooConfigs, setOdooConfigs] = useState<OdooConfigOption[]>([]);

  // Expanded restaurant detail
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<Restaurant | null>(null);
  const [selectedOdooConfig, setSelectedOdooConfig] = useState<number | "">("");
  const [selectedOwner, setSelectedOwner] = useState<number | "">("");
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      const data = await restaurantService.getRestaurants();
      setRestaurants(data);
    } catch {
      setError("Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [usersRes, configsRes] = await Promise.all([
        api.get("/api/auth/admin/users/"),
        api.get("/api/odoo/configs/"),
      ]);
      const usersData = usersRes.data;
      setUsers(
        Array.isArray(usersData) ? usersData : usersData.results ?? []
      );
      const configsData = configsRes.data;
      setOdooConfigs(
        Array.isArray(configsData) ? configsData : configsData.results ?? []
      );
    } catch {
      // Non-critical, dropdowns just won't populate
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/admin");
      return;
    }
    if (!authLoading && isAdmin) {
      fetchRestaurants();
      fetchDropdownData();
    }
  }, [authLoading, isAdmin, router, fetchRestaurants, fetchDropdownData]);

  // Auto-clear success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await restaurantService.createRestaurant({
        name: formName,
        address: formAddress,
        phone: formPhone,
        owner: formOwner || null,
      });
      setFormName("");
      setFormAddress("");
      setFormPhone("");
      setFormOwner("");
      setShowCreate(false);
      setSuccess("Restaurant created successfully");
      fetchRestaurants();
    } catch {
      setError("Failed to create restaurant");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (restaurant: RestaurantListItem) => {
    try {
      await restaurantService.updateRestaurant(restaurant.id, {
        is_active: !restaurant.is_active,
      });
      setSuccess(
        `${restaurant.name} is now ${restaurant.is_active ? "inactive" : "active"}`
      );
      fetchRestaurants();
      if (expandedId === restaurant.id) {
        loadRestaurantDetail(restaurant.id);
      }
    } catch {
      setError("Failed to update restaurant");
    }
  };

  const loadRestaurantDetail = async (id: number) => {
    try {
      const detail = await restaurantService.getRestaurant(id);
      setExpandedDetail(detail);
      setSelectedOdooConfig(detail.odoo_config ?? "");
      setSelectedOwner(detail.owner ?? "");
    } catch {
      setError("Failed to load restaurant details");
    }
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedDetail(null);
    } else {
      setExpandedId(id);
      await loadRestaurantDetail(id);
    }
  };

  const handleAssignOdooConfig = async () => {
    if (!expandedId) return;
    try {
      await restaurantService.assignOdooConfig(
        expandedId,
        selectedOdooConfig === "" ? null : Number(selectedOdooConfig)
      );
      setSuccess("Odoo config updated successfully");
      await loadRestaurantDetail(expandedId);
      fetchRestaurants();
    } catch {
      setError("Failed to assign Odoo config");
    }
  };

  const handleAssignOwner = async () => {
    if (!expandedId) return;
    try {
      await restaurantService.updateRestaurant(expandedId, {
        owner: selectedOwner === "" ? null : Number(selectedOwner),
      });
      setSuccess("Owner updated successfully");
      await loadRestaurantDetail(expandedId);
      fetchRestaurants();
    } catch {
      setError("Failed to assign owner");
    }
  };

  const handleSync = async (type: "menu" | "tables") => {
    if (!expandedId) return;
    setSyncing(type);
    try {
      if (type === "menu") {
        await restaurantService.syncMenu(expandedId);
      } else {
        await restaurantService.syncTables(expandedId);
      }
      setSuccess(
        `${type === "menu" ? "Menu" : "Tables"} synced successfully`
      );
    } catch {
      setError(
        `${type === "menu" ? "Menu" : "Table"} sync failed. Make sure Odoo config is assigned and has a POS config selected.`
      );
    } finally {
      setSyncing(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create restaurants, assign owners and Odoo configs, sync menus &amp; tables
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-[#4A3428] text-white rounded-lg hover:bg-[#3d2b20] transition-colors"
        >
          {showCreate ? "Cancel" : "+ New Restaurant"}
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

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-6 bg-white rounded-lg shadow border border-gray-200"
        >
          <h2 className="text-lg font-semibold mb-4">Create Restaurant</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A3428] focus:outline-none"
                placeholder="e.g. Baristas Downtown"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner
              </label>
              <select
                value={formOwner}
                onChange={(e) =>
                  setFormOwner(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A3428] focus:outline-none"
              >
                <option value="">-- No owner --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.email}) - {u.role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A3428] focus:outline-none"
                placeholder="123 Main St"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A3428] focus:outline-none"
                placeholder="+1 234 567 890"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating || !formName}
            className="mt-4 px-6 py-2 bg-[#4A3428] text-white rounded-lg hover:bg-[#3d2b20] disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating..." : "Create Restaurant"}
          </button>
        </form>
      )}

      {/* Restaurants Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Restaurant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {restaurants.map((restaurant) => (
              <>
                <tr
                  key={restaurant.id}
                  className={`cursor-pointer hover:bg-gray-50 ${
                    expandedId === restaurant.id ? "bg-gray-50" : ""
                  }`}
                  onClick={() => toggleExpand(restaurant.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className="font-medium text-gray-900">
                        {restaurant.name}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {restaurant.slug}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {restaurant.owner_name || (
                      <span className="text-gray-400 italic">No owner</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(restaurant);
                      }}
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        restaurant.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {restaurant.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(restaurant.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="text-gray-400 text-xs">
                      {expandedId === restaurant.id
                        ? "Click to collapse"
                        : "Click to manage"}
                    </span>
                  </td>
                </tr>

                {/* Expanded Detail Panel */}
                {expandedId === restaurant.id && expandedDetail && (
                  <tr key={`${restaurant.id}-detail`}>
                    <td colSpan={5} className="px-6 py-6 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Owner Assignment */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h3 className="font-semibold text-gray-800 mb-3">
                            Owner
                          </h3>
                          <div className="flex items-end gap-3">
                            <div className="flex-1">
                              <select
                                value={selectedOwner}
                                onChange={(e) =>
                                  setSelectedOwner(
                                    e.target.value
                                      ? Number(e.target.value)
                                      : ""
                                  )
                                }
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A3428] focus:outline-none text-sm"
                              >
                                <option value="">-- No owner --</option>
                                {users.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.first_name} {u.last_name} ({u.email})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={handleAssignOwner}
                              className="px-4 py-2 bg-[#4A3428] text-white text-sm rounded-lg hover:bg-[#3d2b20] transition-colors"
                            >
                              Save
                            </button>
                          </div>
                          {expandedDetail.owner_name && (
                            <p className="text-xs text-gray-500 mt-2">
                              Current: {expandedDetail.owner_name}
                            </p>
                          )}
                        </div>

                        {/* Odoo Config Assignment */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h3 className="font-semibold text-gray-800 mb-3">
                            Odoo Configuration
                          </h3>
                          {odooConfigs.length === 0 ? (
                            <p className="text-sm text-gray-500">
                              No Odoo configs found.{" "}
                              <a
                                href="/admin/odoo-settings"
                                className="text-blue-600 underline"
                              >
                                Create one first
                              </a>
                            </p>
                          ) : (
                            <div className="flex items-end gap-3">
                              <div className="flex-1">
                                <select
                                  value={selectedOdooConfig}
                                  onChange={(e) =>
                                    setSelectedOdooConfig(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : ""
                                    )
                                  }
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A3428] focus:outline-none text-sm"
                                >
                                  <option value="">-- None --</option>
                                  {odooConfigs.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name} ({c.url})
                                      {c.pos_config_name
                                        ? ` - POS: ${c.pos_config_name}`
                                        : ""}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <button
                                onClick={handleAssignOdooConfig}
                                className="px-4 py-2 bg-[#4A3428] text-white text-sm rounded-lg hover:bg-[#3d2b20] transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          )}
                          {expandedDetail.odoo_config_name && (
                            <p className="text-xs text-gray-500 mt-2">
                              Current: {expandedDetail.odoo_config_name}
                            </p>
                          )}
                        </div>

                        {/* Restaurant Details */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h3 className="font-semibold text-gray-800 mb-3">
                            Details
                          </h3>
                          <dl className="text-sm space-y-2">
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Slug:</dt>
                              <dd className="text-gray-900 font-mono">
                                {expandedDetail.slug}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Address:</dt>
                              <dd className="text-gray-900">
                                {expandedDetail.address || "Not set"}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Phone:</dt>
                              <dd className="text-gray-900">
                                {expandedDetail.phone || "Not set"}
                              </dd>
                            </div>
                          </dl>
                        </div>

                        {/* Sync Actions */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h3 className="font-semibold text-gray-800 mb-3">
                            Odoo Sync
                          </h3>
                          {!expandedDetail.odoo_config ? (
                            <p className="text-sm text-gray-500">
                              Assign an Odoo config first to enable syncing.
                            </p>
                          ) : (
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleSync("menu")}
                                disabled={syncing !== null}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                              >
                                {syncing === "menu"
                                  ? "Syncing..."
                                  : "Sync Menu"}
                              </button>
                              <button
                                onClick={() => handleSync("tables")}
                                disabled={syncing !== null}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                              >
                                {syncing === "tables"
                                  ? "Syncing..."
                                  : "Sync Tables"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {restaurants.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <p className="text-lg mb-2">No restaurants yet</p>
                  <p className="text-sm">
                    Click &quot;+ New Restaurant&quot; to create one.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
