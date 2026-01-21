/**
 * 병원 분석 데이터 가공 유틸리티
 */

import type {
  Hospital,
  BlogPost,
  SecondaryAccount,
  PlaceReview,
  WeeklySummary,
  RankingSummary,
  HospitalReportData,
  RefererStat,
  VisitStat,
  SmartplaceStat,
  PlaceRankEntry,
  PostRankEntry,
} from '../types/analytics';

// ============================================
// 날짜 유틸리티
// ============================================

/** 최근 N주 데이터 필터링 */
export function getRecentWeeks<T extends { weekStart: string }>(
  data: T[],
  weeks: number = 4
): T[] {
  return data
    .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())
    .slice(0, weeks);
}

/** 최근 N일 데이터 필터링 */
export function getRecentDays<T extends { checked_at: string }>(
  data: T[],
  days: number = 7
): T[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return data
    .filter(item => new Date(item.checked_at) >= cutoff)
    .sort((a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime());
}

// ============================================
// 블로그 통계 가공
// ============================================

/** 블로그 유입 경로 상위 N개 */
export function getTopReferers(
  refererStats: RefererStat[],
  topN: number = 5
): Array<{ source: string; percentage: number }> {
  const latestWeek = getRecentWeeks(refererStats, 1)[0];
  if (!latestWeek) return [];

  return latestWeek.referers
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, topN);
}

/** 블로그 조회수 추이 (주간) */
export function getVisitTrend(
  visitStats: VisitStat[],
  weeks: number = 4
): Array<{ week: string; visits: number }> {
  return getRecentWeeks(visitStats, weeks)
    .reverse()
    .map(stat => ({
      week: `${stat.weekStart} ~ ${stat.weekEnd}`,
      visits: stat.visitTotal,
    }));
}

/** 블로그 조회수 변화율 계산 */
export function calculateVisitChange(visitStats: VisitStat[]): {
  current: number;
  previous: number;
  changePercent: number;
} {
  const recent = getRecentWeeks(visitStats, 2);
  const current = recent[0]?.visitTotal || 0;
  const previous = recent[1]?.visitTotal || 0;

  const changePercent = previous > 0
    ? Math.round(((current - previous) / previous) * 100)
    : 0;

  return { current, previous, changePercent };
}

// ============================================
// 플레이스 통계 가공
// ============================================

