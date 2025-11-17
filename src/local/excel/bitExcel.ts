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
  doctor: string; // 담당의
  address: string; // 주소
}


/* 
export async function parseDailyIncomeBit(
  files: File[]                     // ← File 객체 배열
): Promise<DailyIncomeBit[]> {
  const result: DailyIncomeBit[] = [];

  for (const file of files) {
    let workbook: XLSX.WorkBook;
    try { workbook = await readWorkbook(file); }
    catch (e) { console.error(`Failed to read ${file.name}`, e); continue; }

    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<any[]>(ws, {
      header: 1,
      defval: '',
    });

    if (raw.length < 2) continue;

    const headers = raw[0];
    const idx = {
      chart: headers.findIndex(c => ['챠트번호', '차트번호'].includes(c)),
      cost : headers.findIndex(c => c === '총진료비'),
      date : headers.findIndex(c => ['수납일자', '영수일자'].includes(c)),
    };
    if (Object.values(idx).some(i => i === -1)) continue;

    for (let i = 1; i < raw.length; i++) {
      const row = raw[i];
      if (!row[idx.chart]) continue;

      const chartNumber = Number(row[idx.chart]);
      if (isNaN(chartNumber)) continue;

      let cost = row[idx.cost];
      if (typeof cost === 'string') cost = cost.replace(/,/g, '');
      const totalCost = Number(cost);
      if (isNaN(totalCost)) continue;

      let visitDate = row[idx.date];
      if (typeof visitDate === 'string') {
        visitDate = visitDate.trim();
        // 한국식 "2025년 06월 19일"
        const kor = visitDate.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
        if (kor) {
          const [, y, m, d] = kor;
          visitDate = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
        } else if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/.test(visitDate)) {
          visitDate = visitDate.replace(/\//g, '-');
        }
      } else if (typeof visitDate === 'number') {
        visitDate = excelSerialToDate(visitDate);
      }

      result.push({ chartNumber, visitDate: String(visitDate), totalCost });
    }
  }
  return result;
}

*/


/* ---------- 공통: 워크북 읽기 ---------- */
async function readWorkbook(buffer: ArrayBuffer, fileName: string): Promise<XLSX.WorkBook> {
  const isCsv = fileName.toLowerCase().endsWith(".csv");

  if (isCsv) {
    const text = new TextDecoder("utf-8").decode(buffer).replace(/^\uFEFF/, "");
    return XLSX.read(text, { type: "string", raw: false });
  } else {
    return XLSX.read(buffer, { type: "array" });
  }
}



