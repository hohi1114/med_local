import { Column } from "@ant-design/plots";
import { useEffect, useState } from "react";
import styled from "styled-components";

interface IBaseBarCharProps<T, U> {
  data: T;
  xField: string;
  yField: string;
  height: number;
  width?: number;
  formatData: (data: U) => U[];
}

const BarChart = <T, U extends { [key: string]: any }>({
  data,
  xField,
  yField,
  height,
  width,
  formatData
}: IBaseBarCharProps<T, U>) => {
  const [barData, setBarData] = useState<U[]>([]);

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const formattedData = formatData(data);
      setBarData(formattedData);
    }
  }, [data]);

  const config = {
    data: barData,
    xField: xField,
    yField: yField,
    colorField: xField,
    autoFit: true,
    height: height,
    width: width ? width : null,
    legend: false,
    style: {
      radius: 8,
      maxWidth: 40
    },
    scale: {
      color: {
        range: [
          "#0077C0",
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
      items: [xField, "value"]
    }
  };
  return barData.length > 0 ? (
    <BarChartContainer>
      <Column {...config} />
    </BarChartContainer>
  ) : (
    <EmptyDataContainer>
      <div>불러올 데이터가 없습니다.</div>
    </EmptyDataContainer>
  );
};

const BarChartContainer = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
`;
const EmptyDataContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 280px;
  color: gray;
`;

export default BarChart;
