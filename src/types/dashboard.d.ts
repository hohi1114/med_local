type CostByDate = {
  [key: string]: number;
};

type AverageCostPerVisitByDate = {
  [key: string]: number;
};

type PatientCountByAgeGroup = {
  [key: string]: number;
};

type DiffRates = {
  total_visit_count: number;
  total_cost: number;
  chojin_rejin_visit_count: number;
  sinhwan_visit_count: number;
  average_cost_per_visit: number;
  average_cost_per_patient: number;
  total_patient_count: number;
};

export type Region = {
  region_name: string;
  visit_count: number;
  chojin_rejin_count: number;
  sinhwan_count: number;
  total_cost: number;
};

export type AverageGrowth = {
  data_available: boolean;
  avg_growth_total_cost: number | null;
  avg_growth_sinhwan: number | null;
  avg_growth_revisit: number | null;
  top_age_growth: {
    age: string;
    change_percent: number;
  }[];
};

type TopRegion = Region[];

export interface DashBoard {
  total_visit_count: number;
  total_cost: number;
  chojin_rejin_visit_count: number;
  sinhwan_visit_count: number;
  average_cost_per_visit: number;
  average_cost_per_patient: number;
  cost_by_date: CostByDate;
  average_cost_per_visit_by_date: AverageCostPerVisitByDate;
  patient_count_by_age_group: PatientCountByAgeGroup;
  diff_rates: DiffRates;
  topRegions: TopRegion;
  average_growths: AverageGrowth;
}
export type RangeDateMapKey = "일주일" | "1개월" | "3개월" | "1년";
