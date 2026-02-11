import api from '@/lib/api';
import { Restaurant, RestaurantListItem } from '@/types/restaurant.types';

class RestaurantService {
  async getRestaurants(): Promise<RestaurantListItem[]> {
    const response = await api.get('/api/restaurants/');
    const data = response.data;
    return Array.isArray(data) ? data : data.results ?? [];
  }

  async getRestaurant(id: number): Promise<Restaurant> {
    const response = await api.get<Restaurant>(`/api/restaurants/${id}/`);
    return response.data;
  }

  async createRestaurant(data: Partial<Restaurant>): Promise<Restaurant> {
    const response = await api.post<Restaurant>('/api/restaurants/', data);
    return response.data;
  }

  async updateRestaurant(id: number, data: Partial<Restaurant>): Promise<Restaurant> {
    const response = await api.patch<Restaurant>(`/api/restaurants/${id}/`, data);
    return response.data;
  }

  async deleteRestaurant(id: number): Promise<void> {
    await api.delete(`/api/restaurants/${id}/`);
  }

  async assignOdooConfig(restaurantId: number, odooConfigId: number | null): Promise<void> {
    await api.post(`/api/restaurants/${restaurantId}/assign_odoo_config/`, {
      odoo_config_id: odooConfigId,
    });
  }

  async syncMenu(restaurantId: number): Promise<{ status: string; [key: string]: unknown }> {
    const response = await api.post(`/api/restaurants/${restaurantId}/sync_menu/`);
    return response.data;
  }

  async syncTables(restaurantId: number): Promise<{ status: string; [key: string]: unknown }> {
    const response = await api.post(`/api/restaurants/${restaurantId}/sync_tables/`);
    return response.data;
  }
}

export const restaurantService = new RestaurantService();
