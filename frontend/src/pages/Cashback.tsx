import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle2, Info, ArrowUpRight } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { cashbackService } from '../services/cashbackService';
import { CashbackSummary } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const Cashback: React.FC = () => {
  const [cashback, setCashback] = useState<CashbackSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCashback = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await cashbackService.getCashback();
      setCashback(res);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || 'Failed to load cashback data.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCashback();
  }, []);

  const total = cashback ? Number(cashback.total_cashback) : 0;
  const monthly = cashback ? Number(cashback.monthly_cashback) : 0;
  const history = cashback ? cashback.history : [];

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <p className="font-semibold">Error</p>
          <p className="mt-0.5">{errorMessage}</p>
        </div>
      )}

      {/* Calculation Rule details if returned by backend */}
      {cashback?.calculation_details && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start space-x-3">
          <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-emerald-800">Active Cashback Rule</h4>
            <p className="mt-0.5 text-emerald-700">{cashback.calculation_details}</p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard
          title="All-Time Cashback Earned"
          value={formatCurrency(total)}
          subtitle="Credited directly to wallet"
          icon={Gift}
          variant="green"
        />
        <StatCard
          title="This Month's Cashback"
          value={formatCurrency(monthly)}
          subtitle="Earned during current calendar month"
          icon={ArrowUpRight}
          variant="blue"
        />
      </div>

      {/* History Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-base font-bold text-slate-900">Cashback Reward History</h3>
          <p className="text-xs text-slate-500">Record of all reward credits deposited into your wallet</p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Loading reward history...
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="No cashback rewards yet"
            description="When eligible merchant payments are processed with an active reward rule, cashbacks will be automatically credited here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Reward ID</th>
                  <th className="py-3 px-4">Linked Transaction</th>
                  <th className="py-3 px-4">Credited At</th>
                  <th className="py-3 px-4 text-right">Cashback Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-800">
                      #{record.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      Tx #{record.transaction_id}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatDateTime(record.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      +{formatCurrency(record.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
