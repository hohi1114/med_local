import * as XLSX from "xlsx";
import { normalizeAge } from "../ExcelParser";

//서울뷰의원 위한 Vegas2
// 수납일-> 진료일
//

export interface DailyIncomeVegas {
  chartNumber: number;
  visitDate: string;
  totalCost: number; // 과세총금액
  nonTaxableNonInsuranceCost: number; // 비과세비급여 (위고비, 마운자로 등)
  age: number;
  area: string;
  procedure: string;
  doctor: string;
  staff: string;
}

export interface PatientListVegas {
  chartNumber: number;
  address: string;
  firstDate: string;
  route: string;
  nationality: string;
}

// 오더판매내역및환자내역 파일의 "오더별환자리스트" 시트: 하루에 여러 오더가 찍히면 여러 행으로 나뉜다
export interface OrderRecordVegas2 {
  chartNumber: number;
  visitDate: string;
  orders: string[];
  taxableCost: number; // 부가세 = "O"인 오더 금액 합
  nonTaxableCost: number; // 부가세가 빈칸인 오더 금액 합 (위고비, 마운자로 등)
  doctor: string;
  staff: string;
  route: string;
  nationality: string;
  visitType: string; // 진료구분 (초진/재진/재초진)
}

// 베가스의 경우 Income에서 1) 분야 2) 시술 3) 진료의를 string으로 추가적으로 받는다. default value는 " "이 되도록 주의한다
// 환자 목록에서 1) 최초일을 받는다 2) 애초에 초진 재진 계산해서 올라간다-> fir 3)국적 받는다

export async function parseDailyIncomeVegas2(
  fileBuffers: ArrayBuffer[]
): Promise<DailyIncomeVegas[]> {
  console.log("🔍 Using parseDailyIncomeVegas2 with phone number logic");
  const data: DailyIncomeVegas[] = [];

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
    const phoneNumberIndex = headers.findIndex(
      (col: any) => col === "전화번호"
    );
    const visitDateIndex = headers.findIndex((col: any) => col === "진료일");
    const taxableCostIndex = headers.findIndex(
      (col: any) => col === "과세총금액"
    );
    const nonTaxableNonInsuranceCostIndex = headers.findIndex(
      (col: any) => col === "비과세비급여"
    );

    const genderAgeIndex = headers.findIndex((col: any) => col === "성별/나이");

    const areaIndex = headers.findIndex((col: any) => col === "분야");

    const procedureIndex = headers.findIndex((col: any) => col === "시술");

    const doctorIndex = headers.findIndex((col: any) => col === "진료의");

    const staffIndex = headers.findIndex((col: any) => col === "담당직원");

    if (
      phoneNumberIndex === -1 ||
      visitDateIndex === -1 ||
      taxableCostIndex === -1 ||
      nonTaxableNonInsuranceCostIndex === -1 ||
      genderAgeIndex === -1
    ) {
      console.error("❌ Required columns not found in the file");
      console.error("Available headers:", headers);
      continue;
    }

    // Process data rows (starting from row 2, index 1)
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];

      console.log(row);
      // Skip empty rows
      if (!row || row.length === 0) {
        continue;
      }

      // Check if required fields exist
      if (
        !row[phoneNumberIndex] ||
        !row[visitDateIndex] ||
        (row[taxableCostIndex] === undefined &&
          row[nonTaxableNonInsuranceCostIndex] === undefined)
      ) {
        continue;
      }

      // Process phone number to extract chart number (last 6 digits)
      const phoneNumberStr = String(row[phoneNumberIndex]).trim();
      const phoneNumberDigits = phoneNumberStr.replace(/\D/g, ""); // Remove non-digit characters

      if (phoneNumberDigits.length < 6) {
        console.log(`Skipping row ${i}: phone number too short`);
        continue;
      }

      const chartNumber = Number(phoneNumberDigits.slice(-6)); // Get last 6 digits
      if (isNaN(chartNumber)) {
        console.log(`Skipping row ${i}: invalid chart number from phone`);
        continue;
      }

      // Process costs - 과세총금액과 비과세비급여를 별도로 유지 (합산하지 않음)
      const totalCost = Number(row[taxableCostIndex]) || 0;
      const nonTaxableNonInsuranceCost =
        Number(row[nonTaxableNonInsuranceCostIndex]) || 0;

      if (totalCost <= 0 && nonTaxableNonInsuranceCost <= 0) {
        console.log(`Skipping row ${i}: invalid total cost`);
        continue;
      }

      // Process visit date
      let visitDate = row[visitDateIndex];

      // Handle date format like "2025-05-03(토)"
      if (typeof visitDate === "string") {
        // Remove the day of week in parentheses, e.g., "(토)"
        visitDate = visitDate.replace(/\([^)]*\)$/, "").trim();

        // If it's already in YYYY-MM-DD format after removing day, keep it
        if (visitDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Already in correct format
        }
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

      const area =
        areaIndex !== -1 && row[areaIndex] ? String(row[areaIndex]).trim() : "";
      const procedure =
        procedureIndex !== -1 && row[procedureIndex]
          ? String(row[procedureIndex]).trim()
          : "";
      const doctor =
        doctorIndex !== -1 && row[doctorIndex]
          ? String(row[doctorIndex]).trim()
          : "";
      const staff =
        staffIndex !== -1 && row[staffIndex]
          ? String(row[staffIndex]).trim()
          : "";

      data.push({
        chartNumber,
        age: normalizedAge,
        visitDate: String(visitDate),
        totalCost,
        nonTaxableNonInsuranceCost,
        area,
        procedure,
        doctor,
        staff,
      });
    }
  }
  return data;
}

