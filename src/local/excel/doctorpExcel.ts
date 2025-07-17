import * as XLSX from "xlsx";
import { normalizeAge } from "../ExcelParser";
import { excelSerialToDate, calculateAge } from "../ExcelParser";

export interface DailyIncomeDoctorP {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
  route: string; //내원경로
  area: string; //진료내역
  doctor: string; // 담당의사
  visitType: string;
}

export interface PatientListDoctorP {
  chartNumber: number;
  address: string;
  age: number | null;
}

// In src/services/fileProcessing.ts
export async function parseDaysFilesDoctorP(
  fileBuffers: ArrayBuffer[]
): Promise<DailyIncomeDoctorP[]> {
  let data: DailyIncomeDoctorP[] = [];

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
      (col: any) => col === "환자번호"
    );
    const visitDateIndex = headers.findIndex((col: any) => col === "진료일");

    // For totalCost, check both possible column names
    const totalCostIndex = headers.findIndex((col: any) => col === "결제금액");

    const doctorIndex = headers.findIndex((col: any) => col === "담당의");

    const routeIndex = headers.findIndex((col: any) => col === "내원경로");

    const areaIndex = headers.findIndex((col: any) => col === "방문목적");
    const visitTypeIndex = headers.findIndex((col: any) => col === "신환여부");

    console.log(
      chartNumberIndex,
      visitDateIndex,
      totalCostIndex,
      visitTypeIndex
    );

    // Check if all required columns were found
    if (
      chartNumberIndex === -1 ||
      visitDateIndex === -1 ||
      totalCostIndex === -1 ||
      visitTypeIndex === -1
    ) {
      console.error(`❌ Required columns not found in sheet`);
      continue; // Skip this sheet
    }

    // Process data rows (skip the header row)
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];

      if (
        !row[chartNumberIndex] ||
        !row[visitDateIndex] ||
        row[totalCostIndex] == null ||
        !row[visitTypeIndex]
      ) {
        continue;
      }

      // Process chartNumber - ensure it's a number
      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) {
        continue;
      }

      let visitDate = row[visitDateIndex];

      if (typeof visitDate === "number") {
        const excelDate = XLSX.SSF.parse_date_code(visitDate); // +1 보정
        if (excelDate) {
          visitDate = `${excelDate.y}-${String(excelDate.m).padStart(
            2,
            "0"
          )}-${String(excelDate.d).padStart(2, "0")}`;
        }
      }

      const totalCost = Number(row[totalCostIndex]);
      //if (isNaN(totalCost)) {
      // continue;
      // }

      const area =
        areaIndex !== -1 && row[areaIndex] ? String(row[areaIndex]).trim() : ""; //진료내역

      const doctor =
        doctorIndex !== -1 && row[doctorIndex]
          ? String(row[doctorIndex]).trim()
          : ""; //진료의사

      const route =
        routeIndex !== -1 && row[routeIndex]
          ? String(row[routeIndex]).trim()
          : ""; //내원경로
      let visitType = String(row[visitTypeIndex]).replace(/\s/g, "");
      // Convert visit types according to the specified rules
      if (visitType === "신환") {
        visitType = "신환";
      } else if (visitType === "구환") {
        visitType = "재진";
      }

      data.push({
        chartNumber,
        visitDate,
        totalCost,
        area,
        doctor,
        route,
        visitType,
      });
    }
  }
  return data;
}

export async function parsePlaceFilesDoctorP(
  fileBuffers: ArrayBuffer[]
): Promise<PatientListDoctorP[]> {
  let data: PatientListDoctorP[] = [];

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
      (col: any) => col === "환자번호"
    );
    const ageIndex = headers.findIndex((col: any) => col === "나이");
    const addressIndex = headers.findIndex((col: any) => col === "주소");

    console.log(chartNumberIndex);
    console.log(ageIndex);
    console.log(addressIndex);

    if (chartNumberIndex === -1 || ageIndex === -1 || addressIndex === -1) {
      console.error(
        `❌ Required columns not found in sheet ${workbook.SheetNames[0]}`
      );
      continue; // Skip this sheet
    }

    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];

      // Skip rows where chart number is missing
      if (!row[chartNumberIndex] || !row[ageIndex]) {
        continue;
      }

      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) {
        continue;
      }

      const age = row[ageIndex];
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
