import { useCallback, useEffect, useState } from "react";
import useRangeDurationDatePicker, {
  DateRange
} from "./useRangeDurationDatePicker";
import dayjs from "dayjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getAllRegions, getDashboardData } from "../utils/api/apis.js";
import { DashBoard, RangeDateMapKey } from "../types/dashboard.js";
import isBetween from "dayjs/plugin/isBetween";
import { saveDataToIndexDB } from "../store/indexded_db/RegionDB.js";
import useDashboardStore from "../store/useDashboardStore.js";

dayjs.extend(isBetween);

const RANGE_DATE_MAP: Record<RangeDateMapKey, DateRange> = {
  오늘: {
    startDate: dayjs().format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD")
  },
  "3일": {
    startDate: dayjs().subtract(3, "day").format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD")
  },
  "7일": {
    startDate: dayjs().subtract(7, "day").format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD")
  },
  "1개월": {
    startDate: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD")
  },
  "3개월": {
    startDate: dayjs().subtract(3, "month").format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD")
  },
  "1년": {
    startDate: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD")
  }
};
const useDashBoard = () => {
  const { dateRange, handleDateRangeChange } = useRangeDurationDatePicker();
  const [buttonType, setButtonType] = useState<RangeDateMapKey | null>("1개월");
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardInfo, setDashboardInfo] = useState<DashBoard | null>(null);
  const [dateChanged, setDateChanged] = useState(false);

  const {
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
    mutationFn: getDashboardData,
    retry: false
  });

  const { data: allregionData, refetch: allRegionsRefecth } = useQuery({
    queryKey: ["allRegions"],
    queryFn: () => getAllRegions(),
    enabled: false,
    retry: false
  });

  //지역 데이터 IndexedDB에 저장
  useEffect(() => {
    allRegionsRefecth();
  }, [allRegionsRefecth]);

  useEffect(() => {
    if (allregionData) {
      saveDataToIndexDB(allregionData, 9);
    }
  }, [allregionData]);

  //첫 랜더링시 각 날짜별 데이터 가져오기
  useEffect(() => {
    fetchFirstDate();
  }, []);

  const saveDataMap = {
    오늘: setTodayData,
    "3일": setThreeDaysData,
    "7일": setWeekData,
    "1개월": setMonthData,
    "3개월": setThreeMonthData,
    "1년": setOneYearData
  };

  const saveData = useCallback(
    (section: string, data: DashBoard) => {
      const setter = saveDataMap[section as keyof typeof saveDataMap];
      if (setter) setter(data);
    },
    [saveDataMap]
  );

  useEffect(() => {
    if (!buttonType) return;

    const dataMap = {
      오늘: todayData,
      "3일": threeDaysData,
      "7일": weekData,
      "1개월": monthData,
      "3개월": threeMonthData,
      "1년": oneYearData
    };

    setDashboardInfo(dataMap[buttonType]);
  }, [
    buttonType,
    todayData,
    threeDaysData,
    weekData,
    monthData,
    threeMonthData,
    oneYearData
  ]);

  const fetchFirstDate = async () => {
    try {
      setIsLoading(true);
      //1개월 데이터 가져오기
      const data = await dashboardInfoMutation(dateRange);
      setThreeMonthData(data);
      setIsLoading(false);
      //나머지 날짜 데이터 가져오기
      fetchOtherDate(Object.keys(RANGE_DATE_MAP) as RangeDateMapKey[]);
    } catch (error) {
      throw error;
    }
  };

  const fetchOtherDate = async (dates: RangeDateMapKey[]) => {
    const fetchPromises = dates.map(async (date) => {
      try {
        const data = await dashboardInfoMutation(RANGE_DATE_MAP[date]);
        saveData(date, data);
      } catch (err) {
        console.error(err);
      }

      await Promise.all(fetchPromises);
    });
  };

  useEffect(() => {
    if (!dateChanged) return;
    const fetchData = async () => {
      setButtonType(null);
      setIsLoading(true);
      const data = await dashboardInfoMutation(dateRange);
      setDashboardInfo(data);
      setIsLoading(false);

      setDateChanged(false);
    };
    //만약 DatePicker로 골랐다면 버튼 날짜 데이터 모두 Fetch
    if (dateChanged) {
      fetchData();
    }
  }, [dateChanged, dateRange, dashboardInfoMutation]);

  const handleDateFilterButton = useCallback(
    (content: RangeDateMapKey) => {
      setButtonType(content);

      handleDateRangeChange({
        startDate: RANGE_DATE_MAP[content].startDate,
        endDate: RANGE_DATE_MAP[content].endDate
      });
    },
    [handleDateRangeChange]
  );

  return {
    setButtonType,
    handleDateRangeChange,
    handleDateFilterButton,
    setDateChanged,
    isLoading,
    error,
    isError,
    dashboardInfo,
    buttonType,
    RANGE_DATE_MAP,
    dateRange
  };
};

export default useDashBoard;
