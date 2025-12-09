import api from '@/lib/api';

export interface WaiterStatistics {
  total_orders: number;
  confirmed_orders: number;
  served_orders: number;
  total_revenue: number;
  active_tables_count: number;
}

export interface AssignedTable {
  id: number;
  number: string;
  section: string;
  shift_start: string;
}

export interface Waiter {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  phone_number: string | null;
  created_at: string;
  assigned_tables: AssignedTable[];
  statistics: WaiterStatistics;
}

export interface Table {
  id: number;
  number: string;
  section: string;
  capacity: number;
  status: string;
  floor: number;
  is_active: boolean;
}

export interface WaiterAssignment {
  waiter: number;
  table: number;
  notes?: string;
}

class WaiterService {
  async getWaiters(): Promise<Waiter[]> {
    const response = await api.get<Waiter[]>('/api/auth/admin/users/', {
      params: { role: 'WAITER' }
    });
    return response.data;
  }

  async activateWaiter(waiterId: number): Promise<void> {
    await api.post(`/api/auth/admin/users/${waiterId}/activate/`);
  }

  async deactivateWaiter(waiterId: number): Promise<void> {
    await api.post(`/api/auth/admin/users/${waiterId}/deactivate/`);
  }

  async getWaiterDashboard(): Promise<any> {
    const response = await api.get('/api/tables/waiters/dashboard/');
    return response.data;
  }

  async getMyTables(): Promise<Table[]> {
    const response = await api.get<Table[]>('/api/tables/waiters/me/tables/');
    return response.data;
  }

  async getAllTables(): Promise<Table[]> {
    const response = await api.get<Table[]>('/api/tables/tables/');
    return response.data;
  }

  async assignTable(data: WaiterAssignment): Promise<void> {
    await api.post('/api/tables/assignments/', data);
  }

  async unassignTable(assignmentId: number): Promise<void> {
    await api.post(`/api/tables/assignments/${assignmentId}/end_shift/`);
  }

  async getActiveAssignments(): Promise<any[]> {
    const response = await api.get('/api/tables/assignments/active/');
    return response.data;
  }
}

export const waiterService = new WaiterService();
