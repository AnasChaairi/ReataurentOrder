"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTable } from "@/contexts/TableContext";

export default function SelectTablePage() {
  const router = useRouter();
  const { availableTables, isLoading, error, selectTable, loadAvailableTables } = useTable();
  const [manualTableNumber, setManualTableNumber] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableTables();
  }, []);

  const handleTableSelect = (table: any) => {
    selectTable(table);
    router.push("/checkout");
  };

  const handleManualEntry = () => {
    setSearchError(null);

    if (!manualTableNumber.trim()) {
      setSearchError("Please enter a table number");
      return;
    }

    // Find table by number
    const table = availableTables.find(
      (t) => t.number.toLowerCase() === manualTableNumber.toLowerCase()
    );

    if (table) {
      handleTableSelect(table);
    } else {
      setSearchError("Table not found or not available. Please check the number.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative section-dark text-white py-24 pt-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
            SELECT YOUR TABLE
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Please select your table number to continue with your order
          </p>
        </div>
      </section>

      {/* Table Selection Content */}
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
                    onKeyPress={(e) => {
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

              {/* QR Code Option (Optional) */}
              <div className="mt-8 text-center">
                <p className="text-gray-600 mb-4">or</p>
                <button className="btn-secondary px-6 py-3 flex items-center gap-2 mx-auto">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Scan QR Code
                </button>
              </div>
            </div>

            {/* Available Tables Grid */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-baristas-brown-dark mb-6 text-center">
                Available Tables
              </h2>

              {isLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-baristas-brown border-t-transparent mb-4"></div>
                  <p className="text-gray-600">Loading available tables...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-12">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button onClick={loadAvailableTables} className="btn-primary">
                    Retry
                  </button>
                </div>
              )}

              {!isLoading && !error && availableTables.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-2">No tables available at the moment</p>
                  <p className="text-sm text-gray-500">Please contact staff for assistance</p>
                </div>
              )}

              {!isLoading && !error && availableTables.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableTables.map((table) => (
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
                          {table.number}
                        </p>
                        <p className="text-sm text-gray-600">{table.section}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Capacity: {table.capacity}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-2">
                Can't find your table?
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
