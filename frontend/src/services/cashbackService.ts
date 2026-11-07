import { api } from './api';
import { CashbackSummary } from '../types';

export const cashbackService = {
  async getCashback(): Promise<CashbackSummary> {
    const res = await api.get<CashbackSummary>('/cashback');
    return res.data;
  },
};
