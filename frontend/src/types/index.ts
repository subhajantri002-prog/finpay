export interface User {
  id: number;
  full_name: string;
  student_id: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Wallet {
  id: number;
  user_id: number;
  balance: number | string;
  status: string;
  created_at: string;
}

export interface Merchant {
  id: number;
  name: string;
  is_active: boolean;
}

export interface Transaction {
  id: number;
  wallet_id: number;
  merchant_id: number | null;
  merchant_name?: string | null;
  amount: number | string;
  status: 'success' | 'failed' | string;
  type: 'debit' | 'credit' | 'topup' | string;
  description: string | null;
  idempotency_key: string | null;
  created_at: string;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CashbackRecord {
  id: number;
  transaction_id: number;
  amount: number | string;
  status: string;
  created_at: string;
}

export interface CashbackSummary {
  total_cashback: number | string;
  monthly_cashback: number | string;
  history: CashbackRecord[];
  calculation_details?: string | null;
}

export interface MonthlySpendingItem {
  month: string;
  month_name: string;
  total_spent: number | string;
  transaction_count: number;
}

export interface MonthlySpendingReport {
  items: MonthlySpendingItem[];
  total_spent_all_time: number | string;
}

export interface ReconciliationItem {
  month: string;
  month_name: string;
  total_credits: number | string;
  total_debits: number | string;
  total_cashback: number | string;
  net_change: number | string;
  starting_balance: number | string;
  ending_balance: number | string;
  status: string;
}

export interface ReconciliationReport {
  current_wallet_balance: number | string;
  total_all_time_credits: number | string;
  total_all_time_debits: number | string;
  total_all_time_cashback: number | string;
  reconciled_balance: number | string;
  is_reconciled: boolean;
  monthly_breakdown: ReconciliationItem[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PaymentPayload {
  merchant_id: number;
  amount: number;
  description?: string;
}
