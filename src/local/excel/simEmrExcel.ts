import * as XLSX from "xlsx";
import { normalizeAge } from "../ExcelParser";

export interface DailyVisitSimEmr {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
  address: string;
}

export interface PatientListSimEmr {
  chartNumber: number;
  age: number | null;
  department: string;
}

// 헤더 행이 파일 상단 몇 줄 안에서 오갈 수 있어 이름으로 위치를 동적으로 탐색한다
function findHeaderRow(
  allData: any[][],
  requiredHeaders: string[]
): { rowIndex: number; colIndexes: number[] } | null {
  for (let r = 0; r < Math.min(5, allData.length); r++) {
    const row = allData[r];
    if (!Array.isArray(row)) continue;
    const colIndexes = requiredHeaders.map((h) => row.findIndex((col: any) => col === h));
    if (colIndexes.every((idx) => idx !== -1)) {
      return { rowIndex: r, colIndexes };
    }
  }
  return null;
}

function parseSimEmrDate(raw: any): string {
  if (typeof raw === "number") {
    const excelDate = XLSX.SSF.parse_date_code(raw);
    return `${excelDate.y}-${String(excelDate.m).padStart(2, "0")}-${String(
      excelDate.d
    ).padStart(2, "0")}`;
  }
  if (raw instanceof Date) {
    return `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(raw.getDate()).padStart(2, "0")}`;
  }
  let str = String(raw ?? "").trim();
  str = str.replace(/\([^)]*\)$/, "").trim();
  const digitsOnly = str.replace(/[^0-9]/g, "");
  if (digitsOnly.length === 8 && /^\d{8}$/.test(digitsOnly)) {
    return `${digitsOnly.substring(0, 4)}-${digitsOnly.substring(
      4,
      6
    )}-${digitsOnly.substring(6, 8)}`;
  }
  return str;
}

function parseChartNumber(raw: any): number {
  return Number(String(raw).trim().replace(/^0+/, "") || "0");
}

export async function parseDailyVisitSimEmr(
  fileBuffers: ArrayBuffer[]
): Promise<DailyVisitSimEmr[]> {
  const data: DailyVisitSimEmr[] = [];

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });
    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in file");
      continue;
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const allData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      range: 0,
    });

    if (allData.length < 2) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    const header = findHeaderRow(allData, ["환자번호", "주소", "진료기간", "총진료비"]);
    if (!header) {
      console.error("❌ Required columns not found");
      console.error("Available headers:", allData.slice(0, 3));
      continue;
    }

    const [chartNumberIndex, addressIndex, visitDateIndex, totalCostIndex] =
      header.colIndexes;

    for (let i = header.rowIndex + 1; i < allData.length; i++) {
      const row = allData[i];
      if (!row || row.length === 0) continue;
      if (!row[chartNumberIndex] || !row[visitDateIndex]) continue;

      const chartNumber = parseChartNumber(row[chartNumberIndex]);
      if (isNaN(chartNumber)) continue;

      const visitDate = parseSimEmrDate(row[visitDateIndex]);
      const totalCost = parseAmount(row[totalCostIndex]);
      const address = row[addressIndex] ? String(row[addressIndex]).trim() : "N/D";

      data.push({ chartNumber, visitDate, totalCost, address });
    }
  }
  return data;
}

export async function parsePatientListSimEmr(
  fileBuffers: ArrayBuffer[]
): Promise<PatientListSimEmr[]> {
  const data: PatientListSimEmr[] = [];

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });
    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in file");
      continue;
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const allData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      range: 0,
    });

    if (allData.length < 2) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    const header = findHeaderRow(allData, ["진료과목", "환자번호", "나이"]);
    if (!header) {
      console.error("❌ Required columns not found");
      console.error("Available headers:", allData.slice(0, 3));
      continue;
    }

    const [departmentIndex, chartNumberIndex, ageIndex] = header.colIndexes;

    for (let i = header.rowIndex + 1; i < allData.length; i++) {
      const row = allData[i];
      if (!row || row.length === 0) continue;
      if (!row[chartNumberIndex]) continue;

      const chartNumber = parseChartNumber(row[chartNumberIndex]);
      if (isNaN(chartNumber)) continue;

      const ageRaw = row[ageIndex];
      const age =
        ageRaw !== undefined && ageRaw !== null && ageRaw !== ""
          ? normalizeAge(Number(ageRaw))
          : null;

      const department = row[departmentIndex] ? String(row[departmentIndex]).trim() : "";

      data.push({ chartNumber, age: age !== null && !isNaN(age) ? age : null, department });
    }
  }
  return data;
}

function parseAmount(value: any): number {
  if (value === null || value === undefined || value === "") return 0;
  const str = String(value).trim().replace(/,/g, "").replace(/[^\d.-]/g, "");
  const amount = Number(str);
  return isNaN(amount) ? 0 : amount;
}
