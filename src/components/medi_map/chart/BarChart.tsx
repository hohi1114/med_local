import { Column } from "@ant-design/plots";
import { useEffect, useState } from "react";
import styled from "styled-components";

interface ChartDataItem {
  [key: string]: any;
}

interface BarChartProps<T> {
  data: T;
  xField: string;
  yField: string | string[];
  height: number;
  width?: number;
  formatData?: (data: T) => ChartDataItem[];
  isGrouped?: boolean;
  seriesField?: string;
  legend?: boolean;
  colors?: string[] | string;
  valueXSymbol?: string;
}

const BarChart = <T,>({
  data,
  xField,
  yField,
  height,
  width,
  valueXSymbol,
  isGrouped = false,
  seriesField,
  legend = false,
  colors = [
    "#0077C0",
    "#96E2D6",
    "#000000",
    "#92BFFF",
    "#AEC7ED",
    "#94E9B8",
    "#E4A9FF",
    "#FFB6C1",
    "#142459",
    "#FCEAE6",
    "#EF7E32"
  ]
}: BarChartProps<T>) => {
  const [barData, setBarData] = useState<ChartDataItem[]>([]);

  useEffect(() => {
    setBarData(data as ChartDataItem[]);
  }, [data]);

  const getStyle = () => ({
    radius: 8,
    maxWidth: 50,
    //Colors === 색깔하나
    ...(Array.isArray(colors) ? {} : { fill: colors })
  });

  //Colors === 여러색
  const getScale = () => ({
    color: Array.isArray(colors) ? { range: colors } : undefined
  });

  const getColorField = () => (Array.isArray(colors) ? xField : undefined);

  // 기본 설정
  const baseConfig = {
    data: barData,
    xField: xField,
    height: height,
    width: width || undefined,
    autoFit: true,
    legend: legend,
    style: getStyle(),
    axis: {
      x: {
        labelFormatter: (v: string) => (xField === "age" ? `${v}세` : v)
      }
    },
    tooltip: {
      channel: "y",
      name: "매출",
      valueFormatter: (v: number) =>
        `${v.toLocaleString() + (valueXSymbol || "")}`
    },
    scale: getScale(),
    colorField: getColorField()
  };

  // 일반 바 차트 설정
  const singleBarConfig = {
    ...baseConfig,
    yField: Array.isArray(yField) ? yField[0] : yField
  };

  // 그룹화된 바 차트 설정
  const groupedBarConfig = {
    ...baseConfig,
    yField: Array.isArray(yField) ? yField[0] : yField,
    seriesField: seriesField || "type",
    isGroup: true,
    colorField: seriesField || "type"
  };

  const config = isGrouped ? groupedBarConfig : singleBarConfig;

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
