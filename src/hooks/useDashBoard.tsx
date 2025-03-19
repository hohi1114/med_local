import { useEffect } from "react";
import useRangeDurationDatePicker from "./useRangeDurationDatePicker";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import {
  getAllRegions,
  getDashboardData,
  getUserInfo
} from "../utils/api/apis.js";
import { DashBoard } from "../types/dashboard.js";
import isBetween from "dayjs/plugin/isBetween";
import userStore from "../store/userStore.js";
import { saveDataToIndexDB } from "../store/indexded_db/RegionDB.js";

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
    refetch: dashboardInfoFetch
  } = useQuery<DashBoard>({
    queryKey: ["dashboardInfo"],
    queryFn: () => getDashboardData(rangeDate),
    enabled: false,
    retry: false
  });

  const { data, refetch: userRefetch } = useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfo(),
    enabled: !!user,
    retry: false
  });

  const { data: allregionData, refetch: allRegionsRefecth } = useQuery({
    queryKey: ["allRegions"],
    queryFn: () => getAllRegions(),
    enabled: false,
    retry: false
  });

  //DashboardInfo fetch
  useEffect(() => {
    if (rangeDate) {
      dashboardInfoFetch();
    }
  }, [rangeDate]);

  //자동로그인시 유저정보 fetch
  useEffect(() => {
    if (!user) {
      userRefetch();
    } else if (data) {
      setUser(data);
    }
  }, [user, data]);

  //지역 데이터 IndexedDB에 저장
  useEffect(() => {
    allRegionsRefecth();
  }, []);

  useEffect(() => {
    if (allregionData) {
      saveDataToIndexDB(allregionData);
    }
  }, [allregionData]);

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
