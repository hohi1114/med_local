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
  age_group_population: AgeGroupPopulation;
  female_avg_age: number;
  female_population: number;
  id: number;
  male_avg_age: number;
  male_population: number;
  medical_expense: number;
  monthly_avg_income: number;
  name: string;
  polygon: Polygon[];
  population_by_time: PopulationByTime;
  total_avg_age: number;
  total_population: number;
  total_cost: number;
  patient_locations: Point[];
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
