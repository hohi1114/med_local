import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  role: string;
  //구독 정보
  plan: string;
  subscribedStatus: string;
  nextBillingDate: string;
  isFreeTrial: boolean;
  trialEndDate: string;
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
    plan: "",
    subscribedStatus: "",
    nextBillingDate: "",
    isFreeTrial: false,
    trialEndDate: ""
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
        plan: "",
        subscribedStatus: "",
        nextBillingDate: "",
        isFreeTrial: false,
        trialEndDate: ""
      }
    })
}));

export default userStore;
