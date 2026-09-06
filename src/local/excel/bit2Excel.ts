
import * as XLSX from "xlsx";
import { normalizeAge } from "../ExcelParser";
import { DailyIncomeBit,PatientListBit } from "./bitExcel";

// YYYYMMDD 정수나 문자열을 Date로 변환하는 헬퍼
function parseYyyymmdd(dateInput: string | number): string {
  const str = String(dateInput).trim();
  if (/^\d{8}$/.test(str)) {
    const y = str.slice(0, 4);
    const m = str.slice(4, 6);
    const d = str.slice(6, 8);
    return `${y}-${m}-${d}`;
  }
  return str; // fallback
}

/**
 * 파일이 Excel 바이너리 파일인지 확인 (xlsx, xls)
 * xlsx: PK 시그니처 (ZIP 파일)
 * xls: D0 CF 11 E0 시그니처 (OLE2 compound document)
 */
function isExcelBinaryFile(buffer: ArrayBuffer): boolean {
  const uint8 = new Uint8Array(buffer);

  // xlsx 파일 (ZIP 포맷): PK.. 시그니처
  if (uint8[0] === 0x50 && uint8[1] === 0x4B) {
    return true;
  }

  // xls 파일 (OLE2): D0 CF 11 E0 시그니처
  if (uint8[0] === 0xD0 && uint8[1] === 0xCF && uint8[2] === 0x11 && uint8[3] === 0xE0) {
    return true;
  }

  return false;
}

/**
 * 한국 병원 전산 파일(특히 BIT2) 전용 디코더
 * UTF-16LE → UTF-8 변환 + BOM 제거
 */
function decodeKoreanHospitalFile(buffer: ArrayBuffer): string {
  const uint8 = new Uint8Array(buffer);

  // 1. BOM 체크 (FF FE 또는 FE FF)
  let encoder = "utf-16le";
  if (uint8[0] === 0xFF && uint8[1] === 0xFE) {
    // BOM 있음 → 걍 utf-16le
  } else if (uint8[0] === 0xFE && uint8[1] === 0xFF) {
    encoder = "utf-16be";
  } else {
    // BOM 없으면 대부분 utf-16le
    encoder = "utf-16le";
  }

  // TextDecoder로 안전하게 변환
  return new TextDecoder(encoder).decode(uint8);
}

/**
 * 파일 타입에 따라 적절한 방법으로 Workbook 파싱
 */
function parseFileToWorkbook(buffer: ArrayBuffer): XLSX.WorkBook {
  if (isExcelBinaryFile(buffer)) {
    // xlsx/xls 바이너리 파일
    return XLSX.read(buffer, { type: "array" });
  } else {
    // CSV/텍스트 파일 (UTF-16LE 등)
    const text = decodeKoreanHospitalFile(buffer);
    console.log("첫 번째 줄 미리보기:", text.split("\n")[0]);
    return XLSX.read(text, { type: "string", raw: true });
  }
}

export async function parseDailyIncomeBit2(
  fileBuffers: ArrayBuffer[]
): Promise<DailyIncomeBit[]> {
  const data: DailyIncomeBit[] = [];

  for (const buffer of fileBuffers) {
    // 파일 타입에 따라 자동 분기 처리 (xlsx/xls/csv)
    const workbook = parseFileToWorkbook(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: true });

    if (rows.length < 2) {
      console.error("Insufficient rows in CSV");
      continue;
    }

    const headers = rows[0];
    const chartNumberIdx = headers.findIndex((h: string) => h.includes("챠트번호") || h.includes("차트번호"));
    const totalCostIdx = headers.findIndex((h: string) => h.includes("총진료비"));
    const visitDateIdx = headers.findIndex((h: string) => h.includes("수납일자") || h.includes("영수일자"));

    if (chartNumberIdx === -1 || totalCostIdx === -1 || visitDateIdx === -1) {
      console.error("Required columns missing:", { chartNumberIdx, totalCostIdx, visitDateIdx });
      console.error("Headers:", headers);
      continue;
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const chartNumberRaw = row[chartNumberIdx];
      const totalCostRaw = row[totalCostIdx];
      const visitDateRaw = row[visitDateIdx];

      if (!chartNumberRaw || totalCostRaw === undefined || !visitDateRaw) continue;

      const chartNumber = Number(chartNumberRaw);
      if (isNaN(chartNumber)) continue;

      const totalCostStr = String(totalCostRaw).replace(/,/g, "");
      const totalCost = Number(totalCostStr);
      if (isNaN(totalCost)) continue;

      // 핵심: 20001114 형식 처리
      const visitDate = parseYyyymmdd(visitDateRaw);

      data.push({
        chartNumber,
        visitDate,
        totalCost,
      });
    }
  }

  console.log(`Processed ${data.length} records from DailyIncomeBit2 (CSV)`);
  return data;
}



