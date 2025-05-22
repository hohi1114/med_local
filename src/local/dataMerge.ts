export interface MergedData {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  age: number | null;
  address: string;
}

interface VisitDataVegas {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  age: number | null;
  area: string;
  procedure: string;
  doctor: string;
  staff: string;
}

export interface MergedDataVegas {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  age: number | null;
  address: string;
  area: string; //분야
  procedure: string; // 시술
  doctor: string; //담당의
  staff: string; //담당직원

  route: string; // 경로
  nationality: string; //국적
  visitType: string; //type
}

interface VisitDataHanChart {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  age: number | null;
  route: string;
  doctor: string;
}

export interface MergedDataHanChart {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  age: number | null;
  address: string;
  doctor: string; //담당의
  route: string; // 경로
  visitType: string; //type
}

import {
  DailyIncomeEgis,
  PatientListEgis,
  PatientDataDentWeb,
  PatientData,
  VisitData,
} from "./ExcelParser";

import { DailyIncomeVegas, PatientListVegas } from "./excel/vegasExcel";
import {
  DailyIncomeHanChart,
  PatientListHanChart,
} from "./excel/hanchartExcel";

// For Euisarang data
export function mergeDataEuisarang(
  visits: VisitData[],
  patients: PatientData[]
): MergedData[] {
  // Create merged data from visits
  const df_merged = visits.map((visit) => ({
    chartNumber: visit.chartNumber,
    visitDate: visit.visitDate,
    totalCost: visit.totalCost,
    age: null as number | null, // Will be filled in later
    address: "N/D", // Will be filled in later
  }));

  // Create patient map for quick lookup
  const patientMap = new Map<number, PatientData>(
    patients.map((p) => [p.chartNumber, p])
  );

  // Ensure visitDate is a Date object and standardize to ISO string
  df_merged.forEach((record) => {
    record.visitDate = new Date(record.visitDate); // ✅ Ensure it's a Date object
  });

  // Fill in patient data
  df_merged.forEach((record) => {
    const patient = patientMap.get(record.chartNumber);
    record.age = patient?.age ?? null;
    record.address = patient?.address || "N/D";
  });

  return df_merged;
}

// For Euisarang data
export function mergeDataOrm(
  visits: VisitData[],
  patients: PatientData[]
): MergedData[] {
  // Create merged data from visits
  const df_merged = visits.map((visit) => ({
    chartNumber: visit.chartNumber,
    visitDate: visit.visitDate,
    totalCost: visit.totalCost,
    age: null as number | null, // Will be filled in later
    address: "N/D", // Will be filled in later
  }));

  // Create patient map for quick lookup
  const patientMap = new Map<number, PatientData>(
    patients.map((p) => [p.chartNumber, p])
  );

  // Ensure visitDate is a Date object and standardize to ISO string
  df_merged.forEach((record) => {
    record.visitDate = new Date(record.visitDate); // ✅ Ensure it's a Date object
  });

  // Fill in patient data
  df_merged.forEach((record) => {
    const patient = patientMap.get(record.chartNumber);
    record.age = patient?.age ?? null;
    record.address = patient?.address || "N/D";
  });

  return df_merged;
}

// For DentWeb data
export function mergeDataDentWeb(
  visits: VisitData[],
  patients: PatientDataDentWeb[]
): MergedData[] {
  // Create merged data from visits
  const df_merged = visits.map((visit) => ({
    chartNumber: visit.chartNumber,
    visitDate: visit.visitDate,
    totalCost: visit.totalCost,
    age: null as number | null, // Will be filled in later
    address: "N/D", // Will be filled in later
  }));

  // Create patient map for quick lookup
  const patientMap = new Map<number, PatientDataDentWeb>(
    patients.map((p) => [p.chartNumber, p])
  );

  df_merged.forEach((record) => {
    record.visitDate = new Date(record.visitDate); // ✅ Ensure it's a Date object
  });

  // Fill in patient data
  df_merged.forEach((record) => {
    const patient = patientMap.get(record.chartNumber);
    record.age = patient?.age ?? null;
    record.address = patient?.address || "N/D";
  });

  return df_merged;
}

