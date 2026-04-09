"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { deviceService } from '@/services/device.service';
import { DeviceProfile, DeviceProfileFormData } from '@/types/device.types';
import api from '@/lib/api';

interface Restaurant { id: number; name: string }
interface Table { id: number; number: string; section: string }
interface OdooConfig { id: number; name: string; is_active: boolean }
interface Category { id: number; name: string }

const EMPTY_FORM: DeviceProfileFormData = {
  name: '',
  restaurant: '',
  table: '',
  odoo_config: '',
  allowed_category_ids: [],
  passcode: '',
  is_active: true,
};

export default function DevicesManagement() {
  const { isAdmin, isLoading: authLoading } = useAdmin();
  const router = useRouter();

  const [devices, setDevices] = useState<DeviceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reference data
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [odooConfigs, setOdooConfigs] = useState<OdooConfig[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<DeviceProfileFormData>(EMPTY_FORM);

  // Edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<DeviceProfileFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Passcode modal
  const [passcodeModal, setPasscodeModal] = useState<{ deviceId: number; passcode: string } | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await deviceService.listDevices();
      setDevices(data);
    } catch {
      setError('Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [restRes, odooRes] = await Promise.all([
        api.get('/api/restaurants/'),
        api.get('/api/odoo/configs/'),
      ]);
      setRestaurants(Array.isArray(restRes.data) ? restRes.data : restRes.data.results ?? []);
      setOdooConfigs(Array.isArray(odooRes.data) ? odooRes.data : odooRes.data.results ?? []);
    } catch {
      // non-critical
    }
  }, []);

  const fetchTablesForRestaurant = useCallback(async (restaurantId: number) => {
    try {
      const res = await api.get(`/api/tables/tables/?restaurant=${restaurantId}`);
      setTables(Array.isArray(res.data) ? res.data : res.data.results ?? []);
    } catch {
      setTables([]);
    }
  }, []);

  const fetchCategoriesForRestaurant = useCallback(async (restaurantId: number) => {
    try {
      const res = await api.get(`/api/menu/categories/?restaurant=${restaurantId}`);
      setCategories(Array.isArray(res.data) ? res.data : res.data.results ?? []);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) { router.push('/admin'); return; }
    if (!authLoading && isAdmin) {
      fetchDevices();
      fetchReferenceData();
    }
  }, [authLoading, isAdmin, router, fetchDevices, fetchReferenceData]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // When restaurant changes in create form, reload tables/categories
  useEffect(() => {
    if (form.restaurant) {
      fetchTablesForRestaurant(Number(form.restaurant));
      fetchCategoriesForRestaurant(Number(form.restaurant));
    } else {
      setTables([]);
      setCategories([]);
    }
  }, [form.restaurant, fetchTablesForRestaurant, fetchCategoriesForRestaurant]);

  // When restaurant changes in edit form
  useEffect(() => {
    if (editForm.restaurant) {
      fetchTablesForRestaurant(Number(editForm.restaurant));
      fetchCategoriesForRestaurant(Number(editForm.restaurant));
    }
  }, [editForm.restaurant, fetchTablesForRestaurant, fetchCategoriesForRestaurant]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.restaurant) { setError('Restaurant is required.'); return; }
    if (!form.passcode || form.passcode.length < 4) { setError('Passcode must be 4–6 digits.'); return; }
    setCreating(true);
    setError(null);
    try {
      await deviceService.createDevice(form);
      setForm(EMPTY_FORM);
      setShowCreate(false);
      setSuccess('Device created successfully');
      fetchDevices();
    } catch (err: any) {
      const data = err?.response?.data;
      setError(
        (data && typeof data === 'object'
          ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('; ')
          : undefined) ?? 'Failed to create device'
      );
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (device: DeviceProfile) => {
    setEditingId(device.id);
    setEditForm({
      name: device.name,
      restaurant: device.restaurant,
      table: device.table ?? '',
      odoo_config: device.odoo_config ?? '',
      allowed_category_ids: device.allowed_category_ids,
      passcode: '',
      is_active: device.is_active,
    });
    if (device.restaurant) {
      fetchTablesForRestaurant(device.restaurant);
      fetchCategoriesForRestaurant(device.restaurant);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    setError(null);
    try {
      await deviceService.updateDevice(editingId, editForm);
      setEditingId(null);
      setSuccess('Device updated');
      fetchDevices();
    } catch {
      setError('Failed to update device');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this device profile? This cannot be undone.')) return;
    try {
      await deviceService.deleteDevice(id);
      setSuccess('Device deleted');
      fetchDevices();
    } catch {
      setError('Failed to delete device');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const res = await deviceService.toggleActive(id);
      setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, is_active: res.is_active } : d)));
    } catch {
      setError('Failed to toggle device status');
    }
  };

  const handleRegeneratePasscode = async (id: number) => {
    try {
      const res = await deviceService.regeneratePasscode(id);
      setPasscodeModal({ deviceId: id, passcode: res.passcode });
    } catch {
      setError('Failed to regenerate passcode');
    }
  };

  const toggleCategory = (catId: number, formState: DeviceProfileFormData, setter: (f: DeviceProfileFormData) => void) => {
    const ids = formState.allowed_category_ids;
    setter({
      ...formState,
      allowed_category_ids: ids.includes(catId) ? ids.filter((i) => i !== catId) : [...ids, catId],
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-baristas-brown border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage tablet/kiosk device profiles</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-baristas-brown-dark text-white rounded-lg hover:bg-baristas-brown transition-colors text-sm font-medium"
        >
          {showCreate ? 'Cancel' : '+ New Device'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          {success}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="mb-8 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Device</h2>
          <DeviceFormFields
            form={form}
            setForm={setForm}
            restaurants={restaurants}
            tables={tables}
            odooConfigs={odooConfigs}
            categories={categories}
            showPasscode
            toggleCategory={(id) => toggleCategory(id, form, setForm)}
          />
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 bg-baristas-brown-dark text-white rounded-lg text-sm font-medium hover:bg-baristas-brown disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create Device'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Devices table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {devices.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-4xl mb-3">📱</p>
            <p className="font-medium">No devices yet</p>
            <p className="text-sm mt-1">Create your first device profile to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Device ID', 'Restaurant', 'Table', 'Categories', 'Status', 'Last Seen', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {devices.map((device) => (
                <React.Fragment key={device.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{device.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-baristas-brown-dark">
                          {device.device_id}
                        </span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(device.device_id); setSuccess('Copied!'); }}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                          title="Copy"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{device.restaurant_name}</td>
                    <td className="px-4 py-3 text-gray-600">{device.table_number ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {device.allowed_category_ids.length === 0
                        ? <span className="text-gray-400 text-xs">All</span>
                        : <span className="text-xs">{device.allowed_category_ids.length} selected</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${device.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        {device.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editingId === device.id ? setEditingId(null) : startEdit(device)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          {editingId === device.id ? 'Cancel' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handleRegeneratePasscode(device.id)}
                          className="text-amber-600 hover:text-amber-800 text-xs font-medium"
                          title="Regenerate passcode"
                        >
                          🔑 PIN
                        </button>
                        <button
                          onClick={() => handleToggleActive(device.id)}
                          className="text-gray-500 hover:text-gray-700 text-xs font-medium"
                        >
                          {device.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDelete(device.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Inline edit row */}
                  {editingId === device.id && (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 bg-blue-50 border-y border-blue-100">
                        <DeviceFormFields
                          form={editForm}
                          setForm={setEditForm}
                          restaurants={restaurants}
                          tables={tables}
                          odooConfigs={odooConfigs}
                          categories={categories}
                          showPasscode={false}
                          toggleCategory={(id) => toggleCategory(id, editForm, setEditForm)}
                        />
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="px-4 py-2 bg-baristas-brown-dark text-white rounded-lg text-sm hover:bg-baristas-brown disabled:opacity-50"
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button onClick={() => setEditingId(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">
                            Cancel
                          </button>
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

      {/* Passcode modal */}
      {passcodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">New Passcode Generated</h3>
            <p className="text-sm text-gray-500 mb-4">
              Copy this passcode now. It will not be shown again.
            </p>
            <div className="bg-baristas-cream rounded-xl p-4 text-center mb-4">
              <span className="text-4xl font-mono font-bold tracking-[0.4em] text-baristas-brown-dark">
                {passcodeModal.passcode}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { navigator.clipboard.writeText(passcodeModal.passcode); setSuccess('Passcode copied!'); }}
                className="flex-1 py-2 bg-baristas-brown-dark text-white rounded-lg text-sm font-medium hover:bg-baristas-brown"
              >
                Copy
              </button>
              <button
                onClick={() => setPasscodeModal(null)}
                className="flex-1 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared form fields component ────────────────────────────────────────────

interface FormFieldsProps {
  form: DeviceProfileFormData;
  setForm: (f: DeviceProfileFormData) => void;
  restaurants: Restaurant[];
  tables: Table[];
  odooConfigs: OdooConfig[];
  categories: Category[];
  showPasscode: boolean;
  toggleCategory: (id: number) => void;
}

function DeviceFormFields({ form, setForm, restaurants, tables, odooConfigs, categories, showPasscode, toggleCategory }: FormFieldsProps) {
  const field = (key: keyof DeviceProfileFormData, value: any) =>
    setForm({ ...form, [key]: value });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Device Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => field('name', e.target.value)}
          placeholder="e.g. Table 5 Tablet"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-baristas-brown focus:border-transparent"
          required
        />
      </div>

      {/* Restaurant */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Restaurant *</label>
        <select
          value={form.restaurant}
          onChange={(e) => field('restaurant', e.target.value ? Number(e.target.value) : '')}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-baristas-brown focus:border-transparent"
          required
        >
          <option value="">Select restaurant…</option>
          {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Assigned Table</label>
        <select
          value={form.table}
          onChange={(e) => field('table', e.target.value ? Number(e.target.value) : '')}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-baristas-brown focus:border-transparent"
          disabled={!form.restaurant}
        >
          <option value="">None (no pre-assigned table)</option>
          {tables.map((t) => <option key={t.id} value={t.id}>{t.number} — {t.section}</option>)}
        </select>
      </div>

      {/* Odoo Config */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Odoo Config Override</label>
        <select
          value={form.odoo_config}
          onChange={(e) => field('odoo_config', e.target.value ? Number(e.target.value) : '')}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-baristas-brown focus:border-transparent"
        >
          <option value="">Inherit from restaurant</option>
          {odooConfigs.map((o) => <option key={o.id} value={o.id}>{o.name}{o.is_active ? ' ✓' : ''}</option>)}
        </select>
      </div>

      {/* Passcode */}
      {showPasscode && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Passcode (4–6 digits) *</label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={form.passcode}
            onChange={(e) => field('passcode', e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 1234"
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono tracking-widest focus:ring-2 focus:ring-baristas-brown focus:border-transparent"
            required={showPasscode}
          />
        </div>
      )}

      {/* Active */}
      <div className="flex items-center gap-2 self-end">
        <input
          id="is_active"
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => field('is_active', e.target.checked)}
          className="w-4 h-4 accent-baristas-brown-dark"
        />
        <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
      </div>

      {/* Allowed categories */}
      {form.restaurant && categories.length > 0 && (
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Allowed Categories <span className="text-gray-400 font-normal">(leave all unchecked to show everything)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const checked = form.allowed_category_ids.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    checked
                      ? 'bg-baristas-brown-dark text-white border-baristas-brown-dark'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-baristas-brown'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
