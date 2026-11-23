// 원내 데이터 업로드 진단 로그.
// 업로드 1회의 각 단계(파싱 → 병합 → 지오코딩 → 백엔드 전송)를 기록해 백엔드 upload_logs 에 남긴다.
// 환자 데이터는 담지 않는다: 행 수, 비어 있는 필드 개수, 파일명, 헤더 컬럼명만 기록한다.
import { apiRequest } from "./api/apihelper";
import { FileInspection, PARSER_SPECS } from "../local/uploadParserSpecs";

type StepKind = "read" | "parse" | "derive" | "merge" | "process" | "upload";
type UploadLogStatus = "success" | "warning" | "empty" | "failed";
type ElectronApi = Window["electron"];
type Row = Record<string, unknown>;

interface FileLog extends Partial<FileInspection> {
  file_name: string;
  file_size: number;
}

interface StepLog {
  step: string;
  kind: StepKind;
  file_role: string | null;
  ok: boolean;
  rows: number | null;
  duration_ms: number;
  error: string | null;
  empty_fields: Record<string, number>;
  files: FileLog[];
}

export interface UploadDiagnostics {
  electron: ElectronApi;
  trackUpload: <T>(uploadPromise: Promise<T>) => Promise<T>;
  fail: (error: unknown) => void;
}

const UPLOAD_STEP = "uploadToBackend";
const MAX_TEXT_LENGTH = 1000;
const STEP_KINDS: [string, StepKind][] = [
  ["parse", "parse"],
  ["derive", "derive"],
  ["merge", "merge"],
  ["processDataLocally", "process"],
];

const toMessage = (error: unknown): string =>
  (error instanceof Error ? error.message : String(error)).slice(0, MAX_TEXT_LENGTH);

const stepKindOf = (name: string): StepKind | null =>
  STEP_KINDS.find(([prefix]) => name.startsWith(prefix))?.[1] ?? null;

const isBufferList = (value: unknown): value is ArrayBuffer[] =>
  Array.isArray(value) && value.length > 0 && value.every((v) => v instanceof ArrayBuffer);

const isEmptyValue = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  value === "" ||
  value === "N/D" ||
  (typeof value === "number" && Number.isNaN(value));

// 파서/병합 결과에서 행 배열을 꺼낸다. 지오코딩 결과는 { patient_records, date_location_groups } 형태.
function rowsOf(result: unknown): unknown[] | null {
  if (Array.isArray(result)) return result;
  const records = (result as { patient_records?: unknown } | null)?.patient_records;
  return Array.isArray(records) ? records : null;
}

function addEmptyFields(counts: Record<string, number>, row: unknown): void {
  if (typeof row !== "object" || row === null) return;
  for (const [field, value] of Object.entries(row as Row)) {
    if (isEmptyValue(value)) counts[field] = (counts[field] ?? 0) + 1;
  }
}

function countEmptyFields(rows: unknown[]): Record<string, number> {
  const counts: Record<string, number> = {};
  rows.forEach((row) => addEmptyFields(counts, row));
  return counts;
}

function newStep(step: string, kind: StepKind): StepLog {
  return {
    step,
    kind,
    file_role: PARSER_SPECS[step]?.file_role ?? null,
    ok: true,
    rows: null,
    duration_ms: 0,
    error: null,
    empty_fields: {},
    files: [],
  };
}

// 파서에 넘어간 버퍼가 어느 업로드 칸의 파일인지 (개수 + 바이트 크기)로 찾아 파일명을 붙인다.
function matchFiles(buffers: ArrayBuffer[], fileLists: File[][]): FileLog[] {
  const matched = fileLists.find(
    (files) =>
      files.length === buffers.length &&
      files.every((file, index) => file.size === buffers[index].byteLength)
  );
  return buffers.map((buffer, index) => ({
    file_name: matched?.[index]?.name ?? `(파일 ${index + 1})`,
    file_size: buffer.byteLength,
  }));
}

const formatMissing = (file: FileLog): string =>
  file.error && !file.missing_required?.length
    ? `'${file.file_name}': ${file.error}`
    : `'${file.file_name}': 필수 컬럼 없음 [${(file.missing_required ?? []).join(", ")}]`;

function describeEmptyParse(step: StepLog): string {
  const broken = step.files.filter((file) => file.error || file.missing_required?.length);
  const head = `${step.file_role ?? step.step}(${step.files.length}개 파일) 0행 파싱`;
  return broken.length > 0
    ? `${head} — ${broken.map(formatMissing).join("; ")}`
    : `${head} — 헤더는 정상, 데이터 행이 조건에 맞지 않음`;
}

function buildSummary(status: UploadLogStatus, steps: StepLog[]): string {
  const failed = steps.find((step) => !step.ok);
  if (failed) return `[${failed.kind}] ${failed.step} 실패: ${failed.error}`;
  if (status === "success") return "정상 업로드";
  const emptyParses = steps.filter((step) => step.kind === "parse" && step.rows === 0);
  if (emptyParses.length > 0) return emptyParses.map(describeEmptyParse).join(" / ");
  const firstEmpty = steps.find((step) => step.rows === 0);
  return `${firstEmpty?.step ?? "처리"} 결과 0행 (파싱은 됐으나 병합/처리 후 남은 행 없음)`;
}

