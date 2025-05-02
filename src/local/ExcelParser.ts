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

    const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
      header: 1,
      range: 3,
    }); // Skip first 3 rows

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];

      if (!row[0] || !row[2] || !row[3]) {
        continue;
      }

      if (row.length >= 4) {
        // Type check for chartNumber
        const chartNumber = Number(row[0]);

        if (isNaN(chartNumber)) {
          console.warn(`⚠️ Invalid chart number in row ${i + 4}`); // +4 because we skipped 3 rows
          continue;
        }

        // Type check and process visitDate
        let visitDate = row[2];

        if (!visitDate) {
          console.warn(`⚠️ Missing visit date in row ${i + 4}`);
          continue;
        }
        // ✅ Convert Excel serial date to string format
        if (typeof visitDate === "number") {
          visitDate = excelSerialToDate(visitDate);
        }

        const totalCost = Number(row[3]);
        if (isNaN(totalCost)) {
          console.warn(`⚠️ Invalid total cost in row ${i + 4}`);
          continue;
        }

        data.push({
          chartNumber,
          visitDate,
          totalCost,
        });
      }
    }
  }
  return data;
}

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

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];

      if (!row[4] || !row[8] || !row[1]) {
        continue; // This works in a for loop
      }

      if (row.length >= 9) {
        // Type check for chartNumber
        const chartNumber = Number(row[1]);
        if (isNaN(chartNumber)) {
          console.warn(`⚠️ Invalid chart number in row ${i + 1}`);
          continue;
        }

        // Type check for age
        const ageString = row[4] || "";
        const parsedAge = parseAgeEuisarang(ageString);
        if (isNaN(parsedAge)) {
          console.warn(`⚠️ Invalid age in row ${i + 1}`);
          // Continue with default age 0 rather than skipping the row
        }

        // Normalize age if it's a valid number
        let normalizedAge = !isNaN(parsedAge) ? normalizeAge(parsedAge) : 0;

        // Type check for address (ensure it's a string)
        const address = row[8] ? String(row[8]) : "N/D";

        // All checks passed, add to data array
        data.push({
          chartNumber,
          age: normalizedAge,
          address,
        });
      }
    }
  }
  return data;
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

    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      range: 1,
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row[2] || !row[0] || !row[7]) {
        continue;
      }

      if (row.length >= 8) {
        // Type check for chartNumber
        const chartNumber = Number(row[0]);
        if (isNaN(chartNumber)) {
          console.warn(`⚠️ Invalid chart number in row ${i + 2}`); // +2 because we skipped 1 row
          continue;
        }

        const totalCost = Number(row[7]); // 8th column
        if (isNaN(totalCost)) {
          console.warn(`⚠️ Invalid total cost in row ${i + 2}`);
          continue;
        }

        let visitDate = row[2]; // 3rd column

        // Format the date - now handling string format "YYYY/MM/DD"
        if (
          typeof visitDate === "string" &&
          visitDate.match(/^\d{4}\/\d{2}\/\d{2}$/)
        ) {
          // Replace slashes with hyphens to standardize to YYYY-MM-DD
          visitDate = visitDate.replace(/\//g, "-");
        }
        // Still handle Excel serial dates in case they appear
        else if (typeof visitDate === "number") {
          visitDate = excelSerialToDate(visitDate);
        }

        data.push({
          chartNumber,
          visitDate: String(visitDate), // 3rd column
          totalCost,
        });
      }
    }
  }
  return data;
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

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row[2] || !row[0] || !row[7]) {
        continue;
      }

      if (row.length < 8) {
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

        const chartNumber = Number(row[0]);
        if (isNaN(chartNumber)) {
          console.warn(`⚠️ Invalid chart number in row ${i + 2}`); // +2 because we skipped 1 row
          continue;
        }

        data.push({
          chartNumber,
          address: row[7] ? String(row[7]) : "N/A", // 8th column
          age: normalizedAge,
        });
      }
    }
  }

  return data;
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

      // Get all data including headers
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
        header: 1,
        range: 0, // Start from the first row to get headers
      });

      if (jsonData.length < 2) {
        console.error(`❌ Sheet ${sheetName} has insufficient data`);
        continue;
      }

      // Get header row
      const headers = jsonData[0];

      // Find the index for each required column
      const chartNumberIndex = headers.findIndex(
        (col: any) => col === "차트번호"
      );
      const visitDateIndex = headers.findIndex((col: any) => col === "진료일");

      // For totalCost, check both possible column names
      const totalCostIndex1 = headers.findIndex(
        (col: any) => col === "총진료비"
      );
      const totalCostIndex2 = headers.findIndex(
        (col: any) => col === "진료금액"
      );

      // Determine which totalCost column to use (prioritize "총진료비" if both exist)
      const totalCostIndex =
        totalCostIndex1 !== -1 ? totalCostIndex1 : totalCostIndex2;

      // Check if all required columns were found
      if (
        chartNumberIndex === -1 ||
        visitDateIndex === -1 ||
        totalCostIndex === -1
      ) {
        console.error(`❌ Required columns not found in sheet ${sheetName}`);
        continue; // Skip this sheet
      }

      // Process data rows (skip the header row)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];

        if (
          !row[chartNumberIndex] ||
          !row[visitDateIndex] ||
          !row[totalCostIndex]
        ) {
          continue;
        }

        // Process chartNumber - ensure it's a number
        const chartNumber = Number(row[chartNumberIndex]);
        if (isNaN(chartNumber)) {
          console.warn(
            `⚠️ Invalid chart number in row ${i + 1}, sheet ${sheetName}`
          );
          continue;
        }

        let visitDate = row[visitDateIndex];

        // ✅ Convert Excel serial date to string format
        if (typeof visitDate === "number") {
          visitDate = excelSerialToDate(visitDate);
        }

        const totalCost = Number(row[totalCostIndex]);
        if (isNaN(totalCost)) {
          console.warn(
            `⚠️ Invalid total cost in row ${i + 1}, sheet ${sheetName}`
          );
          continue;
        }

        data.push({
          chartNumber,
          visitDate,
          totalCost,
        });
      }
    }
  }

  return data;
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
      range: 0,
      raw: false,
      dateNF: "YYYY-MM-DD",
    });

    if (jsonData.length < 2) {
      console.error(`❌ Sheet ${workbook.SheetNames[1]} has insufficient data`);
      continue;
    }

    // Get header row
    const headers = jsonData[0] || [];

    // Find the index for each required column
    const chartNumberIndex = headers.findIndex(
      (col: any) => col === "차트번호"
    );
    const birthDateIndex = headers.findIndex((col: any) => col === "생년월일");
    const addressIndex = headers.findIndex((col: any) => col === "주소");

    if (
      chartNumberIndex === -1 ||
      birthDateIndex === -1 ||
      addressIndex === -1
    ) {
      console.error(
        `❌ Required columns not found in sheet ${workbook.SheetNames[1]}`
      );
      continue; // Skip this sheet
    }

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];

      // Skip rows where chart number is missing
      if (!row[chartNumberIndex] || !row[birthDateIndex]) {
        continue;
      }

      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) {
        console.warn(
          `⚠️ Invalid chart number in row ${i + 1}, sheet ${
            workbook.SheetNames[1]
          }`
        );
        continue;
      }

      let age = 0;
      const birthDateValue = row[3];

      if (birthDateValue) {
        age = calculateAge(birthDateValue);
      }

      // Normalize age if it's a valid number
      let normalizedAge = !isNaN(age) ? normalizeAge(age) : 0;

      const address = row[addressIndex] || "N/D";

      data.push({
        chartNumber,
        age: normalizedAge,
        address: typeof address === "string" ? address : String(address),
      });
    }
  }
  return data;
}

