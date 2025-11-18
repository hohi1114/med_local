
import * as XLSX from "xlsx";
import { excelSerialToDate } from "../ExcelParser";
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

import { Buffer } from "buffer"; // Electron은 기본 있음

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

export async function parseDailyIncomeBit2(
  fileBuffers: ArrayBuffer[]
): Promise<DailyIncomeBit[]> {
  const data: DailyIncomeBit[] = [];
  
for (const buffer of fileBuffers) {
  let text: string;

  try {
    // 첫 번째 시도: 한국 병원 전산 전용 디코더 (이게 정답!)
    text = decodeKoreanHospitalFile(buffer);
  } catch (e) {
    console.warn("UTF-16 실패 → CP949로 재시도");
    // 만약에 UTF-16이 아니면 CP949 fallback
    const { default: iconv } = await import("iconv-lite");
    text = iconv.decode(Buffer.from(buffer), "cp949");
  }

  // 이제 이 text는 완벽한 UTF-8 문자열!
  console.log("첫 번째 줄 미리보기:", text.split("\n")[0]); // 디버깅용
    // CSV → Workbook → 첫 번째 시트
    const workbook = XLSX.read(text, { type: "string" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

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
  let text: string;

  try {
    // 첫 번째 시도: 한국 병원 전산 전용 디코더 (이게 정답!)
    text = decodeKoreanHospitalFile(buffer);
  } catch (e) {
    console.warn("UTF-16 실패 → CP949로 재시도");
    // 만약에 UTF-16이 아니면 CP949 fallback
    const { default: iconv } = await import("iconv-lite");
    text = iconv.decode(Buffer.from(buffer), "cp949");
  }

  // 이제 이 text는 완벽한 UTF-8 문자열!
  console.log("첫 번째 줄 미리보기:", text.split("\n")[0]); // 디버깅용
    const workbook = XLSX.read(text, { type: "string" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    if (rows.length < 2) continue;

    const headers = rows[0];
    const chartNumberIdx = headers.findIndex((h: string) => h.includes("차트번호"));
    const ageIdx = headers.findIndex((h: string) => h.includes("나이"));
    const visitTypeIdx = headers.findIndex((h: string) => h.includes("초재진구분"));
    const doctorIdx = headers.findIndex((h: string) => h.includes("담당의"));
    const addressIdx = headers.findIndex((h: string) => h.includes("주소"));

    if ([chartNumberIdx, ageIdx, visitTypeIdx, doctorIdx, addressIdx].some(i => i === -1)) {
      console.error("Missing required columns in PatientListBit2");
      continue;
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const chartNumber = Number(row[chartNumberIdx]);
      if (isNaN(chartNumber)) continue;

      // 나이 처리 (기존 로직과 동일)
      let age: number | null = null;
      const ageStr = String(row[ageIdx] || "").trim();
      const koreanAge = ageStr.match(/(\d+)세(?:\s*(\d+)개월)?/);
      if (koreanAge) {
        const years = parseInt(koreanAge[1]);
        const months = koreanAge[2] ? parseInt(koreanAge[2]) : 0;
        age = normalizeAge(Math.round(years + months / 12));
      } else if (/^\d+$/.test(ageStr)) {
        age = normalizeAge(Number(ageStr));
      }

      // 초재진구분
      const rawVisitType = String(row[visitTypeIdx] || "").trim().replace(/\s/g, "");
      const visitType = rawVisitType === "초진" || rawVisitType === "신환" ? "신환" : "재진";

      const doctor = String(row[doctorIdx] || "").trim();
      const address = String(row[addressIdx] || "").trim() || "N/A";

      data.push({ chartNumber, age, visitType, doctor, address });
    }
  }

  console.log(`Processed ${data.length} records from PatientListBit2 (CSV)`);
  return data;
}