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
}

export interface FilteredData {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
  age: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export interface UpdatedDates {
  date: string;
}
