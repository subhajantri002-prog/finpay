import React, { useState, useEffect } from 'react';
import {
  Wallet as WalletIcon,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Hash,
  User as UserIcon,
  RefreshCw,
  X,
  Loader2,
  Info,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { walletService } from '../services/walletService';
import { transactionService } from '../services/transactionService';
import { Wallet as WalletType, Transaction } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { TransactionTable } from '../components/TransactionTable';

export const Wallet: React.FC = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [recentActivity, setRecentActivity] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Demo Top-up Modal State
  const [topupModalOpen, setTopupModalOpen] = useState<boolean>(false);
  const [topupAmount, setTopupAmount] = useState<string>('');
  const [isTopupLoading, setIsTopupLoading] = useState<boolean>(false);
  const [topupError, setTopupError] = useState<string | null>(null);
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null);

  const fetchWalletAndActivity = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [walletData, txData] = await Promise.all([
        walletService.getWallet(),
        transactionService.getTransactions({ page: 1, page_size: 5 }),
      ]);
      setWallet(walletData);
      setRecentActivity(txData.items);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || 'Failed to fetch wallet information.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletAndActivity();
  }, []);

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopupError(null);
    setTopupSuccess(null);

    const amountNum = parseFloat(topupAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTopupError('Top-up amount must be greater than zero.');
      return;
    }

    if (amountNum > 10000) {
      setTopupError('Maximum top-up amount is ₹10,000 per request.');
      return;
    }

    setIsTopupLoading(true);

    try {
      // Call backend API
      await walletService.topup(amountNum);
      setTopupSuccess(`Successfully added ₹${amountNum.toFixed(2)} to your wallet!`);
      setTopupAmount('');

      // Refetch balance strictly from the API (never update locally)
      await fetchWalletAndActivity();

      setTimeout(() => {
        setTopupModalOpen(false);
        setTopupSuccess(null);
      }, 1200);
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Top-up failed. Demo mode might be disabled.';
      setTopupError(detail);
    } finally {
      setIsTopupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner (Required by prompt) */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Demo mode: no real money.
            </p>
            <p className="text-xs text-blue-800 mt-0.5">
              Testing top-up is permitted up to ₹10,000 per request. Transactions update your real wallet balance in PostgreSQL.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setTopupError(null);
            setTopupSuccess(null);
            setTopupModalOpen(true);
          }}
          className="inline-flex items-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition shrink-0 ml-3"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Add Money (Demo Mode)
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <p className="font-semibold">Error</p>
          <p className="mt-0.5">{errorMessage}</p>
        </div>
      )}

      {/* Wallet Card & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fintech Virtual Wallet Card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] tracking-widest uppercase font-bold text-blue-400">
                FinPay Campus Card
              </span>
              <h3 className="text-sm font-semibold text-slate-200 mt-0.5">
                {user?.full_name || 'Campus Student'}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md">
              <WalletIcon className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          <div className="my-4 relative z-10">
            <span className="text-xs text-slate-400 font-medium">Available Balance</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 text-white">
              {isLoading ? '...' : formatCurrency(wallet?.balance)}
            </h2>
          </div>

          <div className="flex justify-between items-end text-xs text-slate-400 pt-3 border-t border-slate-700/60 relative z-10">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Student ID
              </span>
              <span className="font-mono text-slate-200 font-semibold">{user?.student_id}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-medium text-right">
                Wallet ID
              </span>
              <span className="font-mono text-slate-200 font-semibold">
                #{wallet?.id || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Wallet Attributes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Wallet Specifications</h3>
              <button
                onClick={fetchWalletAndActivity}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                title="Refresh wallet balance"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Student Account</span>
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold text-slate-800 text-sm">{user?.full_name}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">University Roll Number / USN</span>
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold text-slate-800 text-sm font-mono">
                    {user?.student_id}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Wallet Status</span>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-800 text-sm uppercase">
                    {wallet?.status || 'Active'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Wallet Created At</span>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold text-slate-800 text-sm">
                    {wallet?.created_at ? formatDateTime(wallet.created_at) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
            <span>Funding Rule: Frontend balance modification is disabled. All ledger logic enforced by backend.</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Wallet Recent Activity</h3>
            <p className="text-xs text-slate-500">Recent credits, top-ups, and debit charges</p>
          </div>
        </div>
        <TransactionTable transactions={recentActivity} isLoading={isLoading} />
      </div>

      {/* Demo Top-Up Modal Form */}
      {topupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Add Money (Demo Mode)</h3>
              </div>
              <button
                onClick={() => setTopupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTopupSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Top up your test balance. Enter an amount between ₹1.00 and ₹10,000.00.
              </p>

              {topupError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{topupError}</span>
                </div>
              )}

              {topupSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{topupSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Top-Up Amount (₹)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                    ₹
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="10000"
                    placeholder="e.g. 500"
                    required
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    disabled={isTopupLoading}
                    className="w-full pl-8 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2 pt-1">
                {['100', '250', '500', '1000'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTopupAmount(val)}
                    className="flex-1 py-1 px-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
                  >
                    +₹{val}
                  </button>
                ))}
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isTopupLoading}
                  className="w-full flex items-center justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:bg-blue-400"
                >
                  {isTopupLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Crediting Wallet...
                    </>
                  ) : (
                    'Confirm Top-Up'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
