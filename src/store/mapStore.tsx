import { create } from "zustand";
import { PatientData } from "../utils/ExcelParser";
import dayjs, { Dayjs } from "dayjs";
import { Polygon, RegionData } from "../types/naver-maps";

interface IMapStore {
  region: string;
  selectedRegionData: RegionData | null;
  drawerDate: { startDate: Dayjs; endDate: Dayjs } | null;
  isOpenDrawer: boolean;
  dongPolygons: Polygon[];
  smallPolygons: Polygon[];
  boundArea: RegionData[] | null;
  loading: boolean;

  setRegion: (region: string) => void;
  setDrawerDate: (drawerDate: { startDate: Dayjs; endDate: Dayjs }) => void;
  handleIsDrawerOpen: (isDrawerOpen: boolean) => void;
  setSelctedRegionData: (data: RegionData) => void;
  setDongPolygons: (dongPolygons: Polygon[]) => void;
  setSmallPolygons: (smallPolygons: Polygon[]) => void;
  setBoundArea: (boundArea: RegionData[]) => void;
  setLoading: (loading: boolean) => void;

  areaName: string; //지역이름
  totalPatients: number; //전체 환자 수
  totalCost: number; //누적 매출액
  revisitedPatients: number; //재방문 환자수
  firstVisitPatients: number; //신규 환자수
  totalPopulations: number;
  inflowRate: number; //유입비율
  revenueTrend: Record<string, number>;
  ageGroups: Record<string, number>;
  dailyRevenue: Record<string, { totalCost: number; patientCount: number }>; //객단가 = 총 매출 / 총 거래 수
  patients: { areaName: string; patients: PatientData[] }[];

  setAreaName: (areaName: string) => void;
  setTotalPatients: (totalPatients: number) => void;
  setTotalCost: (totalCost: number) => void;
  setRevisitedPatients: (revisitedPatients: number) => void;
  setFirstVisitPatients: (firstVisitPatients: number) => void;
  setTotalPopulations: (totalPopulations: number) => void;
  setInflowRate: (inflowRate: number) => void;
  setRevenueTrend: (revenuTrend: Record<string, number>) => void;
  setAgeGroups: (ageGroups: Record<string, number>) => void;
  setDailyRevenue: (
    dailyRevenue: Record<string, { totalCost: number; patientCount: number }>
  ) => void;
  setPatients: (
    patients: { areaName: string; patients: PatientData[] }[]
  ) => void;
}

const mapStore = create<IMapStore>((set) => ({
  areaName: "",
  totalPatients: 0,
  totalCost: 0,
  revisitedPatients: 0,
  firstVisitPatients: 0,
  totalPopulations: 0,
  inflowRate: 0,
  revenueTrend: {},
  ageGroups: {},
  dailyRevenue: {},
  patients: [],
  region: "small",
  drawerDate: null,
  isOpenDrawer: false,
  selectedRegionData: null,
  dongPolygons: [],
  smallPolygons: [],
  boundArea: null,
  loading: false,

  setLoading: (loading: boolean) => set({ loading }),
  setBoundArea: (boundArea) => set({ boundArea }),
  setAreaName: (areaName) => set({ areaName }),
  setTotalPatients: (totalPatients) => set({ totalPatients }),
  setTotalCost: (totalCost) => set({ totalCost }),
  setRevisitedPatients: (revisitedPatients) => set({ revisitedPatients }),
  setFirstVisitPatients: (firstVisitPatients) => set({ firstVisitPatients }),
  setTotalPopulations: (totalPopulations) => set({ totalPopulations }),
  setInflowRate: (inflowRate) => set({ inflowRate }),
  setRevenueTrend: (revenueTrend) => set({ revenueTrend }),
  setAgeGroups: (ageGroups) => set({ ageGroups }),
  setDailyRevenue: (dailyRevenue) => set({ dailyRevenue }),
  setPatients: (patients) => set({ patients }),
  setDrawerDate: (drawerDate) => set({ drawerDate }),
  handleIsDrawerOpen: (isOpenDrawer) => set({ isOpenDrawer }),
  setRegion: (region) => set({ region }),
  setSelctedRegionData: (selectedRegionData: RegionData) =>
    set({ selectedRegionData }),
  setDongPolygons: (dongPolygons: Polygon[]) => set({ dongPolygons }),
  setSmallPolygons: (smallPolygons: Polygon[]) => set({ smallPolygons })
}));

export default mapStore;
