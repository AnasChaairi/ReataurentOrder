import api from '@/lib/api';

export interface Table {
  id: number;
  number: string;
  section: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  floor: number;
  is_active: boolean;
  qr_code?: string;
  current_session?: TableSession;
}

export interface TableSession {
  id: number;
  table: number;
  customer: number;
  start_time: string;
  end_time?: string;
  is_active: boolean;
}

export interface WaiterAssignment {
  id: number;
  waiter: number;
  waiter_name: string;
  table: number;
  table_number: string;
  shift_start: string;
  shift_end?: string;
  is_active: boolean;
  notes?: string;
}

class TableService {
  async getTables(): Promise<Table[]> {
    const response = await api.get('/api/tables/tables/');
    const data = response.data;
    return Array.isArray(data) ? data : data.results ?? [];
  }

  async getTable(id: number): Promise<Table> {
    const response = await api.get<Table>(`/api/tables/tables/${id}/`);
    return response.data;
  }

  async createTable(data: Partial<Table>): Promise<Table> {
    const response = await api.post<Table>('/api/tables/tables/', data);
    return response.data;
  }

  async updateTableStatus(id: number, status: string): Promise<Table> {
    const response = await api.patch<Table>(`/api/tables/tables/${id}/update_status/`, {
      status
    });
    return response.data;
  }

  async generateQR(id: number): Promise<{ qr_code: string }> {
    const response = await api.post<{ qr_code: string }>(`/api/tables/tables/${id}/generate_qr/`);
    return response.data;
  }

  async getAvailableTables(): Promise<Table[]> {
    const response = await api.get('/api/tables/tables/', {
      params: { status: 'AVAILABLE' }
    });
    const data = response.data;
    return Array.isArray(data) ? data : data.results ?? [];
  }

  async getTableAssignments(): Promise<WaiterAssignment[]> {
    const response = await api.get<WaiterAssignment[]>('/api/tables/assignments/');
    return response.data;
  }

  async getActiveAssignments(): Promise<WaiterAssignment[]> {
    const response = await api.get<WaiterAssignment[]>('/api/tables/assignments/active/');
    return response.data;
  }

  async assignTable(data: { waiter: number; table: number; notes?: string }): Promise<WaiterAssignment> {
    const response = await api.post<WaiterAssignment>('/api/tables/assignments/', data);
    return response.data;
  }

  async endShift(assignmentId: number): Promise<void> {
    await api.post(`/api/tables/assignments/${assignmentId}/end_shift/`);
  }

  async updateTable(id: number, data: Partial<Table>): Promise<Table> {
    const response = await api.patch<Table>(`/api/tables/tables/${id}/`, data);
    return response.data;
  }

  async deleteTable(id: number): Promise<void> {
    await api.delete(`/api/tables/tables/${id}/`);
  }

  async syncTablesFromOdoo(): Promise<{ synced: number; message: string }> {
    const response = await api.post<{ synced: number; message: string }>('/api/tables/tables/sync_from_odoo/');
    return response.data;
  }
}

export const tableService = new TableService();
