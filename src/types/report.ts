/**
 * 보고서 빌더 관련 타입 정의
 */

export interface Hospital {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface AnalyticsHospital {
  hospital_id: string;
  name: string;
}

export interface WeeklyStat {
  id: string;
  week_start: string;
  week_end: string;
  closed_days: number;
  total_revenue: number;
  revenue_change_percent: number;
  new_patients: number;
  new_patients_change_percent: number;
  first_visit_patients: number;
  first_visit_patients_change_percent: number;
  return_patients: number;
  return_patients_change_percent: number;
  total_patients: number;
  total_patients_change_percent: number;
  age_groups: Record<string, number>;
  top_districts_data: Record<string, number>;
  top_districts_sum: number;
  top_districts_ratio: number;
  top_3_districts_sum: number;
  top_3_districts_ratio: number;
}

export interface ReportSection {
  id: string;
  title: string;
  enabled: boolean;
  generated: boolean;
  includedInPdf: boolean;
  contentHtml: string;
}

export interface PeriodConfig {
  periodAStart: string;
  periodAEnd: string;
  periodBStart: string;
  periodBEnd: string;
}

export interface ReportContext {
  selectedHospital: string;
  weeklyStats: WeeklyStat[];
  periodConfig: PeriodConfig;
  notionDatabaseId: string;
  analyticsHospitalId: string;
  getWeekEnd: (weekStart: string) => string;
}

// 섹션 ID 타입
export type SectionId =
  | 'overview'
  | 'summary'
  | 'age_analysis'
  | 'region_analysis'
  | 'channel_performance'
  | 'key_events'
  | 'conclusion';

// 초기 섹션 상태
export const INITIAL_SECTIONS: ReportSection[] = [
  {
    id: 'overview',
    title: '개요',
    enabled: false,
    generated: false,
    includedInPdf: false,
    contentHtml: '',
  },
  {
    id: 'summary',
    title: '유입 추이 분석 - 요약',
    enabled: false,
    generated: false,
    includedInPdf: false,
    contentHtml: '',
  },
  {
    id: 'age_analysis',
    title: '유입 추이 분석 - 연령대별',
    enabled: false,
    generated: false,
    includedInPdf: false,
    contentHtml: '',
  },
  {
    id: 'region_analysis',
    title: '유입 추이 분석 - 지역별',
    enabled: false,
    generated: false,
    includedInPdf: false,
    contentHtml: '',
  },
  {
    id: 'channel_performance',
    title: '채널별 유입 성과 보고',
    enabled: false,
    generated: false,
    includedInPdf: false,
    contentHtml: '',
  },
  {
    id: 'key_events',
    title: '주요 이벤트 (플레이스 순위)',
    enabled: false,
    generated: false,
    includedInPdf: false,
    contentHtml: '',
  },
  {
    id: 'conclusion',
    title: '총평',
    enabled: false,
    generated: false,
    includedInPdf: false,
    contentHtml: '',
  },
];
