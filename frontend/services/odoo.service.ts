import api from '@/lib/api';

export interface OdooConfig {
  id: number;
  name: string;
  is_active: boolean;
  url: string;
  database: string;
  username: string;
  pos_config_id: number | null;
  pos_config_name: string;
  timeout: number;
  retry_attempts: number;
  auto_sync_orders: boolean;
  sync_menu_enabled: boolean;
  sync_tables_enabled: boolean;
  last_test_at: string | null;
  last_test_success: boolean;
  last_test_error: string;
  created_at: string;
  updated_at: string;
}

export interface OdooConfigCreate {
  name: string;
  url: string;
  database: string;
  username: string;
  password: string;
  timeout?: number;
  retry_attempts?: number;
  auto_sync_orders?: boolean;
  sync_menu_enabled?: boolean;
  sync_tables_enabled?: boolean;
}

export interface POSConfig {
  id: number;
  name: string;
  company_id: number;
  company_name: string;
}

export interface SyncLog {
  id: number;
  sync_type: string;
  sync_type_display: string;
  status: string;
  status_display: string;
  order_id: number | null;
  order_number: string | null;
  odoo_config_name: string;
  triggered_by_name: string | null;
  odoo_id: number | null;
  error_message: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  completed_at: string | null;
}

export interface TableVerificationSummary {
  total_django_tables: number;
  linked_to_odoo: number;
  not_linked: number;
  total_odoo_tables: number;
  missing_in_django: number;
  stale_in_django: number;
}

export interface LinkedTable {
  id: number;
  number: string;
  odoo_table_id: number;
  odoo_floor_id: number | null;
  odoo_last_synced: string | null;
}

export interface UnlinkedTable {
  id: number;
  number: string;
  section: string;
  is_active: boolean;
}

export interface TableVerificationResult {
  summary: TableVerificationSummary;
  linked_tables: LinkedTable[];
  unlinked_tables: UnlinkedTable[];
  missing_in_django: Array<{id: number; name: string; floor: string}>;
  stale_tables: Array<{id: number; number: string; odoo_table_id: number}>;
}

export interface SyncStatistics {
  statistics: Array<{sync_type: string; status: string; count: number}>;
  by_type: Array<{sync_type: string; count: number}>;
  by_status: Array<{status: string; count: number}>;
  recent_failures: number;
  success_rate: number;
  total_syncs: number;
}

class OdooService {
  // Config Management
  async getConfigs(): Promise<OdooConfig[]> {
    const response = await api.get<OdooConfig[] | {results: OdooConfig[]}>('/api/odoo/configs/');
    // Handle both paginated and non-paginated responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return (response.data as any).results || [];
  }

  async getConfig(id: number): Promise<OdooConfig> {
    const response = await api.get<OdooConfig>(`/api/odoo/configs/${id}/`);
    return response.data;
  }

  async createConfig(data: OdooConfigCreate): Promise<OdooConfig> {
    const response = await api.post<OdooConfig>('/api/odoo/configs/', data);
    return response.data;
  }

  async updateConfig(id: number, data: Partial<OdooConfigCreate>): Promise<OdooConfig> {
    const response = await api.patch<OdooConfig>(`/api/odoo/configs/${id}/`, data);
    return response.data;
  }

  async deleteConfig(id: number): Promise<void> {
    await api.delete(`/api/odoo/configs/${id}/`);
  }

  // Connection Testing
  async testConnection(id: number): Promise<{success: boolean; message: string; version_info: any}> {
    const response = await api.post(`/api/odoo/configs/${id}/test_connection/`);
    return response.data;
  }

  // Activation
  async activateConfig(id: number): Promise<{status: string; message: string}> {
    const response = await api.post(`/api/odoo/configs/${id}/activate/`);
    return response.data;
  }

  // POS Configuration
  async getPOSConfigs(id: number): Promise<{pos_configs: POSConfig[]}> {
    const response = await api.get(`/api/odoo/configs/${id}/get_pos_configs/`);
    return response.data;
  }

  async selectPOSConfig(id: number, pos_config_id: number, pos_config_name: string): Promise<any> {
    const response = await api.post(`/api/odoo/configs/${id}/select_pos_config/`, {
      pos_config_id,
      pos_config_name
    });
    return response.data;
  }

  // Manual Sync Triggers
  async syncMenuNow(id: number): Promise<{
    status: string;
    message: string;
    categories_created?: number;
    categories_updated?: number;
    items_created?: number;
    items_updated?: number;
  }> {
    const response = await api.post(`/api/odoo/configs/${id}/sync_menu_now/`);
    return response.data;
  }

  async syncTablesNow(id: number): Promise<{
    status: string;
    message: string;
    floors_synced?: number;
    tables_created?: number;
    tables_updated?: number;
    tables_skipped?: number;
    tables_deactivated?: number;
  }> {
    const response = await api.post(`/api/odoo/configs/${id}/sync_tables_now/`);
    return response.data;
  }

  // Table Verification
  async verifyTables(id: number): Promise<TableVerificationResult> {
    const response = await api.get<TableVerificationResult>(`/api/odoo/configs/${id}/verify_tables/`);
    return response.data;
  }

  // Sync Logs
  async getSyncLogs(params?: {sync_type?: string; status?: string; order?: number}): Promise<SyncLog[]> {
    const response = await api.get<SyncLog[] | {results: SyncLog[]}>('/api/odoo/sync-logs/', { params });
    // Handle both paginated and non-paginated responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return (response.data as any).results || [];
  }

  async getSyncLog(id: number): Promise<SyncLog> {
    const response = await api.get<SyncLog>(`/api/odoo/sync-logs/${id}/`);
    return response.data;
  }

  async retrySyncLog(id: number): Promise<{status: string; task_id?: string; message: string}> {
    const response = await api.post(`/api/odoo/sync-logs/${id}/retry/`);
    return response.data;
  }

  async getFailedSyncLogs(): Promise<SyncLog[]> {
    const response = await api.get<SyncLog[] | {results: SyncLog[]}>('/api/odoo/sync-logs/failed/');
    // Handle both paginated and non-paginated responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return (response.data as any).results || [];
  }

  async getSyncStatistics(): Promise<SyncStatistics> {
    const response = await api.get<SyncStatistics>('/api/odoo/sync-logs/statistics/');
    return response.data;
  }
}

export const odooService = new OdooService();
