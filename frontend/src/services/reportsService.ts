import { api } from './api';
import { MonthlySpendingReport, ReconciliationReport } from '../types';

export const reportsService = {
  async getMonthlySpending(): Promise<MonthlySpendingReport> {
    const res = await api.get<MonthlySpendingReport>('/reports/monthly-spending');
    return res.data;
  },

  async getReconciliation(): Promise<ReconciliationReport> {
    const res = await api.get<ReconciliationReport>('/reports/reconciliation');
    return res.data;
  },
};
