import { Line } from "@ant-design/plots";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import styled from "styled-components";

interface ILineData {
  date: string;
  [key: string]: string | number;
}

interface IBaseLineChartProps {
  data: Record<string, number>;
  xField: string;
  yField: string;
  height: number;
  width?: number;
  labelFormatterX?: (value: string) => string;
  labelFormatterY?: (value: number) => string;
  valueXSymbol?: string;
  formatData: (data: any) => ILineData[];
  limitDateXLength?: number;
}

//모든 연도가 같은지 확인
function allSameYear(data: ILineData[]) {
  const years = data.map((d) => dayjs(d.date).year());
  return new Set(years).size === 1;
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
  valueXSymbol,
  limitDateXLength = 50
}: IBaseLineChartProps) => {
  const [lineData, setLineData] = useState<ILineData[]>([]);

  const formatDataWithAggregation = (
    data: Record<string, number>,
    yField: string
  ): ILineData[] => {
    const sortedKeys = Object.keys(data).sort();
    const result: ILineData[] = [];

    for (let i = 0; i < sortedKeys.length; i += 7) {
      const group = sortedKeys.slice(i, i + 7);
      const sum = group.reduce((acc, dateKey) => acc + data[dateKey], 0);
      result.push({
        date: group[0],
        [yField]: sum
      });
    }

    return result;
  };

  useEffect(() => {
    let formattedData = null;
    if (data) {
      if (xField === "time") {
        formattedData = formatData(data);
      } else {
        if (Object.keys(data).length > limitDateXLength) {
          formattedData = formatDataWithAggregation(data, yField);
        } else {
          formattedData = formatData(data);
        }
      }
      setLineData(formattedData);
    }
  }, [data, formatData]);

  const sameYear = allSameYear(lineData);
  const dynamicXFormatter = (v: string) =>
    xField === "time"
      ? v
      : sameYear
      ? dayjs(v).format("MM/DD")
      : dayjs(v).format("YY/MM/DD");

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
        return (
          Math.ceil(value).toLocaleString() +
          (valueXSymbol ? valueXSymbol : " ₩")
        );
      }
    },
    axis: {
      y: {
        labelFormatter: labelFormatterY || ((v: number) => `${v / 1000}K`)
      },
      x: {
        labelFormatter: labelFormatterX || dynamicXFormatter
      }
    },
    scale: {
      x: { utc: false },
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