export async function parsePatientListVegas2(
  fileBuffers: ArrayBuffer[]
): Promise<PatientListVegas[]> {
  const data: PatientListVegas[] = [];

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
    console.log("vegas:", headers);

    // Find the index for each required column
    const phoneNumberIndex = headers.findIndex((col: any) => col === "핸드폰");

    const addressIndex = headers.findIndex((col: any) => col === "주소");

    const firstDateIndex = headers.findIndex((col: any) => col === "최초일");

    const routeIndex = headers.findIndex((col: any) => col === "내원경로");

    const nationalityIndex = headers.findIndex((col: any) => col === "국적");

    if (
      phoneNumberIndex === -1 ||
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
      if (!row[phoneNumberIndex]) {
        continue;
      }

      // Process phone number to extract chart number (last 6 digits)
      const phoneNumberStr = String(row[phoneNumberIndex]).trim();
      const phoneNumberDigits = phoneNumberStr.replace(/\D/g, ""); // Remove non-digit characters (hyphens, spaces, etc.)

      if (phoneNumberDigits.length < 6) {
        console.log(`Skipping row ${i}: phone number too short`);
        continue;
      }

      const chartNumber = Number(phoneNumberDigits.slice(-6)); // Get last 6 digits
      if (isNaN(chartNumber)) {
        console.log(`Skipping row ${i}: invalid chart number from phone`);
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

      // Process route (내원경로)
      const route =
        routeIndex !== -1 && row[routeIndex]
          ? String(row[routeIndex]).trim()
          : "";

      // Process nationality (국적)
      const nationality =
        nationalityIndex !== -1 && row[nationalityIndex]
          ? String(row[nationalityIndex]).trim()
          : "";

      data.push({
        chartNumber,
        address: address || "N/A",
        firstDate,
        route,
        nationality,
      });
    }
  }
  return data;
}

