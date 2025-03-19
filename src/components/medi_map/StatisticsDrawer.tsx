import { Drawer, Segmented } from "antd";
import DurationDatePicker from "../common/datepicker/DurationDatePicker";
import BaseButton from "../common/button/BaseButton";
import styled from "styled-components";
import mapStore from "../../store/mapStore";
import isBetween from "dayjs/plugin/isBetween";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { PatientData } from "../../utils/ExcelParser";
import RegionInfo from "./RegionInfo";
import * as turf from "@turf/turf";
import RevenuInfo from "./chart/RevenueInfo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getRegionPrivateData } from "../../utils/api/apis";
import { Polygon, RegionData } from "../../types/naver-maps";
import { getDataFromRegionDB } from "../../store/indexded_db/RegionDB";
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
  const [selectedPatient, setSelectedPatient] = useState<PatientData[]>([]);
  const {
    areaName,
    totalCost,
    totalPatients,
    firstVisitPatients,
    revisitedPatients,
    dailyRevenue,
    revenueTrend,
    ageGroups,
    drawerDate,
    patients,
    region,
    selectedRegionData,
    setDrawerDate,
    setTotalCost,
    setTotalPatients,
    setFirstVisitPatients,
    setRevisitedPatients,
    setRevenueTrend,
    setAgeGroups,
    setDailyRevenue,
    smallPolygons
  } = mapStore();

  const [regionInfo, setRegionInfo] = useState<RegionData | null>(null);
  //const getPrivateData = useMutation({
  // mutationFn: (params: RegionPrivateParams) => getRegionPrivateData(params),
  // onSuccess: (data) => {
  //  console.log(data);
  //}
  //});

  const params = useMemo(() => {
    return {
      name: areaName,
      regionType: region,
      startDate: dayjs(drawerDate.startDate).format("YYYY-MM-DD"),
      endDate: dayjs(drawerDate.endDate).format("YYYY-MM-DD")
    };
  }, [areaName, region, drawerDate]);

  useEffect(() => {
    //getPrivateData.mutate(params);
  }, [params]);

  useEffect(() => {
    const fetchData = async () => {
      if (region === "small") {
        const containingDong = await findContainingDong(smallPolygons[0]);
        console.log(containingDong);
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
            age_group_population: containingDong.age_group_population
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
    return Object.entries(data).map(([date, value]) => {
      const averageRevenue =
        value.patientCount > 0 ? value.totalCost / value.patientCount : 0;
      return {
        date,
        value: averageRevenue
      };
    });
  };

  const formatDataForRevenueTrend = (data: any) => {
    return Object.entries(revenueTrend).map(([date, value]) => ({
      date,
      value
    }));
  };

  const barFormatData = () => {
    return Object.entries(ageGroups).map(([age, value]) => ({
      age,
      value
    }));
  };

  const statsData: { [key: number]: string } = {
    1: `${totalPatients}명`,
    2: `${totalCost.toLocaleString()} ₩`,
    3:
      totalPatients > 0
        ? `${Math.ceil(totalCost / totalPatients).toLocaleString()}` + " ₩"
        : 0 + " ₩", //1인당 평균 매출 = 총 매출 / 총 환자수
    4:
      selectedPatient.length > 0
        ? `${Math.ceil(totalCost / selectedPatient.length).toLocaleString()}` +
          " ₩"
        : 0 + " ₩", //내원당 평균 매출액
    5: `${revisitedPatients}명`,
    6: `${firstVisitPatients}명`,
    7: `${0}명`,
    8: `${0}%`
  };

  const handleTodayButton = () => {
    setDrawerDate({ startDate: dayjs(), endDate: dayjs() });
  };

  const [toggleValue, setToggleValue] = useState<string>("지역");

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
      {/** 날짜 필터 */}
      <DateFilterWrapper>
        {/* <div style={{ flex: 3 }}> */}
        <DurationDatePicker
          rangeDate={{
            startDate: drawerDate.startDate,
            endDate: drawerDate.endDate
          }}
          handleDateChange={(dates) => {
            if (dates) {
              setDrawerDate({
                startDate: dayjs(dates[0]),
                endDate: dayjs(dates[1])
              });
            }
          }}
        />
        {/* </div> */}
        {/* <div style={{ flex: 1 }}> */}
        <div style={{ width: 100 }}>
          <BaseButton
            type="button"
            onClick={handleTodayButton}
            color="#EDEEFC"
            textcolor="#000000"
          >
            오늘
          </BaseButton>
        </div>

        {/* </div> */}
      </DateFilterWrapper>
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
          <RevenuInfo
            statsData={statsData}
            revenueTrend={revenueTrend}
            dailyRevenue={dailyRevenue}
            ageGroups={ageGroups}
            formatDataForRevenueTrend={formatDataForRevenueTrend}
            formatDataForAverageRevenue={formatDataForAverageRevenue}
            barFormatData={barFormatData}
          />
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
                revenueTrend={revenueTrend}
                dailyRevenue={dailyRevenue}
                ageGroups={ageGroups}
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

const DateFilterWrapper = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: end;
`;
