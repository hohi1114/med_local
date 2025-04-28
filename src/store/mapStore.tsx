import { create } from "zustand";
import { PatientData } from "../utils/ExcelParser";
import { Polygon, RegionData } from "../types/naver-maps";
import { DateRange } from "../hooks/useRangeDurationDatePicker";

interface IMapStore {
  selectedDateRange: DateRange | null;
  selectedDateRangeForCompare1: DateRange | null;
  selectedDateRangeForCompare2: DateRange | null;
  region: string;
  areaName: string;
  selectedRegionData: RegionData | null;
  drawerDate: DateRange | null;
  drawerDate1: DateRange | null;
  drawerDate2: DateRange | null;
  isOpenDrawer: boolean;
  dongPolygons: Polygon[];
  dongNameFroSmall: string | null;
  boundArea: RegionData[] | null;
  loading: boolean;
  patients: { areaName: string; patients: PatientData[] }[];
  isChangedDateRange: boolean;
  //지역 통계 종합 보기
  isAnalyzeMultiRegion: boolean;
  selectedMultiRegion: string[];

  setSelectedDateRange: (dateRange: DateRange) => void;
  setSelectedDateRangeForCompare1: (dateRange: DateRange) => void;
  setSelectedDateRangeForCompare2: (dateRange: DateRange) => void;
  setRegion: (region: string) => void;
  setAreaName: (areaName: string) => void;
  setDrawerDate: (drawerDate: DateRange) => void;
  setDrawerDate1: (drawerDate: DateRange) => void;
  setDrawerDate2: (drawerDate: DateRange) => void;
  handleIsDrawerOpen: (isDrawerOpen: boolean) => void;
  setSelectedRegionData: (data: RegionData) => void;
  setDongPolygons: (dongPolygons: Polygon[]) => void;
  setDongNameForSmall: (dongNameFroSmall: string | null) => void;
  setBoundArea: (boundArea: RegionData[]) => void;
  setLoading: (loading: boolean) => void;
  setPatients: (
    patients: { areaName: string; patients: PatientData[] }[]
  ) => void;
  clearMap: () => void;
  setIsChangedDateRange: (isChangedDateRange: boolean) => void;

  //지역 통계 종합 보기
  handleIsAnalyzeMultiRegion: () => void;
  addSelectedMultiRegion: (selectedMultiRegion: string) => void;
  removeSelectedMultiRegion: (selectedMultiRegion: string) => void;
  initSelectedMultiRegion: () => void;
}

const mapStore = create<IMapStore>((set) => ({
  isAnalyzeMultiRegion: false,
  selectedMultiRegion: [],
  isChangedDateRange: false,
  selectedDateRange: null,
  selectedDateRangeForCompare1: null,
  selectedDateRangeForCompare2: null,
  region: "small",
  areaName: "",
  selectedRegionData: null,
  drawerDate: null,
  drawerDate1: null,
  drawerDate2: null,
  isOpenDrawer: false,
  dongPolygons: [],
  dongNameFroSmall: null,
  boundArea: null,
  loading: false,
  patients: [],

  setSelectedDateRange: (dateRange: DateRange) =>
    set({ selectedDateRange: dateRange }),
  setSelectedDateRangeForCompare1: (selectedDateRangeForCompare1: DateRange) =>
    set({ selectedDateRangeForCompare1 }),
  setSelectedDateRangeForCompare2: (selectedDateRangeForCompare2: DateRange) =>
    set({ selectedDateRangeForCompare2 }),
  setRegion: (region) => set({ region }),
  setAreaName: (areaName) => set({ areaName }),
  setDongNameForSmall: (dongNameFroSmall) => set({ dongNameFroSmall }),
  setSelectedRegionData: (selectedRegionData: RegionData) =>
    set({ selectedRegionData }),
  setLoading: (loading: boolean) => set({ loading }),
  setBoundArea: (boundArea) => set({ boundArea }),
  setPatients: (patients) => set({ patients }),
  setDrawerDate: (drawerDate) => set({ drawerDate }),
  setDrawerDate1: (drawerDate1) => set({ drawerDate1 }),
  setDrawerDate2: (drawerDate2) => set({ drawerDate2 }),
  handleIsDrawerOpen: (isOpenDrawer) => set({ isOpenDrawer }),
  setDongPolygons: (dongPolygons: Polygon[]) => set({ dongPolygons }),
  clearMap: () =>
    set({
      region: "small",
      areaName: "",
      selectedRegionData: null,
      drawerDate: null,
      isOpenDrawer: false,
      dongPolygons: [],
      dongNameFroSmall: null,
      boundArea: null,
      loading: false,
      patients: []
    }),
  setIsChangedDateRange: (isChangedDateRange: boolean) =>
    set({ isChangedDateRange }),

  handleIsAnalyzeMultiRegion() {
    set((state) => ({ isAnalyzeMultiRegion: !state.isAnalyzeMultiRegion }));
  },
  addSelectedMultiRegion: (region) => {
    set((state) => {
      console.log(region);
      return { selectedMultiRegion: [...state.selectedMultiRegion, region] };
    });
  },
  removeSelectedMultiRegion: (region) => {
    set((state) => {
      return {
        selectedMultiRegion: state.selectedMultiRegion.filter(
          (item) => item !== region
        )
      };
    });
  },
  initSelectedMultiRegion: () => set({ selectedMultiRegion: [] })
}));

export default mapStore;
