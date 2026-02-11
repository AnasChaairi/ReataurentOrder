import api from '@/lib/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role?: 'CUSTOMER' | 'WAITER' | 'ADMIN';
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface UserRestaurant {
  id: number;
  name: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: string;
  is_active: boolean;
  restaurant?: number | null;
  restaurant_detail?: UserRestaurant | null;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login/', credentials);
    // Tokens are now set as httpOnly cookies by the backend
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const registerData = {
      ...data,
      role: data.role || 'CUSTOMER',
    };

    const response = await api.post<AuthResponse>('/api/auth/register/', registerData);
    // Tokens are now set as httpOnly cookies by the backend
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/api/auth/profile/');
    return response.data;
  }

  async checkAuthStatus(): Promise<User | null> {
    try {
      const response = await api.get<{ user: User }>('/api/auth/me/');
      return response.data.user;
    } catch {
      return null;
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>('/api/auth/profile/update/', data);
    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post('/api/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }
}

export const authService = new AuthService();
