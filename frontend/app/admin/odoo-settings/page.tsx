"use client";

import { useState, useEffect } from "react";
import { odooService, OdooConfig, POSConfig, SyncLog, TableVerificationResult } from "@/services/odoo.service";
import { tableService, Table } from "@/services/table.service";

export default function OdooSettingsPage() {
  const [configs, setConfigs] = useState<OdooConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<OdooConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for new/edit config
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    database: "",
    username: "",
    password: "",
    timeout: 300,
    retry_attempts: 3,
    auto_sync_orders: true,
    sync_menu_enabled: true,
    sync_tables_enabled: true,
  });

  // POS Config state
  const [posConfigs, setPosConfigs] = useState<POSConfig[]>([]);
  const [selectedPOS, setSelectedPOS] = useState<number | null>(null);
  const [loadingPOS, setLoadingPOS] = useState(false);

  // Sync logs state
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Testing state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);

  // Table sync result state
  const [syncingTables, setSyncingTables] = useState(false);
  const [syncedTables, setSyncedTables] = useState<Table[] | null>(null);
  const [tableVerification, setTableVerification] = useState<TableVerificationResult | null>(null);
  const [showSyncedTables, setShowSyncedTables] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      const data = await odooService.getConfigs();
      setConfigs(data);
      const active = data.find(c => c.is_active);
      setActiveConfig(active || null);
      setError(null);
    } catch (err: any) {
      setError("Failed to load Odoo configurations");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (isEditing && activeConfig) {
        await odooService.updateConfig(activeConfig.id, formData);
        setSuccess("Configuration updated successfully");
      } else {
        await odooService.createConfig(formData);
        setSuccess("Configuration created successfully");
      }

      setShowForm(false);
      resetForm();
      fetchConfigs();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save configuration");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      url: "",
      database: "",
      username: "",
      password: "",
      timeout: 300,
      retry_attempts: 3,
      auto_sync_orders: true,
      sync_menu_enabled: true,
      sync_tables_enabled: true,
    });
    setIsEditing(false);
  };

  const handleEdit = (config: OdooConfig) => {
    setFormData({
      name: config.name,
      url: config.url,
      database: config.database,
      username: config.username,
      password: "", // Don't populate password for security
      timeout: config.timeout,
      retry_attempts: config.retry_attempts,
      auto_sync_orders: config.auto_sync_orders,
      sync_menu_enabled: config.sync_menu_enabled,
      sync_tables_enabled: config.sync_tables_enabled,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleTestConnection = async (config: OdooConfig) => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const result = await odooService.testConnection(config.id);
      setTestResult(result);
      if (result.success) {
        setSuccess("Connection test successful!");
        fetchConfigs(); // Refresh to get updated status
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || "Connection test failed"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleActivate = async (config: OdooConfig) => {
    try {
      await odooService.activateConfig(config.id);
      setSuccess(`Configuration "${config.name}" activated`);
      fetchConfigs();
    } catch (err: any) {
      setError("Failed to activate configuration");
    }
  };

  const handleDelete = async (config: OdooConfig) => {
    if (!confirm(`Are you sure you want to delete "${config.name}"?`)) return;

    try {
      await odooService.deleteConfig(config.id);
      setSuccess("Configuration deleted successfully");
      fetchConfigs();
    } catch (err: any) {
      setError("Failed to delete configuration");
    }
  };

  const loadPOSConfigs = async (config: OdooConfig) => {
    setLoadingPOS(true);
    setError(null);

    try {
      const result = await odooService.getPOSConfigs(config.id);
      setPosConfigs(result.pos_configs);
      setSelectedPOS(config.pos_config_id);
    } catch (err: any) {
      setError("Failed to load POS configurations. Make sure connection is working.");
    } finally {
      setLoadingPOS(false);
    }
  };

  const handleSelectPOS = async (config: OdooConfig, posId: number) => {
    const pos = posConfigs.find(p => p.id === posId);
    if (!pos) return;

    try {
      await odooService.selectPOSConfig(config.id, posId, pos.name);
      setSuccess(`POS configuration "${pos.name}" selected`);
      fetchConfigs();
    } catch (err: any) {
      setError("Failed to select POS configuration");
    }
  };

  const handleSyncMenu = async (config: OdooConfig) => {
    setError(null);
    setSuccess(null);
    try {
      const result = await odooService.syncMenuNow(config.id);
      setSuccess(result.message);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to sync menu from Odoo");
    }
  };

  const handleSyncTables = async (config: OdooConfig) => {
    setSyncingTables(true);
    setSyncedTables(null);
    setTableVerification(null);
    setError(null);
    setSuccess(null);

    try {
      // Run sync synchronously — backend does the work and returns results
      const result = await odooService.syncTablesNow(config.id);
      setSuccess(result.message);

      // Now fetch the tables and verification from Django
      const [tables, verification] = await Promise.all([
        tableService.getTables(),
        odooService.verifyTables(config.id).catch(() => null),
      ]);

      setSyncedTables(tables);
      if (verification) {
        setTableVerification(verification);
      }
      setShowSyncedTables(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to sync tables from Odoo");

      // Still try to show existing tables
      try {
        const tables = await tableService.getTables();
        if (tables.length > 0) {
          setSyncedTables(tables);
          setShowSyncedTables(true);
        }
      } catch {
        // ignore
      }
    } finally {
      setSyncingTables(false);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const logs = await odooService.getSyncLogs();
      setSyncLogs(logs);
      setShowLogs(true);
    } catch (err: any) {
      setError("Failed to load sync logs");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading Odoo configurations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Odoo Integration Settings</h1>
        <p className="text-gray-600">Configure connection to Odoo POS system and manage synchronization</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {success}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => { setShowForm(true); resetForm(); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add New Configuration
        </button>
        <button
          onClick={loadSyncLogs}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          View Sync Logs
        </button>
      </div>

      {/* Configuration Form */}
      {showForm && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? "Edit Configuration" : "New Configuration"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Configuration Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Odoo POS"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Odoo Server URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="http://localhost:10018"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.database}
                  onChange={(e) => setFormData({...formData, database: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="odoo_db"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required={!isEditing}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isEditing ? "Leave blank to keep current" : "Enter password"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData({...formData, timeout: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retry Attempts
                </label>
                <input
                  type="number"
                  value={formData.retry_attempts}
                  onChange={(e) => setFormData({...formData, retry_attempts: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.auto_sync_orders}
                  onChange={(e) => setFormData({...formData, auto_sync_orders: e.target.checked})}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Auto-sync orders to Odoo when confirmed</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.sync_menu_enabled}
                  onChange={(e) => setFormData({...formData, sync_menu_enabled: e.target.checked})}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Enable nightly menu synchronization from Odoo</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.sync_tables_enabled}
                  onChange={(e) => setFormData({...formData, sync_tables_enabled: e.target.checked})}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Enable nightly table synchronization from Odoo</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isEditing ? "Update Configuration" : "Create Configuration"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Configurations List */}
      <div className="space-y-4">
        {configs.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600 mb-4">No Odoo configurations yet</p>
            <button
              onClick={() => { setShowForm(true); resetForm(); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Configuration
            </button>
          </div>
        ) : (
          configs.map((config) => (
            <div
              key={config.id}
              className={`p-6 bg-white border-2 rounded-lg shadow-sm ${
                config.is_active ? "border-green-500 bg-green-50" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{config.name}</h3>
                    {config.is_active && (
                      <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                        ACTIVE
                      </span>
                    )}
                    {config.last_test_success ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        ✓ Connected
                      </span>
                    ) : config.last_test_at ? (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        ✗ Error
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                        Not Tested
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>URL:</strong> {config.url}</p>
                    <p><strong>Database:</strong> {config.database}</p>
                    <p><strong>Username:</strong> {config.username}</p>
                    {config.pos_config_name && (
                      <p><strong>POS Configuration:</strong> {config.pos_config_name}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {!config.is_active && (
                    <button
                      onClick={() => handleActivate(config)}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => handleTestConnection(config)}
                    disabled={testing}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {testing ? "Testing..." : "Test Connection"}
                  </button>
                  <button
                    onClick={() => handleEdit(config)}
                    className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(config)}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* POS Configuration Selection */}
              {config.is_active && config.last_test_success && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">POS Configuration</h4>
                  {posConfigs.length === 0 ? (
                    <button
                      onClick={() => loadPOSConfigs(config)}
                      disabled={loadingPOS}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loadingPOS ? "Loading..." : "Load POS Configurations"}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={selectedPOS || ""}
                        onChange={(e) => handleSelectPOS(config, parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a POS configuration...</option>
                        {posConfigs.map((pos) => (
                          <option key={pos.id} value={pos.id}>
                            {pos.name} ({pos.company_name})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => loadPOSConfigs(config)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Refresh POS list
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Sync Actions */}
              {config.is_active && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Manual Synchronization</h4>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => handleSyncMenu(config)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Sync Menu Now
                    </button>
                    <button
                      onClick={() => handleSyncTables(config)}
                      disabled={syncingTables}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {syncingTables ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Syncing Tables...
                        </>
                      ) : (
                        "Sync Tables Now"
                      )}
                    </button>
                    {syncedTables && (
                      <button
                        onClick={() => setShowSyncedTables(!showSyncedTables)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        {showSyncedTables ? "Hide Tables" : `Show Tables (${syncedTables.length})`}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-600">
                    Manual sync will override automatic nightly synchronization
                  </p>

                  {/* Table Sync Results */}
                  {syncingTables && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-blue-800">Syncing tables from Odoo... This may take a few seconds.</p>
                      </div>
                    </div>
                  )}

                  {/* Verification Summary */}
                  {tableVerification && showSyncedTables && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                      <h5 className="font-semibold text-gray-900 mb-3">Sync Verification</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-blue-700">{tableVerification.summary.total_django_tables}</div>
                          <div className="text-xs text-gray-600">Total Tables</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-green-700">{tableVerification.summary.linked_to_odoo}</div>
                          <div className="text-xs text-gray-600">Linked to Odoo</div>
                        </div>
                        <div className={`rounded-lg p-3 text-center ${tableVerification.summary.not_linked > 0 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                          <div className={`text-2xl font-bold ${tableVerification.summary.not_linked > 0 ? 'text-yellow-700' : 'text-gray-400'}`}>
                            {tableVerification.summary.not_linked}
                          </div>
                          <div className="text-xs text-gray-600">Not Linked</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-purple-700">{tableVerification.summary.total_odoo_tables}</div>
                          <div className="text-xs text-gray-600">Odoo Tables</div>
                        </div>
                        <div className={`rounded-lg p-3 text-center ${tableVerification.summary.missing_in_django > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                          <div className={`text-2xl font-bold ${tableVerification.summary.missing_in_django > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                            {tableVerification.summary.missing_in_django}
                          </div>
                          <div className="text-xs text-gray-600">Missing in Django</div>
                        </div>
                        <div className={`rounded-lg p-3 text-center ${tableVerification.summary.stale_in_django > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                          <div className={`text-2xl font-bold ${tableVerification.summary.stale_in_django > 0 ? 'text-orange-700' : 'text-gray-400'}`}>
                            {tableVerification.summary.stale_in_django}
                          </div>
                          <div className="text-xs text-gray-600">Stale</div>
                        </div>
                      </div>

                      {/* Warnings */}
                      {tableVerification.summary.not_linked > 0 && (
                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                          <strong>Warning:</strong> {tableVerification.summary.not_linked} table(s) are not linked to Odoo.
                          Orders from these tables won&apos;t appear in Odoo POS floor plan.
                        </div>
                      )}
                      {tableVerification.summary.missing_in_django > 0 && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                          <strong>Warning:</strong> {tableVerification.summary.missing_in_django} Odoo table(s) are not imported into Django.
                          Run sync again to import them.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Synced Tables List */}
                  {syncedTables && showSyncedTables && (
                    <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h5 className="font-semibold text-gray-900">
                          Synced Tables ({syncedTables.length})
                        </h5>
                      </div>
                      {syncedTables.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          No tables found. Make sure your Odoo POS has tables configured.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Floor</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Odoo Link</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {syncedTables.map((table) => {
                                const linked = tableVerification?.linked_tables?.find(lt => lt.id === table.id);
                                const isLinked = !!linked;
                                return (
                                  <tr key={table.id} className={`hover:bg-gray-50 ${!table.is_active ? 'opacity-50' : ''}`}>
                                    <td className="px-4 py-2 text-gray-600">{table.id}</td>
                                    <td className="px-4 py-2 font-medium text-gray-900">Table {table.number}</td>
                                    <td className="px-4 py-2">
                                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                        table.section === 'INDOOR' ? 'bg-blue-100 text-blue-700' :
                                        table.section === 'OUTDOOR' ? 'bg-green-100 text-green-700' :
                                        table.section === 'VIP' ? 'bg-purple-100 text-purple-700' :
                                        table.section === 'BAR' ? 'bg-orange-100 text-orange-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {table.section}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-gray-600">{table.capacity} seats</td>
                                    <td className="px-4 py-2 text-gray-600">{table.floor}</td>
                                    <td className="px-4 py-2">
                                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                        table.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                        table.status === 'OCCUPIED' ? 'bg-red-100 text-red-700' :
                                        table.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {table.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2">
                                      {isLinked ? (
                                        <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium">
                                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                          Odoo #{linked!.odoo_table_id}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-yellow-600 text-xs font-medium">
                                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                          Not linked
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Connection Test Result */}
              {testResult && (
                <div className={`mt-4 p-4 rounded-lg ${testResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                  <p className="font-semibold mb-1">Connection Test Result:</p>
                  <p className="text-sm">{testResult.message}</p>
                </div>
              )}

              {/* Error Message */}
              {config.last_test_error && !config.last_test_success && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg text-red-800 text-sm">
                  <p className="font-semibold mb-1">Last Error:</p>
                  <p>{config.last_test_error}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Sync Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Synchronization Logs</h2>
                <button
                  onClick={() => setShowLogs(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {syncLogs.length === 0 ? (
                <p className="text-center text-gray-600">No sync logs yet</p>
              ) : (
                <div className="space-y-3">
                  {syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-lg border ${
                        log.status === "SUCCESS"
                          ? "bg-green-50 border-green-200"
                          : log.status === "FAILED"
                          ? "bg-red-50 border-red-200"
                          : "bg-yellow-50 border-yellow-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{log.sync_type_display}</span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              log.status === "SUCCESS"
                                ? "bg-green-600 text-white"
                                : log.status === "FAILED"
                                ? "bg-red-600 text-white"
                                : "bg-yellow-600 text-white"
                            }`}>
                              {log.status_display}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                          {log.order_number && (
                            <p className="text-sm text-gray-600">Order: {log.order_number}</p>
                          )}
                          {log.error_message && (
                            <p className="text-sm text-red-700 mt-2">{log.error_message}</p>
                          )}
                        </div>
                        {log.status === "FAILED" && log.retry_count < log.max_retries && (
                          <button
                            onClick={async () => {
                              try {
                                await odooService.retrySyncLog(log.id);
                                setSuccess("Retry triggered");
                                loadSyncLogs();
                              } catch (err) {
                                setError("Failed to retry sync");
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
