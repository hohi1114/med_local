import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { getRegionPrivateData } from "../utils/api/apis";
import { findContainingDong } from "../components/medi_map/util/mapUtil";
import mapStore from "../store/mapStore";
import { RegionPrivateParams } from "../types/params";
import { RegionPrivateData } from "../types/naver-maps";

/**
 * For Drawer
 * 1. 지도에서 보길 원하는 구역 클릭
 * 2. 그 지역에 맞는 데이터 Fetch
 * twoType:true (2개 날짜 비교), false (1개 날짜)
 */
export const useDrawerData = (twoType: boolean) => {
  const {
    isOpenDrawer,
    areaName,
    drawerDate,
    drawerDate1,
    drawerDate2,
    region,
    selectedRegionData,
    dongNameFroSmall,
    boundArea,
    loading,
    handleIsDrawerOpen
  } = mapStore();

  const [statsData, setStatsData] = useState({});
  const [comparisonStatsData, setComparisonStatsData] = useState({
    first: {},
    second: {}
  });
  const [regionInfo, setRegionInfo] = useState(null);
  const [population, setPopulation] = useState(0);

  useEffect(() => {
    handleIsDrawerOpen(false);
  }, [region]);

  // 단일 날짜 파라미터
  const singleDateParams = useMemo(() => {
    if (!areaName || !region || !drawerDate || loading) return null;

    return {
      name: areaName,
      regionType: region,
      startDate: drawerDate.startDate,
      endDate: drawerDate.endDate
    };
  }, [areaName, region, drawerDate, loading]);

  // 비교 날짜 파라미터 (첫 번째)
  const firstDateParams = useMemo(() => {
    if (!areaName || !region || !drawerDate1 || loading) return null;
    return {
      name: areaName,
      regionType: region,
      startDate: drawerDate1.startDate,
      endDate: drawerDate1.endDate
    };
  }, [areaName, region, drawerDate1, loading]);

  // 비교 날짜 파라미터 (두 번째)
  const secondDateParams = useMemo(() => {
    if (!areaName || !region || !drawerDate2 || loading) return null;
    return {
      name: areaName,
      regionType: region,
      startDate: drawerDate2.startDate,
      endDate: drawerDate2.endDate
    };
  }, [areaName, region, drawerDate2, loading]);

  // 단일 날짜 뮤테이션
  const {
    mutate: regionPrivateMutation,
    data: regionPrivate,
    isPending
  } = useMutation({
    mutationFn: (params: RegionPrivateParams) => getRegionPrivateData(params)
  });

  // 두 날짜 비교를 위한 뮤테이션
  const {
    mutate: firstDateMutation,
    data: firstRegionPrivate,
    isPending: firstDatePending
  } = useMutation({
    mutationFn: (params: RegionPrivateParams) => getRegionPrivateData(params)
  });

  const {
    mutate: secondDateMutation,
    data: secondRegionPrivate,
    isPending: secondDatePending
  } = useMutation({
    mutationFn: (params: RegionPrivateParams) => getRegionPrivateData(params)
  });

  // 첫번째 날짜 요청
  useEffect(() => {
    if (twoType && firstDateParams && isOpenDrawer) {
      firstDateMutation(firstDateParams);
    }
  }, [twoType, firstDateParams, isOpenDrawer]);

  // 두 번째 날짜 요청
  useEffect(() => {
    if (twoType && secondDateParams && isOpenDrawer) {
      secondDateMutation(secondDateParams);
    }
  }, [twoType, secondDateParams, isOpenDrawer]);

  // 단일 날짜 요청
  useEffect(() => {
    if (!twoType && singleDateParams && isOpenDrawer) {
      regionPrivateMutation(singleDateParams);
    }
  }, [twoType, singleDateParams, isOpenDrawer]);

  useEffect(() => {
    if (boundArea && boundArea.length > 0) {
      const selectedArea = boundArea.filter((area) => area.name === areaName);
      setPopulation(selectedArea[0]?.population ?? 0);
    }
  }, [boundArea]);

  // small 지역 데이터 = dong 데이터와 매치
  useEffect(() => {
    const fetchRegionInfo = async () => {
      if (region === "small" && dongNameFroSmall) {
        const containingDong = await findContainingDong(dongNameFroSmall);

        if (containingDong && selectedRegionData) {
          const newSmallRegion = {
            name: selectedRegionData.name,
            population: selectedRegionData.population,
            dong_population: containingDong.population,
            male_avg_age: containingDong.male_avg_age,
            female_avg_age: containingDong.female_avg_age,
            total_avg_age: containingDong.total_avg_age,
            monthly_avg_income: containingDong.monthly_avg_income,
            male_population: containingDong.male_population,
            female_population: containingDong.female_population,
            medical_expense: containingDong.medical_expense,
            age_group_population: containingDong.age_group_population,
            population_by_time: containingDong.population_by_time,
            population_by_day: containingDong.population_by_day
          };
          setRegionInfo(newSmallRegion);
        }
      } else {
        setRegionInfo(selectedRegionData);
      }
    };
    fetchRegionInfo();
  }, [areaName, region, dongNameFroSmall, selectedRegionData]);

  // set STATS DATA
  useEffect(() => {
    if (!twoType && regionPrivate) {
      setStatsData({
        1: {
          data: `${regionPrivate?.total_visit_count || 0}회`,
          diffRate: regionPrivate?.diff_rates?.total_visit_count
        },
        2: {
          data: `${Math.ceil(
            regionPrivate?.total_cost || 0
          )?.toLocaleString()} ₩`,
          diffRate: regionPrivate?.diff_rates?.total_cost
        },
        3: {
          data: `${Math.ceil(
            regionPrivate?.average_cost_per_visit || 0
          )?.toLocaleString()} ₩`,
          diffRate: regionPrivate?.diff_rates?.average_cost_per_visit
        },
        4: {
          data: `${Math.ceil(
            regionPrivate?.average_cost_per_patient || 0
          )?.toLocaleString()} ₩`,
          diffRate: regionPrivate?.diff_rates?.average_cost_per_patient
        },
        5: {
          data: `${regionPrivate?.chojin_rejin_visit_count || 0}명`,
          diffRate: regionPrivate?.diff_rates?.chojin_rejin_visit_count
        },
        6: {
          data: `${regionPrivate?.sinhwan_visit_count || 0}명`,
          diffRate: regionPrivate?.diff_rates?.sinhwan_visit_count
        },
        7: { data: `준비중`, diffRate: null },
        8: {
          data: `${
            population && regionPrivate?.total_patient_count
              ? (
                  (regionPrivate?.total_patient_count / population) *
                  100
                ).toFixed(3)
              : 0
          } %`,
          diffRate: regionPrivate?.diff_rates?.total_visit_count
        }
      });
    }
  }, [population, regionPrivate, twoType]);

  useEffect(() => {
    if (twoType && firstRegionPrivate && secondRegionPrivate) {
      // 첫 번째 날짜 데이터
      const firstStats = {
        1: {
          data: `${firstRegionPrivate?.total_visit_count || 0}회`
        },
        2: {
          data: `${Math.ceil(
            firstRegionPrivate?.total_cost || 0
          )?.toLocaleString()} ₩`
        },
        3: {
          data: `${Math.ceil(
            firstRegionPrivate?.average_cost_per_visit || 0
          )?.toLocaleString()} ₩`
        },
        4: {
          data: `${Math.ceil(
            firstRegionPrivate?.average_cost_per_patient || 0
          )?.toLocaleString()} ₩`
        },
        5: {
          data: `${firstRegionPrivate?.chojin_rejin_visit_count || 0}명`
        },
        6: {
          data: `${firstRegionPrivate?.sinhwan_visit_count || 0}명`
        },
        7: { data: `준비중` },
        8: {
          data: `${
            population && firstRegionPrivate?.total_patient_count
              ? (
                  (firstRegionPrivate?.total_patient_count / population) *
                  100
                ).toFixed(3)
              : 0
          } %`
        }
      };

      // 두 번째 날짜 데이터
      const secondStats = {
        1: {
          data: `${secondRegionPrivate?.total_visit_count || 0}명`,
          diffRate: calculateDiff(
            secondRegionPrivate?.total_visit_count,
            firstRegionPrivate?.total_visit_count
          )
        },
        2: {
          data: `${Math.ceil(
            secondRegionPrivate?.total_cost || 0
          )?.toLocaleString()} ₩`,
          diffRate: calculateDiff(
            secondRegionPrivate?.total_cost,
            firstRegionPrivate?.total_cost
          )
        },
        3: {
          data: `${Math.ceil(
            secondRegionPrivate?.average_cost_per_visit || 0
          )?.toLocaleString()} ₩`,
          diffRate: calculateDiff(
            secondRegionPrivate?.average_cost_per_visit,
            firstRegionPrivate?.average_cost_per_visit
          )
        },
        4: {
          data: `${Math.ceil(
            secondRegionPrivate?.average_cost_per_patient || 0
          )?.toLocaleString()} ₩`,
          diffRate: calculateDiff(
            secondRegionPrivate?.average_cost_per_patient,
            firstRegionPrivate?.average_cost_per_patient
          )
        },
        5: {
          data: `${secondRegionPrivate?.chojin_rejin_visit_count || 0}명`,
          diffRate: calculateDiff(
            secondRegionPrivate?.chojin_rejin_visit_count,
            firstRegionPrivate?.chojin_rejin_visit_count
          )
        },
        6: {
          data: `${secondRegionPrivate?.sinhwan_visit_count || 0}명`,
          diffRate: calculateDiff(
            secondRegionPrivate?.sinhwan_visit_count,
            firstRegionPrivate?.sinhwan_visit_count
          )
        },
        7: { data: `준비중` },
        8: {
          data: `${
            population && secondRegionPrivate?.total_patient_count
              ? (
                  (secondRegionPrivate?.total_patient_count / population) *
                  100
                ).toFixed(3)
              : 0
          } %`,
          diffRate: calculateDiff(
            secondRegionPrivate?.total_visit_count,
            firstRegionPrivate?.total_visit_count
          )
        }
      };

      setComparisonStatsData({
        first: firstStats,
        second: secondStats
      });
    }
  }, [population, firstRegionPrivate, secondRegionPrivate, twoType]);

  const calculateDiff = (current: number, previous: number): number | null => {
    if (previous === 0) {
      return current === 0 ? 0 : null;
    }
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  };

  // Format data for charts
  const formatDataForAverageRevenue = (data: RegionPrivateData) => {
    return Object.entries(data?.average_cost_per_visit_by_date).map(
      ([date, value]) => ({
        date,
        매출액: value
      })
    );
  };

  const formatDataForRevenueTrend = (data: RegionPrivateData) => {
    return Object.entries(data?.cost_by_date).map(([date, value]) => ({
      date,
      매출액: value
    }));
  };

  const barFormatData = (data: RegionPrivateData) => {
    return Object.entries(data?.patient_count_by_age_group).map(
      ([age, value]) => ({
        연령: age,
        세: value
      })
    );
  };

  return {
    regionInfo,
    statsData,
    regionPrivate,
    firstRegionPrivate,
    secondRegionPrivate,
    isPending: isPending || firstDatePending || secondDatePending,
    areaName,
    comparisonStatsData,
    formatDataForAverageRevenue,
    formatDataForRevenueTrend,
    barFormatData
  };
};
