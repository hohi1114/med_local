import { create } from "zustand";
import { PatientData } from "../utils/ExcelParser";
import dayjs from "dayjs";

interface IMapStore {
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
  drawerDate: [Date, Date];
  isOpenDrawer: boolean;
  highestCost: { small: number; dong: number; gu: number };

  setDrawerDate: (drawerDate: [Date, Date]) => void;
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
  handleIsDrawerOpen: (isDrawerOpen: boolean) => void;
  setHighestCost: (highestCost: {
    small: number;
    dong: number;
    gu: number;
  }) => void;
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
  drawerDate: [new Date(), dayjs().subtract(1, "year").toDate()],
  isOpenDrawer: false,
  highestCost: { small: 175661741, dong: 417978115, gu: 123328002 },

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
  setHighestCost: (highestCost) => set({ highestCost })
}));

export default mapStore;
