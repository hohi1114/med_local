import { useEffect, useState } from "react";
import useRangeDurationDatePicker, {
  RangeDate
} from "./useRangeDurationDatePicker";
import dayjs from "dayjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getAllRegions, getDashboardData } from "../utils/api/apis.js";
import { DashBoard } from "../types/dashboard.js";
import isBetween from "dayjs/plugin/isBetween";
import { saveDataToIndexDB } from "../store/indexded_db/RegionDB.js";
import useDashboardStore from "../store/useDashboardStore.js";

dayjs.extend(isBetween);
export type RangeDateMapKey = keyof typeof RANGE_DATE_MAP;
const RANGE_DATE_MAP = {
  오늘: {
    startDate: dayjs(),
    endDate: dayjs()
  },
  "3일": {
    startDate: dayjs().subtract(3, "day"),
    endDate: dayjs()
  },
  "7일": {
    startDate: dayjs().subtract(7, "day"),
    endDate: dayjs()
  },
  "1개월": {
    startDate: dayjs().subtract(1, "month"),
    endDate: dayjs()
  },
  "3개월": {
    startDate: dayjs().subtract(3, "month"),
    endDate: dayjs()
  },
  "1년": {
    startDate: dayjs().subtract(1, "year"),
    endDate: dayjs()
  }
};
const useDashBoard = () => {
  const { rangeDate, handleDateChange } = useRangeDurationDatePicker();
  const [buttonType, setButtonType] = useState<string>("3개월");
  const {
    dashboardData,
    setDashboardData,
    todayData,
    monthData,
    threeDaysData,
    threeMonthData,
    oneYearData,
    weekData,
    setMonthData,
    setThreeDaysData,
    setThreeMonthData,
    setOneYearData,
    setTodayData,
    setWeekData
  } = useDashboardStore();

  const {
    mutateAsync: dashboardInfoMutation,
    isError,
    error
  } = useMutation({
    mutationFn: (params: RangeDate) => getDashboardData(params),
    retry: false
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dashboardInfo, setDashboardInfo] = useState<DashBoard | null>(null);

  const saveData = (section: string, data: DashBoard) => {
    switch (section) {
      case "오늘":
        setTodayData(data);
        break;
      case "3일":
        setThreeDaysData(data);
        break;
      case "7일":
        setWeekData(data);
        break;
      case "1개월":
        setMonthData(data);
        break;
      case "3개월":
        setThreeMonthData(data);
        break;
      case "1년":
        setOneYearData(data);
        break;
    }
  };

  useEffect(() => {
    if (buttonType) {
      switch (buttonType) {
        case "오늘":
          setDashboardInfo(todayData);
          break;
        case "3일":
          setDashboardInfo(threeDaysData);
          break;
        case "7일":
          setDashboardInfo(weekData);
          break;
        case "1개월":
          setDashboardInfo(monthData);
          break;
        case "3개월":
          setDashboardInfo(threeMonthData);
          break;
        case "1년":
          setDashboardInfo(oneYearData);
          break;
      }
    }
  }, [
    buttonType,
    threeMonthData,
    todayData,
    monthData,
    threeDaysData,
    oneYearData
  ]);

  const fetchFirstDate = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardInfoMutation(rangeDate);
      setThreeMonthData(data);
      setIsLoading(false);
      fetchOtherDate(Object.keys(RANGE_DATE_MAP) as RangeDateMapKey[]);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchOtherDate = async (dates: RangeDateMapKey[]) => {
    const fetchPromises = dates.map(async (date) => {
      try {
        const data = await dashboardInfoMutation(RANGE_DATE_MAP[date]);

        saveData(date, data);
      } catch (err) {
        console.log(err);
      }

      await Promise.all(fetchPromises);
    });
  };

  const { data: allregionData, refetch: allRegionsRefecth } = useQuery({
    queryKey: ["allRegions"],
    queryFn: () => getAllRegions(),
    enabled: false,
    retry: false
  });

  //DashboardInfo fetch
  useEffect(() => {
    fetchFirstDate();
  }, []);

  //지역 데이터 IndexedDB에 저장
  useEffect(() => {
    allRegionsRefecth();
  }, []);

  useEffect(() => {
    if (!Object.keys(RANGE_DATE_MAP).includes(buttonType)) {
      fetchFirstDate();
    }
  }, [buttonType]);

  useEffect(() => {
    if (allregionData) {
      saveDataToIndexDB(allregionData);
    }
  }, [allregionData]);

  const handleDateFilterButton = (content: string) => {
    const today = dayjs();
    setButtonType(content);
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
    setButtonType,
    handleDateChange,
    handleDateFilterButton,
    isLoading,
    error,
    isError,
    dashboardInfo
  };
};

export default useDashBoard;
