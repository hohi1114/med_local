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

export interface Location {
  lat: number;
  long: number;
}

export interface User {
  card_last_num: string | null;
  card_name: string | null;
  created_at: string;
  email: string;
  emr: string | null;
  free: boolean;
  is_free_trial: boolean;
  last_payment_date: string | null;
  location: Location | null;
  name: string;
  next_billing_date: string | null;
  next_plan: string | null;
  nice_bid: string | null;
  plan: string | null;
  role: string | null;
  status: string | null;
  trial_end_date: string | null;
  updated_at: string | null;
  user_id: string;
}
