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
  age: number;
  address: string;
}

export interface PatientDataDentWeb {
  chartNumber: number;
  age: number;
  address: string;
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
  age: number; //2nd column
}

// In src/services/fileProcessing.ts

// Helper function to normalize age into 10-year groups
function normalizeAge(age: number): number {
  if (age < 0) return 0;
  if (age >= 80) return 80;

  // For ages 0-79, round down to nearest 10
  return Math.floor(age / 10) * 10;
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

export async function parseDaysFilesEuisarang(
  fileBuffers: ArrayBuffer[]
): Promise<VisitData[]> {
  let data: VisitData[] = [];

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });

    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in the file");
      continue; // Skip this file
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // First sheet

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
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
}

// In src/services/fileProcessing.ts (add this function)

export async function parsePlaceFilesEuisarang(
  fileBuffers: ArrayBuffer[]
): Promise<PatientData[]> {
  let data: PatientData[] = [];

  // Helper function for age parsing
  const parseAgeEuisarang = (ageString: string | number): number => {
    // If it's already a number, just return it
    if (typeof ageString === "number") {
      return ageString;
    }

    if (!ageString) return 0;

    // Check for combined format (e.g., "5세 11개월")
    const combinedMatch = ageString.match(/(\d+)세\s+(\d+)개월/);
    if (combinedMatch && combinedMatch[1] && combinedMatch[2]) {
      const years = parseInt(combinedMatch[1], 10);
      const months = parseInt(combinedMatch[2], 10);
      return Math.floor(years + months / 12);
    }

    // Extract the main age number (before "세")
    const yearMatch = ageString.match(/(\d+)세/);
    if (yearMatch && yearMatch[1]) {
      return parseInt(yearMatch[1], 10);
    }

    // Check if it's just months (e.g., "15개월")
    const monthMatch = ageString.match(/(\d+)개월/);
    if (monthMatch && monthMatch[1]) {
      return Math.floor(parseInt(monthMatch[1], 10) / 12);
    }

    // Try to parse as direct number
    const parsed = parseInt(ageString, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }

    return 0; // Default value if parsing fails
  };

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });

    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in the file");
      continue; // Skip this file
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
      header: 1,
      range: 2,
    });

    jsonData.forEach((row: any) => {
      if (row.length >= 9) {
        const parsedAge = parseAgeEuisarang(row[4] || "");
        // Normalize age if it's a valid number
        let normalizedAge = normalizeAge(parsedAge);

        data.push({
          chartNumber: Number(row[1]),
          age: normalizedAge,
          address: row[8] || "N/D",
        });
      }
    });
  }
  return data.filter((item) => !isNaN(item.chartNumber));
}

export async function parseDailyIncomeEgis(
  fileBuffers: ArrayBuffer[]
): Promise<DailyIncomeEgis[]> {
  const data: DailyIncomeEgis[] = [];

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });
    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in file");
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

// Second function
export async function parsePatientListEgis(
  fileBuffers: ArrayBuffer[]
): Promise<PatientListEgis[]> {
  const data: PatientListEgis[] = [];
  const currentYear = new Date().getFullYear();

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });
    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in file");
      continue;
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      range: 1,
    });

    for (const row of rows) {
      if (row.length < 8) continue;

      // Calculate age from resident registration number
      let age = 0;
      const idNumber = row[2] ? String(row[2]).trim() : "";

      if (idNumber && idNumber.length >= 8) {
        // Extract birth year (first two digits)
        const yearPrefix = idNumber.substring(0, 2);
        // Extract gender/century code (first digit after hyphen or 7th character)
        const genderCode = idNumber.includes("-")
          ? idNumber.split("-")[1]?.charAt(0)
          : idNumber.charAt(6);

        if (yearPrefix && genderCode) {
          let birthYear: number;

          // Determine century based on gender code
          if (genderCode === "1" || genderCode === "2") {
            // Born in 1900s
            birthYear = 1900 + parseInt(yearPrefix);
          } else if (genderCode === "3" || genderCode === "4") {
            // Born in 2000s
            birthYear = 2000 + parseInt(yearPrefix);
          } else {
            // Default to 1900s if gender code is invalid
            birthYear = 1900 + parseInt(yearPrefix);
          }

          age = currentYear - birthYear;
        }
      }

      // Normalize age if it's a valid number
      let normalizedAge = !isNaN(age) ? normalizeAge(age) : 0;

      data.push({
        chartNumber: Number(row[0]), // 1st column
        address: row[7] ? String(row[7]) : "N/A", // 8th column
        age: normalizedAge,
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

// In src/services/fileProcessing.ts

export async function parseDaysFilesDentweb(
  fileBuffers: ArrayBuffer[]
): Promise<VisitData[]> {
  let data: VisitData[] = [];

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });

    if (workbook.SheetNames.length < 2) {
      console.error("❌ No second sheet found in the file");
      continue; // Skip this file
    }

    // Process all sheets starting from the second one (index 1)
    for (
      let sheetIndex = 1;
      sheetIndex < workbook.SheetNames.length;
      sheetIndex++
    ) {
      const sheetName = workbook.SheetNames[sheetIndex];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
        header: 1,
        range: 1,
      });

      for (const row of jsonData) {
        if (!row[10]) {
          continue;
        }
        let visitDate = row[1];

        // ✅ Convert Excel serial date to string format
        if (typeof visitDate === "number") {
          visitDate = excelSerialToDate(visitDate);
        }

        data.push({
          chartNumber: Number(row[2]),
          visitDate: visitDate,
          totalCost: Number(row[10]),
        });
      }
    }
  }

  return data.filter((item) => !isNaN(item.chartNumber));
}

export async function parsePlaceFilesDentWeb(
  fileBuffers: ArrayBuffer[]
): Promise<PatientDataDentWeb[]> {
  let data: PatientDataDentWeb[] = [];

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, {
      type: "array",
    });

    if (workbook.SheetNames.length < 2) {
      console.error("❌ No second sheet found in the file");
      continue; // Skip this file
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[1]];

    const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
      header: 1,
      range: 1,
      raw: false,
      dateNF: "YYYY-MM-DD",
    });

    for (const row of jsonData) {
      if (!row[3]) {
        continue;
      }
      let age = 0;
      const birthDateValue = row[3];

      if (birthDateValue) {
        // Since we're using raw:false, birthDateValue should be a string in YYYY-MM-DD format
        // We can just use it directly for age calculation
        age = calculateAge(birthDateValue);
      }

      // Normalize age if it's a valid number
      let normalizedAge = !isNaN(age) ? normalizeAge(age) : 0;

      data.push({
        chartNumber: Number(row[2]),
        age: normalizedAge,
        address: row[10] || "N/D",
      });
    }
  }
  return data.filter((item) => !isNaN(item.chartNumber));
}

function calculateAge(birthDateStr: string): number {
  const today = new Date();
  const birthDate = new Date(birthDateStr);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // If birth month is later in the year, or same month but birth day is later, subtract one year
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}
