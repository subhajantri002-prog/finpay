import { api } from './api';
import { Wallet } from '../types';

export const walletService = {
  async getWallet(): Promise<Wallet> {
    const res = await api.get<Wallet>('/wallet');
    return res.data;
  },

  async topup(amount: number): Promise<Wallet> {
    const res = await api.post<Wallet>('/wallet/topup', { amount });
    return res.data;
  },
};
