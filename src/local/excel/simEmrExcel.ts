import * as XLSX from "xlsx";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const iconv: { decode(buf: Buffer, encoding: string): string } = require("iconv-lite");
import { normalizeAge } from "../ExcelParser";

export interface DailyVisitSimEmr {
  chartNumber: number;
  address: string;
  department: string; // 진료과
  inOut: string; // 외/입 (외래/입원)
  visitType: string; // 구분 (초진/재진/신환) - 소스에서 직접 제공
  routeReason: string; // 방문경로 사유 (필수 아님, 공란 가능)
  visitDate: string;
  totalCost: number;
}

export interface PatientRouteSimEmr {
  chartNumber: number;
  age: number | null;
  route: string; // 방문경로
  reason: string; // 방문사유
}

// Postgres integer(int4) 컬럼 범위. 미등록/워크인 환자용 더미 번호가
// 이 범위를 넘어서면 DB insert가 실패하므로 파싱 단계에서 걸러낸다.
const MAX_INT4 = 2147483647;

// SIMEMR을 포함한 일부 구형 EMR은 "엑셀로 내보내기"가 사실 진짜 xls(BIFF)가 아니라
// EUC-KR로 인코딩된 탭/콤마 구분 텍스트 파일에 .xls 확장자만 붙인 것이다.
// 매직 바이트로 실제 포맷을 구분해서 각각 다르게 처리한다.
//  - zip(PK..)        : 진짜 .xlsx → 그대로 파싱 (UTF-8, 문제 없음)
//  - OLE(D0 CF 11 E0) : 진짜 구형 .xls(BIFF) → 드물게 코드페이지 라벨이 틀려 깨질 수 있어 보정
//  - 그 외            : 순수 구분자 텍스트 → EUC-KR로 직접 디코딩 후 문자열로 파싱
type FileFormat = "zip" | "ole" | "text";

function detectFormat(buffer: ArrayBuffer): FileFormat {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "zip";
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) return "ole";
  return "text";
}

function fixMojibake(value: any): any {
  if (typeof value !== "string") return value;
  try {
    const decoded = iconv.decode(Buffer.from(value, "latin1"), "euc-kr");
    return decoded.includes("�") ? value : decoded;
  } catch {
    return value;
  }
}

function readRows(buffer: ArrayBuffer): any[][] {
  const format = detectFormat(buffer);
  const rows: any[][] = [];

  if (format === "text") {
    const text = iconv.decode(Buffer.from(new Uint8Array(buffer)), "euc-kr");
    const workbook = XLSX.read(text, { type: "string" });
    for (const sheetName of workbook.SheetNames) {
      const sheetRows = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[sheetName], {
        header: 1,
        range: 0,
      });
      for (const row of sheetRows) {
        if (Array.isArray(row)) rows.push(row);
      }
    }
    return rows;
  }

  const workbook = XLSX.read(buffer, { type: "array" });
  for (const sheetName of workbook.SheetNames) {
    const sheetRows = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[sheetName], {
      header: 1,
      range: 0,
    });
    for (const row of sheetRows) {
      if (!Array.isArray(row)) continue;
      rows.push(format === "ole" ? row.map(fixMojibake) : row);
    }
  }
  return rows;
}

// 다양한 환자번호 표기("000000020303", "20303 ", "20-303" 등)를 숫자로 정규화한다.
function parseChartNumber(raw: any): number {
  if (raw === null || raw === undefined || raw === "") return NaN;
  if (typeof raw === "number") return raw;
  const digitsOnly = String(raw).trim().replace(/[^0-9]/g, "");
  if (!digitsOnly) return NaN;
  const stripped = digitsOnly.replace(/^0+(?=\d)/, "");
  return Number(stripped);
}

function isValidChartNumber(chartNumber: number): boolean {
  return !isNaN(chartNumber) && chartNumber > 0 && chartNumber <= MAX_INT4;
}

function excelSerialToDateString(raw: any): string {
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
  return String(raw ?? "").replace(/\([^)]*\)$/, "").trim();
}

function parseAmount(value: any): number {
  if (value === null || value === undefined || value === "") return 0;
  const str = String(value).trim().replace(/,/g, "").replace(/[^\d.-]/g, "");
  const amount = Number(str);
  return isNaN(amount) ? 0 : amount;
}

interface DailyVisitColMap {
  visitDate: number;
  department: number;
  inOut: number;
  visitType: number;
  routeReason: number;
  totalCost: number;
  chartNumber: number;
  address: number;
}