export async function parseDaysFilesOrm(
  fileBuffers: ArrayBuffer[]
): Promise<VisitData[]> {
  let data: VisitData[] = [];

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });

    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in the file");
      continue; // Skip this file
    }

    // Start from the second sheet and go to the last sheet
    for (let i = 1; i < workbook.SheetNames.length; i++) {
      const sheetName = workbook.SheetNames[i];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
        header: 1,
        range: 1, // Skip only the first row (header)
      });
      // Use for loop instead of forEach
      for (let j = 0; j < jsonData.length; j++) {
        const row = jsonData[j];

        if (!row[0] || !row[0] || !row[11]) {
          continue;
        }

        if (row.length >= 12) {
          // Make sure we have enough columns
          let visitDate = row[0];
          let chartNumber = Number(row[1]);
          let totalCost = Number(row[11]);

          if (isNaN(chartNumber)) {
            console.warn(
              `⚠️ Invalid chart number in sheet ${sheetName}, row ${j + 2}`
            );
            continue;
          }

          if (isNaN(totalCost)) {
            console.warn(
              `⚠️ Invalid total cost in sheet ${sheetName}, row ${j + 2}`
            );
            continue;
          }

          // Convert Excel serial date to string format if needed
          if (typeof visitDate === "number") {
            visitDate = excelSerialToDate(visitDate);
          }

          data.push({
            chartNumber,
            visitDate,
            totalCost,
          });
        }
      }
    }
  }

  return data;
}

export async function parsePlaceFilesOrm(
  fileBuffers: ArrayBuffer[]
): Promise<PatientData[]> {
  let data: PatientData[] = [];

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });

    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in the file");
      continue; // Skip this file
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
      header: 1,
      range: 4,
    });

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];

      if (!row[1] || !row[3] || !row[4]) {
        continue;
      }

      if (row.length >= 3) {
        // Normalize age if it's a valid number
        let normalizedAge = normalizeAge(row[3]);

        const chartNumber = Number(row[1]);
        if (isNaN(chartNumber)) {
          console.warn(`⚠️ Invalid chart number in row ${i + 5}`); // +5 because we skipped 4 rows
          continue;
        }

        const address = row[4] ? String(row[4]) : "N/D";

        data.push({
          chartNumber,
          age: normalizedAge,
          address,
        });
      }
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
