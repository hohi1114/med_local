import * as XLSX from "xlsx";
import { normalizeAge } from "../ExcelParser";
import { excelSerialToDate, calculateAge } from "../ExcelParser";

export interface DailyIncomeNeo {
  chartNumber: number; // 챠트번호
  visitDate: string | Date; // 진료일자
  totalCost: number; // 총진료비
}

// 환자 목록
export interface PatientListNeo {
  chartNumber: number; // 차트번호
  visitDate: string | Date; // 진료일자
  birthDate: string | Date; // 생년월일
  address: string; // 주소
  visitType: string; // 초/재진
  age: number | null;
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

    const headers = allData[2];

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


export async function parsePatientListNeo(
  fileBuffers: ArrayBuffer[]
): Promise<PatientListNeo[]> {
  const data: PatientListNeo[] = [];
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
      range: 0,
    });

    if (allData.length < 2) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    const headers = allData[2];

    // Find the index for each required column
    const visitDateIndex = headers.findIndex((col: any) => col === "진료일자");
    const chartNumberIndex = headers.findIndex((col: any) => col === "챠트번호");
    const birthDateIndex = headers.findIndex((col: any) => col === "생년월일");
    const addressIndex = headers.findIndex((col: any) => col === "주소");
    const visitTypeIndex = headers.findIndex((col: any) => col === "초/재진");

    if (
      visitDateIndex === -1 ||
      chartNumberIndex === -1 ||
      birthDateIndex === -1 ||
      addressIndex === -1 ||
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
      if (!row[chartNumberIndex] || !row[birthDateIndex]) {
        continue;
      }

      // Process chart number
      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) {
        console.log(`Skipping row ${i}: invalid chart number`);
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

      // Process birth date
      let birthDate = row[birthDateIndex];
      if (
        typeof birthDate === "string" &&
        birthDate.match(/^\d{4}\/\d{2}\/\d{2}$/)
      ) {
        birthDate = birthDate.replace(/\//g, "-");
      } else if (typeof birthDate === "number") {
        birthDate = excelSerialToDate(birthDate);
      }

      // Calculate age from birth date
      let age: number | null = null;
      if (birthDate) {
        const birthYear = new Date(birthDate).getFullYear();
        if (!isNaN(birthYear)) {
          age = currentYear - birthYear;
          age = normalizeAge(age);
        }
      }

      // Get address
      const address = row[addressIndex] ? String(row[addressIndex]).trim() : "N/A";

      // Get visit type and normalize it
      let visitType = row[visitTypeIndex] ? String(row[visitTypeIndex]).replace(/\s/g, "") : "";
      
      // Normalize visit type: 초진 -> 신환, 재진 -> 재진, others -> 재진
      if (visitType === "초진") {
        visitType = "신환";
      } else if (visitType === "재진") {
        visitType = "재진";
      } else {
        visitType = "재진";
      }

      const patientData: PatientListNeo = {
        chartNumber,
        visitDate: String(visitDate),
        birthDate: String(birthDate),
        address,
        visitType,
        age,
      };

      data.push(patientData);
    }
  }
  return data;
}