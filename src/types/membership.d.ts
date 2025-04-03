export interface Membership {
  type: string;
  name: string;
  day: number;
  amount: number;
  original_amount: number | null;
}

export interface PaymentHistory {
  paid_date: string;
  card_last_num: string;
  amount: number;
  info: string;
}
