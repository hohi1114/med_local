import { useMutation } from "@tanstack/react-query";
import useRangeDurationDatePicker from "./useRangeDurationDatePicker";
import { getRegionAnalysis } from "../utils/api/apis";
import { useEffect, useState } from "react";
import { RegionStatistics } from "../types/region-analysis";
import { useRegionAnalysisStore } from "../store/useRegionAnalysisStore";

export const LOCAL_SECTIONS_MAP = {
  시: "small",
  동: "dong",
  구: "gu"
};

export type LocalSectionKey = keyof typeof LOCAL_SECTIONS_MAP;

const useRegionAnalysis = () => {
  const { rangeDate, handleDateChange } = useRangeDurationDatePicker();
  const {
    setSmallSectionData,
    setGuSectionData,
    setDongSectionData,
    setLocalSection,
    localSection
  } = useRegionAnalysisStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    mutateAsync: regionAnalysisMutation,
    isError,
    error
  } = useMutation({
    mutationFn: (params: regionAnalysisParams) => getRegionAnalysis(params)
  });

  const saveData = (section: string, data: RegionStatistics[]) => {
    switch (section) {
      case "시":
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
      setIsLoading(true);
      const data = await regionAnalysisMutation({
        region: LOCAL_SECTIONS_MAP[localSection],
        rangeDate: rangeDate
      });

      saveData(localSection, data);
      setIsLoading(false);
      const others = Object.keys(LOCAL_SECTIONS_MAP).filter(
        (section) => section !== localSection
      ) as LocalSectionKey[];
      fetchOtherRegions(others);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchOtherRegions = async (section: LocalSectionKey[]) => {
    const fetchPromises = section.map(async (section) => {
      try {
        const data = await regionAnalysisMutation({
          region: LOCAL_SECTIONS_MAP[section],
          rangeDate: rangeDate
        });

        saveData(section, data);
      } catch (err) {
        console.log(err);
      }

      await Promise.all(fetchPromises);
    });
  };

  useEffect(() => {
    fetchFirstRegion();
  }, [rangeDate]);

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
    isLoading,
    rangeDate,
    handleDateChange,
    handleLocalSectionChange
  };
};

export default useRegionAnalysis;
