"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { deviceService } from '@/services/device.service';
import { DeviceConfig, DeviceContextType } from '@/types/device.types';

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DeviceConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if a valid device session already exists (rehydrates from cookie)
  useEffect(() => {
    deviceService
      .checkDeviceStatus()
      .then((cfg) => setConfig(cfg))
      .catch(() => setConfig(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (deviceId: string, passcode: string): Promise<void> => {
    const result = await deviceService.login(deviceId, passcode);
    setConfig(result.config);
  };

  const logout = async (): Promise<void> => {
    await deviceService.logout();
    setConfig(null);
  };

  return (
    <DeviceContext.Provider
      value={{
        config,
        isAuthenticated: !!config,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error('useDevice must be used within a DeviceProvider');
  return ctx;
}
