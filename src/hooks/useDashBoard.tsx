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

const useDashBoard = () => {
  const {
    isFreetrialUser,
    user,
    isInActiveUser,
    lastedUpdatedDate,
    startTutorial,
    hasGuided
  } = userStore();

  const getBaseDate = () =>
    lastedUpdatedDate && lastedUpdatedDate.length > 0
      ? dayjs(lastedUpdatedDate)
      : dayjs();

  const makeRange = (
    startOffset: number,
    unit: dayjs.ManipulateType
  ): DateRange => {
    const base = getBaseDate();
    return {
      startDate: base.subtract(startOffset, unit).format("YYYY-MM-DD"),
      endDate: base.format("YYYY-MM-DD")
    };
  };
  const RANGE_DATE_MAP: Record<RangeDateMapKey, DateRange> = {
    일주일: makeRange(7, "day"),
    "1개월": makeRange(1, "month"),
    "3개월": makeRange(3, "month"),
    "1년": makeRange(1, "year")
  } as const;

  // Constants for free trial users
  const FREE_TRIAL_RANGES: Pick<typeof RANGE_DATE_MAP, "1개월"> = {
    "1개월": RANGE_DATE_MAP["1개월"]
  } as const;

  const AVAILABLE_DATE_RANGES: Partial<Record<RangeDateMapKey, DateRange>> =
    isFreetrialUser ? FREE_TRIAL_RANGES : RANGE_DATE_MAP;

  const { dateRange, handleDateRangeChange } = useRangeDurationDatePicker();
  const [buttonType, setButtonType] = useState<RangeDateMapKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardInfo, setDashboardInfo] = useState<DashBoard | null>(null);
  const [dateChanged, setDateChanged] = useState(false);
  const {
    setSelectedDateRange,
    weekData,
    monthData,
    threeMonthData,
    oneYearData,
    setWeekData,
    setMonthData,
    setThreeMonthData,
    setOneYearData
  } = useDashboardStore();

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

  const saveDataMap: Record<RangeDateMapKey, (data: DashBoard) => void> = {
    일주일: setWeekData,
    "1개월": setMonthData,
    "3개월": setThreeMonthData,
    "1년": setOneYearData
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
      const lastedUpdateDateRange = {
        startDate: dayjs(lastedUpdatedDate)
          .subtract(1, "month")
          .format("YYYY-MM-DD"),
        endDate: dayjs(lastedUpdatedDate).format("YYYY-MM-DD")
      };

      if (lastedUpdatedDate && lastedUpdatedDate.length > 0) {
        const data = await dashboardInfoMutation(lastedUpdateDateRange);
        setDashboardInfo(data);
      }

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
    saveData,
    lastedUpdatedDate
  ]);

  useEffect(() => {
    if (
      user?.user_id &&
      lastedUpdatedDate &&
      !isInActiveUser &&
      !startTutorial &&
      hasGuided
    ) {
      if (!(lastedUpdatedDate && lastedUpdatedDate.length > 0)) {
        setButtonType("1개월");
      }
      fetchFirstDate();
    } else {
      setDashboardInfo(null);
    }
  }, [user, lastedUpdatedDate, startTutorial, hasGuided]);

  useEffect(() => {
    if (!buttonType) return;

    const dataMap: Record<RangeDateMapKey, DashBoard | null> = {
      일주일: weekData,
      "1개월": monthData,
      "3개월": threeMonthData,
      "1년": oneYearData
    };

    if (dataMap[buttonType]) setDashboardInfo(dataMap[buttonType]);
  }, [buttonType, weekData, monthData, threeMonthData, oneYearData]);

  // Fetch data when date range changes
  useEffect(() => {
    setSelectedDateRange(dateRange);
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
