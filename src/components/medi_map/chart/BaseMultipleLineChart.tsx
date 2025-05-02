import { Line } from "@ant-design/plots";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import styled from "styled-components";

// Unified interface for line chart data item
interface LineDataItem {
  date: string;
  value?: number;
  category?: string;
  type?: string;
  [key: string]: string | number | undefined;
}

interface UnifiedLineChartProps {
  // Core properties
  data: LineDataItem[] | Record<string, number>;
  xField: string;
  yField: string;
  height: number;
  labelFormatterX?: (value: string) => string;
  labelFormatterY?: (value: number) => string;
  valueXSymbol?: string;
  formatData?: (data: Record<string, number>) => LineDataItem[];
  colorField?: string;
  limitDateXLength?: number;
  seriesField?: string;
}

const BaseMultipleLineChart = ({
  data,
  xField,
  yField,
  height,
  labelFormatterX,
  labelFormatterY,
  valueXSymbol = " ₩",
  formatData,
  colorField,
  seriesField
}: UnifiedLineChartProps) => {
  const [chartData, setChartData] = useState<LineDataItem[]>([]);

  // Check if all dates have the same year
  const allSameYear = (data: LineDataItem[]) => {
    if (!data || data.length === 0) return true;
    const years = data.map((d) => dayjs(d.date).year());
    return new Set(years).size === 1;
  };

  //단순이동평균
  const applySMAForData = (
    data: LineDataItem[] | Record<string, number>,
    valueField: string,
    options?: {
      seriesField?: string;
      dateField?: string;
      windowSize?: number;
    }
  ): LineDataItem[] => {
    if (!data || data.length === 0) return [];

    const { seriesField, dateField = "date", windowSize = 7 } = options || {};

    // 시리즈 필드가 없으면 전체를 하나의 그룹으로 처리
    const groupedData: Record<string, LineDataItem[]> = {};

    if (seriesField) {
      data.forEach((item) => {
        const key = item[seriesField] as string;
        if (!groupedData[key]) groupedData[key] = [];
        groupedData[key].push({ ...item });
      });
    } else {
      groupedData["__single__"] = data.map((d) => ({ ...d }));
    }

    const result: LineDataItem[] = [];

    Object.entries(groupedData).forEach(([key, group]) => {
      const sortedGroup = group.sort(
        (a, b) =>
          new Date(a[dateField] as string).getTime() -
          new Date(b[dateField] as string).getTime()
      );

      for (let i = 0; i < sortedGroup.length; i++) {
        let sum = 0;
        let count = 0;

        for (let j = 0; j < windowSize; j++) {
          const idx = i - j;
          if (idx >= 0 && sortedGroup[idx][valueField] !== undefined) {
            sum += sortedGroup[idx][valueField] as number;
            count++;
          }
        }

        const movingAverage = count > 0 ? sum / count : 0;

        result.push({
          ...sortedGroup[i],
          [valueField]: movingAverage
        });
      }
    });

    return result;
  };

  useEffect(() => {
    if (!data) {
      setChartData([]);
      return;
    }
    //Multiple Line
    if (colorField) {
      const multiLineData = applySMAForData(data, yField, {
        seriesField: colorField
      });
      setChartData(multiLineData);
      return;
    } else {
      if (xField !== "time") {
        setChartData(applySMAForData(data, yField));
      } else {
        setChartData(data);
      }
    }
  }, [data, formatData, xField, yField]);

  const formatXLabel = (value: string) => {
    if (xField === "time") return value;
    return allSameYear(chartData)
      ? dayjs(value).format("MM/DD")
      : dayjs(value).format("YY/MM/DD");
  };

  const config = {
    data: chartData,
    xField,
    yField,
    colorField: seriesField || colorField,
    seriesField: seriesField || colorField,
    smooth: true,
    height,
    autoFit: true,
    forceFit: true,
    tooltip: {
      channel: "y",
      valueFormatter: (value: number) =>
        Math.ceil(value).toLocaleString() + (valueXSymbol || "")
    },
    axis: {
      y: {
        labelFormatter: labelFormatterY || ((v: number) => `${v / 1000}K`)
      },
      x: {
        labelFormatter: labelFormatterX || formatXLabel
      }
    },
    style: {
      lineWidth: 2
    },
    scale: {
      x: { utc: false },
      y: { nice: true }
    }
  };

  return chartData.length > 0 ? (
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

export default BaseMultipleLineChart;
