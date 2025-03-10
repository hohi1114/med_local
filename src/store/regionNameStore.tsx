import { create } from "zustand";

export type RegionName = {
  id: number;
  name: string;
};
interface IRegionNameStore {
  gu: RegionName[];
  dong: RegionName[];
  small: RegionName[];
  setGu: (gu: RegionName[]) => void;
  setDong: (dong: RegionName[]) => void;
  setSmall: (small: RegionName[]) => void;
}

const regionNameStore = create<IRegionNameStore>((set) => ({
  gu: [],
  dong: [],
  small: [],
  setGu: (gu) => set({ gu }),
  setDong: (dong) => set({ dong }),
  setSmall: (small) => set({ small })
}));

export default regionNameStore;
