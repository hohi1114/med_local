/**
 * 병원 분석 데이터 타입 정의
 * 새 Supabase DB 스키마 기반
 */

// ============================================
// 공통 타입
// ============================================

/** 주간 기간 */
export interface WeekPeriod {
  weekStart: string;  // "2025-01-06"
  weekEnd: string;    // "2025-01-12"
}

// ============================================
// 블로그 관련 타입
// ============================================

/** 블로그 유입 경로 (주간) */
export interface RefererStat extends WeekPeriod {
  referers: Array<{
    source: string;       // "네이버검색", "블로그", "외부유입", "기타"
    percentage: number;   // 38.5
  }>;
}

/** 블로그 조회수 (주간) */
export interface VisitStat extends WeekPeriod {
  visitTotal: number;  // 주간 총 조회수
}

// ============================================
// 플레이스 관련 타입
// ============================================

/** 플레이스 통계 (주간) */
export interface SmartplaceStat extends WeekPeriod {
  channels: Array<{
    channel: string;  // "플레이스홈검색", "예약하기", "전화하기"
    count: number;
  }>;
  keywords: Array<{
    keyword: string;  // "강남정형외과", "허리디스크"
    count: number;    // 키워드별 유입 카운트
  }>;
  visitCount: number; // 총 방문 카운트
}

/** 플레이스 순위 이력 (일간) */
export interface PlaceRankEntry {
  rank: number;         // 순위
  checked_at: string;   // ISO 8601
}

// ============================================
// 블로그 포스팅 관련 타입
// ============================================

/** 포스팅 순위 이력 (일간) */
export interface PostRankEntry {
  rank: number | 'out';  // 순위 또는 순위권 밖
  checked_at: string;
}

/** 포스팅 조회수 이력 */
export interface PostViewEntry {
  views: number;
  checked_at: string;
}

/** 블로그 포스팅 */
export interface BlogPost {
  id: string;
  created_at: string;
  hospital_id: string;
  url: string;
  title: string;
  keywords: string[];           // 추출된 주요 키워드
  keywords_status: 'completed' | string;
  rank_history: PostRankEntry[];
  view_history: PostViewEntry[];
}

// ============================================
// 키워드 제안 관련 타입
// ============================================

/** 키워드 제안 입력 */
export interface KeywordSuggestionInput {
  hospitalId: string;
  services: string[];      // ["관절치료", "척추치료"]
  locations: string[];     // ["강남", "서초"]
  coreKeywords: string[];  // ["정형외과", "관절전문"]
}

/** 키워드 (검색량 포함) */
export interface KeywordWithVolume {
  keyword: string;
  monthly_search_volume: number;
  sub_keywords?: Array<{
    keyword: string;
    monthly_search_volume: number;
  }>;
}

/** 키워드 제안 결과 */
export interface KeywordSuggestionResult {
  local_keywords: KeywordWithVolume[];     // 지역 키워드
  national_keywords: KeywordWithVolume[];  // 전국 키워드
}

/** 키워드 제안 작업 */
export interface KeywordSuggestionTask {
  id: string;
  created_at: string;
  hospital_id: string;
  input: KeywordSuggestionInput;
  result: KeywordSuggestionResult;
  status: 'completed' | string;
}

// ============================================
// 플레이스 리뷰 타입
// ============================================

/** 플레이스 리뷰 */
export interface PlaceReview {
  id: string;
  created_at: string;
  hospital_id: string;
  author: string;        // 마스킹된 작성자명
  content: string;
  rating: number;        // 1-5
  visit_date: string;
  status: 'pending' | 'not_malicious';
}

// ============================================
// 세컨더리 계정 (부계정 블로그)
// ============================================

/** 부계정 블로그 */
export interface SecondaryAccount {
  id: string;
  created_at: string;
  hospital_id: string;
  place_id?: string;
  name: string;
  smartplace_id?: string;
  smartplace_password?: string;
  referer_stats: RefererStat[];
  visit_stats: VisitStat[];
}

// ============================================
// 메인 병원 타입
// ============================================

/** 병원 (메인 블로그 + 플레이스 통계 포함) */
export interface Hospital {
  id: string;
  created_at: string;
  place_id: string;              // 네이버 플레이스 ID
  name: string;
  category: string;
  keywords: string[];            // 순위 추적용 키워드
  address: string;
  smartplace_id?: string;
  smartplace_password?: string;

  // 블로그 통계 (주간)
  referer_stats: RefererStat[];
  visit_stats: VisitStat[];

  // 플레이스 통계 (주간)
  smartplace_stats: SmartplaceStat[];

  // 플레이스 순위 (일간)
  place_rank_history: PlaceRankEntry[];
}

// ============================================
// API 응답 타입
// ============================================

/** 병원 상세 (모든 관계 데이터 포함) */
export interface HospitalWithRelations extends Hospital {
  blog_posts: BlogPost[];
  secondary_accounts: SecondaryAccount[];
  keyword_suggestion_tasks: KeywordSuggestionTask[];
  place_reviews: PlaceReview[];
}

// ============================================
// 보고서 생성용 집계 타입
// ============================================

/** 주간 통계 요약 */
export interface WeeklySummary {
  period: WeekPeriod;

  // 블로그
  blogVisits: number;
  topReferers: Array<{ source: string; percentage: number }>;

  // 플레이스
  placeVisits: number;
  topChannels: Array<{ channel: string; count: number }>;
  topKeywords: Array<{ keyword: string; count: number }>;
}

/** 순위 추적 요약 */
export interface RankingSummary {
  // 플레이스 순위
  placeCurrentRank: number | null;
  placeRankChange: number;  // 양수: 상승, 음수: 하락
  placeRankHistory: PlaceRankEntry[];

  // 포스팅별 순위
  postRankings: Array<{
    postId: string;
    postTitle: string;
    keyword: string;
    currentRank: number | 'out';
    rankChange: number | null;
  }>;
}

/** 병원 보고서 데이터 */
export interface HospitalReportData {
  hospital: Hospital;

  // 주간 통계 (최근 N주)
  weeklySummaries: WeeklySummary[];

  // 순위 현황
  rankingSummary: RankingSummary;

  // 부계정 블로그 통계
  secondaryAccounts: Array<{
    name: string;
    weeklyVisits: number;
    topReferers: Array<{ source: string; percentage: number }>;
  }>;

  // 리뷰 현황
  reviewSummary: {
    total: number;
    averageRating: number;
    recentReviews: PlaceReview[];
  };
}
