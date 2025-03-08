import { create } from "zustand";

interface IMapStore {
  areaName: string;
  totalPatients: number;
  totalCost: number;
  revisitedPatients: number;
  firstVisitPatients: number;
  totalPopulations: number;
  inflowRate: number;
  revenueTrend: Record<string, number>;
  ageGroups: Record<string, number>;
  dailyRevenue: Record<string, { totalCost: number; patientCount: number }>;

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

  setAreaName: (areaName) => set({ areaName }),
  setTotalPatients: (totalPatients) => set({ totalPatients }),
  setTotalCost: (totalCost) => set({ totalCost }),
  setRevisitedPatients: (revisitedPatients) => set({ revisitedPatients }),
  setFirstVisitPatients: (firstVisitPatients) => set({ firstVisitPatients }),
  setTotalPopulations: (totalPopulations) => set({ totalPopulations }),
  setInflowRate: (inflowRate) => set({ inflowRate }),
  setRevenueTrend: (revenueTrend) => set({ revenueTrend }),
  setAgeGroups: (ageGroups) => set({ ageGroups }),
  setDailyRevenue: (dailyRevenue) => set({ dailyRevenue })
}));

export default mapStore;
