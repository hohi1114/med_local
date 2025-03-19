import { useEffect } from "react";
import useRangeDurationDatePicker from "./useRangeDurationDatePicker";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "../utils/api/apis.js";
import { DashBoard } from "../types/dashboard.js";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

const useDashBoard = () => {
  const { rangeDate, handleDateChange } = useRangeDurationDatePicker();
  const {
    data: dashboardInfo,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch
  } = useQuery<DashBoard>({
    queryKey: ["dashboardInfo"],
    queryFn: () => getDashboardData(rangeDate),
    enabled: false,
    retry: false
  });

  useEffect(() => {
    if (rangeDate) {
      refetch();
    }
  }, [rangeDate]);

  const handleDateFilterButton = (content: string) => {
    const today = dayjs();
    switch (content) {
      case "오늘":
        return handleDateChange({
          startDate: today,
          endDate: today
        });
      case "3일":
        return handleDateChange({
          startDate: today.subtract(3, "day"),
          endDate: today
        });
      case "7일":
        return handleDateChange({
          startDate: today.subtract(7, "day"),
          endDate: today
        });
      case "1개월":
        return handleDateChange({
          startDate: today.subtract(1, "month"),
          endDate: today
        });
      case "3개월":
        return handleDateChange({
          startDate: today.subtract(3, "month"),
          endDate: today
        });
      case "1년":
        return handleDateChange({
          startDate: today.subtract(1, "year"),
          endDate: today
        });
      default:
        return;
    }
  };

  return {
    rangeDate,
    handleDateChange,
    handleDateFilterButton,
    dashboardInfo,
    isLoading,
    isRefetching,
    error,
    isError
  };
};

export default useDashBoard;
