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
}

export const adminAPI = new AdminAPI();