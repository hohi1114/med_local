import { create } from "zustand";
import { RegionStatistics } from "../types/region-analysis";
import { LocalSectionKey } from "../hooks/useRegionAnalysis";
import { DateRange } from "../hooks/useRangeDurationDatePicker";

type RegionAnalysisStore = {
  selectedDateRange: DateRange | null;
  searchWord: string;
  localSection: LocalSectionKey;
  smallSectionData: RegionStatistics[];
  dongSectionData: RegionStatistics[];
  guSectionData: RegionStatistics[];
  data: RegionStatistics[];
  filteredData: RegionStatistics[];

  setSelectedDateRange: (dateRange: DateRange) => void;
  setSmallSectionData: (data: RegionStatistics[]) => void;
  setDongSectionData: (data: RegionStatistics[]) => void;
  setGuSectionData: (data: RegionStatistics[]) => void;
  setLocalSection: (section: LocalSectionKey) => void;
  setSearchWord: (word: React.ChangeEvent<HTMLInputElement>) => void;
  setData: (data: RegionStatistics[]) => void;
  setFilteredData: (data: RegionStatistics[]) => void;
};

export const useRegionAnalysisStore = create<RegionAnalysisStore>((set) => ({
  selectedDateRange: null,
  localSection: "소구역",
  smallSectionData: [],
  dongSectionData: [],
  guSectionData: [],
  searchWord: "",
  data: [],
  filteredData: [],

  setSelectedDateRange: (dateRange: DateRange) =>
    set({ selectedDateRange: dateRange }),
  setSmallSectionData: (data) => set({ smallSectionData: data }),
  setDongSectionData: (data) => set({ dongSectionData: data }),
  setGuSectionData: (data) => set({ guSectionData: data }),
  setLocalSection: (section) => set({ localSection: section }),
  setSearchWord: (event) => set({ searchWord: event.target.value }),
  setData: (data) => set({ data }),
  setFilteredData: (data) => set({ filteredData: data })
}));
