import { Line } from "@ant-design/plots";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import styled from "styled-components";

interface ILineData {
  date: string;
  value: number;
}

interface IBaseLineChartProps {
  data:
    | Record<string, { totalCost: number; patientCount: number }>
    | Record<string, number>;
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
  formatData,
  number_of_points = 5
}: IBaseLineChartProps) => {
  const [lineData, setLineData] = useState<ILineData[]>([]);

  //Data Formatting for Many Data Points
  useEffect(() => {
    if (data) {
      const formattedData = formatData(data);
      console.log(formattedData);
      // let selectedData: ILineData[] = [];
      // if (formattedData.length > number_of_points) {
      //   selectedData = formattedData.filter(
      //     (_, index) =>
      //       index % Math.floor(formattedData.length / number_of_points) === 0
      //   );
      // } else {
      //   selectedData = formattedData;
      // }

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
