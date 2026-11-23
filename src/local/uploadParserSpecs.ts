// 업로드 진단용 파서 스펙.
// 각 파서(src/local/excel/*)가 헤더 행에서 찾는 컬럼명을 그대로 옮겨 적은 것이다.
// 파서의 헤더 탐지 조건을 바꾸면 이 표도 같이 수정해야 로그가 정확하다.
// 키는 preload(window.electron)에 노출된 메서드명.

export interface ColumnSpec {
  aliases: string[]; // 이 중 하나라도 헤더에 있으면 인식됨
  required: boolean; // 없으면 파서가 해당 파일을 통째로 건너뜀
  match?: "exact" | "includes"; // 기본 exact (파서가 === 로 비교)
}

export interface ParserSpec {
  file_role: string; // 업로드 화면의 파일 종류
  columns: ColumnSpec[];
  note?: string;
}

export type FileFormat = "xlsx" | "xls" | "text";

// 파일 1개의 헤더 검사 결과 (uploadFileInspector 가 생성)
export interface FileInspection {
  format: FileFormat | null;
  sheet_names: string[];
  total_rows: number | null;
  header_sheet: string | null;
  header_sheet_index: number | null;
  header_row: number | null; // 1부터 시작 (엑셀 행 번호)
  found_headers: string[];
  missing_required: string[];
  missing_optional: string[];
  error: string | null;
}

const required = (...aliases: string[]): ColumnSpec => ({ aliases, required: true });
const optional = (...aliases: string[]): ColumnSpec => ({ aliases, required: false });
const requiredIncludes = (...aliases: string[]): ColumnSpec => ({
  aliases,
  required: true,
  match: "includes",
});

const DOCTORP_PATIENT_COLUMNS = [
  required("환자번호"),
  required("나이"),
  required("주소"),
  required("환자태그"),
];

