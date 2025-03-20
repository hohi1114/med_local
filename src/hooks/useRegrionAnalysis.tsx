import { useQuery } from "@tanstack/react-query";
import useRangeDurationDatePicker from "./useRangeDurationDatePicker";
import { getRegionAnalysis } from "../utils/api/apis";
import { useEffect, useState } from "react";
import { RegionStatistics } from "../types/region-analysis";

export const LOCAL_SECTIONS_MAP = {
  시: "small",
  동: "dong",
  구: "gu"
};
type LocalSectionKey = keyof typeof LOCAL_SECTIONS_MAP;

const useRegionAnalysis = () => {
  const { rangeDate, handleDateChange } = useRangeDurationDatePicker();
  const [localSection, setlocalSection] =
    useState<keyof typeof LOCAL_SECTIONS_MAP>("시");
  const [searchword, setSearchword] = useState<string | null>(null);
  const params = {
    region: LOCAL_SECTIONS_MAP[localSection],
    rangeDate: rangeDate
  };

  const {
    data: regionAnalysisData,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch: regionAnalysisFetch
  } = useQuery<RegionStatistics[]>({
    queryKey: ["regionAlalysis"],
    queryFn: () => getRegionAnalysis(params),
    enabled: false,
    retry: false
  });

  useEffect(() => {
    regionAnalysisFetch();
  }, [rangeDate, localSection]);

  //SeclectBox Handler
  const handleLocalSectionChange = (value: LocalSectionKey) => {
    setlocalSection(value);
  };

  //SearchBox Handler
  const handleSearchwordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchword(e.target.value);
  };

  return {
    regionAnalysisData,
    isLoading,
    isRefetching,
    rangeDate,
    localSection,
    handleDateChange,
    handleLocalSectionChange
  };
};

export default useRegionAnalysis;
