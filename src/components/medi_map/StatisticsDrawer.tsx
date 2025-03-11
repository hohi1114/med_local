import { Drawer } from "antd";
import DurationDatePicker from "../common/datepicker/DurationDatePicker";
import BaseButton from "../common/button/BaseButton";
import styled from "styled-components";
import StatsBox, { STATSTYPE } from "./StatsBox";
import mapStore from "../../store/mapStore";
import BarChart from "./chart/BarChart";
import BaseLineChart from "./chart/BaseLineChart";
import isBetween from "dayjs/plugin/isBetween";
import dayjs from "dayjs";
import useRangeDurationDatePicker from "../../hooks/useRangeDurationDatePicker";
import { useEffect, useState } from "react";
import { PatientData } from "../../utils/ExcelParser";
dayjs.extend(isBetween);

interface StatisticsDrawerProps {
  open: boolean;
  handleDrawerOpen: () => void;
}
const StatisticsDrawer = ({
  open,
  handleDrawerOpen
}: StatisticsDrawerProps) => {
  const { rangeDate, handleDateChange } = useRangeDurationDatePicker();
  const [selectedPatient, setSelectedPatient] = useState<PatientData[]>([]);
  const {
    areaName,
    totalCost,
    totalPatients,
    firstVisitPatients,
    revisitedPatients,
    dailyRevenue,
    revenueTrend,
    setDrawerDate,
    setTotalCost,
    setTotalPatients,
    setFirstVisitPatients,
    setRevisitedPatients,
    setRevenueTrend,
    setAgeGroups,
    setDailyRevenue,
    patients
  } = mapStore();

  useEffect(() => {
    setDrawerDate([rangeDate.startDate, rangeDate.endDate]);
  }, []);

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
    setAgeGroups({});
    setDailyRevenue({});
  };

  useEffect(() => {
    if (open) {
      initDrawerData();
    }
  }, [open, rangeDate]);

  useEffect(() => {
    if (areaName && open) {
      if (patients.length > 0) {
        const filteredPatients = patients.filter(
          (data) => data.areaName === areaName
        );
        const filteredPatientsByDate = filteredPatients[0].patients.filter(
          (data) => {
            const visitDate = dayjs(data.visitDate);
            return visitDate.isBetween(rangeDate.startDate, rangeDate.endDate);
          }
        );
        setSelectedPatient(filteredPatientsByDate);
      } else {
        setSelectedPatient([]);
      }
    }
  }, [patients, open, rangeDate, areaName]);

  useEffect(() => {
    if (selectedPatient?.length > 0) {
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
      let totalPatient = new Set();
      const revenueMap: { [key: string]: number } = {};
      const dailyRevenueMap: { [key: string]: number } = {};
      let firstTimeCount = 0;
      let revisitCount = 0;
      let resultTotalCost = 0;

      selectedPatient.forEach((patient) => {
        const { totalCost, visitDate, age, visitType, chartNumber } = patient;
        resultTotalCost += totalCost;

        //총 환자 수
        if (!totalPatient.has(chartNumber)) {
          totalPatient.add(chartNumber);
        }
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
        setTotalPatients(totalPatient.size);
        setFirstVisitPatients(firstTimeCount);
        setRevisitedPatients(revisitCount);
        setRevenueTrend(revenueMap);
        setAgeGroups(ageGroups);
        setDailyRevenue(dailyRevenueMap);
      });
    }
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
  const statsData: { [key: number]: string } = {
    1: `${totalPatients}명`,
    2: `${totalCost.toLocaleString()} ₩`,
    3:
      totalPatients > 0
        ? `${Math.ceil(totalCost / totalPatients).toLocaleString()}`
        : 0 + " ₩", //1인당 평균 매출 = 총 매출 / 총 환자수
    4:
      totalPatients > 0
        ? `${Math.ceil(totalCost / totalPatients).toLocaleString()}`
        : 0 + " ₩", //객단가
    5: `${revisitedPatients}명`,
    6: `${firstVisitPatients}명`,
    7: `${0}명`,
    8: `${0}명`
  };

  const handleTodayButton = () => {
    handleDateChange([dayjs(), dayjs()]);
  };

  return (
    <Drawer
      width={"35rem"}
      placement="right"
      onClose={handleDrawerOpen}
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
      open={open}
    >
      {/** 날짜 필터 */}
      <DateFilterWrapper>
        <div style={{ flex: 3 }}>
          <DurationDatePicker
            rangeDate={rangeDate}
            handleDateChange={handleDateChange}
          />
        </div>
        <div style={{ flex: 1 }}>
          <BaseButton
            type="button"
            onClick={handleTodayButton}
            color="#EDEEFC"
            textcolor="#000000"
          >
            오늘
          </BaseButton>
        </div>
      </DateFilterWrapper>
      {/** 증가&감소 지표 */}
      <div style={{ padding: "0.8rem 0rem" }}>
        <AddressTitleStyle>{areaName}</AddressTitleStyle>
      </div>
      <GridWrapper>
        {STATSTYPE.map((data) => {
          return (
            <StatsBox
              key={data.id}
              title={data.title}
              data={statsData[data.id]}
            />
          );
        })}
      </GridWrapper>
      <GraphContainer>
        <GrapWrapper>
          <ChartTitleStyle>매출액 변화 추이</ChartTitleStyle>
          <BaseLineChart
            data={revenueTrend}
            xField="date"
            yField="value"
            labelFormatterY={(v: number) => `${v / 1000}K`}
            labelFormatterX={(v: string) => dayjs(v).format("MM/DD")}
            formatData={formatDataForRevenueTrend}
          />
        </GrapWrapper>
        <GrapWrapper>
          <ChartTitleStyle>연령대 별 환자 분포</ChartTitleStyle>
          <BarChart />
        </GrapWrapper>
        <GrapWrapper>
          <ChartTitleStyle>1인당 평균 매출액</ChartTitleStyle>
          <BaseLineChart
            data={dailyRevenue}
            xField="date"
            yField="value"
            labelFormatterY={(v: number) => `${v / 1000}K`}
            labelFormatterX={(v: string) => dayjs(v).format("MM/DD")}
            formatData={formatDataForAverageRevenue}
          />
        </GrapWrapper>
      </GraphContainer>
    </Drawer>
  );
};

export default StatisticsDrawer;

const AddressTitleStyle = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
`;

const ChartTitleStyle = styled.span`
  font-size: 1.2rem;
  margin-left: 1rem;
  font-weight: bold;
`;

const GridWrapper = styled.section`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  width: 100%;
`;

const GraphContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GrapWrapper = styled.div`
  background-color: #ffffff;
  border-radius: 1rem;
  padding: 2rem 1rem 0rem 1rem;
`;

const DateFilterWrapper = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
`;
