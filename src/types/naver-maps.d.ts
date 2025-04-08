import { DashBoard } from "./dashboard";

declare global {
  interface Window {
    naver: any;
  }
}

export type Polygon = {
  area: string;
  polygon: Array<Array<[number, number]>>;
};

type PopulationByTime = {
  [hour: number]: number;
};

// Days of the week in Korean
type PopulationByDay = {
  월요일?: number; // Monday
  화요일?: number; // Tuesday
  수요일?: number; // Wednesday
  목요일?: number; // Thursday
  금요일?: number; // Friday
  토요일?: number; // Saturday
  일요일?: number; // Sunday
  [otherDay: string]: number | undefined;
};

type AgeGroupPopulation = {
  "0-9": number;
  "10-19": number;
  "20-29": number;
  "30-39": number;
  "40-49": number;
  "50-59": number;
  "60-69": number;
  "70-79": number;
  "80-89": number;
  "90-99": number;
  "100세 이상": number;
};

type Polygon = number[][];

type Point = {
  lat: number;
  lng: number;
};

type RegionData = {
  id?: number;
  monthly_avg_income: number;
  name: string;
  polygon?: Polygon[];
  total_avg_age: number;
  population: number;
  total_cost?: number;
  patient_locations?: Point;
  male_avg_age: number;
  male_population: number;
  female_avg_age: number;
  female_population: number;
  medical_expense: number;
  age_group_population: AgeGroupPopulation;
  population_by_time: PopulationByTime;
  population_by_day: PopulationByDay;
  dong_population?: number | null;
  dong?: string;
  total_costA?: number;
  total_costB?: number;
};

export interface AgeGroupPopulation {
  "0-9": number;
  "10-19": number;
  "20-29": number;
  "30-39": number;
  "40-49": number;
  "50-59": number;
  "60-69": number;
  "70-79": number;
  "80-89": number;
  "90-99": number;
  "100세 이상": number;
}

export interface RegionEtcData {
  dong_region_name: string;
  total_cost: number;
  patient_location: Point[];
}

export interface RegionPrivateData extends DashBoard {
  average_cost_per_patient: number;
  total_patient_count: number;
}

export type RegionLevel = "small" | "dong" | "gu";
