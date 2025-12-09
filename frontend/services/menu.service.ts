import api from '@/lib/api';
import {
  Category,
  MenuItem,
  MenuItemListItem,
  MenuItemVariant,
  MenuItemAddon,
  MenuItemReview,
  CreateReviewData,
} from '@/types/menu.types';

// Re-export types for convenience
export type {
  Category,
  MenuItem,
  MenuItemListItem,
  MenuItemVariant,
  MenuItemAddon,
  MenuItemReview,
  CreateReviewData,
};

export interface MenuItemsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MenuItemListItem[];
}

class MenuService {
  async getCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/api/menu/categories/');
    return response.data;
  }

  async getMenuItems(params?: {
    category?: number;
    search?: string;
    is_vegetarian?: boolean;
    is_vegan?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<MenuItemsResponse> {
    const response = await api.get<MenuItemsResponse>('/api/menu/items/', { params });
    return response.data;
  }

  async getMenuItem(slug: string): Promise<MenuItem> {
    const response = await api.get<MenuItem>(`/api/menu/items/${slug}/`);
    // The response already includes variants and addons
    return response.data;
  }

  // Note: Variants and addons are already included in the getMenuItem() response
  // These methods are kept for backwards compatibility but simply return the nested data
  async getMenuItemVariants(slug: string): Promise<MenuItemVariant[]> {
    const menuItem = await this.getMenuItem(slug);
    return menuItem.variants || [];
  }

  async getMenuItemAddons(slug: string): Promise<MenuItemAddon[]> {
    const menuItem = await this.getMenuItem(slug);
    return menuItem.addons || [];
  }

  async getMenuItemReviews(slug: string): Promise<MenuItemReview[]> {
    const response = await api.get<MenuItemReview[]>(`/api/menu/items/${slug}/reviews/`);
    return response.data;
  }

  async addReview(slug: string, data: CreateReviewData): Promise<MenuItemReview> {
    const response = await api.post<MenuItemReview>(`/api/menu/items/${slug}/add_review/`, data);
    return response.data;
  }

  async getRecommendedItems(slug: string): Promise<MenuItemListItem[]> {
    const response = await api.get<MenuItemListItem[]>(`/api/menu/items/${slug}/recommended/`);
    return response.data;
  }

  async getPopularItems(): Promise<MenuItemListItem[]> {
    const response = await api.get<MenuItemListItem[]>('/api/menu/items/popular/');
    return response.data;
  }

  async getFeaturedItems(): Promise<MenuItemListItem[]> {
    const response = await api.get<MenuItemListItem[]>('/api/menu/items/featured/');
    return response.data;
  }

  async createMenuItem(data: FormData): Promise<MenuItem> {
    const response = await api.post<MenuItem>('/api/menu/items/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateMenuItem(id: number, data: FormData): Promise<MenuItem> {
    const response = await api.patch<MenuItem>(`/api/menu/items/${id}/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteMenuItem(id: number): Promise<void> {
    await api.delete(`/api/menu/items/${id}/`);
  }

  async createCategory(data: FormData): Promise<Category> {
    const response = await api.post<Category>('/api/menu/categories/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateCategory(slug: string, data: FormData): Promise<Category> {
    const response = await api.patch<Category>(`/api/menu/categories/${slug}/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteCategory(slug: string): Promise<void> {
    await api.delete(`/api/menu/categories/${slug}/`);
  }
}

export const menuService = new MenuService();
