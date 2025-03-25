import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  role: string;
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
    role: ""
  },
  setUser: (user: User) => set({ user }),
  clearUser: () =>
    set({ user: { id: "", name: "", email: "", created_at: "", role: "" } })
}));

export default userStore;
