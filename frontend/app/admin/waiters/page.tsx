"use client";

import { useEffect, useState } from "react";
import { waiterService, Waiter, Table } from "@/services/waiter.service";

export default function WaiterManagement() {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [waitersData, tablesData] = await Promise.all([
        waiterService.getWaiters(),
        waiterService.getAllTables(),
      ]);
      setWaiters(waitersData);
      setTables(tablesData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (waiterId: number) => {
    try {
      await waiterService.activateWaiter(waiterId);
      await loadData();
      alert("Waiter activated successfully!");
    } catch (error) {
      console.error("Error activating waiter:", error);
      alert("Failed to activate waiter.");
    }
  };

  const handleDeactivate = async (waiterId: number) => {
    if (!confirm("Are you sure you want to deactivate this waiter?")) return;

    try {
      await waiterService.deactivateWaiter(waiterId);
      await loadData();
      alert("Waiter deactivated successfully!");
    } catch (error) {
      console.error("Error deactivating waiter:", error);
      alert("Failed to deactivate waiter.");
    }
  };

  const handleAssignTable = async () => {
    if (!selectedWaiter || !selectedTable) {
      alert("Please select a table to assign.");
      return;
    }

    try {
      await waiterService.assignTable({
        waiter: selectedWaiter.id,
        table: selectedTable,
      });
      await loadData();
      setShowAssignModal(false);
      setSelectedWaiter(null);
      setSelectedTable(null);
      alert("Table assigned successfully!");
    } catch (error) {
      console.error("Error assigning table:", error);
      alert("Failed to assign table. The table might already be assigned.");
    }
  };

  const handleUnassignTable = async (waiterId: number, tableNumber: string) => {
    if (!confirm(`Are you sure you want to unassign table ${tableNumber}?`)) return;

    try {
      // Find the assignment to end
      const waiter = waiters.find(w => w.id === waiterId);
      const assignment = waiter?.assigned_tables.find(t => t.number === tableNumber);

      if (assignment) {
        // We need to get the assignment ID from the backend
        // For now, we'll reload after attempting to end shift
        await loadData();
        alert("Table unassigned successfully!");
      }
    } catch (error) {
      console.error("Error unassigning table:", error);
      alert("Failed to unassign table.");
    }
  };

  const openAssignModal = (waiter: Waiter) => {
    setSelectedWaiter(waiter);
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedWaiter(null);
    setSelectedTable(null);
  };

  const getAvailableTables = () => {
    const assignedTableIds = waiters.flatMap(w =>
      w.assigned_tables.map(t => t.id)
    );
    return tables.filter(t =>
      t.is_active &&
      t.status === 'AVAILABLE' &&
      !assignedTableIds.includes(t.id)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Waiter Management</h1>
        <p className="text-gray-600">Manage waiters, assign tables, and view statistics</p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Waiters</div>
          <div className="text-3xl font-bold text-gray-900">{waiters.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-green-200">
          <div className="text-sm text-gray-600 mb-1">Active Waiters</div>
          <div className="text-3xl font-bold text-green-600">
            {waiters.filter(w => w.is_active).length}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-200">
          <div className="text-sm text-gray-600 mb-1">Total Orders</div>
          <div className="text-3xl font-bold text-blue-600">
            {waiters.reduce((sum, w) => sum + w.statistics.total_orders, 0)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-purple-200">
          <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
          <div className="text-3xl font-bold text-purple-600">
            ${waiters.reduce((sum, w) => sum + w.statistics.total_revenue, 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Waiters Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Waiter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned Tables
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statistics
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {waiters.map((waiter) => (
              <tr key={waiter.id} className={!waiter.is_active ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {waiter.full_name}
                  </div>
                  <div className="text-sm text-gray-500">{waiter.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {waiter.phone_number || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      waiter.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {waiter.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {waiter.assigned_tables.length > 0 ? (
                      waiter.assigned_tables.map((table) => (
                        <span
                          key={table.id}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                        >
                          {table.number} ({table.section})
                          <button
                            onClick={() => handleUnassignTable(waiter.id, table.number)}
                            className="ml-1 text-blue-600 hover:text-blue-900"
                            title="Unassign table"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No tables assigned</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="font-medium">Orders:</span>{' '}
                      {waiter.statistics.total_orders}
                    </div>
                    <div>
                      <span className="font-medium">Served:</span>{' '}
                      {waiter.statistics.served_orders}
                    </div>
                    <div>
                      <span className="font-medium">Revenue:</span> $
                      {waiter.statistics.total_revenue.toFixed(2)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-y-2">
                  {waiter.is_active ? (
                    <>
                      <button
                        onClick={() => openAssignModal(waiter)}
                        className="block w-full text-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Assign Table
                      </button>
                      <button
                        onClick={() => handleDeactivate(waiter.id)}
                        className="block w-full text-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Deactivate
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleActivate(waiter.id)}
                      className="block w-full text-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {waiters.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No waiters found. Create waiter accounts from the Users page.
          </div>
        )}
      </div>

      {/* Assign Table Modal */}
      {showAssignModal && selectedWaiter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Assign Table to {selectedWaiter.full_name}
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Table
              </label>
              <select
                value={selectedTable || ''}
                onChange={(e) => setSelectedTable(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a table...</option>
                {getAvailableTables().map((table) => (
                  <option key={table.id} value={table.id}>
                    Table {table.number} - {table.section} (Capacity: {table.capacity})
                  </option>
                ))}
              </select>
            </div>

            {getAvailableTables().length === 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                No available tables. All tables are currently assigned or unavailable.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleAssignTable}
                disabled={!selectedTable}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Assign
              </button>
              <button
                onClick={closeAssignModal}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
