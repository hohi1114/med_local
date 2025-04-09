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
  const { dateRange, handleDateRangeChange } = useRangeDurationDatePicker();
  const { isInActiveUser, user, lastedUpdatedDate } = userStore();
  const {
    setSmallSectionData,
    setGuSectionData,
    setDongSectionData,
    setLocalSection,
    localSection
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
    if (user?.user_id && !isInActiveUser && lastedUpdatedDate) {
      fetchFirstRegion();
    }
  }, [dateRange, user, isInActiveUser]);

  useEffect(() => {
    if (lastedUpdatedDate && lastedUpdatedDate.length > 0) {
      const start = dayjs(lastedUpdatedDate)
        .subtract(1, "month")
        .format("YYYY-MM-DD");
      const end = dayjs(lastedUpdatedDate).format("YYYY-MM-DD");
      handleDateRangeChange({ startDate: start, endDate: end });
    }
  }, [lastedUpdatedDate]);

  //SeclectBox Handler
  const handleLocalSectionChange = (value: LocalSectionKey) => {
    setLocalSection(value);
  };

  //SearchBox Handler
  // const handleSearchwordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setSearchword(e.target.value);
  // };

  // const filterSearchData = regionAnalysisData?.filter((data) => {
  //   item.re;
  // });

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
