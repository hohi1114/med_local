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
  route: string;
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
  const now = new Date();

  // 주민번호 → 나이 계산 (12자리/13자리 모두 가능)
  const getAgeFromRRN = (raw: any): number | null => {
    if (!raw) return null;
    const digits = String(raw).replace(/[^0-9]/g, ""); // 숫자만 추출
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
    const hasHadBirthdayThisYear =
      now.getMonth() > birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    if (!hasHadBirthdayThisYear) age -= 1;

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

    const headers = allData[0];
    const patientNumberIndex = headers.findIndex((col) => col === "환자번호");
    const rrnIndex = headers.findIndex((col) => col === "주민번호");
    const addressIndex = headers.findIndex((col) => col === "주소");
    const routeIndex = headers.findIndex((col) => col === "내원경로");

    if (patientNumberIndex === -1 || rrnIndex === -1 || addressIndex === -1) {
      console.error("❌ Required columns not found in the file");
      console.error("Available headers:", headers);
      continue;
    }

    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      if (!row || row.length === 0) continue;
      if (!row[patientNumberIndex]) continue;

      const patientNumberStr = String(row[patientNumberIndex]).trim();
      const chartNumber = Number(patientNumberStr.replace(/^0+/, "") || "0");
      if (isNaN(chartNumber)) {
        console.log(`Skipping row ${i}: invalid patient number`);
        continue;
      }

      const ageRaw = getAgeFromRRN(row[rrnIndex]);
      const normalizedAge = ageRaw !== null ? normalizeAge(ageRaw) : null;

      const address = row[addressIndex]
        ? String(row[addressIndex]).trim()
        : "N/A";
      

      const route = row[routeIndex]
        ? String(row[routeIndex]).trim()
        : "N/A";
      

      data.push({
        chartNumber,
        age: normalizedAge,
        address: address || "N/A",
        route: route || "N/A"
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
