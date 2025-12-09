"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Table, tableService } from '@/services/table.service';

interface TableContextType {
  selectedTable: Table | null;
  tables: Table[];
  availableTables: Table[];
  isLoading: boolean;
  error: string | null;
  selectTable: (table: Table) => void;
  clearTable: () => void;
  loadTables: () => Promise<void>;
  loadAvailableTables: () => Promise<void>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export function TableProvider({ children }: { children: ReactNode }) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load selected table from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTable = localStorage.getItem('selected_table');
      if (savedTable) {
        try {
          setSelectedTable(JSON.parse(savedTable));
        } catch (e) {
          console.error('Error parsing saved table:', e);
          localStorage.removeItem('selected_table');
        }
      }
    }
  }, []);

  const selectTable = (table: Table) => {
    setSelectedTable(table);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_table', JSON.stringify(table));
    }
  };

  const clearTable = () => {
    setSelectedTable(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selected_table');
    }
  };

  const loadTables = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tableService.getTables();
      setTables(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tables');
      console.error('Error loading tables:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableTables = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tableService.getAvailableTables();
      setAvailableTables(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load available tables');
      console.error('Error loading available tables:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    selectedTable,
    tables,
    availableTables,
    isLoading,
    error,
    selectTable,
    clearTable,
    loadTables,
    loadAvailableTables,
  };

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>;
}

export function useTable() {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
}
