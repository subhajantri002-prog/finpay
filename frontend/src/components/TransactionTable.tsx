import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { TransactionDetailModal } from './TransactionDetailModal';

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  isLoading = false,
}) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
        <p className="text-sm">Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p className="text-sm font-medium">No transactions yet.</p>
      </div>
    );
  }

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'debit':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ArrowDownRight className="w-3 h-3 mr-1" /> Debit
          </span>
        );
      case 'credit':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowUpRight className="w-3 h-3 mr-1" /> Credit
          </span>
        );
      case 'topup':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ArrowUpRight className="w-3 h-3 mr-1" /> Top-Up
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    if (status.toLowerCase() === 'success') {
      return (
        <span className="inline-flex items-center text-xs font-medium text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Success
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-xs font-medium text-rose-700">
        <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Failed
      </span>
    );
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Tx ID</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Merchant / Description</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isDebit = tx.type === 'debit';
              return (
                <tr
                  key={tx.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => setSelectedTx(tx)}
                >
                  <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-800">
                    #{tx.id}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatDateTime(tx.created_at)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{getTypeBadge(tx.type)}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900 truncate max-w-xs">
                      {tx.merchant_name || tx.description || 'Campus Transaction'}
                    </div>
                    {tx.merchant_name && tx.description && (
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {tx.description}
                      </div>
                    )}
                  </td>
                  <td
                    className={`py-3.5 px-4 text-right font-semibold whitespace-nowrap ${
                      isDebit ? 'text-slate-900' : 'text-emerald-600'
                    }`}
                  >
                    {isDebit ? '-' : '+'}
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(tx.status)}</td>
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedTx(tx)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </>
  );
};
