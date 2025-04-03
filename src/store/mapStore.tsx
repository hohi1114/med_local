import { create } from "zustand";
import { PatientData } from "../utils/ExcelParser";
import { Polygon, RegionData } from "../types/naver-maps";
import { DateRange } from "../hooks/useRangeDurationDatePicker";

interface IMapStore {
  region: string;
  areaName: string;
  selectedRegionData: RegionData | null;
  drawerDate: DateRange | null;
  isOpenDrawer: boolean;
  dongPolygons: Polygon[];
  dongNmaeFroSmall: string | null;
  boundArea: RegionData[] | null;
  loading: boolean;
  patients: { areaName: string; patients: PatientData[] }[];

  setRegion: (region: string) => void;
  setAreaName: (areaName: string) => void;
  setDrawerDate: (drawerDate: DateRange) => void;
  handleIsDrawerOpen: (isDrawerOpen: boolean) => void;
  setSelctedRegionData: (data: RegionData) => void;
  setDongPolygons: (dongPolygons: Polygon[]) => void;
  setDongNameForSmall: (dongNmaeFroSmall: string | null) => void;
  setBoundArea: (boundArea: RegionData[]) => void;
  setLoading: (loading: boolean) => void;
  setPatients: (
    patients: { areaName: string; patients: PatientData[] }[]
  ) => void;
}

const mapStore = create<IMapStore>((set) => ({
  region: "small",
  areaName: "",
  selectedRegionData: null,
  drawerDate: null,
  isOpenDrawer: false,
  dongPolygons: [],
  dongNmaeFroSmall: null,
  boundArea: null,
  loading: false,
  patients: [],

  setRegion: (region) => set({ region }),
  setAreaName: (areaName) => set({ areaName }),
  setDongNameForSmall: (dongNmaeFroSmall) => set({ dongNmaeFroSmall }),
  setSelctedRegionData: (selectedRegionData: RegionData) =>
    set({ selectedRegionData }),
  setLoading: (loading: boolean) => set({ loading }),
  setBoundArea: (boundArea) => set({ boundArea }),
  setPatients: (patients) => set({ patients }),
  setDrawerDate: (drawerDate) => set({ drawerDate }),
  handleIsDrawerOpen: (isOpenDrawer) => set({ isOpenDrawer }),
  setDongPolygons: (dongPolygons: Polygon[]) => set({ dongPolygons }),
  setSmallPolygons: (smallPolygons: Polygon[]) => set({ smallPolygons })
}));

export default mapStore;