// 파일 안에서 섹션(부서/기간)별로 헤더 행이 반복되고, 그 사이사이에
// "소 계"/"합 계" 요약 행이 끼어 있다. 진료기간 컬럼이 숫자(엑셀 시리얼 날짜)인
// 행만 실제 데이터 행으로 취급하면 헤더/소계/합계 행이 전부 자연스럽게 걸러진다.
export async function parseDailyVisitSimEmr(
  fileBuffers: ArrayBuffer[]
): Promise<DailyVisitSimEmr[]> {
  const data: DailyVisitSimEmr[] = [];

  for (const buffer of fileBuffers) {
    const rows = readRows(buffer);
    let col: DailyVisitColMap | null = null;

    for (const row of rows) {
      if (!row || row.length === 0) continue;

      if (
        row.includes("진료기간") &&
        row.includes("진료과") &&
        row.includes("총진료비")
      ) {
        col = {
          visitDate: row.indexOf("진료기간"),
          department: row.indexOf("진료과"),
          inOut: row.indexOf("외/입"),
          visitType: row.indexOf("구분"),
          routeReason: row.indexOf("방문경로 사유"),
          totalCost: row.indexOf("총진료비"),
          chartNumber: row.indexOf("환자번호"),
          address: row.indexOf("주소"),
        };
        continue;
      }

      if (!col) continue;

      const rawDate = row[col.visitDate];
      if (typeof rawDate !== "number") continue;

      const chartNumberRaw = col.chartNumber !== -1 ? row[col.chartNumber] : null;
      const chartNumber = parseChartNumber(chartNumberRaw);
      if (!isValidChartNumber(chartNumber)) {
        console.warn(`⚠️ Skipping row: invalid/missing chart number: ${chartNumberRaw}`);
        continue;
      }

      const address =
        col.address !== -1 && row[col.address]
          ? String(row[col.address]).trim()
          : "N/D";
      const department =
        col.department !== -1 ? String(row[col.department] ?? "").trim() : "";
      const inOut = col.inOut !== -1 ? String(row[col.inOut] ?? "").trim() : "";
      const visitType =
        col.visitType !== -1 ? String(row[col.visitType] ?? "").trim() : "";
      const routeReason =
        col.routeReason !== -1 && row[col.routeReason] !== undefined
          ? String(row[col.routeReason] ?? "").trim()
          : "";

      data.push({
        chartNumber,
        address,
        department,
        inOut,
        visitType,
        routeReason,
        visitDate: excelSerialToDateString(rawDate),
        totalCost: parseAmount(row[col.totalCost]),
      });
    }
  }
  return data;
}

interface PatientRouteColMap {
  chartNumber: number;
  age: number;
  route: number;
  reason: number;
}

export async function parsePatientRouteSimEmr(
  fileBuffers: ArrayBuffer[]
): Promise<PatientRouteSimEmr[]> {
  const data: PatientRouteSimEmr[] = [];

  for (const buffer of fileBuffers) {
    const rows = readRows(buffer);
    let col: PatientRouteColMap | null = null;

    for (const row of rows) {
      if (!row || row.length === 0) continue;

      if (row.includes("환자번호") && row.includes("나이")) {
        col = {
          chartNumber: row.indexOf("환자번호"),
          age: row.indexOf("나이"),
          route: row.indexOf("방문경로"),
          reason: row.indexOf("방문사유"),
        };
        continue;
      }

      if (!col) continue;

      const chartNumberRaw = row[col.chartNumber];
      if (chartNumberRaw === undefined || chartNumberRaw === null || chartNumberRaw === "") {
        continue; // "[건수] N명" 같은 요약 행은 이 컬럼이 비어있어 자연스럽게 걸러진다
      }

      const chartNumber = parseChartNumber(chartNumberRaw);
      if (!isValidChartNumber(chartNumber)) {
        console.warn(`⚠️ Skipping row: invalid/missing chart number: ${chartNumberRaw}`);
        continue;
      }

      const ageRaw = row[col.age];
      const age =
        ageRaw !== undefined && ageRaw !== null && ageRaw !== "" && !isNaN(Number(ageRaw))
          ? normalizeAge(Number(ageRaw))
          : null;

      const route =
        col.route !== -1 && row[col.route] !== undefined
          ? String(row[col.route] ?? "").trim()
          : "";
      const reason =
        col.reason !== -1 && row[col.reason] !== undefined
          ? String(row[col.reason] ?? "").trim()
          : "";

      data.push({ chartNumber, age, route, reason });
    }
  }
  return data;
}
