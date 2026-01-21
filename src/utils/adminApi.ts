import { apiRequest } from '../utils/api/apihelper';

interface AdminApiResponse {
  success: boolean;
  message: string;
  [key: string]: any;
}

interface Hospital {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface AnalyticsHospital {
  hospital_id: string;
  name: string;
}

interface PlaceRankEntry {
  rank: number;
  checked_at: string;
}

interface PlaceRankData {
  keyword: string | null;
  rankHistory: PlaceRankEntry[];
}

interface SmartplaceChannel {
  name: string;
  percentage: number;
}

interface SmartplaceKeyword {
  name: string;
  percentage: number;
}

interface SmartplaceStat {
  range: string;
  channels: SmartplaceChannel[];
  keywords: SmartplaceKeyword[];
  visitCount: number;
}

// 블로그 관련 인터페이스
interface RefererEntry {
  source: string;
  percentage: number;
}

interface RefererStat {
  weekStart: string;
  weekEnd: string;
  referers: RefererEntry[];
}

interface VisitStat {
  weekStart: string;
  weekEnd: string;
  visitTotal: number;
}

interface BlogAccount {
  id: string;
  name: string;
  blogId: string;
  isMain: boolean;
  refererStats: RefererStat[];
  visitStats: VisitStat[];
}

interface BlogPost {
  id: string;
  title: string;
  publishedDate: string;
  keywords: string[];
  url: string;
}

interface BlogKeywordsData {
  posts: BlogPost[];
  topKeywords: Array<{ keyword: string; count: number }>;
}

interface WeeklyStat {
  id: string;
  week_start: string;
  week_end: string;
  closed_days: number;
  total_revenue: number;
  revenue_change_percent: number;
  new_patients: number;
  new_patients_change_percent: number;
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
  first_visit_patients: number;  // ⭐ 추가
  first_visit_patients_change_percent: number;  // ⭐ 추가
}


class AdminAPI {
  // ⭐ apiRequest가 자동으로 쿠키에서 토큰 가져와서 헤더에 추가
  async updateAllWeeklyStats(): Promise<AdminApiResponse> {
    return apiRequest('post', '/stats/admin/update-all-weekly-stats');
  }

  async calculateAllTopDistricts(): Promise<AdminApiResponse> {
    return apiRequest('post', '/stats/admin/calculate-all-top-districts');
  }

  async calculateTopDistricts(hospitalName: string): Promise<AdminApiResponse> {
    return apiRequest('post', '/stats/admin/calculate-top-districts', { hospitalName });
  }


  async updateHospitalStats(hospitalName: string): Promise<AdminApiResponse> {
    return apiRequest('post', '/stats/admin/update-hospital-stats', { hospitalName });
  }

  async updateOneWeekAllHospitals(weekStart: string): Promise<AdminApiResponse> {
    return apiRequest('post', '/stats/admin/update-one-week-all-hospitals', { weekStart });
  }

  async getHospitalWeeklyStats(hospitalName: string): Promise<WeeklyStat[]> {
    const response = await apiRequest(
      'get',
      `/stats/admin/hospital-weekly-stats/${encodeURIComponent(hospitalName)}`
    );
    return response.data || [];
  }


  async getHospitalList(): Promise<Hospital[]> {
    const response = await apiRequest('get', '/stats/admin/hospitals');
    return response.data || [];
  }

  // Analytics DB 병원 목록 조회
  async getAnalyticsHospitals(): Promise<AnalyticsHospital[]> {
    const response = await apiRequest('get', '/analytics/hospitals');
    return response.hospitals || [];
  }

  async getAnalyticsMapping(hospitalName: string): Promise<string | null> {
    const response = await apiRequest('get', `/analytics/mapping?hospitalName=${encodeURIComponent(hospitalName)}`);
    return response.analyticsHospitalId || null;
  }

  async saveAnalyticsMapping(hospitalName: string, analyticsHospitalId: string | null): Promise<void> {
    await apiRequest('post', '/analytics/mapping', { hospitalName, analyticsHospitalId });
  }

  async getPlaceRankHistory(hospitalId: string): Promise<PlaceRankData> {
    const response = await apiRequest('get', `/analytics/place-rank?hospitalId=${encodeURIComponent(hospitalId)}`);
    return {
      keyword: response.keyword || null,
      rankHistory: response.rankHistory || []
    };
  }

  async getSmartplaceStats(hospitalId: string): Promise<SmartplaceStat[]> {
    const response = await apiRequest('get', `/analytics/smartplace-stats?hospitalId=${encodeURIComponent(hospitalId)}`);
    return response.stats || [];
  }

  // 블로그 계정 목록 조회 (메인 + 부계정)
  async getBlogAccounts(hospitalId: string): Promise<BlogAccount[]> {
    const response = await apiRequest('get', `/analytics/blog-accounts?hospitalId=${encodeURIComponent(hospitalId)}`);
    return response.accounts || [];
  }

  // 블로그 키워드 조회
  async getBlogKeywords(blogId: string, startDate?: string, endDate?: string): Promise<BlogKeywordsData> {
    let url = `/analytics/blog-keywords?blogId=${encodeURIComponent(blogId)}`;
    if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
    const response = await apiRequest('get', url);
    return {
      posts: response.posts || [],
      topKeywords: response.topKeywords || []
    };
  }
}

export const adminAPI = new AdminAPI();

export type { BlogAccount, BlogKeywordsData, RefererStat, VisitStat };