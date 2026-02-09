"use client";

import React, { createContext, useState, useContext, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { TabletTable, TabletContextType } from '@/types/tablet.types';
import { tableService } from '@/services/table.service';
import { useCart } from '@/contexts/CartContext';

const TabletContext = createContext<TabletContextType | undefined>(undefined);

interface TabletProviderProps {
  children: ReactNode;
}

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const POST_ORDER_RESET_TIMEOUT = 60 * 1000; // 60 seconds after order placed

export function TabletProvider({ children }: TabletProviderProps) {
  const [table, setTable] = useState<TabletTable | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [orderJustPlaced, setOrderJustPlaced] = useState(false);
  const { resetCart } = useCart();

  // Detect kiosk/standalone mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsKioskMode(isStandalone);
    }
  }, []);

  // Prevent browser navigation in kiosk mode
  useEffect(() => {
    if (!isKioskMode || !table) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    const handlePopState = (e: PopStateEvent) => {
      // Push state back to prevent back navigation
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isKioskMode, table]);

  // Auto-reset after order placed (60s timer)
  useEffect(() => {
    if (!orderJustPlaced || !table) return;

    const timer = setTimeout(() => {
      resetCart();
      setOrderJustPlaced(false);
    }, POST_ORDER_RESET_TIMEOUT);

    return () => clearTimeout(timer);
  }, [orderJustPlaced, table, resetCart]);

  // Idle timer - reset to welcome after 5 min of inactivity
  useEffect(() => {
    if (!table) return;

    let idleTimer: NodeJS.Timeout | null = null;

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        resetCart();
        setOrderJustPlaced(false);
        // In kiosk mode, stay on tablet page; just reset the cart
        if (!isKioskMode && typeof window !== 'undefined') {
          window.location.href = `/tablet/${table.id}`;
        }
      }, IDLE_TIMEOUT);
    };

    const events = ['mousedown', 'mousemove', 'touchstart', 'touchmove', 'keydown', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    resetIdleTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [table, isKioskMode, resetCart]);

  const initializeTable = useCallback(async (tableId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const tableData = await tableService.getTable(tableId);

      if (!tableData.is_active) {
        setError('This table is currently inactive. Please contact staff.');
        setTable(null);
        return;
      }

      setTable({
        id: tableData.id,
        number: tableData.number,
        section: tableData.section,
        capacity: tableData.capacity,
        floor: tableData.floor,
        status: tableData.status,
        is_active: tableData.is_active,
        qr_code: tableData.qr_code,
      });
    } catch (err: any) {
      console.error('Error initializing table:', err);
      if (err?.response?.status === 404) {
        setError('Table not found. Please contact staff.');
      } else {
        setError('Failed to load table information. Please contact staff.');
      }
      setTable(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetForNextCustomer = useCallback(() => {
    resetCart();
    setOrderJustPlaced(false);
  }, [resetCart]);

  const setOrderPlaced = useCallback((placed: boolean) => {
    setOrderJustPlaced(placed);
  }, []);

  const value: TabletContextType = useMemo(
    () => ({
      table,
      isLoading,
      error,
      isKioskMode,
      orderJustPlaced,
      initializeTable,
      resetForNextCustomer,
      setOrderPlaced,
    }),
    [table, isLoading, error, isKioskMode, orderJustPlaced, initializeTable, resetForNextCustomer, setOrderPlaced]
  );

  return <TabletContext.Provider value={value}>{children}</TabletContext.Provider>;
}

export function useTablet() {
  const context = useContext(TabletContext);
  if (context === undefined) {
    throw new Error('useTablet must be used within a TabletProvider');
  }
  return context;
}
