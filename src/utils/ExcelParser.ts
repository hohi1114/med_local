import * as XLSX from "xlsx";

// Interfaces for your data structures
export interface VisitData {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
}

export interface BackendResponse {
  message: string;
  processedRecords: number;
  geocodedRecords: number;
}

export interface PatientData {
  chartNumber: number;
  age: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

// 일자별 수입 현황
export interface DailyIncomeEgis {
  chartNumber: number; // 1st column
  visitDate: string; // 3rd column (date)
  totalCost: number; // 8th column (총 진료비)
}

// 환자 목록
export interface PatientListEgis {
  chartNumber: number; // 1st column
  address: string; // 8th column
}

// 환자별 수입 현황
export interface PatientIncomeEgis {
  chartNumber: number; // 1st column
  age: number; // 4th column (나이)
}

/**
 * Converts an Excel serial date (e.g. 45329) to a "YYYY-MM-DD" string.
 * 엑셀 date 저장 오류 해결
 */

function excelSerialToDate(serial: number): string {
  // Input validation
  if (serial < 0) {
    throw new Error("Invalid Excel serial date: cannot be negative");
  }

  if (serial < 1) {
    throw new Error(
      "Invalid Excel serial date: cannot represent dates before 1900-01-01"
    );
  }

  // Adjust for Excel's leap year bug
  // Serial number 60 in Excel represents the non-existent Feb 29, 1900
  let adjustedSerial = serial;
  if (serial >= 60) {
    adjustedSerial = serial - 1;
  }

  // Calculate the date
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  // Excel dates start from December 30, 1899 (day 0 in Excel)
  const baseDate = new Date(Date.UTC(1899, 11, 30));
  const targetDate = new Date(
    baseDate.getTime() + adjustedSerial * millisecondsPerDay
  );

  // Format the date as YYYY-MM-DD using UTC to avoid timezone issues
  const year = targetDate.getUTCFullYear();
  const month = String(targetDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export const parseDaysFilesEuisarang = async (
  files: FileList
): Promise<VisitData[]> => {
  let data: VisitData[] = [];

  for (const file of Array.from(files)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in the file:", file.name);
      continue; // Skip this file
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // First sheet

    const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
      header: 1,
      range: 3,
    }); // Skip first 3 rows

    jsonData.forEach((row: any) => {
      if (row.length >= 4) {
        let visitDate = row[2];

        // ✅ Convert Excel serial date to string format
        if (typeof visitDate === "number") {
          visitDate = excelSerialToDate(visitDate);
        }

        data.push({
          chartNumber: Number(row[0]),
          visitDate: visitDate,
          totalCost: Number(row[3]),
        });
      }
    });
  }

  return data.filter(
    (item) => !isNaN(item.chartNumber) && item.visitDate !== "내원/수납일"
  );
};

export const parsePlaceFilesEuisarang = async (
  files: FileList
): Promise<PatientData[]> => {
  let data: PatientData[] = [];

  for (const file of Array.from(files)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in the file:", file.name);
      continue; // Skip this file
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
      header: 1,
      range: 2,
    });

    jsonData.forEach((row: any) => {
      if (row.length >= 9) {
        data.push({
          chartNumber: Number(row[1]),
          age: row[4] || "N/D",
          address: row[8] || "N/D",
          latitude: null,
          longitude: null,
        });
      }
    });
  }
  return data.filter((item) => !isNaN(item.chartNumber));
};

export async function parseDailyIncomeEgis(
  files: FileList
): Promise<DailyIncomeEgis[]> {
  const data: DailyIncomeEgis[] = [];

  for (const file of Array.from(files)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in file:", file.name);
      continue;
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // header: 1 => each row is an array
    // range: 1 => start reading from the 2nd row (skip the 1st/header row)
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      range: 1,
    });

    for (const row of rows) {
      // We need at least 8 columns: chartNumber(1st), visitDate(3rd), totalCost(8th)
      if (row.length < 8) continue;

      let visitDate = row[2]; // 3rd column
      // Convert if it's an Excel serial date (number)
      if (typeof visitDate === "number") {
        visitDate = excelSerialToDate(visitDate);
      }

      data.push({
        chartNumber: Number(row[0]), // 1st column
        visitDate: String(visitDate), // 3rd column
        totalCost: Number(row[7]), // 8th column
      });
    }
  }

  // Filter invalid entries (e.g., non-numeric chartNumber)
  return data.filter(
    (item) => !isNaN(item.chartNumber) && !isNaN(item.totalCost)
  );
}

export async function parsePatientListEgis(
  files: FileList
): Promise<PatientListEgis[]> {
  const data: PatientListEgis[] = [];

  for (const file of Array.from(files)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in file:", file.name);
      continue;
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      range: 1,
    });

    for (const row of rows) {
      if (row.length < 8) continue;

      data.push({
        chartNumber: Number(row[0]), // 1st column
        address: row[7] ? String(row[7]) : "N/A", // 8th column
      });
    }
  }

  return data.filter(
    (item) =>
      !isNaN(item.chartNumber) && // chartNumber must be a valid number
      typeof item.address === "string" && // ensure it's a string
      item.address.trim().length > 0 // ensure it's not just whitespace
  );
}

export async function parsePatientIncomeEgis(
  files: FileList
): Promise<PatientIncomeEgis[]> {
  const data: PatientIncomeEgis[] = [];

  for (const file of Array.from(files)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in file:", file.name);
      continue;
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      range: 1,
    });

    for (const row of rows) {
      if (row.length < 4) continue;

      data.push({
        chartNumber: Number(row[0]), // 1st column
        age: Number(row[3]), // 4th column
      });
    }
  }

  return data.filter((item) => !isNaN(item.chartNumber) && !isNaN(item.age));
}
