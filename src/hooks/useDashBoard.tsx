import { useEffect } from "react";
import useRangeDurationDatePicker from "./useRangeDurationDatePicker";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData, getUserInfo } from "../utils/api/apis.js";
import { DashBoard } from "../types/dashboard.js";
import isBetween from "dayjs/plugin/isBetween";
import userStore from "../store/userStore.js";

dayjs.extend(isBetween);

const useDashBoard = () => {
  const { rangeDate, handleDateChange } = useRangeDurationDatePicker();
  const { user, setUser } = userStore();
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

  /*** 고치기!!!!!!!!!!!!!!!!!!! */
  const { data, refetch: userRefetch } = useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfo(),
    enabled: false,
    retry: false
  });

  //자동로그인시 유저정보 fetch
  useEffect(() => {
    if (!user) {
      userRefetch();
    } else if (data) {
      setUser(data);
    }
  }, [user, data]);

  useEffect(() => {
    setTimeout(() => {
      userRefetch();
    }, 5000);
  }, []);

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