function resolveStatus(steps: StepLog[]): UploadLogStatus {
  if (steps.some((step) => !step.ok)) return "failed";
  const processed = [...steps].reverse().find((step) => step.kind === "process");
  if (!processed || processed.rows === 0) return "empty";
  const hasEmptyParse = steps.some((step) => step.kind === "parse" && step.rows === 0);
  return hasEmptyParse ? "warning" : "success";
}

class UploadSession {
  private readonly started_at = new Date();
  private readonly steps: StepLog[] = [];
  private readonly buffersByStep = new Map<StepLog, ArrayBuffer[]>();
  private backend_response: unknown = null;
  private sent = false;

  constructor(
    private readonly emr_type: string,
    private readonly fileLists: File[][]
  ) {}

  private beginStep(step: string, kind: StepKind, args: unknown[]): StepLog {
    const log = newStep(step, kind);
    const buffers = args[0];
    if (kind === "parse" && isBufferList(buffers)) {
      log.files = matchFiles(buffers, this.fileLists);
      this.buffersByStep.set(log, buffers);
    }
    this.steps.push(log);
    return log;
  }

  private recordResult(log: StepLog, result: unknown): void {
    const rows = rowsOf(result);
    if (!rows) return;
    log.rows = rows.length;
    log.empty_fields = countEmptyFields(rows);
  }

  async runStep<T>(step: string, kind: StepKind, args: unknown[], invoke: () => Promise<T>) {
    const log = this.beginStep(step, kind, args);
    const startedAt = performance.now();
    try {
      const result = await invoke();
      this.recordResult(log, result);
      return result;
    } catch (error) {
      log.ok = false;
      log.error = toMessage(error);
      throw error;
    } finally {
      log.duration_ms = Math.round(performance.now() - startedAt);
    }
  }

  // 추적 대상 단계 밖(파일 읽기 등)에서 난 오류도 한 줄로 남긴다.
  fail(error: unknown): void {
    if (!this.steps.some((step) => !step.ok)) {
      const log = newStep("readFiles", "read");
      Object.assign(log, { ok: false, error: toMessage(error) });
      this.steps.push(log);
    }
    void this.finish();
  }

  trackUpload<T>(uploadPromise: Promise<T>): Promise<T> {
    const tracked = this.runStep(UPLOAD_STEP, "upload", [], () => uploadPromise);
    const settle = (response: unknown) => {
      this.backend_response = response;
      void this.finish();
    };
    tracked.then(settle, () => settle(null));
    return tracked;
  }

  private async inspectStep(log: StepLog, buffers: ArrayBuffer[]): Promise<void> {
    const inspections = await window.electron.inspectUploadFiles(log.step, buffers);
    log.files = log.files.map((file, index) => ({ ...file, ...inspections[index] }));
  }

  // 정상 업로드가 아닐 때만 파일 헤더를 다시 읽어 누락 컬럼을 찾는다.
  private async inspectFiles(): Promise<void> {
    for (const [log, buffers] of this.buffersByStep) {
      try {
        await this.inspectStep(log, buffers);
      } catch (error) {
        console.warn(`⚠️ Failed to inspect files of ${log.step}:`, error);
      }
    }
  }

  private async buildPayload(status: UploadLogStatus) {
    const failed = this.steps.find((step) => !step.ok);
    return {
      emr_type: this.emr_type,
      status,
      failed_stage: failed?.kind ?? null,
      failed_step: failed?.step ?? null,
      error_message: failed?.error ?? null,
      summary: buildSummary(status, this.steps).slice(0, MAX_TEXT_LENGTH),
      app_version: await window.electron.getAppVersion().catch(() => null),
      started_at: this.started_at.toISOString(),
      duration_ms: Date.now() - this.started_at.getTime(),
      steps: this.steps,
      backend_response: this.backend_response,
    };
  }

  // 로그 전송 실패가 업로드 흐름에 영향을 주면 안 되므로 여기서 모든 오류를 삼킨다.
  private async finish(): Promise<void> {
    if (this.sent) return;
    this.sent = true;
    try {
      const status = resolveStatus(this.steps);
      if (status !== "success") await this.inspectFiles();
      this.buffersByStep.clear();
      await apiRequest("post", "/data/upload-log", await this.buildPayload(status));
    } catch (error) {
      console.warn("⚠️ Failed to send upload log:", error);
    }
  }
}

// contextBridge 가 노출한 window.electron 은 동결(frozen)돼 있어 직접 Proxy 대상으로 쓰면
// 래핑한 함수를 돌려줄 때 TypeError 가 난다. 빈 객체를 대상으로 두고 조회만 위임한다.
function trackElectron(session: UploadSession): ElectronApi {
  return new Proxy({} as ElectronApi, {
    get(_target, prop) {
      const value: unknown = Reflect.get(window.electron, prop);
      const kind = typeof prop === "string" ? stepKindOf(prop) : null;
      if (typeof value !== "function" || !kind) return value;
      return (...args: unknown[]) =>
        session.runStep(String(prop), kind, args, () => value(...args));
    },
  });
}

export function startUploadDiagnostics(
  emr_type: string,
  uploadedFiles: (FileList | null)[]
): UploadDiagnostics {
  const fileLists = uploadedFiles.map((files) => (files ? Array.from(files) : []));
  const session = new UploadSession(emr_type, fileLists);
  return {
    electron: trackElectron(session),
    trackUpload: (uploadPromise) => session.trackUpload(uploadPromise),
    fail: (error) => session.fail(error),
  };
}
