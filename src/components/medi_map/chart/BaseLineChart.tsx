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
  width: number;
  labelFormatterX?: (value: string) => string;
  labelFormatterY?: (value: number) => string;
  formatData: (data: any) => ILineData[];
}

const NUMBER_OF_POINTS = 6;
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

  //Data Formatting for Many Data Points
  useEffect(() => {
    if (data) {
      const formattedData = formatData(data);
      let selectedData: ILineData[] = [];
      if (formattedData.length > NUMBER_OF_POINTS) {
        selectedData = formattedData.filter(
          (_, index) =>
            index % Math.floor(formattedData.length / NUMBER_OF_POINTS) === 0
        );
      } else {
        selectedData = formattedData;
      }

      setLineData(selectedData);
    }
  }, [data, formatData]);

  const config = {
    data: lineData,
    xField,
    yField,
    smooth: true,
    width: width,
    autoFit: true,
    height: height,
    forceFit: true,
    axis: {
      y: {
        labelFormatter: labelFormatterY || ((v: number) => `${v / 1000}K`)
      },
      x: {
        labelFormatter:
          labelFormatterX || ((v: string) => dayjs(v).format("MM/DD"))
      }
    },
    scale: {
      x: { utc: true },
      y: { nice: true }
    },
    lineStyle: {
      stroke: "#F4664A",
      lineWidth: 4
    },
    color: undefined
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
