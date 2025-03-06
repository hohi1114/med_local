import { Drawer } from "antd";
import DurationDatePicker from "../common/datepicker/DurationDatePicker";
import { useEffect, useState } from "react";
import { RangePickerProps } from "antd/es/date-picker";
import BaseButton from "../common/button/BaseButton";
import styled from "styled-components";
import { Line } from "@ant-design/plots";
import StatsBox, { STATSTYPE } from "./StatsBox";

interface StatisticsDrawerProps {
  open: boolean;
  handleDrawerOpen: () => void;
}
const StatisticsDrawer = ({
  open,
  handleDrawerOpen,
}: StatisticsDrawerProps) => {
  const [rangeDate, setRangeDate] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });
  const handleDateChange: RangePickerProps["onChange"] = (dates, _) => {
    if (dates && dates[0] && dates[1]) {
      setRangeDate({
        startDate: dates[0].toDate(),
        endDate: dates[1].toDate(),
      });
    }
  };

  const [data, setData] = useState([]);

  useEffect(() => {
    asyncFetch();
  }, []);

  const asyncFetch = () => {
    fetch(
      "https://gw.alipayobjects.com/os/bmw-prod/c48dbbb1-fccf-4a46-b68f-a3ddb4908b68.json"
    )
      .then((response) => response.json())
      .then((json) => setData(json))
      .catch((error) => {
        console.log("fetch data failed", error);
      });
  };

  const config = {
    data,
    xField: "date",
    yField: "value",
    colorField: "type",
    height: 380,
    autoFit: true,
    responsive: true,
    axis: {
      y: {
        labelFormatter: (v) =>
          `${v}`.replace(/\d{1,3}(?=(\d{3})+$)/g, (s) => `${s},`),
      },
    },
    scale: {
      color: { range: ["#000000", "rgba(0,0, 0, 0.2)", "#FAAD14"] },
    },
    style: {
      lineWidth: 1,
      lineDash: (data) => {
        if (data[0].type === "register") return [4, 4];
      },
    },
  };

  return (
    <Drawer
      width={"35rem"}
      placement="right"
      onClose={handleDrawerOpen}
      style={{ backgroundColor: "#FAFAFB" }}
      styles={{
        mask: { backgroundColor: "rgba(0, 0, 0, 0)", pointerEvents: "none" },
        body: {
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          backgroundColor: "#FAFAFB",
        },
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
      <div style={{ padding: "1.5rem 0rem" }}>
        <AddressTitleStyle>서울시 양천구 신정1동 -B</AddressTitleStyle>
      </div>
      <GridWrapper>
        {STATSTYPE.map((title, index) => {
          return <StatsBox key={index} title={title} />;
        })}
      </GridWrapper>
      {/** 그래프 */}
      <GarpWrapper>
        <Line {...config} />
      </GarpWrapper>
      <GarpWrapper>
        <Line {...config} />
      </GarpWrapper>
      <GarpWrapper>
        <Line {...config} />
      </GarpWrapper>
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
