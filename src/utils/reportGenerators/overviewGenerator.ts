/**
 * 개요 섹션 생성
 */

import type { WeeklyStat, PeriodConfig } from '../../types/report';

interface OverviewParams {
  selectedHospital: string;
  weeklyStats: WeeklyStat[];
  periodConfig: PeriodConfig;
  getWeekEnd: (weekStart: string) => string;
}

export const generateOverview = ({
  selectedHospital,
  weeklyStats,
  periodConfig,
  getWeekEnd,
}: OverviewParams): string => {
  const { periodAStart, periodAEnd, periodBStart, periodBEnd } = periodConfig;

  if (!selectedHospital || !periodAStart || !periodAEnd) {
    return '<p>병원과 기간을 선택해주세요.</p>';
  }

  // 종료일을 해당 주의 week_end로 변환
  const actualPeriodAEnd = getWeekEnd(periodAEnd);
  const actualPeriodBEnd = getWeekEnd(periodBEnd);

  // Period A 데이터 집계
  const periodAStats = weeklyStats.filter(
    (stat) => stat.week_start >= periodAStart && stat.week_end <= actualPeriodAEnd
  );

  // Period B 데이터 집계
  const periodBStats = weeklyStats.filter(
    (stat) => stat.week_start >= periodBStart && stat.week_end <= actualPeriodBEnd
  );

  if (periodAStats.length === 0) {
    return '<p>선택한 기간에 데이터가 없습니다.</p>';
  }

  // 영업일 및 휴무일 계산
  const periodADays = periodAStats.reduce((sum, stat) => sum + (7 - stat.closed_days), 0);
  const periodBDays = periodBStats.reduce((sum, stat) => sum + (7 - stat.closed_days), 0);
  const periodAClosedDays = periodAStats.reduce((sum, stat) => sum + stat.closed_days, 0);
  const periodBClosedDays = periodBStats.reduce((sum, stat) => sum + stat.closed_days, 0);

  // 날짜 포맷팅 (YYYY.MM.DD)
  const formatDate = (date: string) => date.replace(/-/g, '.');

  // 비교 기간 표시 (있을 경우에만)
  const hasComparisonPeriod = periodBStart && periodBEnd && periodBStats.length > 0;

  return `
    <h2>1. 개요</h2>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
      <tbody>
        <tr>
          <td style="background-color: #f3f4f6; font-weight: 600; width: 120px;">분석 기간</td>
          <td>${formatDate(periodAStart)} – ${formatDate(actualPeriodAEnd)} (${periodADays}일)</td>
        </tr>
        <tr>
          <td style="background-color: #f3f4f6; font-weight: 600;">휴무일</td>
          <td>${periodAClosedDays > 0 ? `(총 ${periodAClosedDays}일)` : '없음.'}</td>
        </tr>
        ${hasComparisonPeriod ? `
        <tr>
          <td style="background-color: #f3f4f6; font-weight: 600;">비교 기간</td>
          <td>${formatDate(periodBStart)} – ${formatDate(actualPeriodBEnd)} (${periodBDays}일)</td>
        </tr>
        <tr>
          <td style="background-color: #f3f4f6; font-weight: 600;">휴무일 (비교)</td>
          <td>${periodBClosedDays > 0 ? `(총 ${periodBClosedDays}일)` : '없음.'}</td>
        </tr>
        ` : ''}
      </tbody>
    </table>
  `;
};
