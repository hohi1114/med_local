import { Line } from "@ant-design/plots";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import styled from "styled-components";

interface ILineData {
  date: string;
  value: number;
}

interface IBaseLineChartProps {
  data: Record<string, number>;
  xField: string;
  yField: string;
  height: number;
  width?: number;
  labelFormatterX?: (value: string) => string;
  labelFormatterY?: (value: number) => string;
  formatData: (data: any) => ILineData[];
  number_of_points?: number;
}

const BaseLineChart = ({
  data,
  xField,
  yField,
  height,
  width,
  labelFormatterX,
  labelFormatterY,
  formatData
}: IBaseLineChartProps) => {
  const [lineData, setLineData] = useState<ILineData[]>([]);

  const formatDataWithAggregation = (
    data: Record<string, number>
  ): ILineData[] => {
    const aggregatedData: { [key: string]: number } = {};

    // 데이터를 순회하며 집계
    Object.keys(data).forEach((key) => {
      const date = dayjs(key);
      const weekStart = date.startOf("week").format("YYYY-MM-DD");

      if (!aggregatedData[weekStart]) {
        aggregatedData[weekStart] = 0;
      }

      aggregatedData[weekStart] += data[key]; // totalCost 값을 주별로 합산
    });

    // 집계된 데이터를 ILineData 포맷으로 변환
    const result = Object.keys(aggregatedData).map((weekStart) => ({
      date: weekStart,
      value: aggregatedData[weekStart]
    }));

    return result;
  };

  useEffect(() => {
    let formattedData = null;

    if (data) {
      if (xField === "time") {
        formattedData = formatData(data);
      } else {
        if (Object.keys(data).length > 50) {
          formattedData = formatDataWithAggregation(data);
        } else {
          formattedData = formatData(data);
        }
      }
      setLineData(formattedData);
    }
  }, [data, formatData]);

  const config = {
    data: lineData,
    xField,
    yField,
    smooth: true,
    width: width ? width : null,
    autoFit: true,
    height: height,
    forceFit: true,
    tooltip: {
      channel: "y",
      valueFormatter: (value: number) => {
        return value.toLocaleString() + " ₩";
      }
    },
    axis: {
      y: {
        labelFormatter: labelFormatterY || ((v: number) => `${v / 1000}K`)
      },
      x: {
        labelFormatter:
          labelFormatterX ||
          ((v: string) => (xField === "time" ? v : dayjs(v).format("MM/DD")))
      }
    },
    scale: {
      x: { utc: xField !== "time" },
      y: { nice: true }
    }
  };

  return lineData.length > 0 ? (
    <ChartContainer>
      <Line {...config} />
    </ChartContainer>
  ) : (
    <EmptyDataContainer>
      <div>불러올 데이터가 없습니다.</div>
    </EmptyDataContainer>
  );
};
const ChartContainer = styled.div`
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

export default BaseLineChart;
