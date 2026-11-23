// 업로드 실패 진단용 파일 검사기 (Electron main 전용).
// 파서가 조용히 빈 배열을 반환했을 때 "어느 파일의 어느 컬럼이 없는지"를 알아내기 위해
// 파일의 헤더 행만 다시 읽어 PARSER_SPECS 와 대조한다.
// 환자 데이터 행은 읽지도, 반환하지도 않는다 (헤더 컬럼명만 반환).
import * as XLSX from "xlsx";
import iconv from "iconv-lite";
import { ColumnSpec, FileFormat, FileInspection, PARSER_SPECS } from "./uploadParserSpecs";

const HEADER_SCAN_ROWS = 30;
const MAX_HEADER_CELLS = 80;
const MAX_HEADER_CELL_LENGTH = 40;
const MAX_SHEET_NAMES = 10;

type Cell = unknown;

interface SheetGrid {
  sheet_name: string;
  total_rows: number;
  rows: Cell[][];
}

interface HeaderHit {
  sheet_index: number;
  row_index: number;
  score: number;
  sheets: SheetGrid[];
}

function detectFormat(buffer: ArrayBuffer): FileFormat {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "xlsx";
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf) return "xls";
  return "text";
}

function sheetToGrid(workbook: XLSX.WorkBook, sheet_name: string): SheetGrid {
  const sheet = workbook.Sheets[sheet_name];
  const fullRef = (sheet["!fullref"] ?? sheet["!ref"]) as string | undefined;
  const total_rows = fullRef ? XLSX.utils.decode_range(fullRef).e.r + 1 : 0;
  const rows = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, range: 0 });
  return { sheet_name, total_rows, rows: rows.filter(Array.isArray) };
}

function workbookToGrids(workbook: XLSX.WorkBook): SheetGrid[] {
  return workbook.SheetNames.map((name) => sheetToGrid(workbook, name));
}

function fixMojibake(cell: Cell): Cell {
  if (typeof cell !== "string") return cell;
  const decoded = iconv.decode(Buffer.from(cell, "latin1"), "euc-kr");
  return decoded.includes("�") ? cell : decoded;
}

function fixGridsMojibake(grids: SheetGrid[]): SheetGrid[] {
  return grids.map((grid) => ({
    ...grid,
    rows: grid.rows.map((row) => row.map(fixMojibake)),
  }));
}

// 확장자만 .xls 인 EUC-KR/UTF-8 텍스트 파일이 있어 인코딩 후보를 모두 만들어 본다.
function readTextCandidates(buffer: ArrayBuffer): SheetGrid[][] {
  const raw = Buffer.from(new Uint8Array(buffer));
  return [raw.toString("utf8"), iconv.decode(raw, "euc-kr")].map((text) =>
    workbookToGrids(XLSX.read(text, { type: "string", sheetRows: HEADER_SCAN_ROWS }))
  );
}

function readCandidates(buffer: ArrayBuffer, format: FileFormat): SheetGrid[][] {
  if (format === "text") return readTextCandidates(buffer);
  const workbook = XLSX.read(buffer, { type: "array", sheetRows: HEADER_SCAN_ROWS });
  const grids = workbookToGrids(workbook);
  return format === "xls" ? [grids, fixGridsMojibake(grids)] : [grids];
}

function cellText(cell: Cell, trim: boolean): string {
  const text = cell === null || cell === undefined ? "" : String(cell);
  return trim ? text.trim() : text;
}

function rowHasColumn(row: Cell[], column: ColumnSpec, trim: boolean): boolean {
  return row.some((cell) => {
    const text = cellText(cell, trim);
    return column.aliases.some((alias) =>
      column.match === "includes" ? text.includes(alias) : text === alias
    );
  });
}

function scoreRow(row: Cell[], columns: ColumnSpec[]): number {
  return columns.filter((column) => rowHasColumn(row, column, true)).length;
}

function bestRowInSheet(grid: SheetGrid, columns: ColumnSpec[]) {
  let best = { row_index: -1, score: 0 };
  grid.rows.slice(0, HEADER_SCAN_ROWS).forEach((row, row_index) => {
    const score = scoreRow(row, columns);
    if (score > best.score) best = { row_index, score };
  });
  return best;
}

