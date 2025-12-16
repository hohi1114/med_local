import * as XLSX from "xlsx";
import { normalizeAge } from "../ExcelParser";
import { excelSerialToDate, calculateAge } from "../ExcelParser";

export interface DailyIncomeDoctorP {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
}

export interface PatientListDoctorP {
  chartNumber: number;
  address: string;
  age: number | null;
  route: string;
}

// 날짜 정규화 헬퍼 함수
function normalizeDate(dateValue: any): string {
  // Excel 시리얼 넘버인 경우
  if (typeof dateValue === "number") {
    const excelDate = XLSX.SSF.parse_date_code(dateValue);
    if (excelDate) {
      return `${excelDate.y}-${String(excelDate.m).padStart(2, "0")}-${String(
        excelDate.d
      ).padStart(2, "0")}`;
    }
  }

  // 문자열인 경우 (2025-12-13 형식)
  if (typeof dateValue === "string") {
    return dateValue.trim();
  }

  // Date 객체인 경우
  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    return dateValue.toISOString().split("T")[0];
  }

  // 변환 실패 시 원본 반환
  return String(dateValue);
}

// 나이 정규화 헬퍼 함수
function parseAge(ageValue: any): number | null {
  if (ageValue == null || ageValue === "") {
    return null;
  }

  // 문자열인 경우
  if (typeof ageValue === "string") {
    // "30세", "25세" 형식 처리
    const ageMatch = ageValue.trim().match(/^(\d+)세?$/);
    if (ageMatch) {
      const age = Number(ageMatch[1]);
      return !isNaN(age) ? normalizeAge(age) : null;
    }
    
    // 숫자만 있는 문자열
    const age = Number(ageValue.trim());
    return !isNaN(age) ? normalizeAge(age) : null;
  }

  // 이미 숫자인 경우
  if (typeof ageValue === "number") {
    return !isNaN(ageValue) ? normalizeAge(ageValue) : null;
  }

  return null;
}

// In src/services/fileProcessing.ts
export async function parseDaysFilesDoctorP(
  fileBuffers: ArrayBuffer[]
): Promise<DailyIncomeDoctorP[]> {
  let data: DailyIncomeDoctorP[] = [];

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
      raw: false,
    });

    if (allData.length < 2) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    const headers = allData[0];

    // Find the index for each required column
    const chartNumberIndex = headers.findIndex(
      (col: any) => col === "환자번호"
    );
    const visitDateIndex = headers.findIndex((col: any) => col === "진료일");
    const totalCostIndex = headers.findIndex((col: any) => col === "총 매출");

    console.log(chartNumberIndex, visitDateIndex, totalCostIndex);

    // Check if all required columns were found
    if (
      chartNumberIndex === -1 ||
      visitDateIndex === -1 ||
      totalCostIndex === -1
    ) {
      console.error(`❌ Required columns not found in sheet`);
      continue;
    }

    // Process data rows (skip the header row)
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];

      if (
        !row[chartNumberIndex] ||
        !row[visitDateIndex] ||
        row[totalCostIndex] == null
      ) {
        continue;
      }

      // Process chartNumber - ensure it's a number
      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) {
        continue;
      }

      // 날짜 정규화
      const visitDate = normalizeDate(row[visitDateIndex]);

      // totalCost 처리 - 쉼표 제거 후 숫자 변환
      let totalCostValue = row[totalCostIndex];
      if (typeof totalCostValue === "string") {
        totalCostValue = totalCostValue.replace(/,/g, "");
      }
      const totalCost = Number(totalCostValue);
      
      if (isNaN(totalCost)) {
        continue;
      }

      data.push({
        chartNumber,
        visitDate,
        totalCost,
      });
    }
  }
  return data;
}

export async function parsePlaceFilesDoctorP(
  fileBuffers: ArrayBuffer[]
): Promise<PatientListDoctorP[]> {
  let data: PatientListDoctorP[] = [];

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
      raw: false,
    });

    if (allData.length < 2) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    const headers = allData[0];

    // Find the index for each required column
    const chartNumberIndex = headers.findIndex(
      (col: any) => col === "환자번호"
    );
    const ageIndex = headers.findIndex((col: any) => col === "나이");
    const addressIndex = headers.findIndex((col: any) => col === "주소");
    const routeIndex = headers.findIndex((col: any) => col === "환자태그");

    console.log(chartNumberIndex, ageIndex, addressIndex, routeIndex);

    if (
      chartNumberIndex === -1 ||
      ageIndex === -1 ||
      addressIndex === -1 ||
      routeIndex === -1
    ) {
      console.error(
        `❌ Required columns not found in sheet ${workbook.SheetNames[0]}`
      );
      continue;
    }

    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];

      // Skip rows where chart number is missing
      if (!row[chartNumberIndex] || !row[ageIndex]) {
        continue;
      }

      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) {
        continue;
      }

      // 나이 파싱 ("30세" 형식 처리)
      const normalizedAge = parseAge(row[ageIndex]);

      const address = row[addressIndex] || "N/D";
      const route = row[routeIndex] || "";

      data.push({
        chartNumber,
        age: normalizedAge,
        address: typeof address === "string" ? address : String(address),
        route: typeof route === "string" ? route : String(route),
      });
    }
  }
  return data;
}