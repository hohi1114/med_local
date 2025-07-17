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

export interface MergedDataDentWeb {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  age: number | null;
  address: string;
  area: string;
  doctor: string; //담당의
  route: string; // 경로
  visitType: string;
}

interface VisitDataDentWeb {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  area: string;
  route: string;
  doctor: string;
  firstDate: string;
}

export interface MergedDataEgis {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  age: number | null;
  address: string;
  visitType: string;
}

export interface VisitDataCchart {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
}

export interface MergedDataCchart {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  age: number | null;
  address: string;
}

export interface VisitDataDoctorP {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  route: string; //내원경로
  area: string; //진료내역
  doctor: string; // 담당의사
  visitType: string;
}

export interface MergedDataDoctorP {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  age: number | null;
  address: string;
  area: string;
  doctor: string; //담당의
  route: string; // 경로
  visitType: string;
}

import { PatientData, VisitData } from "./ExcelParser";

import { DailyIncomeEgis, PatientListEgis } from "./excel/egisExcel";
import { DailyIncomeVegas, PatientListVegas } from "./excel/vegasExcel";
import {
  DailyIncomeHanChart,
  PatientListHanChart,
} from "./excel/hanchartExcel";
import { DailyIncomeDentweb, PatientDataDentWeb } from "./excel/dentwebExcel";
import { DailyIncomeDoctorP, PatientListDoctorP } from "./excel/doctorpExcel";
import { DailyIncomeCchart, PatientListCchart } from "./excel/cChartExcel";

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

// For Egis data

