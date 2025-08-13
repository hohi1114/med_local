import * as XLSX from "xlsx";
import { normalizeAge } from "../ExcelParser";

export interface DailyIncomeHanChart {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
  age: number;
  area: string;
  route: string;
  doctor: string;
}

export interface PatientListHanChart {
  chartNumber: number;
  address: string;
  firstDate: string;
}

// 베가스의 경우 Income에서 1) 분야 2) 시술 3) 진료의를 string으로 추가적으로 받는다. default value는 " "이 되도록 주의한다
// 환자 목록에서 1) 최초일을 받는다 2) 애초에 초진 재진 계산해서 올라간다-> fir 3)국적 받는다

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

    const doctorIndex = headers.findIndex((col: any) => col === "진료의");

    const routeIndex = headers.findIndex((col: any) => col === "내원경로");
    const gubunIndex = headers.findIndex((col: any) => col === "구분");

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

      const doctor =
        doctorIndex !== -1 && row[doctorIndex]
          ? String(row[doctorIndex]).trim()
          : "";
      const route =
        routeIndex !== -1 && row[routeIndex]
          ? String(row[routeIndex]).trim()
          : "";
      const area =
        gubunIndex !== -1 && row[gubunIndex]
          ? String(row[gubunIndex]).trim()
          : "";

      data.push({
        chartNumber,
        age: normalizedAge,
        visitDate: String(visitDate),
        totalCost,
        doctor,
        route,
        area,
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
    console.log("hanchart:", headers);

    // Find the index for each required column
    const chartNumberIndex = headers.findIndex(
      (col: any) => col === "차트번호"
    );

    const addressIndex = headers.findIndex((col: any) => col === "주소");
    const firstDateIndex = headers.findIndex((col: any) => col === "최초일");

    if (
      chartNumberIndex === -1 ||
      addressIndex === -1 ||
      firstDateIndex === -1
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

      // Check if required fields exist (주소는 필수가 아님)
      if (!row[chartNumberIndex]) {
        continue;
      }

      // Process chart number
      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) {
        console.log(`Skipping row ${i}: invalid chart number`);
        continue;
      }

      const address = row[addressIndex]
        ? String(row[addressIndex]).trim()
        : "N/A";

      let firstDate = "";

      if (row[firstDateIndex]) {
        let dateValue = row[firstDateIndex];

        if (typeof dateValue === "number") {
          // Use XLSX's built-in date conversion
          const excelDate = XLSX.SSF.parse_date_code(dateValue);
          firstDate = `${excelDate.y}-${String(excelDate.m).padStart(
            2,
            "0"
          )}-${String(excelDate.d).padStart(2, "0")}`;
        }

        if (typeof dateValue === "string") {
          firstDate = dateValue.replace(/\([^)]*\)$/, "").trim();
        }
      }

      data.push({
        chartNumber,
        address: address || "N/A",
        firstDate,
      });
    }
  }
  return data;
}
