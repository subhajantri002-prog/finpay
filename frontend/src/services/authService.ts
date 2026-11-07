import { api } from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async register(data: {
    full_name: string;
    student_id: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<User> {
    const res = await api.post<User>('/auth/register', data);
    return res.data;
  },

  async login(identifier: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', { identifier, password });
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>('/users/me');
    return res.data;
  },

  async updateMe(data: { phone?: string }): Promise<User> {
    const res = await api.patch<User>('/users/me', data);
    return res.data;
  },
};
