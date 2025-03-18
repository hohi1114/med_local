import { Drawer, Segmented } from "antd";
import DurationDatePicker from "../common/datepicker/DurationDatePicker";
import BaseButton from "../common/button/BaseButton";
import styled from "styled-components";
import mapStore from "../../store/mapStore";
import isBetween from "dayjs/plugin/isBetween";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { PatientData } from "../../utils/ExcelParser";
import Dong_region_info from "../../../public/D_integrated_data.json";
import Gu_region_info from "../../../public/G_integrated.json";
import Small_region_info from "../../../public/Sub_integrated_data.json";
import RegionInfo from "./RegionInfo";
import * as turf from "@turf/turf";
import RevenuInfo from "./chart/RevenueInfo";
dayjs.extend(isBetween);

// 지역 데이터 타입 정의
interface RegionData {
  area: string;
  polygon?: string;
  male_avg_age?: number;
  female_avg_age?: number;
  total_avg_age?: number;
  monthly_avg_income?: number;
  male_population?: number;
  female_population?: number;
  medical_expense?: number;
  age_group_population?: any; // 구체적인 타입이 있으면 적용
}

interface Props {
  areaName: string;
  region: "small" | "dong" | "gu";
  setRegionInfo: (data: RegionData) => void;
}

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
function findContainingDong(
  smallPoint: [number, number],
  dongRegions: RegionData[]
): RegionData | undefined {
  return dongRegions.find((dong) => {
    if (!dong.polygon) return false;
    const dongPolygonArray = JSON.parse(dong.polygon);
    const fixedPolygon = fixPolygonCoordinates(dongPolygonArray?.[0]);

    return (
      fixedPolygon.length >= 4 &&
      turf.booleanContains(turf.polygon([fixedPolygon]), turf.point(smallPoint))
    );
  });
}

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
    setDrawerDate,
    setTotalCost,
    setTotalPatients,
    setFirstVisitPatients,
    setRevisitedPatients,
    setRevenueTrend,
    setAgeGroups,
    setDailyRevenue
  } = mapStore();

  const [regionInfo, setRegionInfo] = useState();

  useEffect(() => {
    let data: RegionData[] = [];

    if (region === "small") {
      const smallRegions = Small_region_info["DATA"].filter(
        (data: RegionData) => data["area"] === areaName
      );

      if (smallRegions.length === 0) return;
      const smallPolygonString = smallRegions[0].polygons;
      if (!smallPolygonString) return;

      const smallPolygon = JSON.parse(smallPolygonString);
      const smallPoint = smallPolygon?.[0]?.[0] as [number, number];
      if (!smallPoint) return;

      const dongRegions: RegionData[] = Dong_region_info["DATA"];
      const containingDong = findContainingDong(smallPoint, dongRegions);
      if (containingDong) {
        Object.assign(smallRegions[0], {
          male_avg_age: containingDong.male_avg_age,
          female_avg_age: containingDong.female_avg_age,
          total_avg_age: containingDong.total_avg_age,
          monthly_avg_income: containingDong.monthly_avg_income,
          male_population: containingDong.male_population,
          female_population: containingDong.female_population,
          medical_expense: containingDong.medical_expense,
          age_group_population: containingDong.age_group_population
        });
      }
      data = smallRegions;
    } else if (region === "dong") {
      data = Dong_region_info["DATA"].filter((data) => {
        return data["area"] === areaName;
      });
    } else {
      data = Gu_region_info["DATA"].filter((data) => {
        return data["area"] === areaName;
      });
    }

    if (data.length > 0) {
      setRegionInfo(data[0]);
    }
  }, [areaName]);

  // 연령을 숫자로 변환하는 함수
  const parseAge = (ageString: string): number => {
    const ageParts = ageString.split("세");
    if (ageParts.length < 2) return 0;

    const ageYears = parseInt(ageParts[0].trim(), 10);
    const ageMonths =
      ageParts[1] && ageParts[1].includes("개월")
        ? parseInt(ageParts[1].replace("개월", "").trim(), 10)
        : 0;

    // 1년을 12개월로 보고, 월 단위로 계산하여 나이 계산
    return ageYears + ageMonths / 12;
  };

  const initDrawerData = () => {
    setTotalCost(0);
    setTotalPatients(0);
    setFirstVisitPatients(0);
    setFirstVisitPatients(0);
    setRevisitedPatients(0);
    setRevenueTrend({});
    setAgeGroups({
      아동: 0,
      "10대": 0,
      "20대": 0,
      "30대": 0,
      "40대": 0,
      "50대": 0,
      "60대": 0
    });
    setDailyRevenue({});
  };

  useEffect(() => {
    if (isOpenDrawer) {
      initDrawerData();
    }
  }, [isOpenDrawer, drawerDate]);

  useEffect(() => {
    if (areaName && isOpenDrawer) {
      if (patients?.length > 0) {
        const filteredPatients = patients.filter(
          (data) => data.areaName === areaName
        );

        if (filteredPatients[0]?.patients) {
          const filteredPatientsByDate = filteredPatients[0]?.patients.filter(
            (data) => {
              const visitDate = dayjs(new Date(data.visitDate));
              return visitDate.isBetween(
                drawerDate.startDate.toDate(),
                drawerDate.endDate.toDate()
              );
            }
          );
          setSelectedPatient(filteredPatientsByDate);
        }
      } else {
        setSelectedPatient([]);
      }
    }
  }, [patients, isOpenDrawer, drawerDate, areaName]);

  useEffect(() => {
    if (selectedPatient.length === 0) {
      initDrawerData();
      return;
    }
    // 연령대 별 환자 분포
    const ageGroups = {
      아동: 0,
      "10대": 0,
      "20대": 0,
      "30대": 0,
      "40대": 0,
      "50대": 0,
      "60대": 0
    };

    const revenueMap: { [key: string]: number } = {};
    const dailyRevenueMap: { [key: string]: number } = {};
    let firstTimeCount = 0;
    let revisitCount = 0;
    let resultTotalCost = 0;

    selectedPatient.forEach((patient) => {
      const { totalCost, visitDate, age, visitType } = patient;
      resultTotalCost += totalCost;
      //재방문 환자수 = 초진 + 재진
      if (visitType === "초진" || visitType === "재진") {
        revisitCount++;
      } else if (visitType === "신환") {
        firstTimeCount++;
      }
      //매출액 변화 추이
      if (visitDate && revenueMap[visitDate]) {
        revenueMap[visitDate] += totalCost ?? 0;
      } else {
        revenueMap[visitDate] = totalCost;
      }
      const ageInYears = parseAge(age);
      // 연령대에 맞는 카운트 증가
      if (ageInYears >= 0 && ageInYears <= 9) {
        ageGroups["아동"]++;
      } else if (ageInYears >= 10 && ageInYears <= 19) {
        ageGroups["10대"]++;
      } else if (ageInYears >= 20 && ageInYears <= 29) {
        ageGroups["20대"]++;
      } else if (ageInYears >= 30 && ageInYears <= 39) {
        ageGroups["30대"]++;
      } else if (ageInYears >= 40 && ageInYears <= 49) {
        ageGroups["40대"]++;
      } else if (ageInYears >= 50 && ageInYears <= 59) {
        ageGroups["50대"]++;
      } else {
        ageGroups["60대"]++;
      }
      //1인당 평균 매출액
      if (visitDate) {
        // visitDate가 없으면 초기화
        if (!dailyRevenueMap[visitDate]) {
          dailyRevenueMap[visitDate] = {
            totalCost: 0,
            patientCount: 0
          };
        }
      }
      if (visitDate && dailyRevenueMap[visitDate].totalCost) {
        dailyRevenueMap[visitDate].totalCost += totalCost;
        dailyRevenueMap[visitDate].patientCount += 1;
      } else {
        dailyRevenueMap[visitDate].totalCost = totalCost;
        dailyRevenueMap[visitDate].patientCount = 1;
      }

      setTotalCost(resultTotalCost);
      setTotalPatients(selectedPatient.length);
      setFirstVisitPatients(firstTimeCount);
      setRevisitedPatients(revisitCount);
      setRevenueTrend(revenueMap);
      setAgeGroups(ageGroups);
      setDailyRevenue(dailyRevenueMap);
    });
  }, [selectedPatient]);

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
