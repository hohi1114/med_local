import { Line } from "@ant-design/plots";
import dayjs from "dayjs";
import mapStore from "../../../store/mapStore";
import { useEffect, useState } from "react";
import styled from "styled-components";

interface ILineData {
  date: string;
  value: number;
}
const Line2Chart = () => {
  const { dailyRevenue } = mapStore();
  const [lineData, setLineData] = useState<ILineData[]>([]);

  useEffect(() => {
    console.log(dailyRevenue);
    if (dailyRevenue) {
      const data = Object.entries(dailyRevenue).map(([date, value]) => {
        const averageRevenue =
          value.patientCount > 0 ? value.totalCost / value.patientCount : 0;
        return {
          date,
          value: averageRevenue
        };
      });

      setLineData(data);
    }
  }, [dailyRevenue]);

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

export default Line2Chart;