/** 플레이스 채널별 유입 상위 N개 */
export function getTopChannels(
  smartplaceStats: SmartplaceStat[],
  topN: number = 5
): Array<{ channel: string; count: number }> {
  const latestWeek = getRecentWeeks(smartplaceStats, 1)[0];
  if (!latestWeek) return [];

  return latestWeek.channels
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/** 플레이스 키워드별 유입 상위 N개 */
export function getTopKeywords(
  smartplaceStats: SmartplaceStat[],
  topN: number = 10
): Array<{ keyword: string; count: number }> {
  const latestWeek = getRecentWeeks(smartplaceStats, 1)[0];
  if (!latestWeek) return [];

  return latestWeek.keywords
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/** 플레이스 방문 추이 (주간) */
export function getPlaceVisitTrend(
  smartplaceStats: SmartplaceStat[],
  weeks: number = 4
): Array<{ week: string; visits: number }> {
  return getRecentWeeks(smartplaceStats, weeks)
    .reverse()
    .map(stat => ({
      week: `${stat.weekStart} ~ ${stat.weekEnd}`,
      visits: stat.visitCount,
    }));
}

// ============================================
// 순위 가공
// ============================================

/** 플레이스 순위 현황 */
export function getPlaceRankStatus(
  rankHistory: PlaceRankEntry[]
): { current: number | null; change: number; trend: 'up' | 'down' | 'same' } {
  const recent = getRecentDays(rankHistory, 7);
  if (recent.length === 0) {
    return { current: null, change: 0, trend: 'same' };
  }

  const current = recent[0].rank;
  const previous = recent.length > 1 ? recent[recent.length - 1].rank : current;
  const change = previous - current; // 양수: 상승 (순위 숫자 감소)

  return {
    current,
    change,
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
  };
}

/** 포스팅 순위 현황 */
export function getPostRankStatus(
  rankHistory: PostRankEntry[]
): { current: number | 'out' | null; change: number | null } {
  const recent = getRecentDays(rankHistory, 7);
  if (recent.length === 0) {
    return { current: null, change: null };
  }

  const current = recent[0].rank;

  // 'out'이면 변화 계산 불가
  if (current === 'out' || recent.length < 2) {
    return { current, change: null };
  }

  const previous = recent[recent.length - 1].rank;
  if (previous === 'out') {
    return { current, change: null };
  }

  const change = previous - current;
  return { current, change };
}

// ============================================
// 리뷰 가공
// ============================================

/** 리뷰 요약 통계 */
export function getReviewSummary(reviews: PlaceReview[]): {
  total: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  recentReviews: PlaceReview[];
} {
  const total = reviews.length;
  const averageRating = total > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
    : 0;

  const ratingDistribution = reviews.reduce((acc, r) => {
    acc[r.rating] = (acc[r.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const recentReviews = [...reviews]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return { total, averageRating, ratingDistribution, recentReviews };
}

// ============================================
// 주간 요약 생성
// ============================================

/** 주간 통계 요약 생성 */
export function generateWeeklySummary(
  hospital: Hospital,
  weekIndex: number = 0  // 0 = 최신주
): WeeklySummary | null {
  const visitStat = getRecentWeeks(hospital.visit_stats, weekIndex + 1)[weekIndex];
  const refererStat = getRecentWeeks(hospital.referer_stats, weekIndex + 1)[weekIndex];
  const smartplaceStat = getRecentWeeks(hospital.smartplace_stats, weekIndex + 1)[weekIndex];

  if (!visitStat && !smartplaceStat) return null;

  return {
    period: {
      weekStart: visitStat?.weekStart || smartplaceStat?.weekStart || '',
      weekEnd: visitStat?.weekEnd || smartplaceStat?.weekEnd || '',
    },
    blogVisits: visitStat?.visitTotal || 0,
    topReferers: refererStat?.referers
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5) || [],
    placeVisits: smartplaceStat?.visitCount || 0,
    topChannels: smartplaceStat?.channels
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) || [],
    topKeywords: smartplaceStat?.keywords
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) || [],
  };
}

// ============================================
// 전체 보고서 데이터 생성
// ============================================

/** 병원 보고서 데이터 생성 */
export function generateHospitalReportData(
  hospital: Hospital,
  blogPosts: BlogPost[],
  secondaryAccounts: SecondaryAccount[],
  reviews: PlaceReview[],
  weeks: number = 4
): HospitalReportData {
  // 주간 요약 생성
  const weeklySummaries: WeeklySummary[] = [];
  for (let i = 0; i < weeks; i++) {
    const summary = generateWeeklySummary(hospital, i);
    if (summary) weeklySummaries.push(summary);
  }

  // 순위 요약
  const placeRank = getPlaceRankStatus(hospital.place_rank_history);
  const rankingSummary: RankingSummary = {
    placeCurrentRank: placeRank.current,
    placeRankChange: placeRank.change,
    placeRankHistory: getRecentDays(hospital.place_rank_history, 30),
    postRankings: blogPosts
      .filter(post => post.keywords.length > 0)
      .map(post => {
        const rankStatus = getPostRankStatus(post.rank_history);
        return {
          postId: post.id,
          postTitle: post.title,
          keyword: post.keywords[0], // 첫 번째 키워드 기준
          currentRank: rankStatus.current || 'out',
          rankChange: rankStatus.change,
        };
      }),
  };

  // 부계정 블로그 통계
  const secondaryStats = secondaryAccounts.map(account => {
    const visitChange = calculateVisitChange(account.visit_stats);
    return {
      name: account.name,
      weeklyVisits: visitChange.current,
      topReferers: getTopReferers(account.referer_stats),
    };
  });

  // 리뷰 요약
  const reviewData = getReviewSummary(reviews);

  return {
    hospital,
    weeklySummaries,
    rankingSummary,
    secondaryAccounts: secondaryStats,
    reviewSummary: {
      total: reviewData.total,
      averageRating: reviewData.averageRating,
      recentReviews: reviewData.recentReviews,
    },
  };
}

// ============================================
// 포맷팅 유틸리티
// ============================================

/** 숫자 포맷 (천 단위 콤마) */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

/** 퍼센트 포맷 */
export function formatPercent(num: number): string {
  return `${num > 0 ? '+' : ''}${num}%`;
}

/** 순위 변화 포맷 */
export function formatRankChange(change: number): string {
  if (change > 0) return `▲${change}`;
  if (change < 0) return `▼${Math.abs(change)}`;
  return '-';
}

/** 날짜 포맷 (간단) */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/** 주간 기간 포맷 */
export function formatWeekPeriod(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);
  return `${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`;
}
