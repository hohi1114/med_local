/**
 * 보고서 생성 공통 헬퍼 함수
 */

/** 숫자 포맷 (천 단위 콤마) */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ko-KR').format(num);
};

/** 날짜 포맷 (YYYY-MM-DD → YYYY.MM.DD) */
export const formatDate = (date: string): string => {
  return date.replace(/-/g, '.');
};

/** 주차 라벨 포맷 (예: 2024-12-23 → 12.W4) */
export const formatWeekLabel = (weekStart: string): string => {
  const date = new Date(weekStart);
  const month = date.getMonth() + 1;
  const dayOfMonth = date.getDate();
  const weekOfMonth = Math.ceil(dayOfMonth / 7);
  return `${month}.W${weekOfMonth}`;
};

/** 셀 배경색 스타일 (증가=초록, 감소=빨강) */
export const getCellStyle = (diffValue: number): string => {
  if (diffValue > 0) {
    return 'background-color: #d1fae5;'; // 연한 초록
  } else if (diffValue < 0) {
    return 'background-color: #fee2e2;'; // 연한 빨강
  }
  return '';
};

/** 비교 스타일 (A vs B) */
export const getCompareStyle = (valueA: number, valueB: number): string => {
  if (valueA > valueB) {
    return 'background-color: #d1fae5; font-weight: 600;';
  } else if (valueA < valueB) {
    return 'background-color: #fee2e2; font-weight: 600;';
  }
  return '';
};

/** 차이값 스타일 */
export const getDiffStyle = (diff: number): string => {
  if (diff > 0) {
    return 'color: #2E7D32; background-color: rgba(46, 125, 50, 0.1); font-weight: 600;';
  } else if (diff < 0) {
    return 'color: #C62828; background-color: rgba(198, 40, 40, 0.1); font-weight: 600;';
  }
  return 'color: #666; background-color: rgba(102, 102, 102, 0.05);';
};

/** 변화 색상 스타일 (이전 주 대비) */
export const getChangeColorStyle = (currentValue: number, previousValue: number | null): string => {
  if (previousValue === null) return '';

  if (currentValue > previousValue) {
    return 'background-color: #d1fae5; font-weight: 600;';
  } else if (currentValue < previousValue) {
    return 'background-color: #fee2e2; font-weight: 600;';
  }
  return '';
};

/** Type별 색상 맵 (Notion 스타일) */
export const getTypeStyle = (type: string): string => {
  const typeColorMap: Record<string, { bg: string; text: string }> = {
    '특이사항': { bg: '#fce7f3', text: '#9d174d' },
    '월간 전략': { bg: '#fef3c7', text: '#92400e' },
    '주간 모니터링': { bg: '#fef3c7', text: '#92400e' },
    '주요 원내 일정': { bg: '#fef3c7', text: '#92400e' },
    '블로그': { bg: '#d1fae5', text: '#065f46' },
    '디자인': { bg: '#ffedd5', text: '#9a3412' },
    '악성 리뷰': { bg: '#fee2e2', text: '#991b1b' },
    '플레이스 리뷰': { bg: '#ede9fe', text: '#5b21b6' },
    '플레이스 콘텐츠': { bg: '#ede9fe', text: '#5b21b6' },
    '플레이스 순위': { bg: '#ede9fe', text: '#5b21b6' },
    'META 광고': { bg: '#dbeafe', text: '#1e40af' },
    '플레이스 광고': { bg: '#dbeafe', text: '#1e40af' },
    '커뮤니티 마케팅': { bg: '#fef9c3', text: '#854d0e' },
    '미팅': { bg: '#fef9c3', text: '#854d0e' },
    '오프라인 마케팅': { bg: '#f3f4f6', text: '#374151' },
    '의료광고심의': { bg: '#f3f4f6', text: '#374151' },
  };

  const colors = typeColorMap[type] || { bg: '#f3f4f6', text: '#374151' };
  return `background-color: ${colors.bg}; color: ${colors.text}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; display: inline-block;`;
};
