import * as XLSX from "xlsx";
import { normalizeAge } from "../ExcelParser";

export interface DailyIncomeSmartNC {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
}

export interface PatientAddressSmartNC {
  chartNumber: number;
  address: string;
}

export interface PatientListSmartNC {
  chartNumber: number;
  age: number | null;
}

export async function parseDailyIncomeSmartNC(
  fileBuffers: ArrayBuffer[]
): Promise<DailyIncomeSmartNC[]> {
  const data: DailyIncomeSmartNC[] = [];

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

    const headers = allData[0];
    const visitDateIndex = headers.findIndex((col: any) => col === "수납일자");
    const chartNumberIndex = headers.findIndex((col: any) => col === "고객번호");
    const totalCostIndex = headers.findIndex((col: any) => col === "총진료비");

    if (visitDateIndex === -1 || chartNumberIndex === -1 || totalCostIndex === -1) {
      console.error("❌ Required columns not found");
      console.error("Available headers:", headers);
      continue;
    }

    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      if (!row || row.length === 0) continue;
      if (!row[chartNumberIndex] || !row[visitDateIndex]) continue;

      // Skip 합계 행
      if (String(row[visitDateIndex] ?? "").trim() === "합계") continue;

      const chartNumber = Number(
        String(row[chartNumberIndex]).trim().replace(/^0+/, "") || "0"
      );
      if (isNaN(chartNumber)) continue;

      let visitDate = String(row[visitDateIndex]).trim();
      if (visitDate.match(/^\d{8}$/)) {
        visitDate = `${visitDate.substring(0, 4)}-${visitDate.substring(4, 6)}-${visitDate.substring(6, 8)}`;
      }

      const totalCost = parseAmount(row[totalCostIndex]);
      if (totalCost === 0) continue;

      const key = `${chartNumber}_${visitDate}`;
      const existing = data.find((d) => `${d.chartNumber}_${d.visitDate}` === key);
      if (existing) {
        existing.totalCost += totalCost;
      } else {
        data.push({ chartNumber, visitDate, totalCost });
      }
    }
  }
  return data;
}

export async function parsePatientAddressSmartNC(
  fileBuffers: ArrayBuffer[]
): Promise<PatientAddressSmartNC[]> {
  const data: PatientAddressSmartNC[] = [];

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

    // 제목 행이 있을 수 있으므로 헤더 행을 동적으로 탐색
    let headerRowIndex = -1;
    let chartNumberIndex = -1;
    let addressIndex = -1;

    for (let r = 0; r < Math.min(5, allData.length); r++) {
      const row = allData[r];
      if (!Array.isArray(row)) continue;
      const ci = row.findIndex((col: any) => col === "고객번호");
      const ai = row.findIndex((col: any) => col === "주소");
      if (ci !== -1 && ai !== -1) {
        headerRowIndex = r;
        chartNumberIndex = ci;
        addressIndex = ai;
        break;
      }
    }

    if (headerRowIndex === -1) {
      console.error("❌ Required columns not found");
      console.error("First rows:", allData.slice(0, 3));
      continue;
    }

    for (let i = headerRowIndex + 1; i < allData.length; i++) {
      const row = allData[i];
      if (!row || row.length === 0) continue;
      if (!row[chartNumberIndex]) continue;

      const chartNumber = Number(
        String(row[chartNumberIndex]).trim().replace(/^0+/, "") || "0"
      );
      if (isNaN(chartNumber)) continue;

      const address = row[addressIndex]
        ? String(row[addressIndex]).trim()
        : "N/A";

      data.push({ chartNumber, address });
    }
  }
  return data;
}

export async function parsePatientListSmartNC(
  fileBuffers: ArrayBuffer[]
): Promise<PatientListSmartNC[]> {
  const data: PatientListSmartNC[] = [];
  const now = new Date();

  const getAgeFromRRN = (raw: any): number | null => {
    if (!raw) return null;
    const digits = String(raw).replace(/[^0-9]/g, "");
    if (digits.length < 7) return null;

    const yy = Number(digits.slice(0, 2));
    const mm = Number(digits.slice(2, 4));
    const dd = Number(digits.slice(4, 6));
    const genderCode = Number(digits.charAt(6));

    if (isNaN(yy) || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;

    let century: number | null = null;
    if ([1, 2, 5, 6].includes(genderCode)) century = 1900;
    else if ([3, 4, 7, 8].includes(genderCode)) century = 2000;
    else return null;

    const birthYear = century + yy;
    const birth = new Date(birthYear, mm - 1, dd);
    if (isNaN(birth.getTime())) return null;

    let age = now.getFullYear() - birthYear;
    const hasHadBirthday =
      now.getMonth() > birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    if (!hasHadBirthday) age -= 1;

    return age >= 0 && age < 130 ? age : null;
  };

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

    // 제목 행이 있을 수 있으므로 헤더 행을 동적으로 탐색
    let headerRowIndex = -1;
    let chartNumberIndex = -1;
    let rrnIndex = -1;

    for (let r = 0; r < Math.min(5, allData.length); r++) {
      const row = allData[r];
      if (!Array.isArray(row)) continue;
      const ci = row.findIndex((col: any) => col === "고객번호");
      const ri = row.findIndex((col: any) => col === "주민번호");
      if (ci !== -1 && ri !== -1) {
        headerRowIndex = r;
        chartNumberIndex = ci;
        rrnIndex = ri;
        break;
      }
    }

    if (headerRowIndex === -1) {
      console.error("❌ Required columns not found");
      console.error("First rows:", allData.slice(0, 3));
      continue;
    }

    // 헤더의 "고객번호"는 col A(index 0)이나 실제 데이터는 col B(index 1)에 위치 → +1 보정
    const chartNumberDataIndex = chartNumberIndex + 1;

    for (let i = headerRowIndex + 1; i < allData.length; i++) {
      const row = allData[i];
      if (!row || row.length === 0) continue;

      if (!row[chartNumberDataIndex]) continue;
      const chartNumber = Number(
        String(row[chartNumberDataIndex]).trim().replace(/^0+/, "") || "0"
      );
      if (isNaN(chartNumber)) continue;

      const ageRaw = getAgeFromRRN(row[rrnIndex]);
      const age = ageRaw !== null ? normalizeAge(ageRaw) : null;

      data.push({ chartNumber, age });
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
