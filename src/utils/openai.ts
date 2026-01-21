import { authApi } from './api/apihelper';

interface SummaryAnalysisData {
  periodALabel: string;
  periodBLabel: string;
  periodA: {
    totalRevenue: number;
    newPatients: number;
    firstVisit: number;
    returnPatients: number;
    totalPatients: number;
  };
  periodB: {
    totalRevenue: number;
    newPatients: number;
    firstVisit: number;
    returnPatients: number;
    totalPatients: number;
  };
  weeklyTrend: Array<{
    week: string;
    revenue: number;
    newPatients: number;
    firstVisit: number;
    returnPatients: number;
    totalPatients: number;
  }>;
}

interface AgeAnalysisData {
  periodALabel: string;
  periodBLabel: string;
  periodA: Record<string, number>; // { '0': 10, '10': 20, ... }
  periodB: Record<string, number>;
}

interface RegionAnalysisData {
  periodALabel: string;
  periodBLabel: string;
  top7: Array<{
    name: string;
    countA: number;
    countB: number;
  }>;
  totalA: number;
  totalB: number;
}

interface WeeklyAgeTrendData {
  periodALabel: string;
  periodBLabel: string;
  weeklyData: Array<{
    week: string;
    period: 'A' | 'B';
    ageGroups: Record<string, number>;
  }>;
}

interface WeeklyRegionTrendData {
  periodALabel: string;
  periodBLabel: string;
  regions: string[];
  weeklyData: Array<{
    week: string;
    period: 'A' | 'B';
    regionCounts: Record<string, number>;
  }>;
}

interface WeeklyAreaConcentrationData {
  periodALabel: string;
  periodBLabel: string;
  weeklyData: Array<{
    week: string;
    period: 'A' | 'B';
    top3Count: number;
    top7Count: number;
    top3Ratio: number;
    top7Ratio: number;
    totalNewPatients: number;
  }>;
}

interface SmartplaceAnalysisData {
  periodALabel: string;
  periodBLabel: string;
  periodA: {
    totalVisits: number;
    channels: Array<{ name: string; visits: number; percentage: number }>;
    keywords: Array<{ name: string; visits: number; percentage: number }>;
  };
  periodB: {
    totalVisits: number;
    channels: Array<{ name: string; visits: number; percentage: number }>;
  } | null;
}

interface BlogAnalysisData {
  periodALabel: string;
  periodBLabel: string;
  periodA: {
    totalVisits: number;
    placeRefererPercent: number;
    searchRefererPercent: number;
    placeVisits: number;
    searchVisits: number;
  };
  periodB: {
    totalVisits: number;
    placeRefererPercent: number;
    searchRefererPercent: number;
    placeVisits: number;
    searchVisits: number;
  } | null;
}

/**
 * 요약 분석 해석 생성
 */
export async function generateSummaryInterpretation(
  data: SummaryAnalysisData
): Promise<string> {
  try {
    const response = await authApi.post('/openai/interpretation/summary', data);
    return response.data.interpretation;
  } catch (error) {
    console.error('AI 해석 생성 오류:', error);
    throw new Error('AI 해석 생성 중 오류가 발생했습니다.');
  }
}

/**
 * 연령대별 분석 해석 생성
 */
export async function generateAgeInterpretation(
  data: AgeAnalysisData
): Promise<string> {
  try {
    const response = await authApi.post('/openai/interpretation/age', data);
    return response.data.interpretation;
  } catch (error) {
    console.error('AI 해석 생성 오류:', error);
    throw new Error('AI 해석 생성 중 오류가 발생했습니다.');
  }
}

/**
 * 주별 연령대 신환 추이 해석 생성
 */
export async function generateWeeklyAgeTrendInterpretation(
  data: WeeklyAgeTrendData
): Promise<string> {
  try {
    const response = await authApi.post('/openai/interpretation/weekly-age-trend', data);
    return response.data.interpretation;
  } catch (error) {
    console.error('AI 해석 생성 오류:', error);
    throw new Error('AI 해석 생성 중 오류가 발생했습니다.');
  }
}

/**
 * 지역별 분석 해석 생성
 */
export async function generateRegionInterpretation(
  data: RegionAnalysisData
): Promise<string> {
  try {
    const response = await authApi.post('/openai/interpretation/region', data);
    return response.data.interpretation;
  } catch (error) {
    console.error('AI 해석 생성 오류:', error);
    throw new Error('AI 해석 생성 중 오류가 발생했습니다.');
  }
}

/**
 * 주별 지역별 신환 추이 해석 생성
 */
export async function generateWeeklyRegionTrendInterpretation(
  data: WeeklyRegionTrendData
): Promise<string> {
  try {
    const response = await authApi.post('/openai/interpretation/weekly-region-trend', data);
    return response.data.interpretation;
  } catch (error) {
    console.error('AI 해석 생성 오류:', error);
    throw new Error('AI 해석 생성 중 오류가 발생했습니다.');
  }
}

/**
 * 주별 TOP3/TOP7 집중도 추이 해석 생성
 */
export async function generateWeeklyAreaConcentrationInterpretation(
  data: WeeklyAreaConcentrationData
): Promise<string> {
  try {
    const response = await authApi.post('/openai/interpretation/weekly-area-concentration', data);
    return response.data.interpretation;
  } catch (error) {
    console.error('AI 해석 생성 오류:', error);
    throw new Error('AI 해석 생성 중 오류가 발생했습니다.');
  }
}

/**
 * 스마트플레이스 유입 통계 해석 생성
 */
export async function generateSmartplaceInterpretation(
  data: SmartplaceAnalysisData
): Promise<string> {
  try {
    const response = await authApi.post('/openai/interpretation/smartplace', data);
    return response.data.interpretation;
  } catch (error) {
    console.error('AI 해석 생성 오류:', error);
    throw new Error('AI 해석 생성 중 오류가 발생했습니다.');
  }
}

/**
 * 블로그 유입 통계 해석 생성
 */
export async function generateBlogInterpretation(
  data: BlogAnalysisData
): Promise<string> {
  try {
    const response = await authApi.post('/openai/interpretation/blog', data);
    return response.data.interpretation;
  } catch (error) {
    console.error('AI 해석 생성 오류:', error);
    throw new Error('AI 해석 생성 중 오류가 발생했습니다.');
  }
}
