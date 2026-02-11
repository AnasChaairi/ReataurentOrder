// Tablet-specific type definitions

export interface TabletTable {
  id: number;
  number: string;
  section: string;
  capacity: number;
  floor: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  restaurant_id?: number | null;
  odoo_table_id?: number;
  odoo_last_synced?: string;
  is_active: boolean;
  qr_code?: string;
}

export interface TabletContextType {
  table: TabletTable | null;
  isLoading: boolean;
  error: string | null;
  isKioskMode: boolean;
  orderJustPlaced: boolean;
  initializeTable: (tableId: number) => Promise<void>;
  resetForNextCustomer: () => void;
  setOrderPlaced: (placed: boolean) => void;
}

export type TabletViewState = 'menu' | 'cart' | 'confirmation';

export interface TabletOrderResult {
  orderId: number;
  orderNumber: string;
  estimatedTime?: number;
  syncedToOdoo: boolean;
  odooSyncError?: string;
}
