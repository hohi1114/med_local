export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

export interface AuthError extends Error {
  statusCode?: number;
  code?: string;
}

export interface DecodedToken {
  sub: string; // 유저 ID
  exp: number; // 만료 시간
}

export interface User {
  user_id: string;
  name: string;
  email: string;
  created_at: string;
  role: string;
  plan: string | null;
  amount: number | null;
  next_billing_date: string | null;
  last_payment_date: string | null;
  is_free_trial: boolean | null;
  trial_end_date: string | null;
  card_name?: string | null;
  card_last_num?: string | null;
  status?: string | null;
  nice_bid?: string | null;
  location?: string | null;
  emr?: string | null;
  next_plan?: string | null;
  updated_at?: string | null;
  free: boolean;
}
