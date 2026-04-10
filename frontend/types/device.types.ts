export interface DeviceConfig {
  device_id: string;
  device_name: string;
  restaurant_id: number;
  restaurant_name: string;
  table_id: number | null;
  table_number: string | null;
  allowed_category_ids: number[];
  odoo_config_id: number | null;
}

export interface DeviceProfile {
  id: number;
  name: string;
  device_id: string;
  restaurant: number;
  restaurant_name: string;
  table: number | null;
  table_number: string | null;
  odoo_config: number | null;
  effective_odoo_config_id: number | null;
  allowed_category_ids: number[];
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceProfileFormData {
  name: string;
  restaurant?: number | '';
  table: number | '';
  odoo_config: number | '';
  allowed_category_ids: number[];
  passcode: string;
  is_active: boolean;
}

export interface DeviceContextType {
  config: DeviceConfig | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (deviceId: string, passcode: string) => Promise<void>;
  logout: () => Promise<void>;
}
