import { Column } from "@ant-design/plots";
import mapStore from "../../../store/mapStore";
import { useEffect, useState } from "react";
import styled from "styled-components";

interface IBarData {
  age: string;
  value: number;
}
const BarChart = () => {
  const { ageGroups } = mapStore();
  const [barData, setBarData] = useState<IBarData[]>([]);
  useEffect(() => {
    if (ageGroups) {
      const data = Object.entries(ageGroups).map(([age, value]) => ({
        age,
        value
      }));
      setBarData(data);
    }
  }, [ageGroups]);

  const config = {
    data: barData,
    xField: "age",
    yField: "value",
    colorField: "age",
    width: 350,
    height: 260,
    legend: false,

    style: {
      radius: 8
    },
    scale: {
      color: {
        range: [
          "#9F9FF8",
          "#96E2D6",
          "#000000",
          "#92BFFF",
          "#AEC7ED",
          "#94E9B8",
          "#E4A9FF"
        ]
      }
    },
    tooltip: {
      items: ["age", "value"]
    }
  };
  return barData.length > 0 ? (
    <Column {...config} />
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

export default BarChart;
