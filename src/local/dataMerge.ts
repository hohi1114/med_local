import * as XLSX from "xlsx";
import { normalizeAge } from "./ExcelParser";
import { excelSerialToDate, calculateAge } from "./ExcelParser"
import {
  DailyIncomeSmartNC,
  PatientAddressSmartNC,
  PatientListSmartNC,
} from "./excel/smartncExcel";
import {
  DailyVisitSimEmr,
  PatientRouteSimEmr,
} from "./excel/simEmrExcel";

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
  nonTaxableNonInsuranceCost: number;
  age: number | null;
  area: string;
  procedure: string;
  doctor: string;
  staff: string;
}

export interface MergedDataNeo {
  chartNumber: number;
  visitDate: Date;
  totalCost: number;
  visitType: string;
  age: number | null;
  address: string;
}


export interface MergedDataVegas {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  nonTaxableNonInsuranceCost: number; // 비과세비급여 (위고비, 마운자로 등)
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
  route: string;
}

export interface MergedDataSmartNC {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  age: number | null;
  address: string;
  route: string;
}

export interface MergedDataSimEmr {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  age: number | null;
  address: string;
  visitType: string; // 1번 파일 "구분"(초진/재진/신환) - 소스에서 직접 제공, 서버 재계산 안함
  route: string; // 방문경로 사유 (1번 파일)
  route1: string; // 방문경로 (2번 파일)
  route2: string; // 방문사유 (2번 파일)
}


export interface VisitDataDoctorP {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
}

export interface MergedDataDoctorP {
  chartNumber: number;
  visitDate: Date; // string 대신 Date로 변경
  totalCost: number;
  route: string;
  age: number | null;
  address: string;
}

export interface VisitDataDoctorP2 {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
}

export interface MergedDataDoctorP2 {
  chartNumber: number;
  visitDate: Date;
  totalCost: number;
  route: string;
  age: number | null;
  address: string;
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


export interface MergedDataNeo {
  chartNumber: number;
  visitDate: Date;
  totalCost: number;
  visitType: string;
  age: number | null;
  address: string;
}


import { PatientData, VisitData } from "./ExcelParser";

import { DailyIncomeEgis, PatientListEgis } from "./excel/egisExcel";
import { DailyIncomeVegas, PatientListVegas } from "./excel/vegasExcel";
import { OrderRecordVegas2 } from "./excel/vegas2Excel";
import {
  DailyIncomeHanChart,
  PatientListHanChart,
} from "./excel/hanchartExcel";
import { DailyIncomeDentweb, PatientDataDentWeb } from "./excel/dentwebExcel";
import { DailyIncomeDoctorP, PatientListDoctorP } from "./excel/doctorpExcel";
import { DailyIncomeDoctorP2, PatientListDoctorP2 } from "./excel/doctorpExcel2";
import { DailyIncomeOrm,PatientListOrm } from "./excel/ormExcel";
import { DailyIncomeCchart, PatientListCchart } from "./excel/cChartExcel";
import {
  DailyIncomeBit,
  parsePatientListBit,
  PatientListBit,
} from "./excel/bitExcel";
import { DailyIncomeNeo,PatientListNeo } from "./excel/neoExcel";

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




export async function parseDailyIncomeNeo(
  fileBuffers: ArrayBuffer[]
): Promise<DailyIncomeNeo[]> {
  const data: DailyIncomeNeo[] = [];

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });

    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in file");
      continue;
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Get all data including headers
    const allData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      range: 0,
    });

    if (allData.length < 2) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    const headers = allData[0];

    // Find the index for each required column
    const visitDateIndex = headers.findIndex((col: any) => col === "진료일자");
    const chartNumberIndex = headers.findIndex((col: any) => col === "챠트번호");
    const totalCostIndex = headers.findIndex((col: any) => col === "총진료비");

    if (
      visitDateIndex === -1 ||
      chartNumberIndex === -1 ||
      totalCostIndex === -1
    ) {
      console.error("❌ Required columns not found in the file");
      console.error("Available headers:", headers);
      continue;
    }

    // Process data rows (starting from row 2, index 1)
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];

      // Skip empty rows
      if (!row || row.length === 0) {
        continue;
      }

      // Check if required fields exist
      if (
        !row[visitDateIndex] ||
        !row[chartNumberIndex] ||
        !row[totalCostIndex]
      ) {
        continue;
      }

      // Process chart number
      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) {
        console.log(`Skipping row ${i}: invalid chart number`);
        continue;
      }

      // Process total cost
      let totalCostValue = row[totalCostIndex];
      if (typeof totalCostValue === "string") {
        totalCostValue = totalCostValue.replace(/,/g, "");
      }

      const totalCost = Number(totalCostValue);
      if (isNaN(totalCost)) {
        console.log(`Skipping row ${i}: invalid total cost`);
        continue;
      }

      // Process visit date
      let visitDate = row[visitDateIndex];
      if (
        typeof visitDate === "string" &&
        visitDate.match(/^\d{4}\/\d{2}\/\d{2}$/)
      ) {
        visitDate = visitDate.replace(/\//g, "-");
      } else if (typeof visitDate === "number") {
        visitDate = excelSerialToDate(visitDate);
      }

      data.push({
        chartNumber,
        visitDate: String(visitDate),
        totalCost,
      });
    }
  }
  return data;
}


