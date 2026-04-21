import api from '@/lib/api';
import { DeviceConfig, DeviceProfile, DeviceProfileFormData, DeviceTableOption } from '@/types/device.types';

class DeviceService {
  // ── Tablet authentication ──────────────────────────────────────────────

  async login(deviceId: string, tableNumber: string): Promise<{ config: DeviceConfig }> {
    const res = await api.post<{ config: DeviceConfig }>('/api/auth/device-login/', {
      device_id: deviceId.toUpperCase(),
      table_number: tableNumber,
    });
    return res.data;
  }

  async logout(): Promise<void> {
    await api.post('/api/auth/device-logout/');
  }

  async listTablesForDevice(
    deviceId: string,
    options: { sync?: boolean } = {},
  ): Promise<DeviceTableOption[]> {
    const params: Record<string, string> = {
      device_id: deviceId.toUpperCase(),
    };
    if (options.sync) params.sync = 'true';
    const res = await api.get<{ tables: DeviceTableOption[] }>(
      '/api/auth/device-tables/',
      { params, silent: true },
    );
    return res.data.tables;
  }

  /** Decodes the device_token cookie server-side without a DB query.
   *  Returns null if no valid session exists. */
  async checkDeviceStatus(): Promise<DeviceConfig | null> {
    try {
      const res = await api.get<{ config: DeviceConfig }>('/api/auth/device-status/', {
        silent: true,
      });
      return res.data.config;
    } catch {
      return null;
    }
  }

  // ── Admin CRUD ─────────────────────────────────────────────────────────

  async listDevices(): Promise<DeviceProfile[]> {
    const res = await api.get('/api/devices/devices/');
    const data = res.data;
    return Array.isArray(data) ? data : (data.results ?? []);
  }

  async getDevice(id: number): Promise<DeviceProfile> {
    const res = await api.get<DeviceProfile>(`/api/devices/devices/${id}/`);
    return res.data;
  }

  async createDevice(data: DeviceProfileFormData): Promise<DeviceProfile> {
    const payload = {
      ...data,
      table: data.table || null,
      odoo_config: data.odoo_config || null,
    };
    const res = await api.post<DeviceProfile>('/api/devices/devices/', payload);
    return res.data;
  }

  async updateDevice(id: number, data: Partial<DeviceProfileFormData>): Promise<DeviceProfile> {
    const payload = {
      ...data,
      table: data.table || null,
      odoo_config: data.odoo_config || null,
    };
    const res = await api.patch<DeviceProfile>(`/api/devices/devices/${id}/`, payload);
    return res.data;
  }

  async deleteDevice(id: number): Promise<void> {
    await api.delete(`/api/devices/devices/${id}/`);
  }

  async regeneratePasscode(id: number): Promise<{ passcode: string }> {
    const res = await api.post<{ passcode: string }>(
      `/api/devices/devices/${id}/regenerate_passcode/`
    );
    return res.data;
  }

  async setPasscode(id: number, passcode: string): Promise<void> {
    await api.post(`/api/devices/devices/${id}/set_passcode/`, { passcode });
  }

  async toggleActive(id: number): Promise<{ is_active: boolean }> {
    const res = await api.post<{ is_active: boolean }>(
      `/api/devices/devices/${id}/toggle_active/`
    );
    return res.data;
  }
}

export const deviceService = new DeviceService();
