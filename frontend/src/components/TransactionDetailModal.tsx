import React from 'react';
import { X, CheckCircle2, AlertCircle, ArrowDownRight, ArrowUpRight, Copy } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  const isDebit = transaction.type === 'debit';
  const isSuccess = transaction.status === 'success';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-base font-semibold text-slate-800">Transaction Details</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Amount and Status banner */}
          <div className="text-center pb-6 border-b border-slate-100">
            <div
              className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3 ${
                isDebit
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {isDebit ? (
                <ArrowDownRight className="w-6 h-6" />
              ) : (
                <ArrowUpRight className="w-6 h-6" />
              )}
            </div>
            <p className="text-xs uppercase tracking-wider font-medium text-slate-400">
              {transaction.type.toUpperCase()}
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              {isDebit ? '-' : '+'}
              {formatCurrency(transaction.amount)}
            </h2>
            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold">
              {isSuccess ? (
                <span className="flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Success
                </span>
              ) : (
                <span className="flex items-center text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Failed
                </span>
              )}
            </div>
          </div>

          {/* Details list */}
          <div className="py-4 space-y-3 text-sm">
            <div className="flex justify-between items-center text-slate-600">
              <span className="text-slate-400">Transaction ID</span>
              <span className="font-mono text-xs font-medium text-slate-800">
                #{transaction.id}
              </span>
            </div>

            {transaction.merchant_name && (
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-400">Merchant</span>
                <span className="font-semibold text-slate-800">
                  {transaction.merchant_name}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-600">
              <span className="text-slate-400">Description</span>
              <span className="font-medium text-slate-800 text-right max-w-[200px] truncate">
                {transaction.description || 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span className="text-slate-400">Date & Time</span>
              <span className="font-medium text-slate-800">
                {formatDateTime(transaction.created_at)}
              </span>
            </div>

            {transaction.idempotency_key && (
              <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-100">
                <span className="text-slate-400 text-xs">Idempotency Key</span>
                <button
                  onClick={() => copyToClipboard(transaction.idempotency_key!)}
                  className="flex items-center space-x-1 font-mono text-[11px] text-blue-600 hover:text-blue-800 max-w-[180px] truncate"
                  title="Copy idempotency key"
                >
                  <span className="truncate">{transaction.idempotency_key}</span>
                  <Copy className="w-3 h-3 shrink-0" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
