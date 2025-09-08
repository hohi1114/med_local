import * as XLSX from "xlsx";
import { excelSerialToDate } from "../ExcelParser";
import { normalizeAge } from "../ExcelParser";

export interface DailyIncomeBit {
  chartNumber: number; // 차트번호
  visitDate: string | Date; // 영수일자
  totalCost: number; // 총진료비
}

export interface PatientListBit {
  chartNumber: number; // 차트번호
  age: number | null; // 나이
  visitType: string; // 초재진구분
  doctor: string; // 담당의
  address: string; // 주소
}

export async function parseDailyIncomeBit(
  fileBuffers: ArrayBuffer[]
): Promise<DailyIncomeBit[]> {
  const data: DailyIncomeBit[] = [];

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

    if (allData.length < 3) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    // Skip first 2 rows (headers) and get column headers from row 2 (index 1)
    const headers = allData[0];

    // Find the index for each required column
    const chartNumberIndex = headers.findIndex(
      (col: any) => col === "챠트번호"
    );
    const totalCostIndex = headers.findIndex((col: any) => col === "총진료비");
    const visitDateIndex = headers.findIndex((col: any) => col === "수납일자");

    if (
      chartNumberIndex === -1 ||
      totalCostIndex === -1 ||
      visitDateIndex === -1
    ) {
      console.error("❌ Required columns not found in the file");
      console.error("Available headers:", headers);
      console.error("Looking for: 차트번호, 총진료비, 수납일자");
      continue;
    }


    // Process data rows starting from row 2 (index 1)
    for (let i = 1; i < allData.length; i += 1) {
      const row = allData[i];

      // Skip empty rows
      if (!row || row.length === 0) {
        continue;
      }

      // Check if required fields exist
      if (
        !row[chartNumberIndex] ||
        row[totalCostIndex] === undefined ||
        !row[visitDateIndex]
      ) {
        console.log(`Skipping row ${i}: missing required data`);
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
        // Remove commas from the string before converting to number
        totalCostValue = totalCostValue.replace(/,/g, "");
      }

      const totalCost = Number(totalCostValue);
      if (isNaN(totalCost)) {
        console.log(`Skipping row ${i}: invalid total cost`);
        continue;
      }

      // Process visit date
      let visitDate = row[visitDateIndex];

      // Handle different date formats
      if (typeof visitDate === "string") {
        // Handle formats like "2025년 06월 19일" or "2025/06/19" or "2025-06-19"
        if (
          visitDate.includes("년") &&
          visitDate.includes("월") &&
          visitDate.includes("일")
        ) {
          // Korean format: "2025년 06월 19일"
          const match = visitDate.match(
            /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/
          );
          if (match) {
            const [, year, month, day] = match;
            visitDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
              2,
              "0"
            )}`;
          }
        } else if (visitDate.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
          // Format YYYY/MM/DD → YYYY-MM-DD
          visitDate = visitDate.replace(/\//g, "-");
        }
        // YYYY-MM-DD format is already correct
      } else if (typeof visitDate === "number") {
        // Excel serial date
        visitDate = excelSerialToDate(visitDate);
      }

      const dailyIncomeData: DailyIncomeBit = {
        chartNumber,
        visitDate: String(visitDate),
        totalCost,
      };

      data.push(dailyIncomeData);
    }

    console.log(`✅ Processed ${data.length} records from DailyIncomeBit file`);
  }

  return data;
}

export async function parsePatientListBit(
  fileBuffers: ArrayBuffer[]
): Promise<PatientListBit[]> {
  const data: PatientListBit[] = [];

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
    const ageIndex = headers.findIndex((col: any) => col === "나이");
    const visitTypeIndex = headers.findIndex(
      (col: any) => col === "초재진구분"
    );
    const doctorIndex = headers.findIndex((col: any) => col === "담당의");
    const addressIndex = headers.findIndex((col: any) => col === "주소");

    if (
      chartNumberIndex === -1 ||
      ageIndex === -1 ||
      visitTypeIndex === -1 ||
      doctorIndex === -1 ||
      addressIndex === -1
    ) {
      console.error("❌ Required columns not found in the file");
      console.error("Available headers:", headers);
      console.error("Looking for: 차트번호, 나이, 초재진구분, 담당의, 주소");
      continue;
    }

    console.log(
      `✅ Found columns - 차트번호: ${chartNumberIndex}, 나이: ${ageIndex}, 초재진구분: ${visitTypeIndex}, 담당의: ${doctorIndex}, 주소: ${addressIndex}`
    );

    // Process data rows (starting from row 2, index 1)
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];

      // Skip empty rows
      if (!row || row.length === 0) {
        continue;
      }

      // Check if required fields exist (차트번호 is mandatory)
      if (!row[chartNumberIndex] || !row[ageIndex] || !row[visitTypeIndex]) {
        continue;
      }

      // Process chart number
      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) {
        console.log(`Skipping row ${i}: invalid chart number`);
        continue;
      }

      // Process age
      let age: number | null = null;
      if (
        row[ageIndex] !== undefined &&
        row[ageIndex] !== null &&
        row[ageIndex] !== ""
      ) {
        const ageString = String(row[ageIndex]).trim();
        const koreanAgeMatch = ageString.match(/(\d+)세(?:(\d+)개월)?/);

        if (koreanAgeMatch) {
          const years = parseInt(koreanAgeMatch[1]);
          const months = koreanAgeMatch[2] ? parseInt(koreanAgeMatch[2]) : 0;

          if (!isNaN(years) && years >= 0) {
            // Convert to decimal age (years + months/12)
            const totalAge = years + months / 12;
            age = normalizeAge(Math.round(totalAge)); // Round to nearest year
          }
        } else {
          // Fallback: try to parse as plain number
          const ageValue = Number(ageString);
          if (!isNaN(ageValue) && ageValue >= 0) {
            age = normalizeAge(ageValue);
          }
        }
      }

      // Process visit type
      // Process visit type
      let visitType = "재진"; // Default to 재진
      if (row[visitTypeIndex]) {
        const rawVisitType = String(row[visitTypeIndex])
          .trim()
          .replace(/\s/g, "");
        // Map 초진 and 신환 -> 신환, everything else -> 재진
        if (rawVisitType === "초진" || rawVisitType === "신환") {
          visitType = "신환";
        }
        // 재진 or any other value defaults to 재진
      }

      // Process doctor
      const doctor = row[doctorIndex] ? String(row[doctorIndex]).trim() : "";

      // Process address
      const address = row[addressIndex]
        ? String(row[addressIndex]).trim()
        : "N/A";

      const patientData: PatientListBit = {
        chartNumber,
        age,
        visitType,
        doctor,
        address,
      };

      data.push(patientData);
    }

    console.log(`✅ Processed ${data.length} records from PatientListBit file`);
  }

  return data;
}