// For Vegas data
export function mergeDataEgis(
  dailyIncome: DailyIncomeEgis[],
  patientList: PatientListEgis[]
): MergedDataEgis[] {
  // Build "visits" array from dailyIncome (
  const visits: DailyIncomeEgis[] = dailyIncome.map((inc) => ({
    chartNumber: inc.chartNumber,
    visitDate: inc.visitDate,
    totalCost: inc.totalCost,
    visitType: inc.visitType,
  }));

  // Create merged data from visits
  const df_merged = visits.map((visit) => ({
    chartNumber: visit.chartNumber,
    visitDate: visit.visitDate,
    totalCost: visit.totalCost,
    visitType: visit.visitType,
    age: null as number | null, //Will be filled in later
    address: "N/D", // Will be filled in from patient list
  }));

  // Build a Map
  const patientMap = new Map<
    number,
    {
      address: string;
      age: number | null;
    }
  >();

  for (const pat of patientList) {
    patientMap.set(pat.chartNumber, {
      address: pat.address || "N/D",
      age: pat?.age ?? null,
    });
  }

  // Fill address data into df_merged
  df_merged.forEach((record) => {
    const patientData = patientMap.get(record.chartNumber);
    if (patientData) {
      record.address = patientData.address;
      record.age = patientData.age;
    }
  });

  // NOW convert visitDate strings to Date objects
  df_merged.forEach((record) => {
    record.visitDate = new Date(record.visitDate as string);
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
    age: inc?.age ?? null, // Vegas has age in daily income
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

export function mergeDataDentWeb(
  dailyIncome: DailyIncomeDentweb[],
  patients: PatientDataDentWeb[]
): MergedDataDentWeb[] {
  // Build "visits" array from dailyIncome (Vegas includes age in daily income)

  const visits: VisitDataDentWeb[] = dailyIncome.map((inc) => ({
    chartNumber: inc.chartNumber,
    visitDate: inc.visitDate,
    totalCost: inc.totalCost,
    route: inc.route,
    area: inc.area,
    doctor: inc.doctor,
    firstDate: inc.firstDate,
  }));

  // Create merged data from visits
  const df_merged = visits.map((visit) => ({
    chartNumber: visit.chartNumber,
    visitDate: visit.visitDate,
    totalCost: visit.totalCost,
    area: visit.area,
    doctor: visit.doctor,
    route: visit.route,
    firstDate: visit.firstDate,
    address: "N/D", // Will be filled in from patient list
    age: null as number | null, // Will be filled in later
    visitType: "재진", //default
  }));

  // Build a Map
  // Create patient map for quick lookup
  const patientMap = new Map<
    number,
    {
      address: string;
      age: number | null;
    }
  >();

  // Fill address from patientList (Vegas patient list only has chartNumber and address)
  for (const pat of patients) {
    patientMap.set(pat.chartNumber, {
      address: pat.address || "N/D",
      age: pat?.age ?? null,
    });
  }

  df_merged.forEach((record) => {
    const patientData = patientMap.get(record.chartNumber);
    if (patientData) {
      record.address = patientData.address;
      record.age = patientData.age;
      if (record.visitDate === record.firstDate) {
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
export function MergedDataDoctorP(
  dailyIncome: DailyIncomeDoctorP[],
  patientList: PatientListDoctorP[]
): MergedDataDoctorP[] {
  // Build "visits" array from dailyIncome (Vegas includes age in daily income)
  const visits: VisitDataDoctorP[] = dailyIncome.map((inc) => ({
    chartNumber: inc.chartNumber,
    visitDate: inc.visitDate,
    totalCost: inc.totalCost,
    visitType: inc.visitType,
    route: inc.route,
    area: inc.area,
    doctor: inc.doctor,
  }));

  // Create merged data from visits
  const df_merged = visits.map((visit) => ({
    chartNumber: visit.chartNumber,
    visitDate: visit.visitDate,
    totalCost: visit.totalCost,
    visitType: visit.visitType,
    route: visit.route,
    area: visit.area,
    doctor: visit.doctor,
    age: null as number | null, //Will be filled in later
    address: "N/D", // Will be filled in from patient list
  }));

  // Build a Map
  const patientMap = new Map<
    number,
    {
      address: string;
      age: number | null;
    }
  >();

  for (const pat of patientList) {
    patientMap.set(pat.chartNumber, {
      address: pat.address || "N/D",
      age: pat?.age ?? null,
    });
  }

  // Fill address data into df_merged
  df_merged.forEach((record) => {
    const patientData = patientMap.get(record.chartNumber);
    if (patientData) {
      record.address = patientData.address;
      record.age = patientData.age;
    }
  });

  // NOW convert visitDate strings to Date objects
  df_merged.forEach((record) => {
    record.visitDate = new Date(record.visitDate as string);
  });

  return df_merged;
}

export function MergedDataCchart(
  dailyIncome: DailyIncomeCchart[],
  patientList: PatientListCchart[]
): MergedDataCchart[] {
  // Build "visits" array from dailyIncome (Vegas includes age in daily income)
  const visits: VisitDataCchart[] = dailyIncome.map((inc) => ({
    chartNumber: inc.chartNumber,
    visitDate: inc.visitDate,
    totalCost: inc.totalCost,
  }));

  // Create merged data from visits
  const df_merged = visits.map((visit) => ({
    chartNumber: visit.chartNumber,
    visitDate: visit.visitDate,
    totalCost: visit.totalCost,
    age: null as number | null, //Will be filled in later
    address: "N/D", // Will be filled in from patient list
  }));

  // Build a Map
  const patientMap = new Map<
    number,
    {
      address: string;
      age: number | null;
    }
  >();

  for (const pat of patientList) {
    patientMap.set(pat.chartNumber, {
      address: pat.address || "N/D",
      age: pat?.age ?? null,
    });
  }

  // Fill address data into df_merged
  df_merged.forEach((record) => {
    const patientData = patientMap.get(record.chartNumber);
    if (patientData) {
      record.address = patientData.address;
      record.age = patientData.age;
    }
  });

  // NOW convert visitDate strings to Date objects
  df_merged.forEach((record) => {
    record.visitDate = new Date(record.visitDate as string);
  });

  return df_merged;
}
