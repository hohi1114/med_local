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
  primaryDiagnosis?: string; // 주상병
  dayNightHoliday?: string; // 주야공휴
  procedures?: string[]; // 시행된 검사/촬영/PT/주사/원외/처치/US/CT/중증 항목
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


// 📌 "46세11개월", "F/46세11개월" 같은 문자열에서 나이(년)를 추출하는 헬퍼 함수
function parseKoreanAgeString(ageString: string): number | null {
  const trimmed = ageString.trim();
  const koreanAgeMatch = trimmed.match(/(\d+)세(?:(\d+)개월)?/);

  if (koreanAgeMatch) {
    const years = parseInt(koreanAgeMatch[1]);
    // 개월수는 반영하지 않는다: normalizeAge가 10년 단위로 버림 처리하므로
    // 반올림하면 예) "49세9개월"이 50대로 잘못 집계된다.
    if (isNaN(years) || years < 0) return null;
    return years;
  }

  const ageValue = Number(trimmed);
  if (!isNaN(ageValue) && ageValue >= 0) {
    return ageValue;
  }
  return null;
}

// 📌 주민등록번호(예: 920221-1030314)에서 만 나이를 계산하는 헬퍼 함수
function calculateAgeFromResidentId(residentId: string): number | null {
  const digits = residentId.replace(/[^0-9]/g, "");
  if (digits.length < 7) return null;

  const yy = parseInt(digits.slice(0, 2), 10);
  const mm = parseInt(digits.slice(2, 4), 10);
  const dd = parseInt(digits.slice(4, 6), 10);
  const genderDigit = digits[6];

  let century: number;
  if (["1", "2", "5", "6"].includes(genderDigit)) {
    century = 1900;
  } else if (["3", "4", "7", "8"].includes(genderDigit)) {
    century = 2000;
  } else if (["9", "0"].includes(genderDigit)) {
    century = 1800;
  } else {
    return null;
  }

  if (isNaN(yy) || isNaN(mm) || isNaN(dd)) return null;

  const birthYear = century + yy;
  const today = new Date();
  let age = today.getFullYear() - birthYear;

  // 생일이 아직 안 지났으면 만 나이 1살 차감
  const hasHadBirthdayThisYear =
    today.getMonth() + 1 > mm ||
    (today.getMonth() + 1 === mm && today.getDate() >= dd);
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 0 ? age : null;
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


const PROCEDURE_COLUMNS = [
  "검사",
  "촬영",
  "PT",
  "주사",
  "원외",
  "처치",
  "US",
  "CT",
  "마취",
  "중증",
  "만성질환",
  "MRI",
];

// 📌 "진료내역 조회" 계열 파일은 실제 헤더 앞에 검색조건 메타데이터 행이 여러 줄 붙어있을 수 있어
// 차트번호 헤더가 나오는 행을 찾아서 그 행을 헤더로 사용한다.
function findHeaderRowIndex(allData: any[][]): number {
  const searchLimit = Math.min(allData.length, 20);
  for (let i = 0; i < searchLimit; i++) {
    const row = allData[i];
    if (
      Array.isArray(row) &&
      row.some((cell: any) => cell === "차트번호" || cell === "챠트번호")
    ) {
      return i;
    }
  }
  return 0; // 못 찾으면 기존 동작대로 첫 행을 헤더로 사용
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

    const headerRowIndex = findHeaderRowIndex(allData);
    const headers = allData[headerRowIndex];

    const chartNumberIndex = headers.findIndex(
      (col: any) => col === "차트번호" || col === "챠트번호"
    );
    const ageIndex = headers.findIndex((col: any) => col === "나이");
    const saIndex = headers.findIndex((col: any) => col === "S/A"); // "F/46세11개월" (성별/나이)
    const residentIdIndex = headers.findIndex(
      (col: any) => col === "주민등록번호" || col === "주민번호"
    );
    const visitTypeIndex = headers.findIndex(
      (col: any) =>
        col === "초재진구분" || col === "초/재진" || col === "초/재"
    );
    const visitDateIndex = headers.findIndex(
      (col: any) =>
        col === "내원날짜" || col === "내원/입원일시" || col === "내원일"
    );
    const doctorIndex = headers.findIndex((col: any) => col === "담당의");
    const addressIndex = headers.findIndex((col: any) => col === "주소");
    const diagnosisIndex = headers.findIndex((col: any) => col === "주상병");
    const dayNightHolidayIndex = headers.findIndex(
      (col: any) => col === "주야공휴"
    );
    const procedureIndices = PROCEDURE_COLUMNS.map((name) => ({
      name,
      idx: headers.findIndex((col: any) => col === name),
    })).filter((p) => p.idx !== -1);

    if (
      chartNumberIndex === -1 ||
      (ageIndex === -1 && saIndex === -1 && residentIdIndex === -1) ||
      visitDateIndex === -1
    ) {
      console.error("❌ Required columns not found in the file");
      console.error("Available headers:", headers);
      console.error(
        "Looking for: 차트번호, (나이 또는 S/A 또는 주민등록번호/주민번호), 내원날짜(또는 내원/입원일시, 내원일)"
      );
      continue;
    }


    for (let i = headerRowIndex + 1; i < allData.length; i++) {
      const row = allData[i];

      if (!row || row.length === 0) {
        continue;
      }

      if (!row[chartNumberIndex] || !row[visitDateIndex]) {
        continue;
      }

      const chartNumber = Number(row[chartNumberIndex]);
      if (isNaN(chartNumber)) {
        continue;
      }

      let age: number | null = null;
      const rawAgeCell =
        ageIndex !== -1 && row[ageIndex]
          ? row[ageIndex]
          : saIndex !== -1 && row[saIndex]
          ? row[saIndex]
          : null;
      if (rawAgeCell !== null) {
        const years = parseKoreanAgeString(String(rawAgeCell));
        if (years !== null) {
          age = normalizeAge(years);
        }
      } else if (residentIdIndex !== -1 && row[residentIdIndex]) {
        const yearsFromResidentId = calculateAgeFromResidentId(
          String(row[residentIdIndex])
        );
        if (yearsFromResidentId !== null) {
          age = normalizeAge(yearsFromResidentId);
        }
      }

      let visitType = "재진";
      if (visitTypeIndex !== -1 && row[visitTypeIndex]) {
        const rawVisitType = String(row[visitTypeIndex])
          .trim()
          .replace(/\s/g, "");
        if (rawVisitType.includes("산정안함")) {
          // 진찰료 산정안함: 실제 진료가 아니므로 재진으로 집계하지 않고 통째로 제외
          continue;
        } else if (rawVisitType.includes("신환")) {
          visitType = "신환";
        } else if (rawVisitType.includes("초진")) {
          // "30일초진" 등 신환과 별개로 초진으로 분류 (신환에 합치지 않음)
          visitType = "초진";
        }
      }

      // 📌 날짜 파싱: "YYYY-MM-DD  HH:MM"은 시간 제거, "YYYYMMDDHHmm"(12자리)은 앞 8자리(날짜)만 사용
      let visitDateRaw = String(row[visitDateIndex]).trim().split(/\s+/)[0];
      if (/^\d{12}$/.test(visitDateRaw)) {
        visitDateRaw = visitDateRaw.slice(0, 8);
      }
      const visitDate = parseDateString(visitDateRaw);

      const doctor =
        doctorIndex !== -1 && row[doctorIndex]
          ? String(row[doctorIndex]).trim()
          : "";
      const address = row[addressIndex]
        ? String(row[addressIndex]).trim()
        : "N/A";

      const primaryDiagnosis =
        diagnosisIndex !== -1 && row[diagnosisIndex]
          ? String(row[diagnosisIndex]).trim()
          : "";

      const dayNightHoliday =
        dayNightHolidayIndex !== -1 && row[dayNightHolidayIndex]
          ? String(row[dayNightHolidayIndex]).trim()
          : "";

      const procedures = procedureIndices
        .filter(({ idx }) => row[idx] && String(row[idx]).trim() !== "")
        .map(({ name }) => name);

      const patientData: PatientListBit = {
        chartNumber,
        age,
        visitType,
        visitDate,
        doctor,
        address,
        primaryDiagnosis,
        dayNightHoliday,
        procedures,
      };

      data.push(patientData);
    }

    console.log(`✅ Processed ${data.length} records from PatientListBit file`);
  }

  return data;
}
