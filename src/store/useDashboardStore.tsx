import { create } from "zustand";
import { DashBoard } from "../types/dashboard";

interface DashboardStore {
  dashboardData: DashBoard | null;
  todayData: DashBoard | null;
  threeDaysData: DashBoard | null;
  weekData: DashBoard | null;
  monthData: DashBoard | null;
  threeMonthData: DashBoard | null;
  oneYearData: DashBoard | null;

  setDashboardData: (data: DashBoard) => void;
  setTodayData: (data: DashBoard) => void;
  setThreeDaysData: (data: DashBoard) => void;
  setWeekData: (data: DashBoard) => void;
  setMonthData: (data: DashBoard) => void;
  setThreeMonthData: (data: DashBoard) => void;
  setOneYearData: (data: DashBoard) => void;
}

const useDashboardStore = create<DashboardStore>((set) => ({
  dashboardData: null,
  todayData: null,
  threeDaysData: null,
  weekData: null,
  monthData: null,
  threeMonthData: null,
  oneYearData: null,
  setDashboardData: (data: DashBoard) => set({ dashboardData: data }),
  setTodayData: (data: DashBoard) => set({ todayData: data }),
  setThreeDaysData: (data: DashBoard) => set({ threeDaysData: data }),
  setWeekData: (data: DashBoard) => set({ weekData: data }),
  setMonthData: (data: DashBoard) => set({ monthData: data }),
  setThreeMonthData: (data: DashBoard) => set({ threeMonthData: data }),
  setOneYearData: (data: DashBoard) => set({ oneYearData: data })
}));

export default useDashboardStore;
