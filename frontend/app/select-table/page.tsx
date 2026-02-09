"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTable } from "@/contexts/TableContext";
import { Table } from "@/services/table.service";

export default function SelectTablePage() {
  const router = useRouter();
  const { availableTables, isLoading, error, selectTable, loadAvailableTables } = useTable();
  const [manualTableNumber, setManualTableNumber] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableTables();
  }, []);

  // Group tables by section (room)
  const tablesBySection = useMemo(() => {
    const grouped: Record<string, Table[]> = {};
    for (const table of availableTables) {
      const section = table.section || "OTHER";
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(table);
    }
    return grouped;
  }, [availableTables]);

  const sections = useMemo(() => Object.keys(tablesBySection), [tablesBySection]);

  // Auto-select section if only one exists
  useEffect(() => {
    if (sections.length === 1 && !selectedSection) {
      setSelectedSection(sections[0]);
    }
  }, [sections, selectedSection]);

  const handleTableSelect = (table: Table) => {
    selectTable(table);
    router.push("/checkout");
  };

  const handleManualEntry = () => {
    setSearchError(null);

    if (!manualTableNumber.trim()) {
      setSearchError("Please enter a table number");
      return;
    }

    const table = availableTables.find(
      (t) => t.number.toLowerCase() === manualTableNumber.toLowerCase()
    );

    if (table) {
      handleTableSelect(table);
    } else {
      setSearchError("Table not found or not available. Please check the number.");
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section.toUpperCase()) {
      case "INDOOR":
        return (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case "OUTDOOR":
        return (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case "VIP":
        return (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case "BAR":
        return (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
    }
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

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative section-dark text-white py-24 pt-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
            {selectedSection ? "SELECT YOUR TABLE" : "SELECT YOUR AREA"}
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            {selectedSection
              ? `Choose a table in the ${getSectionLabel(selectedSection)}`
              : "Please select the area where you are seated"}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 section-light">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Manual Entry Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
              <h2 className="text-2xl font-bold text-baristas-brown-dark mb-6 text-center">
                Enter Table Number
              </h2>
              <p className="text-center text-gray-600 mb-6">
                Look for your table number on the table sign or scan the QR code
              </p>

              <div className="max-w-md mx-auto">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={manualTableNumber}
                    onChange={(e) => {
                      setManualTableNumber(e.target.value);
                      setSearchError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleManualEntry();
                      }
                    }}
                    placeholder="Enter table number (e.g., T-01)"
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-baristas-brown transition-colors text-lg"
                  />
                  <button
                    onClick={handleManualEntry}
                    className="btn-primary px-8"
                  >
                    Continue
                  </button>
                </div>
                {searchError && (
                  <p className="text-red-600 text-sm mt-2 text-center">{searchError}</p>
                )}
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-baristas-brown border-t-transparent mb-4"></div>
                <p className="text-gray-600">Loading available tables...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button onClick={loadAvailableTables} className="btn-primary">
                  Retry
                </button>
              </div>
            )}

            {/* No tables */}
            {!isLoading && !error && availableTables.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <p className="text-gray-600 mb-2">No tables available at the moment</p>
                <p className="text-sm text-gray-500">Please contact staff for assistance</p>
              </div>
            )}

            {/* Step 1: Room/Section Selection */}
            {!isLoading && !error && availableTables.length > 0 && !selectedSection && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-baristas-brown-dark mb-6 text-center">
                  Where are you seated?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sections.map((section) => (
                    <button
                      key={section}
                      onClick={() => setSelectedSection(section)}
                      className="group bg-baristas-cream hover:bg-baristas-beige border-2 border-baristas-beige hover:border-baristas-brown rounded-xl p-8 transition-all transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-baristas-brown transition-colors text-baristas-brown group-hover:text-white">
                          {getSectionIcon(section)}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-baristas-brown-dark text-xl mb-1">
                            {getSectionLabel(section)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {tablesBySection[section].length} table{tablesBySection[section].length !== 1 ? "s" : ""} available
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Table Selection within Room */}
            {!isLoading && !error && selectedSection && tablesBySection[selectedSection] && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => setSelectedSection(null)}
                    className="text-baristas-brown-dark hover:text-baristas-brown flex items-center gap-2 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to areas
                  </button>
                  <h2 className="text-2xl font-bold text-baristas-brown-dark flex-1 text-center">
                    {getSectionLabel(selectedSection)}
                  </h2>
                  <div className="w-24"></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tablesBySection[selectedSection].map((table) => (
                    <button
                      key={table.id}
                      onClick={() => handleTableSelect(table)}
                      className="group relative bg-baristas-cream hover:bg-baristas-beige border-2 border-baristas-beige hover:border-baristas-brown rounded-xl p-6 transition-all transform hover:scale-105"
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-baristas-brown transition-colors">
                          <svg className="w-8 h-8 text-baristas-brown group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="font-bold text-baristas-brown-dark text-lg mb-1">
                          Table {table.number}
                        </p>
                        <p className="text-xs text-gray-500">
                          {table.capacity} seat{table.capacity !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Floor {table.floor}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-2">
                Can&apos;t find your table?
              </p>
              <p className="text-sm text-gray-500">
                Please ask a staff member for assistance
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
