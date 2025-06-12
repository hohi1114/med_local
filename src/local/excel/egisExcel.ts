import * as XLSX from "xlsx";
import { normalizeAge } from "../ExcelParser";
import { excelSerialToDate, calculateAge } from "../ExcelParser";

export interface DailyIncomeEgis {
  chartNumber: number; // 1st column
  visitDate: string | Date; // 3rd column (date)
  totalCost: number; // 8th column (총 진료비)
  visitType: string;
}

// 환자 목록
export interface PatientListEgis {
  chartNumber: number;
  address: string;
  age: number | null;
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
    const visitTypeIndex = headers.findIndex((col: any) => col === "초재구분");

    if (
      patientNumberIndex === -1 ||
      dateIndex === -1 ||
      totalCostIndex === -1 ||
      visitTypeIndex === -1
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
        !row[patientNumberIndex] ||
        !row[dateIndex] ||
        !row[totalCostIndex] ||
        !row[visitTypeIndex]
      ) {
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

      let visitType = String(row[visitTypeIndex]).replace(/\s/g, "");

      data.push({
        chartNumber,
        visitDate: String(visitDate), // 3rd column
        totalCost,
        visitType,
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

      const patientData: PatientListEgis = {
        chartNumber,
        address: address || "N/A",
        age: normalizedAge,
      };

      data.push(patientData);
    }
  }
  return data;
}
