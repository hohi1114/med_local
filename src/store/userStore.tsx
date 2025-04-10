import { create } from "zustand";
import { User } from "../types/auth";
import dayjs from "dayjs";

interface UserStore {
  user: User;
  isFreetrialUser: boolean;
  isInActiveUser: boolean;
  hasUserCard: boolean;
  fetchingUserLoading: boolean;
  updatedDates: string[] | null;
  lastedUpdatedDate: string | null;
  hasGuided: boolean;
  startTutorial: boolean;

  setUser: (user: User) => void;
  clearUser: () => void;
  setFetchingUserLoading: (loading: boolean) => void;
  setIsFreetrialUser: (isFreetrialUser: boolean) => void;
  setIsInActiveUser: (isInActiveUser: boolean) => void;
  setHasUserCard: (hasUserCard: boolean) => void;
  setUpdatedDates: (updatedDates: string[]) => void;
  setLastedUpdatedDate: (lastedUpdatedDate: string) => void;
  setGuided: (hasGuided: boolean) => void;
  setStartTutorial: (startTutorial: boolean) => void;
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
    nice_bid: null,
    location: null,
    emr: null,
    next_plan: null,
    updated_at: null,
    free: false
  },
  updatedDates: null,
  lastedUpdatedDate: null,
  fetchingUserLoading: true,
  isFreetrialUser: false,
  isInActiveUser: false,
  hasUserCard: false,
  hasGuided: false,
  startTutorial: false,
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
        nice_bid: null,
        location: null,
        emr: null,
        next_plan: null,
        updated_at: null,
        free: false
      }
    }),
  setIsFreetrialUser: (isFreetrialUser: boolean) => set({ isFreetrialUser }),
  setIsInActiveUser: (isInActiveUser: boolean) => set({ isInActiveUser }),
  setUpdatedDates: (updatedDates: string[]) =>
    set(() => {
      if (updatedDates.length === 0) {
        return { updatedDates, lastedUpdatedDate: [] };
      }
      const lastedDate = updatedDates.reduce((latest, current) => {
        return dayjs(current).isAfter(dayjs(latest)) ? current : latest;
      });
      return {
        updatedDates,
        lastedUpdatedDate: lastedDate
      };
    }),

  setLastedUpdatedDate: (lastedUpdatedDate: string) =>
    set({ lastedUpdatedDate }),
  setGuided: (hasGuided: boolean) => set({ hasGuided }),
  setStartTutorial: (startTutorial: boolean) => set({ startTutorial })
}));

export default userStore;
