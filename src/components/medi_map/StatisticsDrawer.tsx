import { Drawer, Segmented } from "antd";
import DurationDatePicker from "../common/datepicker/DurationDatePicker";
import BaseButton from "../common/button/BaseButton";
import styled from "styled-components";
import mapStore from "../../store/mapStore";
import isBetween from "dayjs/plugin/isBetween";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import RegionInfo from "./RegionInfo";
import * as turf from "@turf/turf";
import RevenuInfo from "./chart/RevenueInfo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getRegionPrivateData } from "../../utils/api/apis";
import { Polygon, RegionData } from "../../types/naver-maps";
import { getDataFromRegionDB } from "../../store/indexded_db/RegionDB";
import Loading from "../common/Loading";
import CustomSegmentedControl from "../common/toggle/BaseToggle";
dayjs.extend(isBetween);

function fixPolygonCoordinates(
  polygon: [number, number][]
): [number, number][] {
  if (
    polygon[0][0] !== polygon[polygon.length - 1][0] ||
    polygon[0][1] !== polygon[polygon.length - 1][1]
  ) {
    polygon.push(polygon[0]);
  }

  while (polygon.length < 4) {
    polygon.push(polygon[0]);
  }

  return polygon;
}

// ✅ `smallPolygon`을 포함하는 `dong` 찾기
const findContainingDong = async (
  smallPoint: number[][]
): RegionData | undefined => {
  const dongData = await getDataFromRegionDB("dong_regions");

  return dongData.find((dong) => {
    if (!dong.polygon) return false;
    const dongPolygonArray = JSON.parse(dong.polygon);
    const fixedPolygon = fixPolygonCoordinates(dongPolygonArray?.[0]);

    return (
      fixedPolygon.length >= 4 &&
      turf.booleanContains(turf.polygon([fixedPolygon]), turf.point(smallPoint))
    );
  });
};

const StatisticsDrawer = () => {
  const { isOpenDrawer, handleIsDrawerOpen } = mapStore();
  const {
    areaName,
    drawerDate,
    region,
    selectedRegionData,
    setDrawerDate,
    smallPolygons,
    boundArea
  } = mapStore();

  const [statsData, setStatsData] = useState<{ [key: number]: string }>({});
  const [regionInfo, setRegionInfo] = useState<RegionData | null>(null);
  const [population, setPopulation] = useState<number>(0);

  const params = useMemo(() => {
    if (!areaName || !region || !drawerDate) return;
    return {
      name: areaName,
      regionType: region,
      startDate: drawerDate?.startDate.format("YYYY-MM-DD"),
      endDate: drawerDate?.endDate.format("YYYY-MM-DD")
    };
  }, [areaName, region, drawerDate]);

  const {
    data: regionPrivate,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch: regionPrivateFetch
  } = useQuery({
    queryKey: ["regionPrivateData", params],
    queryFn: () => getRegionPrivateData(params!),
    enabled: !!params,
    retry: false
  });

  useEffect(() => {
    regionPrivateFetch();
  }, [params]);

  useEffect(() => {
    if (boundArea && boundArea.length > 0) {
      const selectedArea: RegionData[] = boundArea.filter(
        (area) => area.name === areaName
      );
      setPopulation(selectedArea[0]?.population);
    }
  }, [boundArea]);

  useEffect(() => {
    const fetchData = async () => {
      if (region === "small") {
        if (!smallPolygons[0]) return;
        const containingDong = await findContainingDong(smallPolygons[0]);

        if (containingDong) {
          const newSmallRegion = {
            name: selectedRegionData.name,
            population: selectedRegionData.population,
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
    fetchData();
  }, [areaName]);

  const formatDataForAverageRevenue = (data: any) => {
    return Object.entries(regionPrivate?.average_cost_per_visit_by_date).map(
      ([date, value]) => ({
        date,
        value
      })
    );
  };

  const formatDataForRevenueTrend = (data: any) => {
    return Object.entries(regionPrivate?.cost_by_date).map(([date, value]) => ({
      date,
      value
    }));
  };

  const barFormatData = () => {
    return Object.entries(regionPrivate?.patient_count_by_age_group).map(
      ([age, value]) => ({
        age,
        value
      })
    );
  };

  useEffect(() => {
    setStatsData({
      1: `${regionPrivate?.total_patient_count || 0}명`,
      2: `${Math.ceil(regionPrivate?.total_cost)?.toLocaleString() || 0} ₩`,
      3: `${
        Math.ceil(regionPrivate?.average_cost_per_visit)?.toLocaleString() || 0
      } ₩`,
      4: `${
        Math.ceil(regionPrivate?.average_cost_per_patient)?.toLocaleString() ||
        0
      } ₩`,
      5: `${regionPrivate?.chojin_rejin_visit_count || 0}명`,
      6: `${regionPrivate?.sinhwan_visit_count || 0}명`,
      7: `${0}명`,
      8: `${
        population
          ? Math.ceil((regionPrivate?.total_patient_count / population) * 100)
          : 0
      } %`
    });
  }, [population, regionPrivate]);

  const [toggleValue, setToggleValue] = useState<string>("지역");
  const handleToggle = (value: string) => {};
  return (
    <Drawer
      width={toggleValue === "전체" ? "70rem" : "35rem"}
      placement="right"
      onClose={() => handleIsDrawerOpen(false)}
      style={{ backgroundColor: "#FAFAFB" }}
      styles={{
        header: {
          padding: "0.8rem 1rem"
        },
        mask: { backgroundColor: "rgba(0, 0, 0, 0)", pointerEvents: "none" },
        body: {
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          backgroundColor: "#FAFAFB"
        }
      }}
      open={isOpenDrawer}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <Segmented
          options={["지역", "매출", "전체"]}
          value={toggleValue}
          onChange={setToggleValue}
          shape="round"
        />
      </div>

      <div style={{ padding: "0.8rem 0rem" }}>
        <AddressTitleStyle>{areaName}</AddressTitleStyle>
      </div>
      {regionInfo &&
        (toggleValue === "지역" ? (
          <RegionInfo data={regionInfo} />
        ) : toggleValue === "매출" ? (
          isLoading || isRefetching ? (
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
          )
        ) : isLoading || isRefetching ? (
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
              <RegionInfo data={regionInfo} />
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
        ))}
    </Drawer>
  );
};

export default StatisticsDrawer;

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
  background-color: #ffffff;
  border-radius: 1rem;
  padding: 2rem 1rem 0rem 1rem;
`;
const StyledSegmented = styled(Segmented)`
  .ant-segmented-item-selected {
    background-color: #0f52ba; /* 선택된 아이템 배경색 */
    color: #fafafa; /* 선택된 아이템 글자색 */
  }

  .ant-segmented-item {
    border-color: #ccc; /* 아이템의 기본 테두리 색 */
    color: #333; /* 기본 글자 색 */
  }

  .ant-segmented-item:hover {
    background-color: #f0f0f0; /* hover 시 배경색 */
    color: #0f52ba; /* hover 시 글자색 */
  }
`;
