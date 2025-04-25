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

export type TopAgeGrowth = {
  age: number;
  change_percent: number;
};

export type AverageGrowth = {
  data_available: boolean;
  message?: string;
  avg_growth_total_cost?: number;
  avg_growth_sinhwan?: number;
  avg_growth_revisit?: number;
  top_age_growth: TopAgeGrowth[];
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
  sinhwan_cost_by_date: AverageCostPerVisitByDate;
  chojin_rejin_cost_by_date: AverageCostPerVisitByDate;

  patient_count_by_age_group: PatientCountByAgeGroup;
  visit_count_by_date: AverageCostPerVisitByDate;
  sinhwan_visit_count_by_date: AverageCostPerVisitByDate;
  chojin_rejin_visit_count_by_date: AverageCostPerVisitByDate;
  total_cost_by_day_of_week: AverageCostPerVisitByDate;
  sinhwan_visit_count_by_day_of_week: AverageCostPerVisitByDate;
  chojin_rejin_visit_count_by_day_of_week: AverageCostPerVisitByDate;
  diff_rates: DiffRates;
  topRegions: TopRegion;
  top_age_growth: AverageGrowth;
}
export type RangeDateMapKey = "1주일" | "1개월" | "3개월" | "1년";
