import * as XLSX from "xlsx";

// Interfaces for your data structures
export interface VisitData {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
}

export interface BackendResponse {
  message: string;
  processedRecords: number;
  geocodedRecords: number;
}

export interface PatientData {
  chartNumber: number;
  age: number | null;
  address: string;
}

export interface PatientDataDentWeb {
  chartNumber: number;
  age: number | null;
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
  age: number | null; //2nd column
}

// In src/services/fileProcessing.ts

// Helper function to normalize age into 10-year groups
export function normalizeAge(age: number): number {
  if (age < 0) return 0;
  if (age >= 80) return 80;

  // For ages 0-79, round down to nearest 10
  return Math.floor(age / 10) * 10;
}

/**
 * Converts an Excel serial date (e.g. 45329) to a "YYYY-MM-DD" string.
 * 엑셀 date 저장 오류 해결
 */

export function 
excelSerialToDate(serial: number): string {
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

    // Get all data including headers
    const allData = XLSX.utils.sheet_to_json<any>(worksheet, {
      header: 1,
      range: 0, // Start from the first row to get all data
    });

    if (allData.length < 4) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    // Get header row (4th row, index 3)
    const headers = allData[3];

    // Find the index for each required column
    const chartNumberIndex = headers.findIndex(
      (col: any) => col === "차트번호"
    );
    const visitDateIndex = headers.findIndex(
      (col: any) => col === "내원/수납일"
    );
    const totalCostIndex = headers.findIndex((col: any) => col === "총진료비");

    // Check if all required columns were found
    if (
      chartNumberIndex === -1 ||
      visitDateIndex === -1 ||
      totalCostIndex === -1
    ) {
      console.error("❌ Required columns not found in the file");
      continue; // Skip this file
    }

    // Process data rows (starting from row 5, index 4)
    for (let i = 4; i < allData.length; i++) {
      const row = allData[i];

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
        continue;
      }

      // Process visitDate
      let visitDate = row[visitDateIndex];
      if (!visitDate) {
        console.warn(`⚠️ Missing visit date in row ${i + 1}`);
        continue;
      }

      // ✅ Convert Excel serial date to string format
      if (typeof visitDate === "number") {
        // visitDate = excelSerialToDate(visitDate);
        const excelDate = XLSX.SSF.parse_date_code(visitDate);
        visitDate = `${excelDate.y}-${String(excelDate.m).padStart(
          2,
          "0"
        )}-${String(excelDate.d).padStart(2, "0")}`;
      }

      // Process totalCost
      const totalCost = Number(row[totalCostIndex]);
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

export async function parsePlaceFilesEuisarang(
  fileBuffers: ArrayBuffer[]
): Promise<PatientData[]> {
  let data: PatientData[] = [];

  // Helper function for age parsing
  const parseAgeEuisarang = (ageString: string | number): number | null => {
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

    return null; // Default value if parsing fails
  };

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });

    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in the file");
      continue; // Skip this file
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Get all data including headers
    const allData = XLSX.utils.sheet_to_json<any>(worksheet, {
      header: 1,
      range: 0, // Start from the first row to get headers
    });

    if (allData.length < 3) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    // Get header row (3rd row, index 2)
    const headers = allData[1];

    // Find the index for each required column
    const chartNumberIndex = headers.findIndex(
      (col: any) => col === "차트번호"
    );
    const ageIndex = headers.findIndex((col: any) => col === "나이");
    const addressIndex = headers.findIndex((col: any) => col === "주소");

    // Check if all required columns were found
    if (chartNumberIndex === -1 || ageIndex === -1 || addressIndex === -1) {
      console.error("❌ Required columns not found in the file");
      continue; // Skip this file
    }

    // Process data rows (starting from row 4, index 3)
    for (let i = 2; i < allData.length; i++) {
      const row = allData[i];

      if (!row[chartNumberIndex] || !row[ageIndex] || !row[addressIndex]) {
        continue; // This works in a for loop
      }

      // Type check for chartNumber
      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) {
        continue;
      }

      // Type check for age
      const ageString = row[ageIndex] || "";
      const parsedAge = parseAgeEuisarang(ageString);

      // Normalize age if it's a valid number
      let normalizedAge = parsedAge ? normalizeAge(parsedAge) : null;

      // Type check for address (ensure it's a string)
      const address = row[addressIndex] ? String(row[addressIndex]) : "N/D";

      // All checks passed, add to data array
      data.push({
        chartNumber,
        age: normalizedAge,
        address,
      });
    }
  }
  return data;
}

