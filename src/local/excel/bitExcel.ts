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
  visitDate: string | Date; // 내원날짜 추가!
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

    const allData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      range: 0,
    });

    if (allData.length < 3) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    const headers = allData[0];

    const chartNumberIndex = headers.findIndex(
      (col: any) => col === "챠트번호" || col === "차트번호"
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

    for (let i = 1; i < allData.length; i += 1) {
      const row = allData[i];

      if (!row || row.length === 0) {
        continue;
      }

      if (
        !row[chartNumberIndex] ||
        row[totalCostIndex] === undefined ||
        !row[visitDateIndex]
      ) {
        continue;
      }

      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) {
        continue;
      }

      let totalCostValue = row[totalCostIndex];
      if (typeof totalCostValue === "string") {
        totalCostValue = totalCostValue.replace(/,/g, "");
      }

      const totalCost = Number(totalCostValue);
      if (isNaN(totalCost)) {
        continue;
      }

      // 📌 날짜 처리 - parseDateString 함수만 사용
      const visitDate = parseDateString(String(row[visitDateIndex]));

      const dailyIncomeData: DailyIncomeBit = {
        chartNumber,
        visitDate,
        totalCost,
      };

      data.push(dailyIncomeData);
    }

    console.log(`✅ Processed ${data.length} records from DailyIncomeBit file`);
  }

  return data;
}


// 📌 날짜 문자열 파싱 헬퍼 함수
function parseDateString(dateStr: string): string {
  dateStr = dateStr.trim();
  
  // 1. 한국어 형식: "2025년 12월 01일"
  if (dateStr.includes("년") && dateStr.includes("월") && dateStr.includes("일")) {
    const match = dateStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    if (match) {
      const [, year, month, day] = match;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }
  
  // 2. 점 구분: "2025.12.1"
  if (dateStr.includes(".")) {
    const parts = dateStr.split(".");
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }
  }
  
  // 3. 슬래시 구분: "2025/12/1" 또는 "12/01/25" (MM/DD/YY)
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      let year, month, day;
      
      // 📌 2자리 연도면 MM/DD/YY 형식으로 간주
      if (parts[2].length === 2) {
        // MM/DD/YY → YYYY-MM-DD
        const yy = parseInt(parts[2]);
        year = (yy > 50 ? "19" : "20") + parts[2]; // 50 이상이면 1900년대
        month = parts[0];
        day = parts[1];
      } 
      // 4자리 연도면 YYYY/MM/DD 또는 DD/MM/YYYY
      else if (parts[0].length === 4) {
        // YYYY/MM/DD
        year = parts[0];
        month = parts[1];
        day = parts[2];
      } else {
        // 애매한 경우 첫 번째가 년도라고 가정
        year = parts[0];
        month = parts[1];
        day = parts[2];
      }
      
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }
  
  // 4. 하이픈 구분: "2025-12-1"
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }
  }
  
  // 5. YYYYMMDD 8자리
  if (/^\d{8}$/.test(dateStr)) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }
  
  return dateStr;
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

    const allData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      range: 0,
      raw: false, // 📌 문자열로 읽기
    });

    if (allData.length < 2) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    const headers = allData[0];

    const chartNumberIndex = headers.findIndex(
      (col: any) => col === "차트번호" || col === "챠트번호"
    );
    const ageIndex = headers.findIndex((col: any) => col === "나이");
    const visitTypeIndex = headers.findIndex(
      (col: any) => col === "초재진구분"
    );
    const visitDateIndex = headers.findIndex((col: any) => col === "내원날짜");
    const doctorIndex = headers.findIndex((col: any) => col === "담당의");
    const addressIndex = headers.findIndex((col: any) => col === "주소");

    if (
      chartNumberIndex === -1 ||
      ageIndex === -1 ||
      visitTypeIndex === -1 ||
      visitDateIndex === -1 ||
      doctorIndex === -1 ||
      addressIndex === -1
    ) {
      console.error("❌ Required columns not found in the file");
      console.error("Available headers:", headers);
      console.error("Looking for: 차트번호, 나이, 초재진구분, 내원날짜, 담당의, 주소");
      continue;
    }


    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];

      if (!row || row.length === 0) {
        continue;
      }

      if (!row[chartNumberIndex] || !row[ageIndex] || !row[visitTypeIndex] || !row[visitDateIndex]) {
        continue;
      }

      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) {
        continue;
      }

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
            const totalAge = years + months / 12;
            age = normalizeAge(Math.round(totalAge));
          }
        } else {
          const ageValue = Number(ageString);
          if (!isNaN(ageValue) && ageValue >= 0) {
            age = normalizeAge(ageValue);
          }
        }
      }

      let visitType = "재진";
      if (row[visitTypeIndex]) {
        const rawVisitType = String(row[visitTypeIndex])
          .trim()
          .replace(/\s/g, "");
        if (rawVisitType === "초진" || rawVisitType === "신환") {
          visitType = "신환";
        }
      }

      // 📌 날짜 파싱
      const visitDate = parseDateString(String(row[visitDateIndex]));

      const doctor = row[doctorIndex] ? String(row[doctorIndex]).trim() : "";
      const address = row[addressIndex]
        ? String(row[addressIndex]).trim()
        : "N/A";

      const patientData: PatientListBit = {
        chartNumber,
        age,
        visitType,
        visitDate,
        doctor,
        address,
      };

      data.push(patientData);
    }

    console.log(`✅ Processed ${data.length} records from PatientListBit file`);
  }

  return data;
}
