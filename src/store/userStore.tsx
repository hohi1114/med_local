import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  role: string;
  //구독 정보
  plan: string | null;
  subscribedStatus: string | null;
  nextBillingDate: string | null;
  isFreeTrial: boolean | null;
  trialEndDate: string | null;
  cardName?: string | null;
  cardLastNumber?: string | null;
}

interface UserStore {
  user: User;
  setUser: (user: User) => void;
  clearUser: () => void;
}

const userStore = create<UserStore>((set) => ({
  user: {
    id: "",
    name: "",
    email: "",
    created_at: "",
    role: "",
    plan: null,
    subscribedStatus: null,
    nextBillingDate: null,
    isFreeTrial: false,
    trialEndDate: null,
    cardName: null,
    cardLastNumber: null
  },
  setUser: (user: User) => set({ user }),
  clearUser: () =>
    set({
      user: {
        id: "",
        name: "",
        email: "",
        created_at: "",
        role: "",
        plan: null,
        subscribedStatus: null,
        nextBillingDate: null,
        isFreeTrial: false,
        trialEndDate: null,
        cardName: null,
        cardLastNumber: null
      }
    })
}));

export default userStore;
