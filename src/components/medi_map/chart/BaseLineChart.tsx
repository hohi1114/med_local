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
  labelFormatterX?: (value: string) => string;
  labelFormatterY?: (value: number) => string;
  formatData: (data: any) => ILineData[];
}

const BaseLineChart = ({
  data,
  xField,
  yField,
  labelFormatterX,
  labelFormatterY,
  formatData
}: IBaseLineChartProps) => {
  const [lineData, setLineData] = useState<ILineData[]>([]);

  useEffect(() => {
    if (data) {
      const formattedData = formatData(data);
      setLineData(formattedData);
    }
  }, [data, formatData]);

  const config = {
    data: lineData,
    xField,
    yField,
    smooth: true,
    autoFit: true,
    width: 350,
    height: 280,
    axis: {
      y: {
        labelFormatter: labelFormatterY || ((v: number) => `${v / 1000}K`)
      },
      x: {
        labelFormatter:
          labelFormatterX || ((v: string) => dayjs(v).format("MM/DD"))
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

export default BaseLineChart;
