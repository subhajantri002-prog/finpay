import { api } from './api';
import { PaginatedTransactions, Transaction } from '../types';

export interface TransactionQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: 'created_at' | 'amount';
  sort_order?: 'asc' | 'desc';
}

export const transactionService = {
  async getTransactions(params: TransactionQueryParams = {}): Promise<PaginatedTransactions> {
    const res = await api.get<PaginatedTransactions>('/transactions', { params });
    return res.data;
  },

  async getTransactionById(id: number): Promise<Transaction> {
    const res = await api.get<Transaction>(`/transactions/${id}`);
    return res.data;
  },
};
