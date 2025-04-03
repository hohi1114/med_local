import { create } from "zustand";

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

interface UserStore {
  user: User;
  isFreetrialUser: boolean;
  isInActiveUser: boolean;
  fetchingUserLoading: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  setFetchingUserLoading: (loading: boolean) => void;
  setIsFreetrialUser: (isFreetrialUser: boolean) => void;
  setIsInActiveUser: (isInActiveUser: boolean) => void;
}

const userStore = create<UserStore>((set) => ({
  user: {
    user_id: "",
    name: "",
    email: "",
    created_at: "",
    role: "",
    plan: null,
    next_billing_date: null,
    is_free_trial: false,
    trial_end_date: null,
    card_name: null,
    card_last_num: null,
    status: null,
    last_payment_date: null,
    amount: null,
    nice_bid: null,
    location: null,
    emr: null,
    next_plan: null,
    updated_at: null,
    free: false
  },
  fetchingUserLoading: true,
  isFreetrialUser: false,
  isInActiveUser: false,
  setFetchingUserLoading: (fetchingUserLoading: boolean) =>
    set({ fetchingUserLoading }),
  setUser: (user: User) => set({ user }),
  clearUser: () =>
    set({
      user: {
        user_id: "",
        name: "",
        email: "",
        created_at: "",
        role: "",
        plan: null,
        next_billing_date: null,
        is_free_trial: false,
        trial_end_date: null,
        card_name: null,
        card_last_num: null,
        status: null,
        last_payment_date: null,
        amount: null,
        nice_bid: null,
        location: null,
        emr: null,
        next_plan: null,
        updated_at: null,
        free: false
      }
    }),
  setIsFreetrialUser: (isFreetrialUser: boolean) => set({ isFreetrialUser }),
  setIsInActiveUser: (isInActiveUser: boolean) => set({ isInActiveUser })
}));

export default userStore;
