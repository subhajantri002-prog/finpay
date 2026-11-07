import React from 'react';
import { CheckCircle2, X, Download, ArrowRight } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface ReceiptModalProps {
  transaction: Transaction | null;
  updatedBalance: number | string | null;
  onClose: () => void;
  onViewTransactions: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  updatedBalance,
  onClose,
  onViewTransactions,
}) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-emerald-600 px-6 py-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-xs rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Payment Successful!</h3>
          <p className="text-xs text-emerald-100 mt-1">Transaction completed atomically</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center pb-5 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Amount Paid
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              {formatCurrency(transaction.amount)}
            </h2>
          </div>

          <div className="py-4 space-y-3 text-sm">
            <div className="flex justify-between items-center text-slate-600">
              <span className="text-slate-400">Transaction ID</span>
              <span className="font-mono text-xs font-semibold text-slate-800">
                #{transaction.id}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span className="text-slate-400">Merchant</span>
              <span className="font-semibold text-slate-900">
                {transaction.merchant_name || 'Campus Merchant'}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span className="text-slate-400">Date & Time</span>
              <span className="font-medium text-slate-800">
                {formatDateTime(transaction.created_at)}
              </span>
            </div>

            {updatedBalance !== null && (
              <div className="flex justify-between items-center text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                <span className="text-slate-500 font-medium">Updated Wallet Balance</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(updatedBalance)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onViewTransactions}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            View History <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-100 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
