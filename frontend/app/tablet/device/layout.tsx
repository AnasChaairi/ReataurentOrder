"use client";

import { ReactNode } from 'react';
import { DeviceProvider, useDevice } from '@/contexts/DeviceContext';
import { CartProvider } from '@/contexts/CartContext';
import { TabletProvider } from '@/contexts/TabletContext';
import { cartService } from '@/services/cart.service';

function DeviceScopedCart({ children }: { children: ReactNode }) {
  const { config } = useDevice();
  // Fall back to a "pending" key before the device session is hydrated;
  // once config loads, the key flips to a device-specific bucket and the
  // provider reloads its cart from that bucket.
  const storageKey = config?.device_id
    ? cartService.deviceCartKey(config.device_id)
    : 'restaurant_cart:device:pending';

  return <CartProvider storageKey={storageKey}>{children}</CartProvider>;
}

export default function DeviceTabletLayout({ children }: { children: ReactNode }) {
  return (
    <DeviceProvider>
      <DeviceScopedCart>
        <TabletProvider>
          <div className="tablet-mode min-h-screen flex flex-col bg-baristas-cream">
            {children}
          </div>
        </TabletProvider>
      </DeviceScopedCart>
    </DeviceProvider>
  );
}
