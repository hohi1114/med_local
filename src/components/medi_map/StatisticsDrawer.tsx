import { Drawer } from "antd";
import DurationDatePicker from "../common/datepicker/DurationDatePicker";
import { useState } from "react";
import { RangePickerProps } from "antd/es/date-picker";
import BaseButton from "../common/button/BaseButton";
import styled from "styled-components";
// import { Line } from "@ant-design/plots";
import StatsBox, { STATSTYPE } from "./StatsBox";
import mapStore from "../../store/mapStore";
import LineChart from "./chart/LineChart";
import BarChart from "./chart/BarChart";
import Line2Chart from "./chart/Line2Chart";

interface StatisticsDrawerProps {
  open: boolean;
  handleDrawerOpen: () => void;
}
const StatisticsDrawer = ({
  open,
  handleDrawerOpen
}: StatisticsDrawerProps) => {
  const [rangeDate, setRangeDate] = useState({
    startDate: new Date(),
    endDate: new Date()
  });
  const {
    areaName,
    totalCost,
    totalPatients,
    firstVisitPatients,
    revisitedPatients
  } = mapStore();

  const statsData: { [key: number]: string } = {
    1: `${totalPatients}명`,
    2: `${totalCost.toLocaleString()} ₩`,
    3: `${revisitedPatients}명`,
    4: `${firstVisitPatients}명`,
    5: `${0}명`,
    6: `${0}명`
  };

  const handleDateChange: RangePickerProps["onChange"] = (dates, _) => {
    if (dates && dates[0] && dates[1]) {
      setRangeDate({
        startDate: dates[0].toDate(),
        endDate: dates[1].toDate()
      });
    }
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
            type="submit"
            onClick={() => {}}
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
          <LineChart />
        </GrapWrapper>
        <GrapWrapper>
          <ChartTitleStyle>연령대 별 환자 분포</ChartTitleStyle>
          <BarChart />
        </GrapWrapper>
        <GrapWrapper>
          <ChartTitleStyle>1인당 평균 매출액</ChartTitleStyle>
          <Line2Chart />
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
