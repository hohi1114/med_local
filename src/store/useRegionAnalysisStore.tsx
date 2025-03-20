import { create } from "zustand";
import { RegionStatistics } from "../types/region-analysis";
import { LocalSectionKey } from "../hooks/useRegionAnalysis";

type RegionAnalysisStore = {
  localSection: LocalSectionKey;
  smallSectionData: RegionStatistics[];
  dongSectionData: RegionStatistics[];
  guSectionData: RegionStatistics[];
  setSmallSectionData: (data: RegionStatistics[]) => void;
  setDongSectionData: (data: RegionStatistics[]) => void;
  setGuSectionData: (data: RegionStatistics[]) => void;
  setLocalSection: (section: LocalSectionKey) => void;
};

export const useRegionAnalysisStore = create<RegionAnalysisStore>((set) => ({
  localSection: "시",
  smallSectionData: [],
  dongSectionData: [],
  guSectionData: [],
  setSmallSectionData: (data) => set({ smallSectionData: data }),
  setDongSectionData: (data) => set({ dongSectionData: data }),
  setGuSectionData: (data) => set({ guSectionData: data }),
  setLocalSection: (section) => set({ localSection: section })
}));
