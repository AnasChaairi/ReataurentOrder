import { ReactNode } from 'react';
import { DeviceProvider } from '@/contexts/DeviceContext';
import { CartProvider } from '@/contexts/CartContext';
import { TabletProvider } from '@/contexts/TabletContext';

export default function DeviceTabletLayout({ children }: { children: ReactNode }) {
  return (
    <DeviceProvider>
      <CartProvider>
        <TabletProvider>
          <div className="tablet-mode min-h-screen flex flex-col bg-baristas-cream">
            {children}
          </div>
        </TabletProvider>
      </CartProvider>
    </DeviceProvider>
  );
}
