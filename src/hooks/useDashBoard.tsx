import { useCallback, useEffect, useState } from "react";
import useRangeDurationDatePicker, {
  DateRange
} from "./useRangeDurationDatePicker";
import dayjs from "dayjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getAllRegions, getDashboardData } from "../utils/api/apis";
import { DashBoard, RangeDateMapKey } from "../types/dashboard";
import isBetween from "dayjs/plugin/isBetween";
import { saveDataToIndexDB } from "../store/indexded_db/RegionDB";
import useDashboardStore from "../store/useDashboardStore";
import userStore from "../store/userStore";
dayjs.extend(isBetween);

// Type-safe date range map
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
} as const;

// Constants for free trial users
const FREE_TRIAL_RANGES: Pick<typeof RANGE_DATE_MAP, "1개월"> = {
  "1개월": RANGE_DATE_MAP["1개월"]
} as const;

const useDashBoard = () => {
  const { isFreetrialUser, user, isInActiveUser } = userStore();
  const AVAILABLE_DATE_RANGES: Partial<Record<RangeDateMapKey, DateRange>> =
    isFreetrialUser ? FREE_TRIAL_RANGES : RANGE_DATE_MAP;

  const { dateRange, handleDateRangeChange } = useRangeDurationDatePicker();
  const [buttonType, setButtonType] = useState<RangeDateMapKey | null>("1개월");
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardInfo, setDashboardInfo] = useState<DashBoard | null>(null);
  const [dateChanged, setDateChanged] = useState(false);

  const dashboardStore = useDashboardStore();

  const {
    mutateAsync: dashboardInfoMutation,
    isError,
    error
  } = useMutation({
    mutationFn: getDashboardData,
    retry: false
  });

  const { data: allregionData, refetch: allRegionsRefetch } = useQuery({
    queryKey: ["allRegions"],
    queryFn: getAllRegions,
    enabled: false,
    retry: false
  });

  // Type-safe data saving map
  const saveDataMap: Record<RangeDateMapKey, (data: DashBoard) => void> = {
    오늘: dashboardStore.setTodayData,
    "3일": dashboardStore.setThreeDaysData,
    "7일": dashboardStore.setWeekData,
    "1개월": dashboardStore.setMonthData,
    "3개월": dashboardStore.setThreeMonthData,
    "1년": dashboardStore.setOneYearData
  };

  const saveData = useCallback((section: RangeDateMapKey, data: DashBoard) => {
    const setter = saveDataMap[section];
    if (setter) setter(data);
  }, []);

  useEffect(() => {
    allRegionsRefetch();
  }, [allRegionsRefetch]);

  useEffect(() => {
    if (allregionData) {
      saveDataToIndexDB(allregionData, 14);
    }
  }, [allregionData]);

  // Fetch dashboard data for all available date ranges
  const fetchOtherDate = useCallback(
    async (dates: RangeDateMapKey[]) => {
      const fetchPromises = dates.map(async (date) => {
        try {
          if (AVAILABLE_DATE_RANGES[date]) {
            const data = await dashboardInfoMutation(
              AVAILABLE_DATE_RANGES[date]!
            );
            saveData(date, data);
          }
        } catch (err) {
          console.error(err);
        }
      });

      await Promise.all(fetchPromises);
    },
    [dashboardInfoMutation, AVAILABLE_DATE_RANGES, saveData]
  );

  // Initial data fetch
  const fetchFirstDate = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await dashboardInfoMutation(dateRange);
      saveData("1개월", data);

      if (!isFreetrialUser) {
        await fetchOtherDate(
          Object.keys(AVAILABLE_DATE_RANGES) as RangeDateMapKey[]
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [
    dashboardInfoMutation,
    dateRange,
    fetchOtherDate,
    isFreetrialUser,
    AVAILABLE_DATE_RANGES,
    saveData
  ]);

  useEffect(() => {
    if (user?.user_id && !isInActiveUser) {
      fetchFirstDate();
    } else {
      setDashboardInfo(null);
    }
  }, [user]);

  useEffect(() => {
    if (!buttonType) return;

    const dataMap: Record<RangeDateMapKey, DashBoard | null> = {
      오늘: dashboardStore.todayData,
      "3일": dashboardStore.threeDaysData,
      "7일": dashboardStore.weekData,
      "1개월": dashboardStore.monthData,
      "3개월": dashboardStore.threeMonthData,
      "1년": dashboardStore.oneYearData
    };

    if (dataMap[buttonType]) setDashboardInfo(dataMap[buttonType]);
  }, [
    buttonType,
    dashboardStore.todayData,
    dashboardStore.threeDaysData,
    dashboardStore.weekData,
    dashboardStore.monthData,
    dashboardStore.threeMonthData,
    dashboardStore.oneYearData
  ]);

  // Fetch data when date range changes
  useEffect(() => {
    if (!dateChanged) return;

    const fetchData = async () => {
      try {
        setButtonType(null);
        setIsLoading(true);
        const data = await dashboardInfoMutation(dateRange);
        setDashboardInfo(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
        setDateChanged(false);
      }
    };

    fetchData();
  }, [dateChanged, dateRange, dashboardInfoMutation]);

  // Handle date filter button click
  const handleDateFilterButton = useCallback(
    (content: RangeDateMapKey) => {
      if (!AVAILABLE_DATE_RANGES[content]) return;

      setButtonType(content);
      handleDateRangeChange({
        startDate: AVAILABLE_DATE_RANGES[content].startDate,
        endDate: AVAILABLE_DATE_RANGES[content].endDate
      });
    },
    [AVAILABLE_DATE_RANGES, handleDateRangeChange]
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
    AVAILABLE_DATE_RANGES,
    dateRange
  };
};

export default useDashBoard;
