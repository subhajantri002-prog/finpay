import { api } from './api';
import { Merchant, PaymentPayload, Transaction } from '../types';

export const paymentService = {
  async getMerchants(): Promise<Merchant[]> {
    const res = await api.get<Merchant[]>('/merchants');
    return res.data;
  },

  async sendPayment(payload: PaymentPayload, idempotencyKey: string): Promise<Transaction> {
    const res = await api.post<Transaction>('/payments', payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return res.data;
  },
};