// "오더판매내역및환자내역" 파일의 "오더별환자리스트" 시트를 파싱해 (차트번호, 진료일)별 오더명 목록을 만든다.
export async function parseOrderListVegas2(
  fileBuffers: ArrayBuffer[]
): Promise<OrderRecordVegas2[]> {
  const grouped = new Map<string, OrderRecordVegas2>();

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });

    const sheetName = workbook.SheetNames.find((name) => {
      const preview = XLSX.utils
        .sheet_to_json<any[]>(workbook.Sheets[name], { header: 1, range: 0 })
        .slice(0, 3);
      return preview.some(
        (row) => Array.isArray(row) && row.includes("핸드폰번호")
      );
    });

    if (!sheetName) {
      console.error("❌ 오더별환자리스트 시트를 찾을 수 없습니다");
      continue;
    }

    const worksheet = workbook.Sheets[sheetName];
    const allData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      range: 0,
    });

    const headerRowIndex = allData.findIndex(
      (row) => Array.isArray(row) && row.includes("핸드폰번호")
    );
    if (headerRowIndex === -1) continue;

    const headers = allData[headerRowIndex];
    const phoneNumberIndex = headers.findIndex(
      (col: any) => col === "핸드폰번호"
    );
    const visitDateIndex = headers.findIndex((col: any) => col === "진료일");
    const orderNameIndex = headers.findIndex((col: any) => col === "오더명");
    const amountIndex = headers.findIndex((col: any) => col === "금액");
    const vatIndex = headers.findIndex((col: any) => col === "부가세");
    const doctorIndex = headers.findIndex((col: any) => col === "진료의명");
    const staffIndex = headers.findIndex((col: any) => col === "담당직원");
    const routeIndex = headers.findIndex((col: any) => col === "내원경로");
    const nationalityIndex = headers.findIndex((col: any) => col === "국적");
    const visitTypeIndex = headers.findIndex((col: any) => col === "진료구분");

    if (
      phoneNumberIndex === -1 ||
      visitDateIndex === -1 ||
      orderNameIndex === -1
    ) {
      console.error("❌ Required columns not found in order list file");
      console.error("Available headers:", headers);
      continue;
    }

    for (let i = headerRowIndex + 1; i < allData.length; i++) {
      const row = allData[i];
      if (!row || row.length === 0) {
        continue;
      }

      const phoneNumberStr = String(row[phoneNumberIndex] || "").trim();
      const phoneNumberDigits = phoneNumberStr.replace(/\D/g, "");
      if (phoneNumberDigits.length < 6) {
        continue;
      }

      const chartNumber = Number(phoneNumberDigits.slice(-6));
      if (isNaN(chartNumber)) {
        continue;
      }

      const orderName = String(row[orderNameIndex] || "").trim();
      if (!orderName) {
        continue;
      }

      // "20260721" -> "2026-07-21" (dailyIncome의 visitDate 포맷과 맞춤)
      let visitDate = String(row[visitDateIndex] || "").trim();
      if (/^\d{8}$/.test(visitDate)) {
        visitDate = `${visitDate.slice(0, 4)}-${visitDate.slice(
          4,
          6
        )}-${visitDate.slice(6, 8)}`;
      }

      const amount =
        amountIndex !== -1 ? Number(row[amountIndex]) || 0 : 0;
      const isVat = vatIndex !== -1 && String(row[vatIndex] || "").trim() === "O";
      const doctor =
        doctorIndex !== -1 ? String(row[doctorIndex] || "").trim() : "";
      const staff =
        staffIndex !== -1 ? String(row[staffIndex] || "").trim() : "";
      const route =
        routeIndex !== -1 ? String(row[routeIndex] || "").trim() : "";
      const nationality =
        nationalityIndex !== -1
          ? String(row[nationalityIndex] || "").trim()
          : "";
      const visitType =
        visitTypeIndex !== -1 ? String(row[visitTypeIndex] || "").trim() : "";

      const key = `${chartNumber}|${visitDate}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.orders.push(orderName);
        if (isVat) {
          existing.taxableCost += amount;
        } else {
          existing.nonTaxableCost += amount;
        }
        if (!existing.doctor) existing.doctor = doctor;
        if (!existing.staff) existing.staff = staff;
        if (!existing.route) existing.route = route;
        if (!existing.nationality) existing.nationality = nationality;
        if (!existing.visitType) existing.visitType = visitType;
      } else {
        grouped.set(key, {
          chartNumber,
          visitDate,
          orders: [orderName],
          taxableCost: isVat ? amount : 0,
          nonTaxableCost: isVat ? 0 : amount,
          doctor,
          staff,
          route,
          nationality,
          visitType,
        });
      }
    }
  }

  return Array.from(grouped.values());
}