/*
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

    // Get all data including headers
    const allData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      range: 0, // Start from the first row to get all data
    });

    if (allData.length < 2) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    const headers = allData[0];

    // Find the index for each required column
    const patientNumberIndex = headers.findIndex(
      (col: any) => col === "환자번호"
    );
    const dateIndex = headers.findIndex((col: any) => col === "날짜");
    const totalCostIndex = headers.findIndex((col: any) => col === "총진료비");

    if (
      patientNumberIndex === -1 ||
      dateIndex === -1 ||
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
      if (!row[patientNumberIndex] || !row[dateIndex] || !row[totalCostIndex]) {
        continue;
      }

      // Process patient number (chart number)
      const chartNumber = Number(row[patientNumberIndex]);
      if (isNaN(chartNumber)) {
        console.log(`Skipping row ${i}: invalid patient number`);
        continue;
      }

      // Process total cost
      let totalCostValue = row[totalCostIndex];
      if (typeof totalCostValue === "string") {
        // Remove commas from the string before converting to number
        totalCostValue = totalCostValue.replace(/,/g, "");
      }

      const totalCost = Number(totalCostValue);
      if (isNaN(totalCost)) {
        console.log(`Skipping row ${i}: invalid total cost`);
        continue;
      }

      // Process visit date
      let visitDate = row[dateIndex];
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
  return data;
}

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

    // Get all data including headers
    const allData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      range: 0, // Start from the first row to get all data
    });

    if (allData.length < 2) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    // Get header row (first row, index 0)
    const headers = allData[0];

    // Find the index for each required column
    const patientNumberIndex = headers.findIndex(
      (col: any) => col === "환자번호"
    );

    const residentNumberIndex = headers.findIndex(
      (col: any) => col === "주민번호"
    );

    const addressIndex = headers.findIndex((col: any) => col === "주소");

    if (
      patientNumberIndex === -1 ||
      residentNumberIndex === -1 ||
      addressIndex === -1
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
      if (!row[patientNumberIndex] || !row[residentNumberIndex]) {
        continue;
      }

      // Process patient number (chart number)
      const chartNumber = Number(row[patientNumberIndex]);
      if (isNaN(chartNumber)) {
        console.log(`Skipping row ${i}: invalid patient number`);
        continue;
      }

      // Process resident registration number for age calculation
      const idNumber = String(row[residentNumberIndex]).trim();
      let age = 0;

      if (idNumber && idNumber.length >= 8) {
        const yearPrefix = idNumber.substring(0, 2);
        const genderCode = idNumber.includes("-")
          ? idNumber.split("-")[1]?.charAt(0)
          : idNumber.charAt(6);

        if (yearPrefix && genderCode) {
          let birthYear: number;

          if (genderCode === "1" || genderCode === "2") {
            birthYear = 1900 + parseInt(yearPrefix);
          } else if (genderCode === "3" || genderCode === "4") {
            birthYear = 2000 + parseInt(yearPrefix);
          } else {
            birthYear = 1900 + parseInt(yearPrefix);
          }

          age = currentYear - birthYear;
        }
      }

      const normalizedAge = !isNaN(age) ? normalizeAge(age) : null;

      // Get address
      const address = String(row[addressIndex]).trim();

      data.push({
        chartNumber,
        address: address || "N/A",
        age: normalizedAge,
      });
    }
  }
  return data;
}
*/

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
          continue;
        }

        let visitDate = row[visitDateIndex];

        // ✅ Convert Excel serial date to string format
        if (typeof visitDate === "number") {
          visitDate = excelSerialToDate(visitDate);
        }

        const totalCost = Number(row[totalCostIndex]);
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
            continue;
          }

          if (isNaN(totalCost)) {
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

/*
export async function parseDailyIncomeHanChart(
  fileBuffers: ArrayBuffer[]
): Promise<DailyIncomeHanChart[]> {
  const data: DailyIncomeHanChart[] = [];

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
      range: 0, // Start from the first row to get all data
    });

    if (allData.length < 2) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    const headers = allData[0];

    // Find the index for each required column
    const chartNumberIndex = headers.findIndex(
      (col: any) => col === "차트번호"
    );
    const paymentDateIndex = headers.findIndex((col: any) => col === "진료일");
    const nonInsuranceCostIndex = headers.findIndex(
      (col: any) => col === "총진료비"
    );

    const genderAgeIndex = headers.findIndex((col: any) => col === "성별/나이");

    if (
      chartNumberIndex === -1 ||
      paymentDateIndex === -1 ||
      nonInsuranceCostIndex === -1 ||
      genderAgeIndex === -1
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
        !row[chartNumberIndex] ||
        !row[paymentDateIndex] ||
        !row[nonInsuranceCostIndex]
      ) {
      
        continue;
      }

      // Process chart number
      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) {
        console.log(`Skipping row ${i}: invalid chart number`);
        continue;
      }

      // Process non-insurance cost
      const totalCost = Number(row[nonInsuranceCostIndex]);
      if (isNaN(totalCost)) {
        console.log(`Skipping row ${i}: invalid non-insurance cost`);
        continue;
      }

      // Process payment date
      let visitDate = row[paymentDateIndex];

      if (typeof visitDate === "number") {
        // Use XLSX's built-in date conversion
        const excelDate = XLSX.SSF.parse_date_code(visitDate);
        visitDate = `${excelDate.y}-${String(excelDate.m).padStart(
          2,
          "0"
        )}-${String(excelDate.d).padStart(2, "0")}`;
      }

      // Handle date format like "2025-05-03(토)"
      if (typeof visitDate === "string") {
        // Remove the day of week in parentheses, e.g., "(토)"
        visitDate = visitDate.replace(/\([^)]*\)$/, "").trim();
      }

      let age = 0;
      const genderAgeStr = String(row[genderAgeIndex]).trim();

      // Parse format like "여/33" or "남/45"
      if (genderAgeStr && genderAgeStr.includes("/")) {
        const parts = genderAgeStr.split("/");
        if (parts.length === 2) {
          const ageStr = parts[1].trim();
          const parsedAge = Number(ageStr);
          if (!isNaN(parsedAge)) {
            age = parsedAge;
          }
        }
      }

      const normalizedAge = !isNaN(age) ? normalizeAge(age) : 0;

      data.push({
        chartNumber,
        age: normalizedAge,
        visitDate: String(visitDate),
        totalCost,
      });
    }
  }
  return data;
}

export async function parsePatientListHanChart(
  fileBuffers: ArrayBuffer[]
): Promise<PatientListHanChart[]> {
  const data: PatientListHanChart[] = [];

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
      range: 0, // Start from the first row to get all data
    });

    if (allData.length < 2) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    // Get header row (first row, index 0)
    const headers = allData[0];

    // Find the index for each required column
    const chartNumberIndex = headers.findIndex(
      (col: any) => col === "차트번호"
    );

    const addressIndex = headers.findIndex((col: any) => col === "주소");

    if (chartNumberIndex === -1 || addressIndex === -1) {
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

      // Check if required fields exist (주소는 필수가 아님)
      if (!row[chartNumberIndex]) {
        continue;
      }

      // Process chart number
      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) {
        console.log(` ${i}: invalid chart number`);
        continue;
      }

      const address = row[addressIndex]
        ? String(row[addressIndex]).trim()
        : "N/A";

      data.push({
        chartNumber,
        address: address || "N/A",
      });
    }
  }
  return data;
}
*/

export function calculateAge(birthDateStr: string): number {
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
