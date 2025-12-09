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
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
  };
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: string;
  is_active: boolean;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login/', credentials);

    // Store tokens and user data
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    // Set default role to CUSTOMER if not provided
    const registerData = {
      ...data,
      role: data.role || 'CUSTOMER',
    };

    const response = await api.post<AuthResponse>('/api/auth/register/', registerData);

    // Store tokens and user data
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

      if (refreshToken) {
        await api.post('/api/auth/logout/', {
          refresh: refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    }
  }

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/api/auth/profile/');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>('/api/auth/profile/update/', data);

    // Update stored user data
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post('/api/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('access_token');
    }
    return false;
  }
}

export const authService = new AuthService();
