import { ColumnType } from "antd/es/table";
import { RegionStatistics } from "../../../types/region-analysis";

export const statisticsColumn: ColumnType<RegionStatistics>[] = [
  {
    title: "지역",
    dataIndex: "region_name",
    key: "region_name",
    align: "center"
  },
  {
    title: "유동 인구 수",
    dataIndex: "population",
    key: "population",
    align: "center",
    render: (value: number) => `${value.toLocaleString()} 명`,
    sorter: (a: { population: number }, b: { population: number }) =>
      a.population - b.population
  },
  {
    title: "방문 환자 수",
    dataIndex: "total_visit_count",
    key: "total_visit_count",
    align: "center",
    render: (value: number) => `${value.toLocaleString()} 명`,
    sorter: (
      a: { total_visit_count: number },
      b: { total_visit_count: number }
    ) => a.total_visit_count - b.total_visit_count
  },
  {
    title: "누적 매출액",
    dataIndex: "total_cost",
    key: "total_cost",
    align: "center",
    render: (value: number) => `${value.toLocaleString()} ₩`,
    sorter: (a: { total_cost: number }, b: { total_cost: number }) =>
      a.total_cost - b.total_cost
  },
  {
    title: "재방문 환자 수",
    dataIndex: "chojin_rejin_visit_count",
    key: "chojin_rejin_visit_count",
    align: "center",
    render: (value: number) => `${value.toLocaleString()} 명`,
    sorter: (
      a: { chojin_rejin_visit_count: number },
      b: { chojin_rejin_visit_count: number }
    ) => a.chojin_rejin_visit_count - b.chojin_rejin_visit_count
  },
  {
    title: "신규 환자 수",
    dataIndex: "sinhwan_visit_count",
    key: "sinhwan_visit_count",
    align: "center",
    render: (value: number) => `${value.toLocaleString()} 명`,
    sorter: (
      a: { sinhwan_visit_count: number },
      b: { sinhwan_visit_count: number }
    ) => a.sinhwan_visit_count - b.sinhwan_visit_count
  },
  {
    title: "내원당 평균 매출액",
    dataIndex: "average_cost_per_visit",
    key: "average_cost_per_visit",
    align: "center",
    render: (value: number) => `${Math.ceil(value).toLocaleString()} ₩`,
    sorter: (
      a: { chojin_rejin_visit_count: number },
      b: { chojin_rejin_visit_count: number }
    ) => a.chojin_rejin_visit_count - b.chojin_rejin_visit_count
  },
  {
    title: "1인당 평균 매출액",
    dataIndex: "average_cost_per_patient",
    key: "average_cost_per_patient",
    align: "center",
    render: (value: number) => `${Math.ceil(value).toLocaleString()} ₩`,
    sorter: (
      a: { average_cost_per_patient: number },
      b: { average_cost_per_patient: number }
    ) => a.average_cost_per_patient - b.average_cost_per_patient
  },
  {
    title: "총 환자 수",
    dataIndex: "total_patient_count",
    key: "total_patient_count",
    align: "center",
    render: (value: number) => `${value.toLocaleString()} 명`,
    sorter: (
      a: { total_patient_count: number },
      b: { total_patient_count: number }
    ) => a.total_patient_count - b.total_patient_count
  },
  {
    title: "평균 환자 연령",
    dataIndex: "average_patient_age",
    key: "average_patient_age",
    align: "center",
    render: (value: number) => `${value} 세`,
    sorter: (
      a: { average_patient_age: number },
      b: { average_patient_age: number }
    ) => a.average_patient_age - b.average_patient_age
  }
];
