import { create } from "zustand";
import { User } from "../types/auth";

interface UserStore {
  user: User;
  isFreetrialUser: boolean;
  isInActiveUser: boolean;
  hasUserCard: boolean;
  fetchingUserLoading: boolean;

  setUser: (user: User) => void;
  clearUser: () => void;
  setFetchingUserLoading: (loading: boolean) => void;
  setIsFreetrialUser: (isFreetrialUser: boolean) => void;
  setIsInActiveUser: (isInActiveUser: boolean) => void;
  setHasUserCard: (hasUserCard: boolean) => void;
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
  hasUserCard: false,
  setHasUserCard: (hasUserCard: boolean) => set({ hasUserCard }),
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