export const PARSER_SPECS: Record<string, ParserSpec> = {
  parseDaysFilesEuisarang: {
    file_role: "일일 수입",
    columns: [required("차트번호"), required("내원/수납일"), required("총진료비")],
    note: "헤더는 4번째 행 고정",
  },
  parsePlaceFilesEuisarang: {
    file_role: "장소별 환자",
    columns: [required("차트번호"), required("나이"), required("주소")],
  },
  parseDaysFilesDentweb: {
    file_role: "일일 수입",
    columns: [
      required("차트번호"),
      required("진료일"),
      required("총진료비", "진료금액"),
      optional("담당의사", "진료의사"),
      optional("내원경로"),
      optional("최초내원"),
      optional("진료내역"),
    ],
  },
  parsePlaceFilesDentWeb: {
    file_role: "장소별 환자",
    columns: [required("차트번호"), required("생년월일"), required("주소")],
  },
  parseDailyIncomeEgis: {
    file_role: "일일 수입",
    columns: [
      required("환자번호"),
      required("날짜"),
      required("총진료비"),
      required("초재구분"),
    ],
  },
  parsePatientListEgis: {
    file_role: "환자 목록",
    columns: [required("환자번호"), required("주민번호"), required("주소")],
  },
  parseDailyIncomeOrm: {
    file_role: "일일 수입",
    columns: [
      required("차트번호", "환자번호", "환자등록번호"),
      required("진료일", "수납일", "날짜"),
      required("진료비", "총진료비", "과세총금액", "비급여(과세총금액)"),
      optional("신환"),
      optional("진료비구분", "초재구분"),
      optional("담당의", "진료의"),
      optional("나이", "나이(만)", "성별/나이"),
    ],
    note: "첫 번째 시트는 건너뛰고 2번째 시트부터 읽음. 헤더는 각 시트 1행",
  },
  parsePatientListOrm: {
    file_role: "장소별 환자",
    columns: [required("환자등록번호", "차트번호"), required("주소")],
  },
  parseDailyIncomeVegas: {
    file_role: "일일 수입",
    columns: [
      required("차트번호"),
      required("수납일"),
      required("비급여(과세총금액)", "과세총금액"),
      required("성별/나이"),
      optional("분야"),
      optional("시술"),
      optional("진료의"),
      optional("담당직원"),
    ],
  },
  parsePatientListVegas: {
    file_role: "환자 목록",
    columns: [
      required("차트번호"),
      required("주소"),
      required("최초일"),
      optional("내원경로"),
      optional("국적"),
    ],
  },
  parseDailyIncomeVegas2: {
    file_role: "환자별 집계",
    columns: [
      required("전화번호"),
      required("진료일"),
      required("과세총금액"),
      required("비과세비급여"),
      required("성별/나이"),
      optional("분야"),
      optional("시술"),
      optional("진료의"),
      optional("담당직원"),
    ],
  },
  parsePatientListVegas2: {
    file_role: "DM 주소록",
    columns: [
      required("핸드폰"),
      required("주소"),
      required("최초일"),
      optional("내원경로"),
      optional("국적"),
    ],
  },
  parseOrderListVegas2: {
    file_role: "오더판매내역및환자내역",
    columns: [
      required("핸드폰번호"),
      required("진료일"),
      required("오더명"),
      optional("금액"),
      optional("부가세"),
      optional("진료의명"),
      optional("담당직원"),
      optional("내원경로"),
      optional("국적"),
      optional("진료구분"),
      optional("이름"),
      optional("진료분야"),
      optional("시술"),
    ],
  },
  parseDailyIncomeHanChart: {
    file_role: "일일 수입",
    columns: [
      required("차트번호"),
      required("진료일"),
      required("총진료비"),
      required("성별/나이"),
      optional("진료의"),
      optional("내원경로"),
      optional("구분"),
    ],
  },
  parsePatientListHanChart: {
    file_role: "환자 목록",
    columns: [required("차트번호"), required("주소"), required("최초일")],
  },
  parseDaysFilesDoctorP: {
    file_role: "일일 수입",
    columns: [required("환자번호"), required("진료일"), required("총 매출")],
  },
  parsePlaceFilesDoctorP: { file_role: "환자 목록", columns: DOCTORP_PATIENT_COLUMNS },
  parseDaysFilesDoctorP2: {
    file_role: "일일 수입",
    columns: [required("환자번호"), required("진료일"), required("매출 총액 합계")],
  },
  parsePlaceFilesDoctorP2: { file_role: "환자 목록", columns: DOCTORP_PATIENT_COLUMNS },
  parseDailyIncomecChart: {
    file_role: "일일 수입",
    columns: [
      required("환자번호"),
      required("진료일자"),
      required("현금수납액"),
      required("카드수납액"),
      required("통장수납액"),
      optional("보험유형"),
    ],
  },
  parsePatientListcChart: {
    file_role: "장소별 환자",
    columns: [
      required("환자번호"),
      required("주민번호"),
      required("주소"),
      optional("내원경로"),
    ],
  },
  parseDailyIncomeBit: {
    file_role: "일일 수입",
    columns: [required("챠트번호", "차트번호"), required("총진료비"), required("수납일자")],
  },
  parsePatientListBit: {
    file_role: "환자 목록",
    columns: [
      required("차트번호", "챠트번호"),
      required("나이", "S/A", "주민등록번호", "주민번호"),
      required("내원날짜", "내원/입원일시", "내원일"),
      optional("초재진구분", "초/재진", "초/재"),
      optional("담당의"),
      optional("주소"),
      optional("주상병"),
      optional("주야공휴"),
    ],
  },
  parseDailyIncomeBit2: {
    file_role: "일일 수입",
    columns: [
      requiredIncludes("챠트번호", "차트번호"),
      requiredIncludes("총진료비"),
      requiredIncludes("수납일자", "영수일자"),
    ],
    note: "헤더는 1행 고정, 부분 일치로 비교",
  },
  parsePatientListBit2: {
    file_role: "환자 목록",
    columns: [
      required("차트번호", "챠트번호"),
      required("나이"),
      required("초재진구분"),
      required("내원날짜"),
      required("담당의"),
      required("주소"),
    ],
  },
  parseDailyIncomeNeo: {
    file_role: "일일 수입",
    columns: [required("진료일자"), required("챠트번호"), required("총진료비")],
  },
  parsePatientListNeo: {
    file_role: "환자 목록",
    columns: [
      required("챠트번호"),
      required("처음내원일자"),
      required("생년월일"),
      required("주소"),
    ],
  },
  parseDailyIncomeSmartNC: {
    file_role: "일일 수입",
    columns: [required("수납일자"), required("고객번호"), required("총진료비")],
  },
  parsePatientAddressSmartNC: {
    file_role: "환자 주소",
    columns: [required("고객번호"), required("주소")],
    note: "헤더는 상위 5행 안에서 탐색",
  },
  parsePatientListSmartNC: {
    file_role: "환자 목록",
    columns: [required("고객번호"), required("주민번호")],
    note: "헤더는 상위 5행 안에서 탐색",
  },
  parseDailyVisitSimEmr: {
    file_role: "일일 내원",
    columns: [
      required("진료기간"),
      required("진료과"),
      required("총진료비"),
      required("환자번호"),
      optional("주소"),
      optional("외/입"),
      optional("구분"),
      optional("방문경로 사유"),
    ],
    note: "섹션마다 헤더 행이 반복됨",
  },
  parsePatientRouteSimEmr: {
    file_role: "환자 방문경로",
    columns: [
      required("환자번호"),
      required("나이"),
      optional("방문경로"),
      optional("방문사유"),
    ],
  },
};
