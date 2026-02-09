"use client";

import { useEffect, useState } from "react";
import { tableService, Table } from "@/services/table.service";

interface TableFormData {
  number: string;
  section: string;
  capacity: number;
  floor: number;
  is_active: boolean;
}

const initialFormData: TableFormData = {
  number: "",
  section: "",
  capacity: 4,
  floor: 1,
  is_active: true,
};

export default function TablesManagement() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState<TableFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await tableService.getTables();
      setTables(data);
    } catch (error) {
      console.error("Error loading tables:", error);
      alert("Failed to load tables. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTable(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleOpenEdit = (table: Table) => {
    setEditingTable(table);
    setFormData({
      number: table.number,
      section: table.section,
      capacity: table.capacity,
      floor: table.floor,
      is_active: table.is_active,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTable(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingTable) {
        await tableService.updateTable(editingTable.id, formData);
        alert("Table updated successfully!");
      } else {
        await tableService.createTable(formData);
        alert("Table created successfully!");
      }
      handleCloseModal();
      await loadTables();
    } catch (error) {
      console.error("Error saving table:", error);
      alert("Failed to save table. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (table: Table) => {
    if (!confirm(`Are you sure you want to delete Table ${table.number}?`)) {
      return;
    }

    try {
      await tableService.deleteTable(table.id);
      alert("Table deleted successfully!");
      await loadTables();
    } catch (error) {
      console.error("Error deleting table:", error);
      alert("Failed to delete table. Please try again.");
    }
  };

  const handleGenerateQR = async (table: Table) => {
    try {
      const result = await tableService.generateQR(table.id);
      if (result.qr_code) {
        // Open QR code in new window
        const qrWindow = window.open("", "_blank");
        if (qrWindow) {
          qrWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>QR Code - Table ${table.number}</title>
                <style>
                  body {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    font-family: system-ui, -apple-system, sans-serif;
                    background: #f5f5f5;
                  }
                  .container {
                    text-align: center;
                    background: white;
                    padding: 40px;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                  }
                  h1 { margin: 0 0 8px; color: #2D1810; }
                  p { color: #666; margin: 0 0 24px; }
                  img { max-width: 300px; height: auto; }
                  .url {
                    margin-top: 16px;
                    padding: 12px;
                    background: #f0f0f0;
                    border-radius: 8px;
                    font-size: 14px;
                    word-break: break-all;
                  }
                  button {
                    margin-top: 20px;
                    padding: 12px 24px;
                    background: #4A3428;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                  }
                  button:hover { background: #2D1810; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>Table ${table.number}</h1>
                  <p>${table.section} - Floor ${table.floor}</p>
                  <img src="${result.qr_code}" alt="QR Code for Table ${table.number}" />
                  <div class="url">${window.location.origin}/tablet/${table.id}</div>
                  <button onclick="window.print()">Print QR Code</button>
                </div>
              </body>
            </html>
          `);
        }
      }
      await loadTables();
    } catch (error) {
      console.error("Error generating QR:", error);
      alert("Failed to generate QR code. Please try again.");
    }
  };

  const handleCopyTabletUrl = (table: Table) => {
    const url = `${window.location.origin}/tablet/${table.id}`;
    navigator.clipboard.writeText(url);
    alert(`Tablet URL copied: ${url}`);
  };

  const handleSyncFromOdoo = async () => {
    setSyncing(true);
    try {
      const result = await tableService.syncTablesFromOdoo();
      alert(result.message || `Synced ${result.synced} tables from Odoo`);
      await loadTables();
    } catch (error) {
      console.error("Error syncing from Odoo:", error);
      alert("Failed to sync tables from Odoo. Please check your Odoo connection.");
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800";
      case "OCCUPIED":
        return "bg-red-100 text-red-800";
      case "RESERVED":
        return "bg-yellow-100 text-yellow-800";
      case "MAINTENANCE":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading tables...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Table Management</h1>
          <p className="text-gray-600">
            Manage restaurant tables, generate QR codes, and sync with Odoo
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSyncFromOdoo}
            disabled={syncing}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 flex items-center gap-2"
          >
            {syncing ? (
              <>
                <span className="animate-spin">↻</span> Syncing...
              </>
            ) : (
              <>⟳ Sync from Odoo</>
            )}
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-baristas-brown text-white rounded-lg hover:bg-baristas-brown-dark flex items-center gap-2"
          >
            + Add Table
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Tables</div>
          <div className="text-3xl font-bold text-gray-900">{tables.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-green-200">
          <div className="text-sm text-gray-600 mb-1">Available</div>
          <div className="text-3xl font-bold text-green-600">
            {tables.filter((t) => t.status === "AVAILABLE").length}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-red-200">
          <div className="text-sm text-gray-600 mb-1">Occupied</div>
          <div className="text-3xl font-bold text-red-600">
            {tables.filter((t) => t.status === "OCCUPIED").length}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-200">
          <div className="text-sm text-gray-600 mb-1">Total Capacity</div>
          <div className="text-3xl font-bold text-blue-600">
            {tables.reduce((sum, t) => sum + t.capacity, 0)}
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Table
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Section / Floor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Odoo Sync
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tables.map((table) => (
              <tr key={table.id} className={!table.is_active ? "bg-gray-50 opacity-60" : ""}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-baristas-cream rounded-lg flex items-center justify-center">
                      <span className="text-lg">🪑</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Table {table.number}
                      </div>
                      {!table.is_active && (
                        <span className="text-xs text-red-500">Inactive</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{table.section}</div>
                  <div className="text-sm text-gray-500">Floor {table.floor}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{table.capacity} seats</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      table.status
                    )}`}
                  >
                    {table.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {table.qr_code ? (
                    <span className="text-green-600 text-sm flex items-center gap-1">
                      ✓ QR Ready
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">No QR</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateQR(table)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      title="Generate QR Code"
                    >
                      QR
                    </button>
                    <button
                      onClick={() => handleCopyTabletUrl(table)}
                      className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                      title="Copy Tablet URL"
                    >
                      URL
                    </button>
                    <button
                      onClick={() => handleOpenEdit(table)}
                      className="px-3 py-1.5 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                      title="Edit Table"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(table)}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      title="Delete Table"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tables.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No tables found</p>
            <p className="text-sm">
              Create a table or sync from Odoo to get started.
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingTable ? `Edit Table ${editingTable.number}` : "Create New Table"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Number *
                  </label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-baristas-brown focus:border-transparent"
                    placeholder="e.g., 1, A1, T-01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section *
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-baristas-brown focus:border-transparent"
                  >
                    <option value="">Select section...</option>
                    <option value="INDOOR">Indoor</option>
                    <option value="OUTDOOR">Outdoor</option>
                    <option value="VIP">VIP</option>
                    <option value="BAR">Bar</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capacity: parseInt(e.target.value) || 1,
                        })
                      }
                      min="1"
                      max="20"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-baristas-brown focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Floor
                    </label>
                    <input
                      type="number"
                      value={formData.floor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          floor: parseInt(e.target.value) || 1,
                        })
                      }
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-baristas-brown focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-baristas-brown focus:ring-baristas-brown border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Table is active
                  </label>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-baristas-brown text-white rounded-lg hover:bg-baristas-brown-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Saving..."
                    : editingTable
                    ? "Update Table"
                    : "Create Table"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