// For Egis data
export function mergeDataEgis(
  dailyIncome: DailyIncomeEgis[],
  patientList: PatientListEgis[]
): MergedData[] {
  // Build "visits" array from dailyIncome
  const visits: VisitData[] = dailyIncome.map((inc) => ({
    chartNumber: inc.chartNumber,
    visitDate: inc.visitDate,
    totalCost: inc.totalCost,
  }));

  // Create merged data from visits
  const df_merged = visits.map((visit) => ({
    chartNumber: visit.chartNumber,
    visitDate: visit.visitDate,
    totalCost: visit.totalCost,
    age: null as number | null, // Will be filled in later
    address: "N/D", // Will be filled in later
  }));

  // Build a Map<chartNumber, PatientData> from patientList
  const patientMap = new Map<number, { age: number | null; address: string }>();

  // Fill age and address from patientList
  for (const pat of patientList) {
    patientMap.set(pat.chartNumber, {
      age: pat?.age ?? null,
      address: pat.address,
    });
  }

  df_merged.forEach((record) => {
    record.visitDate = new Date(record.visitDate); // ✅ Ensure it's a Date object
  });

  // Fill patient data into df_merged
  df_merged.forEach((record) => {
    const pat = patientMap.get(record.chartNumber);
    record.age = pat?.age ?? null;
    record.address = pat?.address || "N/D";
  });

  return df_merged;
}
// For Vegas data
export function mergeDataVegas(
  dailyIncome: DailyIncomeVegas[],
  patientList: PatientListVegas[]
): MergedDataVegas[] {
  // Build "visits" array from dailyIncome (Vegas includes age in daily income)
  const visits: VisitDataVegas[] = dailyIncome.map((inc) => ({
    chartNumber: inc.chartNumber,
    visitDate: inc.visitDate,
    totalCost: inc.totalCost,
    age: inc.age, // Vegas has age in daily income
    area: inc.area,
    procedure: inc.procedure,
    doctor: inc.doctor,
    staff: inc.staff,
  }));

  // Create merged data from visits
  const df_merged = visits.map((visit) => ({
    chartNumber: visit.chartNumber,
    visitDate: visit.visitDate,
    totalCost: visit.totalCost,
    age: visit?.age ?? null, // Age from daily income
    area: visit.area,
    procedure: visit.procedure,
    doctor: visit.doctor,
    staff: visit.staff,
    route: "",
    nationality: "",
    address: "N/D", // Will be filled in from patient list
    visitType: "재진", //default
  }));

  // Build a Map
  const patientMap = new Map<
    number,
    {
      address: string;
      firstDate: string;
      route: string;
      nationality: string;
    }
  >();

  for (const pat of patientList) {
    patientMap.set(pat.chartNumber, {
      address: pat.address || "N/D",
      firstDate: pat.firstDate || "",
      route: pat.route || "",
      nationality: pat.nationality || "",
    });
  }

  // Fill address data into df_merged
  df_merged.forEach((record) => {
    const patientData = patientMap.get(record.chartNumber);
    if (patientData) {
      record.address = patientData.address;
      record.route = patientData.route;
      record.nationality = patientData.nationality;

      if (record.visitDate === patientData.firstDate) {
        record.visitType = "신환"; // New patient
      } else {
        record.visitType = "재진"; // Follow-up visit
      }
    }
  });

  // NOW convert visitDate strings to Date objects
  df_merged.forEach((record) => {
    record.visitDate = new Date(record.visitDate as string);
  });

  return df_merged;
}

export function mergeDataHanChart(
  dailyIncome: DailyIncomeHanChart[],
  patientList: PatientListHanChart[]
): MergedDataHanChart[] {
  // Build "visits" array from dailyIncome (Vegas includes age in daily income)
  const visits: VisitDataHanChart[] = dailyIncome.map((inc) => ({
    chartNumber: inc.chartNumber,
    visitDate: inc.visitDate,
    totalCost: inc.totalCost,
    age: inc?.age ?? null, // Vegas has age in daily income
    doctor: inc.doctor,
    route: inc.route,
  }));

  // Create merged data from visits
  const df_merged = visits.map((visit) => ({
    chartNumber: visit.chartNumber,
    visitDate: visit.visitDate,
    totalCost: visit.totalCost,
    age: visit?.age ?? null, // Age from daily income
    doctor: visit.doctor,
    route: visit.route,
    visitType: "재진",
    address: "N/D", // Will be filled in from patient list
  }));

  // Build a Map<chartNumber, address> from patientList
  const patientMap = new Map<
    number,
    {
      address: string;
      firstDate: string;
    }
  >();

  // Fill address from patientList (Vegas patient list only has chartNumber and address)
  for (const pat of patientList) {
    patientMap.set(pat.chartNumber, {
      address: pat.address || "N/D",
      firstDate: pat.firstDate || "",
    });
  }

  df_merged.forEach((record) => {
    const patientData = patientMap.get(record.chartNumber);
    if (patientData) {
      record.address = patientData.address;
      if (record.visitDate === patientData.firstDate) {
        record.visitType = "신환"; // New patient
      } else {
        record.visitType = "재진"; // Follow-up visit
      }
    }
  });

  // NOW convert visitDate strings to Date objects
  df_merged.forEach((record) => {
    record.visitDate = new Date(record.visitDate as string);
  });

  return df_merged;
}
