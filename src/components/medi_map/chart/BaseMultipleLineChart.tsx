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
  data: LineDataItem[];
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
  smaThresholdDays?: number;
  smaWindowSize?: number;
  checkEachSeriesSeparately?: boolean;
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
  seriesField,
  smaThresholdDays = 60,
  smaWindowSize = 7,
  checkEachSeriesSeparately = false
}: UnifiedLineChartProps) => {
  const [chartData, setChartData] = useState<LineDataItem[]>([]);

  // Calculate date range of the data
  const getDateRange = (dataArray: LineDataItem[]) => {
    if (!dataArray || dataArray.length === 0) return 0;

    const dates = dataArray.map(d => new Date(d[xField] as string));
    const minDate = Math.min(...dates.map(d => d.getTime()));
    const maxDate = Math.max(...dates.map(d => d.getTime()));

    // Calculate the difference in days
    const diffInMs = maxDate - minDate;
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    return diffInDays;
  };

  // Check if all dates have the same year
  const allSameYear = (dataArray: LineDataItem[]) => {
    if (!dataArray || dataArray.length === 0) return true;
    const years = dataArray.map((d) => dayjs(d.date).year());
    return new Set(years).size === 1;
  };

  // Simple Moving Average
  const applySMAForData = (
    dataArray: LineDataItem[],
    valueField: string,
    options?: {
      seriesField?: string;
      dateField?: string;
      windowSize?: number;
    }
  ): LineDataItem[] => {
    if (!dataArray || dataArray.length === 0) return [];

    const { seriesField: series, dateField = "date", windowSize = 7 } = options || {};

    // Group data by series if seriesField is provided
    const groupedData: Record<string, LineDataItem[]> = {};

    if (series) {
      dataArray.forEach((item) => {
        const key = item[series] as string;
        if (!groupedData[key]) groupedData[key] = [];
        groupedData[key].push({ ...item });
      });
    } else {
      groupedData["__single__"] = dataArray.map((d) => ({ ...d }));
    }

    const result: LineDataItem[] = [];

    Object.entries(groupedData).forEach(([_, group]) => {
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

    const dateRangeInDays = getDateRange(data);
    const shouldApplySMA = dateRangeInDays > smaThresholdDays;



    if (colorField) {
      const multiLineData = shouldApplySMA
        ? applySMAForData(data, yField, {
          seriesField: colorField,
          windowSize: smaWindowSize
        })
        : data;
      setChartData(multiLineData);
    } else {
      // Single line
      if (xField !== "time" && shouldApplySMA) {
        setChartData(applySMAForData(data, yField, { windowSize: smaWindowSize }));
      } else {
        setChartData(data);
      }
    }
  }, [data, xField, yField, colorField, smaThresholdDays, smaWindowSize]);

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