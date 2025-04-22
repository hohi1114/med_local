import { useMutation } from "@tanstack/react-query";
import useRangeDurationDatePicker from "./useRangeDurationDatePicker";
import { getRegionAnalysis } from "../utils/api/apis";
import { useEffect } from "react";
import { RegionStatistics } from "../types/region-analysis";
import { useRegionAnalysisStore } from "../store/useRegionAnalysisStore";
import { regionAnalysisParams } from "../types/params";
import userStore from "../store/userStore";
import dayjs from "dayjs";

export const LOCAL_SECTIONS_MAP = {
  소구역: "small",
  동: "dong",
  구: "gu"
} as const;

export type LocalSectionKey = keyof typeof LOCAL_SECTIONS_MAP;

const useRegionAnalysis = () => {
  const { dateRange, handleDateRangeChange, latestDateRangeRef } =
    useRangeDurationDatePicker({
      startDate: "",
      endDate: ""
    });
  const { isInActiveUser, user, lastedUpdatedDate, hasGuided, startTutorial } =
    userStore();
  const {
    setSmallSectionData,
    setGuSectionData,
    setDongSectionData,
    setLocalSection,
    localSection,
    selectedDateRange,
    setSelectedDateRange
  } = useRegionAnalysisStore();

  const {
    mutateAsync: regionAnalysisMutation,
    isError,
    error,
    isPending
  } = useMutation({
    mutationFn: (params: regionAnalysisParams) => getRegionAnalysis(params)
  });

  const saveData = (section: string, data: RegionStatistics[]) => {
    switch (section) {
      case "소구역":
        setSmallSectionData(data);
        break;
      case "동":
        setDongSectionData(data);
        break;
      case "구":
        setGuSectionData(data);
    }
  };

  const fetchFirstRegion = async () => {
    try {
      const data = await regionAnalysisMutation({
        region: LOCAL_SECTIONS_MAP[localSection],
        rangeDate: dateRange
      });

      saveData(localSection, data);
      const others = Object.keys(LOCAL_SECTIONS_MAP).filter(
        (section) => section !== localSection
      ) as LocalSectionKey[];
      await fetchOtherRegions(others);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOtherRegions = async (section: LocalSectionKey[]) => {
    const fetchPromises = section.map(async (section) => {
      try {
        const data = await regionAnalysisMutation({
          region: LOCAL_SECTIONS_MAP[section],
          rangeDate: dateRange
        });

        saveData(section, data);
      } catch (err) {
        console.error(err);
      }

      await Promise.all(fetchPromises);
    });
  };

  useEffect(() => {
    if (
      user?.user_id &&
      !isInActiveUser &&
      lastedUpdatedDate &&
      hasGuided &&
      !startTutorial &&
      dateRange.startDate !== "" &&
      dateRange.endDate !== ""
    ) {
      fetchFirstRegion();
    }
  }, [dateRange, user, isInActiveUser, hasGuided, startTutorial]);

  useEffect(() => {
    if (selectedDateRange) {
      handleDateRangeChange(selectedDateRange);
    } else {
      if (lastedUpdatedDate && lastedUpdatedDate.length > 0) {
        const start = dayjs(lastedUpdatedDate)
          .subtract(1, "month")
          .format("YYYY-MM-DD");
        const end = dayjs(lastedUpdatedDate).format("YYYY-MM-DD");
        handleDateRangeChange({ startDate: start, endDate: end });
      } else {
        handleDateRangeChange({
          startDate: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
          endDate: dayjs().format("YYYY-MM-DD")
        });
      }
    }
  }, [lastedUpdatedDate]);

  useEffect(() => {
    return () => {
      setSelectedDateRange(latestDateRangeRef.current);
    };
  }, []);

  //SeclectBox Handler
  const handleLocalSectionChange = (value: LocalSectionKey) => {
    setLocalSection(value);
  };

  return {
    isError,
    error,
    isPending,
    dateRange,
    handleDateRangeChange,
    handleLocalSectionChange
  };
};

export default useRegionAnalysis;
