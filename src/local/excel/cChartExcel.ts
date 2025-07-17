import * as XLSX from "xlsx";
import { normalizeAge } from "../ExcelParser";

export interface DailyIncomeCchart {
  chartNumber: number;
  visitDate: string;
  totalCost: number; // 현금수납액 + 카드수납액 + 통장수납액
}

export interface PatientListCchart {
  chartNumber: number;
  age: number | null;
  address: string;
}

export async function parseDailyIncomecChart(
  fileBuffers: ArrayBuffer[]
): Promise<DailyIncomeCchart[]> {
  const data: DailyIncomeCchart[] = [];

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
    const visitDateIndex = headers.findIndex((col: any) => col === "진료일자");
    const cashAmountIndex = headers.findIndex(
      (col: any) => col === "현금수납액"
    );
    const cardAmountIndex = headers.findIndex(
      (col: any) => col === "카드수납액"
    );
    const bankAmountIndex = headers.findIndex(
      (col: any) => col === "통장수납액"
    );

    if (
      patientNumberIndex === -1 ||
      visitDateIndex === -1 ||
      cashAmountIndex === -1 ||
      cardAmountIndex === -1 ||
      bankAmountIndex === -1
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
      if (!row[patientNumberIndex] || !row[visitDateIndex]) {
        continue;
      }

      // Process patient number (chart number) - remove leading zeros
      const patientNumberStr = String(row[patientNumberIndex]).trim();
      const chartNumber = Number(patientNumberStr.replace(/^0+/, "") || "0");

      if (isNaN(chartNumber)) {
        console.log(`Skipping row ${i}: invalid patient number`);
        continue;
      }

      // Process visit date
      let visitDate = row[visitDateIndex];

      // Handle YYYYMMDD format
      if (typeof visitDate === "string" && visitDate.match(/^\d{8}$/)) {
        const year = visitDate.substr(0, 4);
        const month = visitDate.substr(4, 2);
        const day = visitDate.substr(6, 2);
        visitDate = `${year}-${month}-${day}`;
      }

      // Process payment amounts
      const cashAmount = parseAmount(row[cashAmountIndex]) || 0;
      const cardAmount = parseAmount(row[cardAmountIndex]) || 0;
      const bankAmount = parseAmount(row[bankAmountIndex]) || 0;

      // Calculate total cost (sum of all payment methods)
      const totalCost = cashAmount + cardAmount + bankAmount;

      // Skip rows with zero total cost
      if (totalCost === 0) {
        continue;
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

export async function parsePatientListcChart(
  fileBuffers: ArrayBuffer[]
): Promise<PatientListCchart[]> {
  const data: PatientListCchart[] = [];
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

    const headers = allData[0];

    // Find the index for each required column
    const patientNumberIndex = headers.findIndex(
      (col: any) => col === "환자번호"
    );
    const birthYearIndex = headers.findIndex((col: any) => col === "생년");
    const addressIndex = headers.findIndex((col: any) => col === "주소");

    if (
      patientNumberIndex === -1 ||
      birthYearIndex === -1 ||
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
      if (!row[patientNumberIndex]) {
        continue;
      }

      // Process patient number (chart number) - remove leading zeros
      const patientNumberStr = String(row[patientNumberIndex]).trim();
      const chartNumber = Number(patientNumberStr.replace(/^0+/, "") || "0");

      if (isNaN(chartNumber)) {
        console.log(`Skipping row ${i}: invalid patient number`);
        continue;
      }

      // Process birth year and calculate age
      let age: number | null = null;
      const birthYearValue = row[birthYearIndex];

      if (birthYearValue) {
        const birthYearStr = String(birthYearValue).trim();

        // Handle different birth year formats
        let birthYear: number;

        if (birthYearStr.length === 4) {
          // Full year format: 1990, 2000, etc.
          birthYear = Number(birthYearStr);
        } else if (birthYearStr.length === 2) {
          // Two-digit year format: 90, 00, etc.
          const twoDigitYear = Number(birthYearStr);
          // Updated logic for 2-digit years
          // 00-30 -> 2000-2030, 31-99 -> 1931-1999
          if (twoDigitYear >= 0 && twoDigitYear <= 30) {
            birthYear = 2000 + twoDigitYear;
          } else {
            birthYear = 1900 + twoDigitYear;
          }
        } else {
          birthYear = Number(birthYearStr);
        }

        if (!isNaN(birthYear) && birthYear > 1900 && birthYear <= currentYear) {
          age = currentYear - birthYear;
        }
      }

      const normalizedAge = age !== null ? normalizeAge(age) : null;

      // Process address
      const address = row[addressIndex]
        ? String(row[addressIndex]).trim()
        : "N/A";

      data.push({
        chartNumber,
        age: normalizedAge,
        address: address || "N/A",
      });
    }
  }
  return data;
}

// Helper function to parse amount values
function parseAmount(value: any): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  let amountStr = String(value).trim();

  // Remove commas and any currency symbols
  amountStr = amountStr.replace(/,/g, "").replace(/[^\d.-]/g, "");

  const amount = Number(amountStr);
  return isNaN(amount) ? 0 : amount;
}
