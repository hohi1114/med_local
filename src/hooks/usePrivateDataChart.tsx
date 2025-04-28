import { useState } from "react";
import { DashBoard } from "../types/dashboard";
import { RadioChangeEvent } from "antd";
import { RegionPrivateData } from "../types/naver-maps";

enum ChartType {
  REVENUE = 1,
  PATIENT_COUNT = 2
}

export const usePrivateDataChart = (data: DashBoard | RegionPrivateData) => {
  const [chartType, setChartType] = useState<ChartType>(ChartType.REVENUE);

  //연령 별 환자 분포
  const formatPatientCountBarData = () => {
    if (!data) return [];

    return Object.entries(data.patient_count_by_age_group).map(
      ([age, value]) => ({ age, value })
    );
  };

  //요일별 매출 통계
  const formatTotalCostBarData = () => {
    if (!data) return [];

    return Object.entries(data.total_cost_by_day_of_week).map(
      ([day, value]) => ({ day, value })
    );
  };

  //일자별 매출 통계
  const formatLineChartData = (type: ChartType) => {
    if (!data) return [];

    const configs =
      type === ChartType.REVENUE
        ? [
            { key: "cost_by_date", label: "전체 매출액" },
            { key: "sinhwan_cost_by_date", label: "신규환자 매출" },
            { key: "chojin_rejin_cost_by_date", label: "재방문 환자 매출" }
          ]
        : [
            { key: "visit_count_by_date", label: "전체 환자 수" },
            { key: "sinhwan_visit_count_by_date", label: "신규 환자 수" },
            { key: "chojin_rejin_visit_count_by_date", label: "재방문 환자 수" }
          ];

    return configs.flatMap(({ key, label }) =>
      Object.entries(data[key as keyof DashBoard] || {}).map(
        ([date, value]) => ({
          date,
          value,
          category: label
        })
      )
    );
  };

  //일자별 매출 통계 Y축 레이블 Formatter
  const formatYAxisLabelForLineChart = (value: number): string => {
    return chartType === ChartType.REVENUE
      ? `${value / 1000}K`
      : value.toString() + "명";
  };

  //요일별 신규/재방문 환자 비율
  const formatWeeklyDataForBarChart = () => {
    if (!data) return [];
    const days = [
      "월요일",
      "화요일",
      "수요일",
      "목요일",
      "금요일",
      "토요일",
      "일요일"
    ];
    return days.flatMap((day) => [
      {
        day,
        type: "신규 환자 수",
        value: data.sinhwan_visit_count_by_day_of_week[day] || 0
      },
      {
        day,
        type: "재방문 환자 수",
        value: data.chojin_rejin_visit_count_by_day_of_week[day] || 0
      }
    ]);
  };

  //매출액 변화 추이
  const formatDataForRevenueTrend = () => {
    if (!data?.cost_by_date) return [];
    return Object.entries(data?.cost_by_date).map(([date, value]) => ({
      date,
      매출액: value
    }));
  };

  //1인당 평균 매출액
  const formatDataForAverageRevenue = () => {
    if (!data?.average_cost_per_visit_by_date) return [];
    return Object.entries(data?.average_cost_per_visit_by_date).map(
      ([date, value]) => ({
        date,
        매출액: value
      })
    );
  };

  const handleChartRadioChange = (e: RadioChangeEvent) => {
    setChartType(e.target.value);
  };

  return {
    formatPatientCountBarData,
    formatTotalCostBarData,
    formatLineChartData,
    formatYAxisLabelForLineChart,
    formatWeeklyDataForBarChart,
    handleChartRadioChange,
    formatDataForRevenueTrend,
    formatDataForAverageRevenue,
    chartType
  };
};