/* ---------- 날짜 정규화 함수 ---------- */
function normalizeDate(dateValue: any): string {
  // 비어있으면 빈 문자열 반환
  if (!dateValue) return "";

  let dateStr = String(dateValue).trim();
  
  // 1. 한글 날짜 형식: 2024년 11월 17일
  const korPattern = /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/;
  const korMatch = dateStr.match(korPattern);
  if (korMatch) {
    const [, y, m, d] = korMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  
  // 2. 슬래시 구분자: 2024/11/17 또는 11/16/24
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    
    // 형식: MM/DD/YY 또는 M/D/YY
    if (parts.length === 3 && parts[2].length === 2) {
      const [m, d, y] = parts;
      const fullYear = Number(y) >= 0 && Number(y) <= 50 ? `20${y}` : `19${y}`;
      return `${fullYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    
    // 형식: YYYY/MM/DD
    if (parts.length === 3 && parts[0].length === 4) {
      const [y, m, d] = parts;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  
  // 3. 하이픈 구분자: 2024-11-17
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const [y, m, d] = parts;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  
  // 4. 8자리 숫자: 20241117
  if (/^\d{8}$/.test(dateStr)) {
    const y = dateStr.slice(0, 4);
    const m = dateStr.slice(4, 6);
    const d = dateStr.slice(6, 8);
    return `${y}-${m}-${d}`;
  }
  
  // 5. 엑셀 시리얼 번호 (1 ~ 99999 범위의 숫자)
  const numValue = Number(dateStr);
  if (!isNaN(numValue) && numValue > 0 && numValue < 100000) {
    return excelSerialToDate(numValue);
  }
  
  // 변환 실패시 원본 반환
  return dateStr;
}


/* ---------- DailyIncomeBit ---------- */

/* ---------- DailyIncomeBit ---------- */
export async function parseDailyIncomeBit(
  buffers: ArrayBuffer[],
  fileNames: string[]
): Promise<DailyIncomeBit[]> {
  const result: DailyIncomeBit[] = [];

  for (let i = 0; i < buffers.length; i++) {
    const buffer = buffers[i];
    const fileName = fileNames[i] || `file_${i}`;

    let workbook: XLSX.WorkBook;
    try {
      workbook = await readWorkbook(buffer, fileName);
    } catch (err) {
      console.error(`Failed to read workbook: ${fileName}`, err);
      continue;
    }

    const ws = workbook.Sheets[workbook.SheetNames[0]];
    // raw: true로 원본 값 그대로 가져오기
    const raw = XLSX.utils.sheet_to_json<any[]>(ws, { 
      header: 1, 
      defval: "", 
      raw: true 
    });

    if (raw.length < 2) continue;

    const headers = raw[0];
    const idx = {
      chart: headers.findIndex((c) => ["챠트번호", "차트번호"].includes(c)),
      cost: headers.findIndex((c) => c === "총진료비"),
      date: headers.findIndex((c) => ["수납일자", "영수일자"].includes(c)),
    };

    if (Object.values(idx).some((i) => i === -1)) {
      console.warn(`Required columns not found in ${fileName}`);
      continue;
    }

    for (let rowIdx = 1; rowIdx < raw.length; rowIdx++) {
      const row = raw[rowIdx];

      // 차트번호 파싱
      if (!row[idx.chart]) continue;
      const chartNumber = Number(row[idx.chart]);
      if (isNaN(chartNumber)) continue;

      // 총진료비 파싱
      let cost = row[idx.cost];
      if (typeof cost === "string") {
        cost = cost.replace(/,/g, "");
      }
      const totalCost = Number(cost);
      if (isNaN(totalCost)) continue;

      // 날짜 파싱 및 정규화
      const visitDate = normalizeDate(row[idx.date]);
      
      result.push({ chartNumber, visitDate, totalCost });
    }
  }

  return result;
}

/* ---------- PatientListBit ---------- */
export async function parsePatientListBit(
  buffers: ArrayBuffer[],
  fileNames: string[]
): Promise<PatientListBit[]> {
  const result: PatientListBit[] = [];

  for (let i = 0; i < buffers.length; i++) {
    const buffer = buffers[i];
    const fileName = fileNames[i] || `file_${i}`;

    let workbook: XLSX.WorkBook;
    try {
      workbook = await readWorkbook(buffer, fileName);
    } catch {
      continue;
    }

    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" });

    if (raw.length < 2) continue;

    const headers = raw[0];
    const idx = {
      chart: headers.findIndex((c) => ["차트번호", "챠트번호"].includes(c)),
      age: headers.findIndex((c) => c === "나이"),
      type: headers.findIndex((c) => c === "초재진구분"),
      doctor: headers.findIndex((c) => c === "담당의"),
      addr: headers.findIndex((c) => c === "주소"),
    };

    if (Object.values(idx).some((i) => i === -1)) continue;

    for (let rowIdx = 1; rowIdx < raw.length; rowIdx++) {
      const row = raw[rowIdx];

      if (!row[idx.chart]) continue;

      const chartNumber = Number(row[idx.chart]);
      if (isNaN(chartNumber)) continue;

      // --- 나이 ---
      let age: number | null = null;
      if (row[idx.age]) {
        const txt = String(row[idx.age]).trim();
        const kor = txt.match(/(\d+)세(?:(\d+)개월)?/);
        if (kor) {
          const y = parseInt(kor[1]);
          const m = kor[2] ? parseInt(kor[2]) : 0;
          age = normalizeAge(Math.round(y + m / 12));
        } else {
          const n = Number(txt);
          if (!isNaN(n) && n >= 0) age = normalizeAge(n);
        }
      }

      const rawType = String(row[idx.type] ?? "").trim().replace(/\s/g, "");
      const visitType = rawType === "초진" || rawType === "신환" ? "신환" : "재진";

      const doctor = row[idx.doctor] ? String(row[idx.doctor]).trim() : "";
      const address = row[idx.addr] ? String(row[idx.addr]).trim() : "N/A";

      result.push({ chartNumber, age, visitType, doctor, address });
    }
  }

  return result;
}










