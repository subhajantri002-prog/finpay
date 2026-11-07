import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Gift,
  Wallet,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { reportsService } from '../services/reportsService';
import { MonthlySpendingReport, ReconciliationReport } from '../types';
import { formatCurrency } from '../utils/formatters';

export const Reports: React.FC = () => {
  const [spendingReport, setSpendingReport] = useState<MonthlySpendingReport | null>(null);
  const [reconciliation, setReconciliation] = useState<ReconciliationReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [spending, recon] = await Promise.all([
        reportsService.getMonthlySpending(),
        reportsService.getReconciliation(),
      ]);
      setSpendingReport(spending);
      setReconciliation(recon);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || 'Failed to generate financial reports.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const totalCredits = reconciliation ? Number(reconciliation.total_all_time_credits) : 0;
  const totalDebits = reconciliation ? Number(reconciliation.total_all_time_debits) : 0;
  const totalCashback = reconciliation ? Number(reconciliation.total_all_time_cashback) : 0;
  const walletBalance = reconciliation ? Number(reconciliation.current_wallet_balance) : 0;
  const reconciledBalance = reconciliation ? Number(reconciliation.reconciled_balance) : 0;
  const isReconciled = reconciliation ? reconciliation.is_reconciled : true;

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <p className="font-semibold">Error</p>
          <p className="mt-0.5">{errorMessage}</p>
        </div>
      )}

      {/* Reconciliation Status Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isReconciled
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex items-start space-x-3.5">
          <div
            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
              isReconciled
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold">Ledger Reconciliation Status:</h3>
              {isReconciled ? (
                <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  100% Balanced
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  Discrepancy Found
                </span>
              )}
            </div>
            <p className="text-xs opacity-80 mt-1">
              Reconciled Balance = Total Credits ({formatCurrency(totalCredits)}) − Total Debits (
              {formatCurrency(totalDebits)}) + Total Cashback ({formatCurrency(totalCashback)}) ={' '}
              <strong className="underline">{formatCurrency(reconciledBalance)}</strong>. Current
              Wallet: <strong>{formatCurrency(walletBalance)}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Reconciliation Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Current Wallet"
          value={formatCurrency(walletBalance)}
          subtitle="Real-time balance"
          icon={Wallet}
          variant="blue"
        />
        <StatCard
          title="All-Time Credits"
          value={formatCurrency(totalCredits)}
          subtitle="Admin deposits & top-ups"
          icon={ArrowUpRight}
          variant="green"
        />
        <StatCard
          title="All-Time Debits"
          value={formatCurrency(totalDebits)}
          subtitle="Merchant spending"
          icon={ArrowDownRight}
          variant="navy"
        />
        <StatCard
          title="Total Rewards"
          value={formatCurrency(totalCashback)}
          subtitle="Cashback received"
          icon={Gift}
          variant="slate"
        />
      </div>

      {/* Monthly Reconciliation Ledger Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-base font-bold text-slate-900">Monthly Reconciliation Breakdown</h3>
          <p className="text-xs text-slate-500">
            Audit trail of starting balance, inflows, outflows, and ending balance per month
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Computing monthly reconciliation...
          </div>
        ) : !reconciliation || reconciliation.monthly_breakdown.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No historical transaction months available for reconciliation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4 text-right">Starting Balance</th>
                  <th className="py-3 px-4 text-right text-emerald-600">+ Inflows (Credits/Topups)</th>
                  <th className="py-3 px-4 text-right text-rose-600">− Outflows (Debits)</th>
                  <th className="py-3 px-4 text-right text-blue-600">+ Cashback</th>
                  <th className="py-3 px-4 text-right font-bold">Ending Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reconciliation.monthly_breakdown.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{row.month_name}</td>
                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {formatCurrency(row.starting_balance)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 font-medium">
                      +{formatCurrency(row.total_credits)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-600 font-medium">
                      −{formatCurrency(row.total_debits)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-blue-600 font-medium">
                      +{formatCurrency(row.total_cashback)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(row.ending_balance)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Spending by Month Bar Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Monthly Spending History</h3>
            <p className="text-xs text-slate-500">Total debit volume per calendar month</p>
          </div>
        </div>

        {spendingReport && spendingReport.items.length > 0 ? (
          <div className="space-y-4 pt-2">
            {spendingReport.items.map((item) => {
              const maxSpent = Math.max(
                ...spendingReport.items.map((i) => Number(i.total_spent)),
                1
              );
              const percent = Math.min(
                Math.round((Number(item.total_spent) / maxSpent) * 100),
                100
              );
              return (
                <div key={item.month}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-700">{item.month_name}</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(item.total_spent)}{' '}
                      <span className="text-slate-400 font-normal">
                        ({item.transaction_count} transactions)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No merchant spending recorded to plot monthly trends.
          </div>
        )}
      </div>
    </div>
  );
};