// For Neo data - visitType is determined dynamically
export function mergeDataNeo(
  dailyIncome: DailyIncomeNeo[],
  patientList: PatientListNeo[]
): MergedDataNeo[] {
  // Create a map for patient data: chartNumber -> { firstVisitDate, age, address }
  const patientChartMap = new Map<
    number,
    {
      firstVisitDate: string;
      age: number | null;
      address: string;
    }
  >();

  // Build patient chart map
  for (const pat of patientList) {
    const existing = patientChartMap.get(pat.chartNumber);

    if (!existing) {
      patientChartMap.set(pat.chartNumber, {
        firstVisitDate: String(pat.firstVisitDate),
        age: pat.age,
        address: pat.address,
      });
    } else {
      // Prefer non-null age and non-empty address
      patientChartMap.set(pat.chartNumber, {
        firstVisitDate: existing.firstVisitDate,
        age: pat.age !== null ? pat.age : existing.age,
        address: pat.address && pat.address !== "N/A" && pat.address !== ""
          ? pat.address
          : existing.address,
      });
    }
  }

  // Helper function to normalize date string for comparison
  const normalizeDate = (date: string | Date): string => {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Create merged data from dailyIncome
  const df_merged: MergedDataNeo[] = dailyIncome.map((inc) => {
    const chartData = patientChartMap.get(inc.chartNumber);

    // Determine visitType dynamically:
    // 신환: chartNumber exists in patientList AND visitDate equals firstVisitDate
    // 재진: otherwise
    let visitType = "재진";
    if (chartData) {
      const incVisitDate = normalizeDate(inc.visitDate);
      const firstVisitDate = normalizeDate(chartData.firstVisitDate);
      if (incVisitDate === firstVisitDate) {
        visitType = "신환";
      }
    }

    return {
      chartNumber: inc.chartNumber,
      visitDate: new Date(inc.visitDate as string),
      totalCost: inc.totalCost,
      visitType,
      age: chartData?.age ?? null,
      address: chartData?.address || "N/D",
    };
  });

  return df_merged;
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
    nonTaxableNonInsuranceCost: inc.nonTaxableNonInsuranceCost ?? 0,
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
    nonTaxableNonInsuranceCost: visit.nonTaxableNonInsuranceCost,
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



type PatientInfo = {
  address: string;
  age: number | null;
  route: string;
};

export function mergeDataDoctorP(
  dailyIncome: DailyIncomeDoctorP[],
  patientList: PatientListDoctorP[]
): MergedDataDoctorP[] {
  // Build "visits" array from dailyIncome
  const visits: VisitDataDoctorP[] = dailyIncome.map((inc) => ({
    chartNumber: inc.chartNumber,
    visitDate: inc.visitDate,
    totalCost: inc.totalCost,
  }));

  // Create merged data from visits
  const df_merged = visits.map((visit) => ({
    chartNumber: visit.chartNumber,
    visitDate: visit.visitDate,
    totalCost: visit.totalCost,
    route: "", // Will be filled in from patient list
    age: null as number | null, // Will be filled in from patient list
    address: "N/D", // Will be filled in from patient list
  }));

  // Build a Map
  const patientMap = new Map<number, PatientInfo>();

  for (const pat of patientList) {
    patientMap.set(pat.chartNumber, {
      address: pat.address || "N/D",
      age: pat?.age ?? null,
      route: pat.route || "",
    });
  }

  // Fill patient data into df_merged
  df_merged.forEach((record) => {
    const patientData = patientMap.get(record.chartNumber);
    if (patientData) {
      record.address = patientData.address;
      record.age = patientData.age;
      record.route = patientData.route;
    }
  });

  // Convert visitDate strings to Date objects
  const result: MergedDataDoctorP[] = df_merged.map((record) => ({
    ...record,
    visitDate: new Date(record.visitDate),
  }));

  return result;
}

export function mergeDataDoctorP2(
  dailyIncome: DailyIncomeDoctorP2[],
  patientList: PatientListDoctorP2[]
): MergedDataDoctorP2[] {
  const df_merged = dailyIncome.map((inc) => ({
    chartNumber: inc.chartNumber,
    visitDate: inc.visitDate,
    totalCost: inc.totalCost,
    route: "",
    age: null as number | null,
    address: "N/D",
  }));

  const patientMap = new Map<number, { address: string; age: number | null; route: string }>();
  for (const pat of patientList) {
    patientMap.set(pat.chartNumber, {
      address: pat.address || "N/D",
      age: pat.age ?? null,
      route: pat.route || "",
    });
  }

  df_merged.forEach((record) => {
    const patientData = patientMap.get(record.chartNumber);
    if (patientData) {
      record.address = patientData.address;
      record.age = patientData.age;
      record.route = patientData.route;
    }
  });

  return df_merged.map((record) => ({
    ...record,
    visitDate: new Date(record.visitDate),
  }));
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
    route: "N/D"
  }));

  // Build a Map
  const patientMap = new Map<
    number,
    {
      address: string;
      age: number | null;
      route: string;
    }
  >();

  for (const pat of patientList) {
    patientMap.set(pat.chartNumber, {
      address: pat.address || "N/D",
      age: pat?.age ?? null,
      route: pat.route || "N/D",
    });
  }

  // Fill address data into df_merged
  df_merged.forEach((record) => {
    const patientData = patientMap.get(record.chartNumber);
    if (patientData) {
      record.address = patientData.address;
      record.age = patientData.age;
      record.route= patientData.route;
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
  
  const normalizeDate = (date: string | Date): string => {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return String(date).split('T')[0];
  };

  const normalizeChartNumber = (cn: number | string): string => String(cn);

  const patientMapByDateAndChart = new Map<string, {
    age: number | null;
    address: string;
    visitType: string;
    doctor: string;
  }>();

  const patientFirstVisitByChart = new Map<string, {
    visitDate: string;
    age: number | null;
    address: string;
    visitType: string;
    doctor: string;
  }>();

  for (const pat of patientList) {
    const normalizedDate = normalizeDate(pat.visitDate);
    const normalizedChart = normalizeChartNumber(pat.chartNumber);
    const key = `${normalizedChart}_${normalizedDate}`;
    
    const patientData = {
      age: pat.age,
      address: pat.address || "N/D",
      visitType: pat.visitType,
      doctor: pat.doctor || "N/D",
    };

    patientMapByDateAndChart.set(key, patientData);

    if (!patientFirstVisitByChart.has(normalizedChart)) {
      patientFirstVisitByChart.set(normalizedChart, {
        visitDate: normalizedDate,
        ...patientData,
      });
    }
  }



  const df_merged = dailyIncome.map((income) => {
    const normalizedIncomeDate = normalizeDate(income.visitDate);
    const normalizedChart = normalizeChartNumber(income.chartNumber);
    const key = `${normalizedChart}_${normalizedIncomeDate}`;
    
    // 1차: 정확한 매칭
    let patientData = patientMapByDateAndChart.get(key);
    
    // 2차: fallback
    if (!patientData) {
      const firstVisit = patientFirstVisitByChart.get(normalizedChart);
      if (firstVisit) {
        patientData = {
          age: firstVisit.age,
          address: firstVisit.address,
          visitType: "재진",
          doctor: firstVisit.doctor,
        };
      
      }
    }

    return {
      chartNumber: income.chartNumber,
      visitDate: new Date(income.visitDate),
      totalCost: income.totalCost,
      age: patientData?.age ?? null,
      address: patientData?.address ?? "N/D",
      visitType: patientData?.visitType ?? "재진",
      doctor: patientData?.doctor ?? "N/D",
    };
  });


  return df_merged;
}


export function mergeDataSmartNC(
  dailyIncome: DailyIncomeSmartNC[],
  patientAddress: PatientAddressSmartNC[],
  patientList: PatientListSmartNC[]
): MergedDataSmartNC[] {
  // IPC 직렬화 시 숫자가 문자열로 올 수 있으므로 string 키로 통일
  const toKey = (n: number | string) => String(Number(n));

  // chartNumber → address
  const addressMap = new Map<string, string>();
  for (const p of patientAddress) {
    const key = toKey(p.chartNumber);
    if (!addressMap.has(key)) {
      addressMap.set(key, p.address);
    }
  }

  // chartNumber → age (첫 번째 유효한 값만)
  const ageMap = new Map<string, number | null>();
  for (const p of patientList) {
    const key = toKey(p.chartNumber);
    if (!ageMap.has(key) && p.age !== null) {
      ageMap.set(key, p.age);
    }
  }

  const df_merged: MergedDataSmartNC[] = dailyIncome.map((inc) => {
    const key = toKey(inc.chartNumber);
    return {
      chartNumber: inc.chartNumber,
      visitDate: inc.visitDate as string | Date,
      totalCost: inc.totalCost,
      age: ageMap.get(key) ?? null,
      address: addressMap.get(key) ?? "N/D",
      route: "N/D",
    };
  });

  df_merged.forEach((record) => {
    record.visitDate = new Date(record.visitDate as string);
  });

  return df_merged;
}

export function mergeDataSimEmr(
  dailyVisit: DailyVisitSimEmr[],
  patientRoute: PatientRouteSimEmr[]
): MergedDataSimEmr[] {
  // IPC 직렬화 시 숫자가 문자열로 올 수 있으므로 string 키로 통일
  const toKey = (n: number | string) => String(Number(n));

  // chartNumber → age / 방문경로 / 방문사유 (2번 파일에서만 제공됨)
  const ageMap = new Map<string, number | null>();
  const route1Map = new Map<string, string>();
  const route2Map = new Map<string, string>();
  for (const p of patientRoute) {
    const key = toKey(p.chartNumber);
    if (!ageMap.has(key) && p.age !== null) {
      ageMap.set(key, p.age);
    }
    if (!route1Map.has(key) && p.route) {
      route1Map.set(key, p.route);
    }
    if (!route2Map.has(key) && p.reason) {
      route2Map.set(key, p.reason);
    }
  }

  const df_merged: MergedDataSimEmr[] = dailyVisit.map((visit) => {
    const key = toKey(visit.chartNumber);
    return {
      chartNumber: visit.chartNumber,
      visitDate: visit.visitDate as string | Date,
      totalCost: visit.totalCost,
      age: ageMap.get(key) ?? null,
      // 방문 기록 자체에 주소가 있으므로 우선 사용, 없으면 N/D
      address: visit.address && visit.address !== "N/D" ? visit.address : "N/D",
      visitType: visit.visitType,
      route: visit.routeReason ?? "",
      route1: route1Map.get(key) ?? "",
      route2: route2Map.get(key) ?? "",
    };
  });

  df_merged.forEach((record) => {
    record.visitDate = new Date(record.visitDate as string);
  });

  return df_merged;
}