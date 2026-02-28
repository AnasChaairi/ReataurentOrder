"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTable } from "@/contexts/TableContext";
import { useAuth } from "@/contexts/AuthContext";
import { Table } from "@/services/table.service";
import { MapPin, Users, ChevronLeft, CheckCircle, Settings, Trash2 } from "lucide-react";

export default function CustomerSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { selectedTable, availableTables, isLoading, error, selectTable, clearTable, loadAvailableTables } = useTable();

  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [manualNumber, setManualNumber] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    loadAvailableTables();
  }, []);

  const tablesBySection = useMemo(() => {
    const grouped: Record<string, Table[]> = {};
    for (const table of availableTables) {
      const section = table.section || "OTHER";
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(table);
    }
    return grouped;
  }, [availableTables]);

  const sections = useMemo(() => Object.keys(tablesBySection), [tablesBySection]);

  useEffect(() => {
    if (sections.length === 1 && !selectedSection) {
      setSelectedSection(sections[0]);
    }
  }, [sections, selectedSection]);

  const handleTableSelect = (table: Table) => {
    selectTable(table);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleManualEntry = () => {
    setManualError(null);
    if (!manualNumber.trim()) {
      setManualError("Please enter a table number");
      return;
    }
    const table = availableTables.find(
      (t) => t.number.toLowerCase() === manualNumber.trim().toLowerCase()
    );
    if (table) {
      handleTableSelect(table);
      setManualNumber("");
    } else {
      setManualError("Table not found or unavailable. Please check the number.");
    }
  };

  const handleClearTable = () => {
    clearTable();
    setSelectedSection(null);
  };

  const getSectionLabel = (section: string) => {
    switch (section.toUpperCase()) {
      case "INDOOR": return "Indoor Area";
      case "OUTDOOR": return "Outdoor Terrace";
      case "VIP": return "VIP Lounge";
      case "BAR": return "Bar Area";
      default: return section;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-baristas-cream">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-baristas-brown-dark border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative bg-baristas-brown-dark text-white py-24 pt-36 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/baristas-background.png" alt="" aria-hidden className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-baristas-brown-dark/70" />
        </div>
        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-baristas-cream text-sm mb-5">
            <Settings className="w-4 h-4" />
            Your Settings
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
            Table Configuration
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            {user?.first_name ? `Hi ${user.first_name}! ` : ""}Set your table once and all your orders will be placed there automatically.
          </p>
        </div>
      </section>

      <section className="py-14 bg-baristas-cream/30">
        <div className="container mx-auto px-4 max-w-3xl">

          {/* Current table banner */}
          {selectedTable && (
            <div className={`mb-8 p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${
              saved ? "bg-green-50 border-green-400" : "bg-white border-baristas-beige"
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-baristas-brown-dark/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className={`w-6 h-6 ${saved ? "text-green-500" : "text-baristas-brown-dark"}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                    {saved ? "Table saved!" : "Current table"}
                  </p>
                  <p className="font-bold text-baristas-brown-dark text-lg">
                    Table {selectedTable.number}
                  </p>
                  <p className="text-sm text-gray-500">
                    {getSectionLabel(selectedTable.section)} · Floor {selectedTable.floor} · {selectedTable.capacity} seats
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push("/checkout")}
                  className="px-4 py-2 bg-baristas-brown-dark text-white text-sm font-semibold rounded-xl hover:bg-baristas-brown transition-colors"
                >
                  Go to Checkout
                </button>
                <button
                  onClick={handleClearTable}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Remove table"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Manual entry */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-1">Enter table number</h2>
            <p className="text-sm text-gray-500 mb-4">Find your table number on the sign or QR code on the table.</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={manualNumber}
                onChange={(e) => { setManualNumber(e.target.value); setManualError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleManualEntry()}
                placeholder="e.g. T-01"
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-baristas-brown text-sm transition-colors"
              />
              <button
                onClick={handleManualEntry}
                className="px-5 py-2.5 bg-baristas-brown-dark text-white rounded-xl text-sm font-semibold hover:bg-baristas-brown transition-colors"
              >
                Confirm
              </button>
            </div>
            {manualError && <p className="text-red-500 text-xs mt-2">{manualError}</p>}
          </div>

          {/* OR divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">or browse</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-baristas-brown border-t-transparent mb-3" />
              <p className="text-gray-500 text-sm">Loading tables…</p>
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
              <p className="text-red-600 text-sm mb-3">{error}</p>
              <button onClick={loadAvailableTables} className="text-sm text-red-600 underline">Retry</button>
            </div>
          )}

          {/* No tables */}
          {!isLoading && !error && availableTables.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No available tables right now</p>
              <p className="text-sm text-gray-400 mt-1">Please ask a staff member for help</p>
            </div>
          )}

          {/* Section picker */}
          {!isLoading && !error && availableTables.length > 0 && !selectedSection && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Where are you seated?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sections.map((section) => (
                  <button
                    key={section}
                    onClick={() => setSelectedSection(section)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-baristas-cream hover:bg-baristas-beige border-2 border-baristas-beige hover:border-baristas-brown transition-all text-left"
                  >
                    <MapPin className="w-5 h-5 text-baristas-brown flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-baristas-brown-dark">{getSectionLabel(section)}</p>
                      <p className="text-xs text-gray-500">{tablesBySection[section].length} table{tablesBySection[section].length !== 1 ? "s" : ""} available</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Table grid */}
          {!isLoading && !error && selectedSection && tablesBySection[selectedSection] && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={() => setSelectedSection(null)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-baristas-brown-dark transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <h2 className="font-bold text-gray-900">{getSectionLabel(selectedSection)}</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {tablesBySection[selectedSection].map((table) => {
                  const isActive = selectedTable?.id === table.id;
                  return (
                    <button
                      key={table.id}
                      onClick={() => handleTableSelect(table)}
                      className={`relative p-4 rounded-xl border-2 transition-all text-center ${
                        isActive
                          ? "bg-baristas-brown-dark border-baristas-brown-dark text-white"
                          : "bg-baristas-cream border-baristas-beige hover:border-baristas-brown hover:bg-baristas-beige"
                      }`}
                    >
                      {isActive && (
                        <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-white" />
                      )}
                      <p className={`font-bold text-lg mb-1 ${isActive ? "text-white" : "text-baristas-brown-dark"}`}>
                        {table.number}
                      </p>
                      <div className={`flex items-center justify-center gap-1 text-xs ${isActive ? "text-white/70" : "text-gray-500"}`}>
                        <Users className="w-3 h-3" />
                        {table.capacity}
                      </div>
                      <p className={`text-xs mt-0.5 ${isActive ? "text-white/60" : "text-gray-400"}`}>
                        Floor {table.floor}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </section>

      <Footer />
    </div>
  );
}
