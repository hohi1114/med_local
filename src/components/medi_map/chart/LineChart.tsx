import { Line } from "@ant-design/plots";
import dayjs from "dayjs";
import mapStore from "../../../store/mapStore";
import { useEffect, useState } from "react";
import styled from "styled-components";

interface ILineData {
  date: string;
  value: number;
}
const LineChart = () => {
  const { revenueTrend } = mapStore();
  const [lineData, setLineData] = useState<ILineData[]>([]);

  useEffect(() => {
    if (revenueTrend) {
      const data = Object.entries(revenueTrend).map(([date, value]) => ({
        date,
        value
      }));
      setLineData(data);
    }
  }, [revenueTrend]);

  const config = {
    data: lineData,
    xField: "date",
    yField: "value",
    smooth: true,
    autoFit: true,
    width: 350,
    height: 280,
    axis: {
      y: {
        labelFormatter: (v: number) => `${v / 1000}K`
      },
      x: {
        labelFormatter: (v: string) => dayjs(v).format("MM/DD")
      }
    },
    lineStyle: {
      stroke: "#F4664A",
      lineWidth: 4
    },
    color: undefined
  };

  return lineData.length > 0 ? (
    <Line {...config} />
  ) : (
    <EmptyDataContainer>
      <div>불러올 데이터가 없습니다.</div>
    </EmptyDataContainer>
  );
};

const EmptyDataContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 280px;
  color: gray;
`;

export default LineChart;
