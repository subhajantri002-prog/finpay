import React, { useState, useEffect } from 'react';
import { Send, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { Merchant } from '../types';
import { paymentService } from '../services/paymentService';
import { formatCurrency, generateUUID } from '../utils/formatters';

interface PaymentFormProps {
  currentBalance: number;
  merchants: Merchant[];
  isLoadingMerchants: boolean;
  onPaymentSuccess: (tx: any, updatedBalance: number) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  currentBalance,
  merchants,
  isLoadingMerchants,
  onPaymentSuccess,
}) => {
  const [merchantId, setMerchantId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-select first merchant when available
  useEffect(() => {
    if (merchants.length > 0 && !merchantId) {
      setMerchantId(String(merchants[0].id));
    }
  }, [merchants, merchantId]);

  const numAmount = parseFloat(amount) || 0;
  const isZeroBalance = currentBalance <= 0;
  const isInsufficient = numAmount > currentBalance && !isZeroBalance;
  const isInvalidAmount = numAmount <= 0;

  const isButtonDisabled =
    isSubmitting ||
    isZeroBalance ||
    isInsufficient ||
    isInvalidAmount ||
    !merchantId ||
    isLoadingMerchants;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isButtonDisabled) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    // Generate fresh idempotency key per payment attempt
    const idempotencyKey = generateUUID();

    try {
      const tx = await paymentService.sendPayment(
        {
          merchant_id: parseInt(merchantId, 10),
          amount: numAmount,
          description: description.trim() || undefined,
        },
        idempotencyKey
      );

      // Amount subtracted by backend
      const newBalance = currentBalance - numAmount;
      onPaymentSuccess(tx, newBalance);

      // Reset form fields
      setAmount('');
      setDescription('');
    } catch (err: any) {
      const backendError =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Payment failed. Please check your balance and try again.';
      setErrorMessage(backendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-1">Make a Campus Payment</h3>
      <p className="text-xs text-slate-500 mb-6">
        Pay authorized campus cafeteria, bookstore, or department merchants securely.
      </p>

      {/* Zero balance notice */}
      {isZeroBalance && (
        <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold">Your wallet has no money.</p>
            <p className="mt-0.5">
              You cannot make a payment. Please add money to continue.
            </p>
          </div>
        </div>
      )}

      {/* Insufficient balance notice */}
      {isInsufficient && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-2.5 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Insufficient balance. Your balance is {formatCurrency(currentBalance)}.</span>
        </div>
      )}

      {/* Error alert from backend */}
      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Payment Rejected</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Merchant Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Select Campus Merchant *
          </label>
          {isLoadingMerchants ? (
            <div className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-sm">
              Loading available merchants...
            </div>
          ) : merchants.length === 0 ? (
            <div className="w-full px-3.5 py-2.5 border border-amber-200 rounded-xl bg-amber-50 text-amber-700 text-xs">
              No campus merchants configured yet.
            </div>
          ) : (
            <select
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              disabled={isSubmitting || isZeroBalance}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Amount */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-slate-700">Amount (₹) *</label>
            <span className="text-[11px] text-slate-400">
              Available: <strong className="text-slate-700">{formatCurrency(currentBalance)}</strong>
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
              ₹
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting || isZeroBalance}
              className={`w-full pl-8 pr-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                isInsufficient
                  ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Note / Description (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Lunch meal, Lab manual, Printouts"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting || isZeroBalance}
            maxLength={100}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={isButtonDisabled}
          className={`w-full flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-xl text-white shadow-sm transition ${
            isButtonDisabled
              ? 'bg-slate-300 cursor-not-allowed text-slate-500'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing Atomic Payment...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Confirm Payment
            </>
          )}
        </button>
      </div>
    </form>
  );
};
