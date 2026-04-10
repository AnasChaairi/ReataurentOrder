"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { deviceService } from '@/services/device.service';
import { DeviceProfile, DeviceProfileFormData } from '@/types/device.types';
import api from '@/lib/api';

interface OdooConfig {
  id: number; name: string; is_active: boolean
  pos_config_id?: number; pos_config_name?: string
  restaurant_id?: number | null; restaurant_name?: string | null
}
interface PosConfig  { id: number; name: string }
interface Table      { id: number; number: string; section: string; floor: number }
interface Category   { id: number; name: string }

// Per-form volatile state (not sent to backend)
interface FormCtx {
  posConfigs:   PosConfig[];
  posConfigId:  number | '';
  posLoading:   boolean;
  syncing:      boolean;
  tables:       Table[];
  floor:        string;
  categories:   Category[];
}

const EMPTY_CTX: FormCtx = {
  posConfigs:  [],
  posConfigId: '',
  posLoading:  false,
  syncing:     false,
  tables:      [],
  floor:       '',
  categories:  [],
};

const EMPTY_FORM: DeviceProfileFormData = {
  name: '',
  odoo_config: '',
  table: '',
  allowed_category_ids: [],
  passcode: '',
  is_active: true,
};

function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text: string) {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

export default function DevicesManagement() {
  const { isAdmin, isLoading: authLoading } = useAdmin();
  const router = useRouter();

  const [devices,       setDevices]       = useState<DeviceProfile[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [success,       setSuccess]       = useState<string | null>(null);
  const [odooConfigs,   setOdooConfigs]   = useState<OdooConfig[]>([]);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [form,       setForm]       = useState<DeviceProfileFormData>(EMPTY_FORM);
  const [ctx,        setCtx]        = useState<FormCtx>(EMPTY_CTX);

  // Edit form
  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [editForm,   setEditForm]   = useState<DeviceProfileFormData>(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [editCtx,    setEditCtx]    = useState<FormCtx>(EMPTY_CTX);

  // Passcode modal
  const [passcodeModal, setPasscodeModal] = useState<{ deviceId: number; passcode: string } | null>(null);

  // Per-device syncing state
  const [syncingDeviceId, setSyncingDeviceId] = useState<number | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setDevices(await deviceService.listDevices());
    } catch {
      setError('Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOdooConfigs = useCallback(async () => {
    try {
      const res = await api.get('/api/odoo/configs/');
      setOdooConfigs(Array.isArray(res.data) ? res.data : res.data.results ?? []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) { router.push('/admin'); return; }
    if (!authLoading && isAdmin)  { fetchDevices(); fetchOdooConfigs(); }
  }, [authLoading, isAdmin, router, fetchDevices, fetchOdooConfigs]);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 4000); return () => clearTimeout(t); }
  }, [success]);

  // ── POS + sync logic ──────────────────────────────────────────────────────

  /** Step 1: Odoo config selected → fetch POS list from Odoo live */
  const handleOdooConfigChange = useCallback(async (
    odooConfigId: number | '',
    setF: React.Dispatch<React.SetStateAction<DeviceProfileFormData>>,
    setC: React.Dispatch<React.SetStateAction<FormCtx>>,
  ) => {
    setF({ ...EMPTY_FORM, odoo_config: odooConfigId });
    setC(EMPTY_CTX);
    if (!odooConfigId) return;

    setC((c) => ({ ...c, posLoading: true }));
    try {
      const res = await api.get(`/api/odoo/configs/${odooConfigId}/get_pos_configs/`);
      const list: PosConfig[] = res.data.pos_configs ?? [];
      // Pre-select POS if the config already has one
      const saved = odooConfigs.find((o) => o.id === odooConfigId);
      const preselect = saved?.pos_config_id
        ? list.find((p) => p.id === saved.pos_config_id)
        : null;
      setC((c) => ({
        ...c,
        posConfigs:  list,
        posConfigId: preselect?.id ?? '',
        posLoading:  false,
      }));
      // If a POS was already saved, also load tables immediately
      if (preselect) {
        handlePosSelect(odooConfigId, preselect.id, preselect.name, setF, setC);
      }
    } catch (e: any) {
      setError(`Failed to fetch POS configs: ${e?.response?.data?.error ?? e.message}`);
      setC((c) => ({ ...c, posLoading: false }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [odooConfigs]);

  /** Step 2: POS selected → save it on OdooConfig + sync tables from Odoo */
  const handlePosSelect = useCallback(async (
    odooConfigId: number | '',
    posId: number | '',
    posName: string,
    setF: React.Dispatch<React.SetStateAction<DeviceProfileFormData>>,
    setC: React.Dispatch<React.SetStateAction<FormCtx>>,
  ) => {
    if (!odooConfigId || !posId) {
      setC((c) => ({ ...c, posConfigId: '', tables: [], floor: '', categories: [] }));
      setF((prev) => ({ ...prev, table: '', allowed_category_ids: [] }));
      return;
    }

    setC((c) => ({ ...c, posConfigId: posId, syncing: true, tables: [], floor: '' }));
    setF((prev) => ({ ...prev, table: '', allowed_category_ids: [] }));

    try {
      // 1. Persist POS selection on the OdooConfig
      await api.post(`/api/odoo/configs/${odooConfigId}/select_pos_config/`, {
        pos_config_id:   posId,
        pos_config_name: posName,
      });

      // 2. Sync tables from Odoo for this POS
      await api.post(`/api/odoo/configs/${odooConfigId}/sync_tables_now/`);

      // 3. Refresh odoo configs list (pos_config_name updated)
      fetchOdooConfigs();

      // 4. Fetch synced tables + categories from DB
      const [tablesRes, catsRes] = await Promise.allSettled([
        api.get(`/api/tables/tables/?odoo_config=${odooConfigId}`),
        api.get(`/api/menu/categories/`),
      ]);
      const tables: Table[] = tablesRes.status === 'fulfilled'
        ? (Array.isArray(tablesRes.value.data) ? tablesRes.value.data : tablesRes.value.data.results ?? [])
        : [];
      const cats: Category[] = catsRes.status === 'fulfilled'
        ? (Array.isArray(catsRes.value.data) ? catsRes.value.data : catsRes.value.data.results ?? [])
        : [];

      setC((c) => ({ ...c, syncing: false, tables, categories: cats }));
      setSuccess(`Synced ${tables.length} table(s) from Odoo`);
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.response?.data?.detail ?? e.message ?? 'Unknown error';
      setError(msg);
      setC((c) => ({ ...c, syncing: false }));
    }
  }, [fetchOdooConfigs]);

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.odoo_config)  { setError('Odoo configuration is required.'); return; }
    if (!ctx.posConfigId)   { setError('Please select a POS.'); return; }
    if (!form.passcode || form.passcode.length < 4) { setError('Passcode must be 4–6 digits.'); return; }
    setCreating(true); setError(null);
    try {
      await deviceService.createDevice(form);
      setForm(EMPTY_FORM); setCtx(EMPTY_CTX); setShowCreate(false);
      setSuccess('Device created successfully');
      fetchDevices();
    } catch (err: any) {
      const data = err?.response?.data;
      setError(
        (data && typeof data === 'object'
          ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('; ')
          : undefined) ?? 'Failed to create device'
      );
    } finally { setCreating(false); }
  };

  const startEdit = (device: DeviceProfile) => {
    setEditingId(device.id);
    setEditCtx(EMPTY_CTX);
    setEditForm({
      name: device.name,
      odoo_config: device.odoo_config ?? '',
      table: device.table ?? '',
      allowed_category_ids: device.allowed_category_ids,
      passcode: '',
      is_active: device.is_active,
    });
    if (device.odoo_config) {
      handleOdooConfigChange(device.odoo_config, setEditForm, setEditCtx);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true); setError(null);
    try {
      await deviceService.updateDevice(editingId, editForm);
      setEditingId(null);
      setSuccess('Device updated');
      fetchDevices();
    } catch {
      setError('Failed to update device');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this device profile? This cannot be undone.')) return;
    try {
      await deviceService.deleteDevice(id);
      setSuccess('Device deleted'); fetchDevices();
    } catch { setError('Failed to delete device'); }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const res = await deviceService.toggleActive(id);
      setDevices((prev) => prev.map((d) => d.id === id ? { ...d, is_active: res.is_active } : d));
    } catch { setError('Failed to toggle device status'); }
  };

  const handleRegeneratePasscode = async (id: number) => {
    try {
      setPasscodeModal({ deviceId: id, passcode: (await deviceService.regeneratePasscode(id)).passcode });
    } catch { setError('Failed to regenerate passcode'); }
  };

  const handleSyncMenu = async (device: DeviceProfile) => {
    if (!device.odoo_config) { setError('This device has no Odoo config assigned.'); return; }
    setSyncingDeviceId(device.id);
    setError(null);
    try {
      const res = await api.post(`/api/odoo/configs/${device.odoo_config}/sync_menu_now/`);
      setSuccess(res.data.message ?? 'Menu synced successfully');
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.response?.data?.detail ?? e.message;
      setError(`Menu sync failed: ${msg}`);
    } finally {
      setSyncingDeviceId(null);
    }
  };

  const toggleCategory = (
    catId: number,
    formState: DeviceProfileFormData,
    setter: (f: DeviceProfileFormData) => void,
  ) => {
    const ids = formState.allowed_category_ids;
    setter({ ...formState, allowed_category_ids: ids.includes(catId) ? ids.filter((i) => i !== catId) : [...ids, catId] });
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
          onClick={() => { setShowCreate(!showCreate); setForm(EMPTY_FORM); setCtx(EMPTY_CTX); }}
          className="px-4 py-2 bg-baristas-brown-dark text-white rounded-lg hover:bg-baristas-brown transition-colors text-sm font-medium"
        >
          {showCreate ? 'Cancel' : '+ New Device'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
          <span>{error}</span>
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
            form={form} setForm={setForm}
            ctx={ctx}
            odooConfigs={odooConfigs}
            showPasscode
            onOdooConfigChange={(id) => handleOdooConfigChange(id, setForm, setCtx)}
            onPosSelect={(posId, posName) => handlePosSelect(form.odoo_config, posId, posName, setForm, setCtx)}
            onFloorChange={(floor) => { setCtx((c) => ({ ...c, floor })); setForm((f) => ({ ...f, table: '' })); }}
            toggleCategory={(id) => toggleCategory(id, form, setForm)}
          />
          <div className="flex gap-3 mt-5">
            <button type="submit" disabled={creating}
              className="px-5 py-2 bg-baristas-brown-dark text-white rounded-lg text-sm font-medium hover:bg-baristas-brown disabled:opacity-50">
              {creating ? 'Creating…' : 'Create Device'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-5 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
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
                {['Name', 'Device ID', 'Odoo Config', 'POS', 'Table', 'Categories', 'Status', 'Last Seen', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {devices.map((device) => {
                const cfg = odooConfigs.find((o) => o.id === device.odoo_config);
                return (
                  <React.Fragment key={device.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{device.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-baristas-brown-dark">{device.device_id}</span>
                          <button onClick={() => { copyToClipboard(device.device_id); setSuccess('Copied!'); }}
                            className="text-gray-400 hover:text-gray-600 text-xs" title="Copy">📋</button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{cfg?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{cfg?.pos_config_name ?? <span className="text-gray-400">—</span>}</td>
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
                          <button onClick={() => editingId === device.id ? setEditingId(null) : startEdit(device)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                            {editingId === device.id ? 'Cancel' : 'Edit'}
                          </button>
                          <button
                            onClick={() => handleSyncMenu(device)}
                            disabled={syncingDeviceId === device.id}
                            className="text-emerald-600 hover:text-emerald-800 text-xs font-medium disabled:opacity-50"
                            title="Sync menu from Odoo"
                          >
                            {syncingDeviceId === device.id ? '⏳ Syncing…' : '🔄 Sync Menu'}
                          </button>
                          <button onClick={() => handleRegeneratePasscode(device.id)}
                            className="text-amber-600 hover:text-amber-800 text-xs font-medium" title="Regenerate passcode">
                            🔑 PIN
                          </button>
                          <button onClick={() => handleToggleActive(device.id)}
                            className="text-gray-500 hover:text-gray-700 text-xs font-medium">
                            {device.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={() => handleDelete(device.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline edit row */}
                    {editingId === device.id && (
                      <tr>
                        <td colSpan={9} className="px-4 py-4 bg-blue-50 border-y border-blue-100">
                          <DeviceFormFields
                            form={editForm} setForm={setEditForm}
                            ctx={editCtx}
                            odooConfigs={odooConfigs}
                            showPasscode={false}
                            onOdooConfigChange={(id) => handleOdooConfigChange(id, setEditForm, setEditCtx)}
                            onPosSelect={(posId, posName) => handlePosSelect(editForm.odoo_config, posId, posName, setEditForm, setEditCtx)}

                            onFloorChange={(floor) => { setEditCtx((c) => ({ ...c, floor })); setEditForm((f) => ({ ...f, table: '' })); }}
                            toggleCategory={(id) => toggleCategory(id, editForm, setEditForm)}
                          />
                          <div className="flex gap-3 mt-4">
                            <button onClick={handleSaveEdit} disabled={saving}
                              className="px-4 py-2 bg-baristas-brown-dark text-white rounded-lg text-sm hover:bg-baristas-brown disabled:opacity-50">
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Passcode modal */}
      {passcodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">New Passcode Generated</h3>
            <p className="text-sm text-gray-500 mb-4">Copy this passcode now. It will not be shown again.</p>
            <div className="bg-baristas-cream rounded-xl p-4 text-center mb-4">
              <span className="text-4xl font-mono font-bold tracking-[0.4em] text-baristas-brown-dark">{passcodeModal.passcode}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { copyToClipboard(passcodeModal.passcode); setSuccess('Passcode copied!'); }}
                className="flex-1 py-2 bg-baristas-brown-dark text-white rounded-lg text-sm font-medium hover:bg-baristas-brown">Copy</button>
              <button onClick={() => setPasscodeModal(null)} className="flex-1 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Form fields component ──────────────────────────────────────────────────

interface FormFieldsProps {
  form:               DeviceProfileFormData;
  setForm:            (f: DeviceProfileFormData) => void;
  ctx:                FormCtx;
  odooConfigs:        OdooConfig[];
  showPasscode:       boolean;
  onOdooConfigChange: (id: number | '') => void;
  onPosSelect:        (posId: number | '', posName: string) => void;
  onFloorChange:      (floor: string) => void;
  toggleCategory:     (id: number) => void;
}

function DeviceFormFields({
  form, setForm, ctx, odooConfigs, showPasscode,
  onOdooConfigChange, onPosSelect, onFloorChange, toggleCategory,
}: FormFieldsProps) {
  const field = (key: keyof DeviceProfileFormData, value: any) =>
    setForm({ ...form, [key]: value });

  // Derive floors from synced tables
  const floors = Array.from(
    new Map(
      ctx.tables.map((t) => [`${t.floor}-${t.section}`, { key: String(t.floor ?? t.section), label: t.section, floor: t.floor }])
    ).values()
  ).sort((a, b) => (a.floor ?? 0) - (b.floor ?? 0));

  const filteredTables = ctx.floor
    ? ctx.tables.filter((t) => String(t.floor ?? t.section) === ctx.floor)
    : ctx.tables;

  const selectedConfig = odooConfigs.find((o) => o.id === Number(form.odoo_config));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Device Name */}
      <div className="md:col-span-2">
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

      {/* Step 1 — Odoo Config */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          <span className="inline-flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-baristas-brown-dark text-white text-[10px] flex items-center justify-center font-bold">1</span>
            Odoo Configuration *
          </span>
        </label>
        <select
          value={form.odoo_config}
          onChange={(e) => onOdooConfigChange(e.target.value ? Number(e.target.value) : '')}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-baristas-brown focus:border-transparent"
          required
        >
          <option value="">Select Odoo config…</option>
          {odooConfigs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}{o.is_active ? ' ✓' : ' (inactive)'}
            </option>
          ))}
        </select>
      </div>

      {/* Warning: config has no restaurant linked */}
      {selectedConfig && !selectedConfig.restaurant_id && (
        <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold mb-0.5">⚠️ No restaurant linked to this Odoo config</p>
          <p className="text-xs text-amber-700">
            Table sync requires a restaurant. Go to{' '}
            <a href="/admin/restaurants" className="underline font-medium">Restaurants</a>
            , edit or create a restaurant, and assign <strong>{selectedConfig.name}</strong> as its Odoo config.
          </p>
        </div>
      )}

      {/* Step 2 — POS */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          <span className="inline-flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-baristas-brown-dark text-white text-[10px] flex items-center justify-center font-bold">2</span>
            POS Configuration *
          </span>
        </label>
        <div className="relative">
          {ctx.posLoading ? (
            <div className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-baristas-brown rounded-full animate-spin" />
              Fetching POS configs from Odoo…
            </div>
          ) : (
            <select
              value={ctx.posConfigId}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : '';
                const name = ctx.posConfigs.find((p) => p.id === id)?.name ?? '';
                onPosSelect(id, name);
              }}
              disabled={!form.odoo_config || ctx.posConfigs.length === 0}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-baristas-brown focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
              required
            >
              <option value="">
                {!form.odoo_config
                  ? 'Select Odoo config first'
                  : ctx.posConfigs.length === 0
                    ? 'No POS configs available'
                    : 'Select POS…'}
              </option>
              {ctx.posConfigs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          {ctx.syncing && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-baristas-brown">
              <span className="w-3.5 h-3.5 border-2 border-baristas-brown/30 border-t-baristas-brown rounded-full animate-spin" />
              Syncing tables and floors from Odoo…
            </div>
          )}
        </div>
      </div>

      {/* Step 3 — Floor */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          <span className="inline-flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-baristas-brown-dark text-white text-[10px] flex items-center justify-center font-bold">3</span>
            Floor / Section
          </span>
        </label>
        <select
          value={ctx.floor}
          onChange={(e) => onFloorChange(e.target.value)}
          disabled={ctx.syncing || ctx.tables.length === 0}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-baristas-brown focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">
            {ctx.syncing ? 'Syncing…' : !ctx.posConfigId ? 'Select POS first' : floors.length === 0 ? 'No floors found' : 'All floors'}
          </option>
          {floors.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}{f.floor ? ` (Floor ${f.floor})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Step 4 — Table */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          <span className="inline-flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-baristas-brown-dark text-white text-[10px] flex items-center justify-center font-bold">4</span>
            Assigned Table
          </span>
        </label>
        <select
          value={form.table}
          onChange={(e) => field('table', e.target.value ? Number(e.target.value) : '')}
          disabled={ctx.syncing || filteredTables.length === 0}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-baristas-brown focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">
            {ctx.syncing ? 'Syncing…' : !ctx.posConfigId ? 'Select POS first' : filteredTables.length === 0 ? 'No tables found' : 'No pre-assigned table'}
          </option>
          {filteredTables.map((t) => (
            <option key={t.id} value={t.id}>Table {t.number} — {t.section}</option>
          ))}
        </select>
      </div>

      {/* Passcode */}
      {showPasscode && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Passcode (4–6 digits) *</label>
          <input
            type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={6}
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
        <input id="is_active" type="checkbox" checked={form.is_active}
          onChange={(e) => field('is_active', e.target.checked)}
          className="w-4 h-4 accent-baristas-brown-dark" />
        <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
      </div>

      {/* Allowed categories */}
      {ctx.posConfigId && ctx.categories.length > 0 && (
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Allowed Categories <span className="text-gray-400 font-normal">(leave all unchecked to show everything)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ctx.categories.map((cat) => {
              const checked = form.allowed_category_ids.includes(cat.id);
              return (
                <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    checked
                      ? 'bg-baristas-brown-dark text-white border-baristas-brown-dark'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-baristas-brown'
                  }`}>
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