function findHeader(sheets: SheetGrid[], columns: ColumnSpec[]): HeaderHit | null {
  let hit: HeaderHit | null = null;
  sheets.forEach((grid, sheet_index) => {
    const best = bestRowInSheet(grid, columns);
    if (best.score > (hit?.score ?? 0)) hit = { ...best, sheet_index, sheets };
  });
  return hit;
}

function findBestHeader(candidates: SheetGrid[][], columns: ColumnSpec[]): HeaderHit | null {
  let best: HeaderHit | null = null;
  for (const sheets of candidates) {
    const hit = findHeader(sheets, columns);
    if (hit && hit.score > (best?.score ?? 0)) best = hit;
  }
  return best;
}

// 헤더 행의 컬럼명만 남긴다. 숫자/날짜 셀은 버려 데이터 행이 섞여도 값이 새지 않게 한다.
function toHeaderNames(row: Cell[]): string[] {
  return row
    .filter((cell): cell is string => typeof cell === "string" && cell.trim() !== "")
    .slice(0, MAX_HEADER_CELLS)
    .map((cell) => cell.slice(0, MAX_HEADER_CELL_LENGTH));
}

// 파서와 동일하게 공백을 다듬지 않고 비교한다. "차트번호 " 처럼 공백이 붙은 헤더는 누락으로 잡힌다.
function listMissing(row: Cell[], columns: ColumnSpec[], isRequired: boolean): string[] {
  return columns
    .filter((column) => column.required === isRequired)
    .filter((column) => !rowHasColumn(row, column, false))
    .map((column) => column.aliases.join("|"));
}

function emptyInspection(format: FileFormat | null, error: string | null): FileInspection {
  return {
    format,
    sheet_names: [],
    total_rows: null,
    header_sheet: null,
    header_sheet_index: null,
    header_row: null,
    found_headers: [],
    missing_required: [],
    missing_optional: [],
    error,
  };
}

function describeHeader(hit: HeaderHit, columns: ColumnSpec[]) {
  const grid = hit.sheets[hit.sheet_index];
  const row = grid.rows[hit.row_index];
  return {
    total_rows: grid.total_rows,
    header_sheet: grid.sheet_name,
    header_sheet_index: hit.sheet_index,
    header_row: hit.row_index + 1,
    found_headers: toHeaderNames(row),
    missing_required: listMissing(row, columns, true),
    missing_optional: listMissing(row, columns, false),
  };
}

function describeNoHeader(sheets: SheetGrid[], columns: ColumnSpec[]) {
  return {
    total_rows: sheets[0]?.total_rows ?? 0,
    missing_required: listMissing([], columns, true),
    missing_optional: listMissing([], columns, false),
    error: "기대하는 컬럼명이 포함된 헤더 행을 찾지 못했습니다",
  };
}

function inspectBuffer(buffer: ArrayBuffer, columns: ColumnSpec[]): FileInspection {
  const format = detectFormat(buffer);
  const candidates = readCandidates(buffer, format);
  const hit = findBestHeader(candidates, columns);
  const sheets = hit?.sheets ?? candidates[0] ?? [];
  const sheet_names = sheets.map((grid) => grid.sheet_name).slice(0, MAX_SHEET_NAMES);
  const base = { ...emptyInspection(format, null), sheet_names };
  const described = hit ? describeHeader(hit, columns) : describeNoHeader(sheets, columns);
  // 텍스트 파일은 상위 행만 읽으므로 전체 행 수를 알 수 없다.
  const total_rows = format === "text" ? null : described.total_rows;
  return { ...base, ...described, total_rows };
}

function inspectBufferSafely(buffer: ArrayBuffer, columns: ColumnSpec[]): FileInspection {
  try {
    return inspectBuffer(buffer, columns);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return emptyInspection(null, `파일을 읽지 못했습니다: ${message}`);
  }
}

export function inspectUploadFiles(
  parserName: string,
  fileBuffers: ArrayBuffer[]
): FileInspection[] {
  const spec = PARSER_SPECS[parserName];
  if (!spec) return [];
  return fileBuffers.map((buffer) => inspectBufferSafely(buffer, spec.columns));
}
