import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ShieldCheck, History, ArrowRight } from 'lucide-react';
import { PaymentForm } from '../components/PaymentForm';
import { ReceiptModal } from '../components/ReceiptModal';
import { walletService } from '../services/walletService';
import { paymentService } from '../services/paymentService';
import { Merchant, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

export const Payments: React.FC = () => {
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success Receipt Modal state
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [receiptBalance, setReceiptBalance] = useState<number | null>(null);
  const [receiptOpen, setReceiptOpen] = useState<boolean>(false);

  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [walletData, merchantList] = await Promise.all([
        walletService.getWallet(),
        paymentService.getMerchants(),
      ]);
      setCurrentBalance(Number(walletData.balance));
      setMerchants(merchantList);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || 'Failed to load merchant and wallet data.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePaymentSuccess = async (tx: Transaction, _estimatedNewBalance: number) => {
    // Crucial rule: Never calculate or keep local balance permanently; refetch directly from backend API
    try {
      const updatedWallet = await walletService.getWallet();
      const freshBalance = Number(updatedWallet.balance);
      setCurrentBalance(freshBalance);
      setReceiptBalance(freshBalance);
    } catch {
      // Fallback to estimated if refetch failed
      setReceiptBalance(_estimatedNewBalance);
    }

    setLastTransaction(tx);
    setReceiptOpen(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <p className="font-semibold">Error</p>
          <p className="mt-0.5">{errorMessage}</p>
        </div>
      )}

      {/* Top Banner showing current balance */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Available Spending Balance
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {isLoading ? '...' : formatCurrency(currentBalance)}
            </h2>
          </div>
        </div>

        <button
          onClick={() => navigate('/transactions')}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition"
        >
          <History className="w-4 h-4 mr-1.5" />
          Past Transactions <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>

      {/* Payment Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <PaymentForm
            currentBalance={currentBalance}
            merchants={merchants}
            isLoadingMerchants={isLoading}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </div>

        {/* Security & Info Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center space-x-2.5 text-emerald-700 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Atomic Ledger Guarantee
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every payment executes inside a strict atomic database transaction with row-level locks.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                Idempotency key prevents double deduction
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                Instant merchant settlement
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                Automatic rollback upon failure
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
              Need to add money?
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              If your balance is zero or low, use Demo Top-Up on the My Wallet page.
            </p>
            <button
              onClick={() => navigate('/wallet')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
            >
              Go to My Wallet
            </button>
          </div>
        </div>
      </div>

      {/* Payment Receipt Modal */}
      {receiptOpen && (
        <ReceiptModal
          transaction={lastTransaction}
          updatedBalance={receiptBalance}
          onClose={() => setReceiptOpen(false)}
          onViewTransactions={() => {
            setReceiptOpen(false);
            navigate('/transactions');
          }}
        />
      )}
    </div>
  );
};
