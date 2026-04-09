import { ReactNode } from 'react';
import { DeviceProvider } from '@/contexts/DeviceContext';

export default function DeviceLoginLayout({ children }: { children: ReactNode }) {
  return <DeviceProvider>{children}</DeviceProvider>;
}
