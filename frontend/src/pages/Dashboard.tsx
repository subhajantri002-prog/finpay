import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Gift,
  AlertTriangle,
  Send,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { TransactionTable } from '../components/TransactionTable';
import { CardSkeleton } from '../components/Loading';
import { walletService } from '../services/walletService';
import { transactionService } from '../services/transactionService';
import { cashbackService } from '../services/cashbackService';
import { reportsService } from '../services/reportsService';
import { Wallet as WalletType, Transaction, CashbackSummary, MonthlySpendingReport } from '../types';
import { formatCurrency } from '../utils/formatters';

export const Dashboard: React.FC = () => {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [cashbackSummary, setCashbackSummary] = useState<CashbackSummary | null>(null);
  const [spendingReport, setSpendingReport] = useState<MonthlySpendingReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadDashboardData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [walletData, txData, cbData, reportData] = await Promise.all([
        walletService.getWallet(),
        transactionService.getTransactions({ page: 1, page_size: 5 }),
        cashbackService.getCashback(),
        reportsService.getMonthlySpending(),
      ]);

      setWallet(walletData);
      setRecentTransactions(txData.items);
      setCashbackSummary(cbData);
      setSpendingReport(reportData);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || 'Failed to load dashboard data. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const balanceNum = wallet ? Number(wallet.balance) : 0;
  const isZeroBalance = !isLoading && wallet !== null && balanceNum === 0;

  // Calculate totals from backend records
  const totalSpent = spendingReport ? Number(spendingReport.total_spent_all_time) : 0;
  const totalCashback = cashbackSummary ? Number(cashbackSummary.total_cashback) : 0;

  // Total received (balance + spent - cashback) or derived strictly from backend transactions
  const totalReceived = balanceNum + totalSpent - totalCashback;

  return (
    <div className="space-y-6">
      {/* Zero Balance Warning Notice */}
      {isZeroBalance && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Your wallet has no money.</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                You cannot make a payment. Please add money to continue.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/wallet')}
            className="inline-flex items-center justify-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition shrink-0"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Add Money
          </button>
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <p className="font-semibold">Unable to load dashboard</p>
          <p className="mt-0.5">{errorMessage}</p>
        </div>
      )}

      {/* Stat Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Wallet Balance"
            value={formatCurrency(balanceNum)}
            subtitle={`Status: ${wallet?.status || 'Active'}`}
            icon={Wallet}
            variant="blue"
          />
          <StatCard
            title="Total Received"
            value={formatCurrency(totalReceived > 0 ? totalReceived : 0)}
            subtitle="All-time credits & top-ups"
            icon={ArrowUpRight}
            variant="green"
          />
          <StatCard
            title="Total Spent"
            value={formatCurrency(totalSpent)}
            subtitle="All-time merchant payments"
            icon={ArrowDownRight}
            variant="navy"
          />
          <StatCard
            title="Total Cashback"
            value={formatCurrency(totalCashback)}
            subtitle="Campus reward credits"
            icon={Gift}
            variant="slate"
          />
        </div>
      )}

      {/* Quick Action & Spending Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Monthly Spending Bars (computed strictly from backend data) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Spending Overview</h3>
              <p className="text-xs text-slate-500">Aggregated directly from your debit records</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center"
            >
              Full Report <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          {isLoading ? (
            <div className="h-44 bg-slate-100 rounded-xl animate-pulse"></div>
          ) : spendingReport && spendingReport.items.length > 0 ? (
            <div className="space-y-3.5 pt-2">
              {spendingReport.items.slice(0, 4).map((item) => {
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
                        {formatCurrency(item.total_spent)} ({item.transaction_count} txs)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <p className="text-xs font-medium">No spending activity recorded yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Make your first campus payment to populate monthly insights.
              </p>
            </div>
          )}
        </div>

        {/* Right: Quick Payment / Action Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Quick Campus Payment</h3>
            <p className="text-xs text-slate-500 mb-5">
              Instantly pay campus vendors, food court, or printing stations.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 mb-5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Available to Spend</span>
                <span className="font-bold text-slate-900">{formatCurrency(balanceNum)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Security</span>
                <span className="font-medium text-emerald-600">Atomic Idempotency</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/payments')}
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Campus Payment
            </button>
            <button
              onClick={() => navigate('/wallet')}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Manage Wallet
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-500">Your latest digital wallet credits and debits</p>
          </div>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center"
          >
            View All ({recentTransactions.length}) <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <TransactionTable transactions={recentTransactions} isLoading={isLoading} />
      </div>
    </div>
  );
};
