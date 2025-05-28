import * as XLSX from "xlsx";
import { normalizeAge } from "../ExcelParser";
import { excelSerialToDate, calculateAge } from "../ExcelParser";

export interface DailyIncomeDentweb {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
  route: string; //내원경로
  area: string; //진료내역
  doctor: string; // 담당의사
  firstVisit: string; //최초내원
}

export interface PatientDataDentWeb {
  chartNumber: number;
  age: number | null;
  address: string;
}

// In src/services/fileProcessing.ts
export async function parseDaysFilesDentweb(
  fileBuffers: ArrayBuffer[]
): Promise<DailyIncomeDentweb[]> {
  let data: DailyIncomeDentweb[] = [];

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

      const doctorIndex1 = headers.findIndex((col: any) => col === "담당의사");
      const doctorIndex2 = headers.findIndex((col: any) => col === "진료의사");

      const routeIndex = headers.findIndex((col: any) => col === "내원경로");

      const firstVisitIndex = headers.findIndex(
        (col: any) => col === "최초내원"
      );

      const areaIndex = headers.findIndex((col: any) => col === "진료내역");

      // Determine which totalCost column to use (prioritize "총진료비" if both exist)
      const totalCostIndex =
        totalCostIndex1 !== -1 ? totalCostIndex1 : totalCostIndex2;

      // Determine which doctorc column to use
      const doctorIndex = doctorIndex1 !== -1 ? doctorIndex1 : doctorIndex2;

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

        const area =
          areaIndex !== -1 && row[areaIndex]
            ? String(row[areaIndex]).trim()
            : ""; //진료내역

        const doctor =
          doctorIndex !== -1 && row[doctorIndex]
            ? String(row[doctorIndex]).trim()
            : ""; //진료의사

        const route =
          routeIndex !== -1 && row[routeIndex]
            ? String(row[routeIndex]).trim()
            : ""; //내원경로

        const firstVisit =
          firstVisitIndex !== -1 && row[firstVisitIndex]
            ? String(row[firstVisitIndex]).trim()
            : ""; //최초내원

        data.push({
          chartNumber,
          visitDate,
          totalCost,
          area,
          doctor,
          route,
          firstVisit,
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