export async function parsePatientListBit2(
  fileBuffers: ArrayBuffer[]
): Promise<PatientListBit[]> {
  const data: PatientListBit[] = [];

  for (const buffer of fileBuffers) {
    // 파일 타입에 따라 자동 분기 처리 (xlsx/xls/csv)
    const workbook = parseFileToWorkbook(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const allData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    });

    if (allData.length < 2) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    // Get header row (first row, index 0)
    const headers = allData[0];

    // Find the index for each required column
    const chartNumberIndex = headers.findIndex(
      (col: any) => col === "차트번호" || col === "챠트번호"
    );
    const ageIndex = headers.findIndex((col: any) => col === "나이");
    const visitTypeIndex = headers.findIndex(
      (col: any) => col === "초재진구분"
    );
    const visitDateIndex = headers.findIndex((col: any) => col === "내원날짜"); // 추가!
    const doctorIndex = headers.findIndex((col: any) => col === "담당의");
    const addressIndex = headers.findIndex((col: any) => col === "주소");

    if (
      chartNumberIndex === -1 ||
      ageIndex === -1 ||
      visitTypeIndex === -1 ||
      visitDateIndex === -1 || // 추가!
      doctorIndex === -1 ||
      addressIndex === -1
    ) {
      console.error("❌ Required columns not found in the file");
      console.error("Available headers:", headers);
      console.error("Looking for: 차트번호, 나이, 초재진구분, 내원날짜, 담당의, 주소");
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
      if (!row[chartNumberIndex] || !row[ageIndex] || !row[visitTypeIndex] || !row[visitDateIndex]) {
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

          // 개월수는 반영하지 않는다: normalizeAge가 10년 단위로 버림 처리하므로
          // 반올림하면 예) "49세9개월"이 50대로 잘못 집계된다.
          if (!isNaN(years) && years >= 0) {
            age = normalizeAge(years);
          }
        } else {
          const ageValue = Number(ageString);
          if (!isNaN(ageValue) && ageValue >= 0) {
            age = normalizeAge(ageValue);
          }
        }
      }

      // Process visit type
      let visitType = "재진"; // Default to 재진
      if (row[visitTypeIndex]) {
        const rawVisitType = String(row[visitTypeIndex])
          .trim()
          .replace(/\s/g, "");
        if (rawVisitType === "초진" || rawVisitType === "신환") {
          visitType = "신환";
        }
      }
      let visitDate = row[visitDateIndex];
      

        if (typeof visitDate === "string") {
          // Handle formats like "2025.12.1" or "2025-12-01" or "2025년 12월 01일" or "20251201"
          if (visitDate.includes("년") && visitDate.includes("월") && visitDate.includes("일")) {
          
            const match = visitDate.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
            if (match) {
              const [, year, month, day] = match;
              visitDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
            }
          } else if (visitDate.includes(".")) {
          
            // Format "2025.12.1" → "2025-12-01"
            const parts = visitDate.split(".");
            if (parts.length === 3) {
              visitDate = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
            }
          } else if (visitDate.includes("/")) {
          
            // Format "2025/12/1" → "2025-12-01"
            const parts = visitDate.split("/");
            if (parts.length === 3) {
              visitDate = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
            }
          } else if (/^\d{8}$/.test(visitDate)) {
          
            // Format "20251201" → "2025-12-01"
            visitDate = parseYyyymmdd(visitDate);
          } else {
            
          }
        } else if (typeof visitDate === "number") {
        
          // Excel serial date or YYYYMMDD number
          if (visitDate > 19000000 && visitDate < 21000000) {
            
            // Looks like YYYYMMDD
            visitDate = parseYyyymmdd(visitDate);
          } else {
          
            // Excel serial
            visitDate = excelSerialToDate(visitDate);
          }
        } else {
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
        visitDate: String(visitDate), // 추가!
        doctor,
        address,
      };

      data.push(patientData);
    }
  }

  return data;
}

export function excelSerialToDate(serial: number): string {
  // Input validation
  if (serial < 0) {
    throw new Error("Invalid Excel serial date: cannot be negative");
  }

  if (serial < 1) {
    throw new Error(
      "Invalid Excel serial date: cannot represent dates before 1900-01-01"
    );
  }

  // Adjust for Excel's leap year bug
  // Serial number 60 in Excel represents the non-existent Feb 29, 1900
  let adjustedSerial = serial;
  if (serial >= 60) {
    adjustedSerial = serial - 1;
  }

  // Calculate the date
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  // Excel dates start from December 30, 1899 (day 0 in Excel)
  const baseDate = new Date(Date.UTC(1899, 11, 30));
  const targetDate = new Date(
    baseDate.getTime() + (adjustedSerial + 1) * millisecondsPerDay  // +1 추가
  );

  // Format the date as YYYY-MM-DD using UTC to avoid timezone issues
  const year = targetDate.getUTCFullYear();
  const month = String(targetDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
