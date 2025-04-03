import { Drawer, Segmented } from "antd";
import styled from "styled-components";
import mapStore from "../../store/mapStore";
import isBetween from "dayjs/plugin/isBetween";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import RegionInfo from "./RegionInfo";
import RevenuInfo from "./chart/RevenueInfo";
import { useMutation } from "@tanstack/react-query";
import { getRegionPrivateData } from "../../utils/api/apis";
import Loading from "../common/Loading";
import { RegionData } from "../../types/naver-maps";
import { findContainingDong } from "./util/mapUtil";
import { RegionPrivateParams } from "../../types/params";
import BaseToggle from "../common/toggle/BaseToggle";
dayjs.extend(isBetween);

const TOGGLEOPTION = ["지역", "매출", "전체"];
const StatisticsDrawer = () => {
  const {
    areaName,
    drawerDate,
    region,
    selectedRegionData,
    dongNmaeFroSmall,
    boundArea,
    loading,
    isOpenDrawer,
    handleIsDrawerOpen
  } = mapStore();

  const [statsData, setStatsData] = useState<{
    [key: number]: { data: string; diffRate: number | null };
  }>({});
  const [regionInfo, setRegionInfo] = useState<RegionData | null>(null);
  const [population, setPopulation] = useState<number>(0);
  const [toggleValue, setToggleValue] = useState<string>("지역");

  const params = useMemo(() => {
    if (!areaName || !region || !drawerDate || loading) return;
    return {
      name: areaName,
      regionType: region,
      startDate: drawerDate.startDate,
      endDate: drawerDate.endDate
    };
  }, [areaName, region, drawerDate, loading]);

  const {
    mutate: regionPrivateMutation,
    data: regionPrivate,
    isPending
  } = useMutation({
    mutationFn: (params: RegionPrivateParams) => getRegionPrivateData(params)
  });

  //Fetch 매출 데이터
  useEffect(() => {
    if (params) {
      regionPrivateMutation(params);
    }
  }, [areaName, drawerDate]);

  //Save each area's population for map backgroun color
  useEffect(() => {
    if (boundArea && boundArea.length > 0) {
      const selectedArea = boundArea.filter((area) => area.name === areaName);
      setPopulation(selectedArea[0]?.population ?? 0);
    }
  }, [boundArea]);

  useEffect(() => {
    handleIsDrawerOpen(false);
  }, [region]);

  useEffect(() => {
    //Small region data  === dong region data
    const fetchRegionInfo = async () => {
      if (region === "small" && dongNmaeFroSmall) {
        const containingDong = await findContainingDong(dongNmaeFroSmall);

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
  }, [areaName, region, dongNmaeFroSmall, selectedRegionData]);

  useEffect(() => {
    setStatsData({
      1: {
        data: `${regionPrivate?.total_visit_count || 0}명`,
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
            ? ((regionPrivate?.total_patient_count / population) * 100).toFixed(
                3
              )
            : 0
        } %`,
        diffRate: regionPrivate?.diff_rates?.total_patient_count
      }
    });
  }, [population, regionPrivate]);

  const formatDataForAverageRevenue = () => {
    return Object.entries(regionPrivate?.average_cost_per_visit_by_date).map(
      ([date, value]) => ({
        date,
        매출액: value
      })
    );
  };

  const formatDataForRevenueTrend = () => {
    return Object.entries(regionPrivate?.cost_by_date).map(([date, value]) => ({
      date,
      매출액: value
    }));
  };

  const barFormatData = () => {
    return Object.entries(regionPrivate?.patient_count_by_age_group).map(
      ([age, value]) => ({
        연령: age,
        세: value
      })
    );
  };

  const renderContent = () => {
    if (!regionInfo) return null;
    if (toggleValue === "지역")
      return <RegionInfo data={regionInfo} region={region} />;
    if (toggleValue === "매출") {
      return isPending ? (
        <Loading />
      ) : (
        <RevenuInfo
          statsData={statsData}
          revenueTrend={regionPrivate?.cost_by_date}
          dailyRevenue={regionPrivate?.average_cost_per_visit_by_date}
          ageGroups={regionPrivate?.patient_count_by_age_group}
          formatDataForRevenueTrend={formatDataForRevenueTrend}
          formatDataForAverageRevenue={formatDataForAverageRevenue}
          barFormatData={barFormatData}
        />
      );
    }
    return isPending ? (
      <Loading />
    ) : (
      <div style={{ display: "flex", gap: "1rem" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "0.5rem 1rem",
              backgroundColor: "#f0f2f5"
            }}
          >
            <ChartTitleStyle>지역 데이터</ChartTitleStyle>
          </div>
          <RegionInfo data={regionInfo} region={region} />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "0.5rem 1rem",
              backgroundColor: "#f0f2f5"
            }}
          >
            <ChartTitleStyle>매출 데이터</ChartTitleStyle>
          </div>

          <RevenuInfo
            statsData={statsData}
            revenueTrend={regionPrivate?.cost_by_date}
            dailyRevenue={regionPrivate?.average_cost_per_visit_by_date}
            ageGroups={regionPrivate?.patient_count_by_age_group}
            formatDataForRevenueTrend={formatDataForRevenueTrend}
            formatDataForAverageRevenue={formatDataForAverageRevenue}
            barFormatData={barFormatData}
          />
        </div>
      </div>
    );
  };

  return (
    <Drawer
      width={toggleValue === "전체" ? "70rem" : "39rem"}
      placement="right"
      onClose={() => handleIsDrawerOpen(false)}
      styles={{
        header: {
          padding: "0.8rem 1rem"
        },
        mask: { backgroundColor: "rgba(0, 0, 0, 0)", pointerEvents: "none" },
        body: {
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          backgroundColor: "#FFFFFF"
        }
      }}
      open={isOpenDrawer}
    >
      <ToggleContainer>
        <BaseToggle
          options={TOGGLEOPTION}
          selected={toggleValue}
          onChange={(val) => setToggleValue(val)}
        />
      </ToggleContainer>

      <div style={{ padding: "0.8rem 0rem" }}>
        <AddressTitleStyle>{areaName}</AddressTitleStyle>
      </div>
      {renderContent()}
    </Drawer>
  );
};

export default StatisticsDrawer;

const ToggleContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const AddressTitleStyle = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
`;

export const ChartTitleStyle = styled.span`
  font-size: 1.2rem;
  margin-left: 1rem;
  font-weight: bold;
`;

export const GridWrapper = styled.section`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  width: 100%;
`;

export const GraphContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const GrapWrapper = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  border-radius: 1rem;
  padding: 2rem 1rem 0rem 1rem;
`;
