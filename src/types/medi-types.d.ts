import { PatientData } from "../utils/ExcelParser";

export interface MediDataType {
  key: number;
  local: string | null;
  people_of_movement: number;
  visiting_patients: number;
  average_age_of_patients: number;
  new_patients: number;
  revisiting_patients: number;
  inflow_rate: number;
  average_sales_per_person: number;
  sales_rate: number;
  accumulated_sales: number;
}
export interface MergedData {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
  age: string;
  address: string;
  visitType: string;
}

export interface FilteredData {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
  age: string;
  address: string;
  visitType: string;
  latitude: number | null;
  longitude: number | null;
}

export interface UpdatedDates {
  date: string;
}

export interface BackendData {
  merged_data: MergedData[];
  filtered_data: FilteredData[];
  df_date: UpdatedDates[];
}

export type RegionSummary = {
  regionName: string;
  totalCost: number;
  patientCount: number;
};

export interface RankedRegion extends RegionSummary {
  revenueRate: string; // 매출 비율 (예: "25.50%")
}

export interface AllPatientsData extends PatientData {
  regionName: string;
  data: PatientData[];
}
