import { Drawer } from "antd";
import DurationDatePicker from "../common/datepicker/DurationDatePicker";
import { useEffect, useState } from "react";
import { RangePickerProps } from "antd/es/date-picker";
import BaseButton from "../common/button/BaseButton";
import styled from "styled-components";
// import { Line } from "@ant-design/plots";
import StatsBox, { STATSTYPE } from "./StatsBox";
import mapStore from "../../store/mapStore";

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
      width={"30rem"}
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
      <span> 차트 그리는 중...</span>
    </Drawer>
  );
};

export default StatisticsDrawer;

const AddressTitleStyle = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
`;

const GridWrapper = styled.section`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  width: 100%;
`;

const GarpWrapper = styled.div`
  background-color: #ffffff;
  border-radius: 1rem;
  padding: 1rem;
`;

const DateFilterWrapper = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
`;
