import * as XLSX from "xlsx";
import { normalizeAge } from "../ExcelParser";

export interface DailyIncomeDoctorP2 {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
}

export interface PatientListDoctorP2 {
  chartNumber: number;
  address: string;
  age: number | null;
  route: string;
}

function normalizeDate(dateValue: any): string {
  let date: Date;

  if (typeof dateValue === "number") {
    const excelDate = XLSX.SSF.parse_date_code(dateValue);
    if (excelDate) {
      date = new Date(excelDate.y, excelDate.m - 1, excelDate.d);
    } else {
      return String(dateValue);
    }
  } else if (typeof dateValue === "string") {
    date = new Date(dateValue.trim());
  } else if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    date = dateValue;
  } else {
    return String(dateValue);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseAge(ageValue: any): number | null {
  if (ageValue == null || ageValue === "") return null;

  if (typeof ageValue === "string") {
    const ageMatch = ageValue.trim().match(/^(\d+)세?$/);
    if (ageMatch) {
      const age = Number(ageMatch[1]);
      return !isNaN(age) ? normalizeAge(age) : null;
    }
    const age = Number(ageValue.trim());
    return !isNaN(age) ? normalizeAge(age) : null;
  }

  if (typeof ageValue === "number") {
    return !isNaN(ageValue) ? normalizeAge(ageValue) : null;
  }

  return null;
}

// [거주지인근, ★VIP★] → "거주지인근,★VIP★"
function parseRoute(raw: any): string {
  if (!raw) return "";
  const str = String(raw).trim();
  const inner = str.replace(/^\[/, "").replace(/\]$/, "");
  return inner
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");
}

export async function parseDaysFilesDoctorP2(
  fileBuffers: ArrayBuffer[]
): Promise<DailyIncomeDoctorP2[]> {
  const data: DailyIncomeDoctorP2[] = [];

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });
    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in file");
      continue;
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
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
    const chartNumberIndex = headers.findIndex((col: any) => col === "환자번호");
    const visitDateIndex = headers.findIndex((col: any) => col === "진료일");
    const totalCostIndex = headers.findIndex((col: any) => col === "매출 총액 합계");

    if (chartNumberIndex === -1 || visitDateIndex === -1 || totalCostIndex === -1) {
      console.error("❌ Required columns not found");
      console.error("Available headers:", headers);
      continue;
    }

    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      if (!row[chartNumberIndex] || !row[visitDateIndex] || row[totalCostIndex] == null) continue;

      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) continue;

      const visitDate = normalizeDate(row[visitDateIndex]);

      let totalCostValue = row[totalCostIndex];
      if (typeof totalCostValue === "string") {
        totalCostValue = totalCostValue.replace(/,/g, "");
      }
      const totalCost = Number(totalCostValue);
      if (isNaN(totalCost) || totalCost === 0) continue;

      data.push({ chartNumber, visitDate, totalCost });
    }
  }
  return data;
}

export async function parsePlaceFilesDoctorP2(
  fileBuffers: ArrayBuffer[]
): Promise<PatientListDoctorP2[]> {
  const data: PatientListDoctorP2[] = [];

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });
    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in file");
      continue;
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
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
    const chartNumberIndex = headers.findIndex((col: any) => col === "환자번호");
    const ageIndex = headers.findIndex((col: any) => col === "나이");
    const addressIndex = headers.findIndex((col: any) => col === "주소");
    const routeIndex = headers.findIndex((col: any) => col === "환자태그");

    if (chartNumberIndex === -1 || ageIndex === -1 || addressIndex === -1 || routeIndex === -1) {
      console.error("❌ Required columns not found");
      console.error("Available headers:", headers);
      continue;
    }

    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      if (!row[chartNumberIndex] || !row[ageIndex]) continue;

      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) continue;

      const age = parseAge(row[ageIndex]);
      const address = row[addressIndex] ? String(row[addressIndex]).trim() : "N/D";
      const route = parseRoute(row[routeIndex]);

      data.push({ chartNumber, age, address, route });
    }
  }
  return data;
}
