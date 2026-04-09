"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDevice } from '@/contexts/DeviceContext';
import { useTablet } from '@/contexts/TabletContext';
import { TabletHeader } from '@/components/tablet/TabletHeader';
import { TabletMenuGrid } from '@/components/tablet/TabletMenuGrid';
import { TabletFloatingCart } from '@/components/tablet/TabletFloatingCart';
import { TabletCart } from '@/components/tablet/TabletCart';
import { TabletConfirmation } from '@/components/tablet/TabletConfirmation';
import { TabletViewState, TabletOrderResult } from '@/types/tablet.types';

export default function DeviceTabletPage() {
  const router = useRouter();
  const { config, isAuthenticated, isLoading: deviceLoading } = useDevice();
  const { table, isLoading: tableLoading, error, initializeTable, resetForNextCustomer } = useTablet();

  const [viewState, setViewState] = useState<TabletViewState>('menu');
  const [orderResult, setOrderResult] = useState<TabletOrderResult | null>(null);

  // Guard: redirect to device login if not authenticated
  useEffect(() => {
    if (deviceLoading) return;
    if (!isAuthenticated || !config) {
      router.replace('/device-login');
    }
  }, [deviceLoading, isAuthenticated, config, router]);

  // Initialize table from device config
  useEffect(() => {
    if (deviceLoading || !config) return;
    if (config.table_id) {
      initializeTable(config.table_id);
    }
  }, [deviceLoading, config, initializeTable]);

  const handleOpenCart = () => setViewState('cart');
  const handleBackToMenu = () => setViewState('menu');

  const handleOrderPlaced = (result: TabletOrderResult) => {
    setOrderResult(result);
    setViewState('confirmation');
  };

  const handleNewOrder = () => {
    resetForNextCustomer();
    setOrderResult(null);
    setViewState('menu');
  };

  // Loading states
  if (deviceLoading || tableLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-baristas-cream">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-baristas-brown border-t-transparent mb-6" />
          <h2 className="text-2xl font-semibold text-baristas-brown-dark mb-2">Loading…</h2>
          <p className="text-gray-600">Setting up your device</p>
        </div>
      </div>
    );
  }

  // No table assigned — allow browsing but no table context
  if (config && !config.table_id) {
    return (
      <>
        <TabletHeader onCartClick={handleOpenCart} />
        {viewState === 'menu' && (
          <>
            <TabletMenuGrid />
            <TabletFloatingCart onClick={handleOpenCart} />
          </>
        )}
        {viewState === 'cart' && (
          <TabletCart onBack={handleBackToMenu} onOrderPlaced={handleOrderPlaced} />
        )}
        {viewState === 'confirmation' && orderResult && (
          <TabletConfirmation
            orderResult={orderResult}
            onNewOrder={handleNewOrder}
            tableId={0}
          />
        )}
      </>
    );
  }

  // Error state
  if (error || !table) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-baristas-cream p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-baristas-brown-dark mb-4">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">{error || 'Unable to load table information.'}</p>
          <div className="bg-baristas-brown-dark text-white rounded-xl p-4">
            <p className="font-semibold mb-1">Need assistance?</p>
            <p className="text-sm opacity-80">Please ask a staff member for help</p>
          </div>
        </div>
      </div>
    );
  }

  // Main tablet interface
  return (
    <>
      <TabletHeader onCartClick={handleOpenCart} />
      {viewState === 'menu' && (
        <>
          <TabletMenuGrid />
          <TabletFloatingCart onClick={handleOpenCart} />
        </>
      )}
      {viewState === 'cart' && (
        <TabletCart onBack={handleBackToMenu} onOrderPlaced={handleOrderPlaced} />
      )}
      {viewState === 'confirmation' && orderResult && (
        <TabletConfirmation
          orderResult={orderResult}
          onNewOrder={handleNewOrder}
          tableId={table.id}
        />
      )}
    </>
  );
}
