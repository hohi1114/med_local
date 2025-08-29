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
  area:string;
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
  area:string; // 교통사고 환자 구분용
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

interface VisitDataBit {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
}

// Final merged data structure
export interface MergedDataBit {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  age: number | null;
  address: string;
  visitType: string; // 신환/재진
  doctor: string; // 담당의
}

export interface MergedDataOrm {
  chartNumber: number;
  visitDate: Date;
  totalCost: number;
  visitType: "신환" | "초진" | "재진";
  doctor: string;
  age: number | null;
  address: string;
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
import { DailyIncomeOrm,PatientListOrm } from "./excel/ormExcel";
import { DailyIncomeCchart, PatientListCchart } from "./excel/cChartExcel";
import {
  DailyIncomeBit,
  parsePatientListBit,
  PatientListBit,
} from "./excel/bitExcel";

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



// For Orm





export function mergeDataOrm(
  dailyIncome: DailyIncomeOrm[],
  patientList: PatientListOrm[]
): MergedDataOrm[] {
  // 기본 visits 배열 구성
  const visits = dailyIncome.map((inc) => ({
    chartNumber: inc.chartNumber,
    visitDate: inc.visitDate,
    totalCost: inc.totalCost,
    visitType: inc.visitType,
    doctor: inc.doctor || "",
    age: inc.age ?? null,
  }));

  // df_merged 초기화 (address는 기본 "N/D")
  const df_merged = visits.map((v) => ({
    chartNumber: v.chartNumber,
    visitDate: v.visitDate,
    totalCost: v.totalCost,
    visitType: v.visitType,
    doctor: v.doctor,
    age: v.age,
    address: "N/D",
  }));

  const patientMap = new Map<number, { address: string }>();
  for (const p of patientList) {
    patientMap.set(p.chartNumber, {
      address: p.address || "N/D",
    });
  }

  // address만 채워넣기
  df_merged.forEach((rec) => {
    const pat = patientMap.get(rec.chartNumber);
    if (pat) {
      rec.address = pat.address;
    }
  });

  // visitDate를 Date 객체로 변환
  df_merged.forEach((rec) => {
    rec.visitDate = new Date(String(rec.visitDate));
  });

  return df_merged as MergedDataOrm[];
}



// For Egis data
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
    area: inc.area ?? "" ,
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
    area: visit.area,
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

export function mergeDataBit(
  dailyIncome: DailyIncomeBit[],
  patientList: PatientListBit[]
): MergedDataBit[] {
  // Build "visits" array from dailyIncome
  const visits: VisitDataBit[] = dailyIncome.map((inc) => ({
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
    address: "N/D", // Will be filled in from patient list
    visitType: "재진", // Default to 재진
    doctor: "", // Will be filled in from patient list
  }));

  // Build a Map for quick patient lookup
  const patientMap = new Map<
    number,
    {
      age: number | null;
      address: string;
      visitType: string;
      doctor: string;
    }
  >();

  for (const pat of patientList) {
    patientMap.set(pat.chartNumber, {
      age: pat.age,
      address: pat.address || "N/D",
      visitType: pat.visitType,
      doctor: pat.doctor || "N/D",
    });
  }

  // Fill patient data into df_merged
  df_merged.forEach((record) => {
    const patientData = patientMap.get(record.chartNumber);
    if (patientData) {
      record.age = patientData.age;
      record.address = patientData.address;
      record.visitType = patientData.visitType;
      record.doctor = patientData.doctor;
    }
  });

  // Convert visitDate strings to Date objects
  df_merged.forEach((record) => {
    record.visitDate = new Date(record.visitDate as string);
  });

  return df_merged;
}
