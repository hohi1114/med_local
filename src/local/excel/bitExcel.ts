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
    return XLSX.read(text, { type: "string" });
  } else {
    return XLSX.read(buffer, { type: "array" });
  }
}

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
    } catch {
      continue;
    }

    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" });

    if (raw.length < 2) continue;

    const headers = raw[0];
    const idx = {
      chart: headers.findIndex((c) => ["챠트번호", "차트번호"].includes(c)),
      cost: headers.findIndex((c) => c === "총진료비"),
      date: headers.findIndex((c) => ["수납일자", "영수일자"].includes(c)),
    };

    if (Object.values(idx).some((i) => i === -1)) continue;

    for (let rowIdx = 1; rowIdx < raw.length; rowIdx++) {
      const row = raw[rowIdx];

      if (!row[idx.chart]) continue;

      const chartNumber = Number(row[idx.chart]);
      if (isNaN(chartNumber)) continue;

      let cost = row[idx.cost];
      if (typeof cost === "string") cost = cost.replace(/,/g, "");
      const totalCost = Number(cost);
      if (isNaN(totalCost)) continue;

      let visitDate = row[idx.date];

      if (typeof visitDate === "string") {
        visitDate = visitDate.trim();
        const kor = visitDate.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
        if (kor) {
          const [, y, m, d] = kor;
          visitDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        } else if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/.test(visitDate)) {
          visitDate = visitDate.replace(/\//g, "-");
        }
      } else if (typeof visitDate === "number") {
        visitDate = excelSerialToDate(visitDate);
      }

      result.push({ chartNumber, visitDate: String(visitDate), totalCost });
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










