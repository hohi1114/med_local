import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../utils/adminApi';
import { logout } from "../utils/api/apihelper";
import { getCookie } from "../utils/api/cookie";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Hospital {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface WeeklyStat {
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

// ⭐ 숫자 + 가로 바 인라인 컴포넌트
const InlineBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
      <span style={{ 
        fontSize: '11px', 
        fontWeight: 600, 
        color: '#374151', 
        minWidth: '24px', 
        textAlign: 'right' 
      }}>
        {value}
      </span>
      <div style={{ 
        flex: 1, 
        height: '14px', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '2px', 
        overflow: 'hidden',
        minWidth: '40px'
      }}>
        <div style={{ 
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '2px',
          minWidth: value > 0 ? '2px' : '0',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
};

// ⭐ 매출용 가로 바
const RevenueBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num);
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <span style={{ 
        fontSize: '11px', 
        fontWeight: 600, 
        color: '#374151', 
        minWidth: '85px', 
        textAlign: 'right',
        whiteSpace: 'nowrap'
      }}>
        ₩{formatNumber(value)}
      </span>
      <div style={{ 
        flex: 1, 
        height: '14px', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '2px', 
        overflow: 'hidden',
        minWidth: '60px'
      }}>
        <div style={{ 
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '2px',
          minWidth: value > 0 ? '2px' : '0',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
};

// ⭐ 환자수용 가로 바
const PatientBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const formatValue = (num: number) => {
    if (Number.isInteger(num)) {
      return new Intl.NumberFormat('ko-KR').format(num);
    }
    return num.toFixed(1);
  };
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
      <span style={{ 
        fontSize: '11px', 
        fontWeight: 600, 
        color: '#374151', 
        minWidth: '32px', 
        textAlign: 'right' 
      }}>
        {formatValue(value)}
      </span>
      <div style={{ 
        flex: 1, 
        height: '14px', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '2px', 
        overflow: 'hidden',
        minWidth: '50px'
      }}>
        <div style={{ 
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '2px',
          minWidth: value > 0 ? '2px' : '0',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
};

// ⭐ 동 이름 파싱 함수
const parseDistrictName = (fullName: string): string => {
  const parts = fullName.split(' ');
  return parts[parts.length - 1];
};

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [allWeeklyStats, setAllWeeklyStats] = useState<WeeklyStat[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [startWeekIndex, setStartWeekIndex] = useState(0);
  const [endWeekIndex, setEndWeekIndex] = useState(9);

  // ⭐ 차트 토글 상태
  const [showNewPatients, setShowNewPatients] = useState(true);
  const [showFirstVisitPatients, setShowFirstVisitPatients] = useState(true);
  const [showReturnPatients, setShowReturnPatients] = useState(true);
  
  // ⭐ 일평균 모드 토글
  const [isDailyAverage, setIsDailyAverage] = useState(false);

  useEffect(() => {
    checkAdminAuth();
    loadHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospital) {
      setMessage(''); // 병원 변경 시 메시지 초기화
      loadWeeklyStats(selectedHospital);
    }
  }, [selectedHospital]);

  useEffect(() => {
    if (allWeeklyStats.length > 0) {
      const filtered = allWeeklyStats.slice(startWeekIndex, endWeekIndex + 1);
      setWeeklyStats(filtered);
    }
  }, [startWeekIndex, endWeekIndex, allWeeklyStats]);

  // 메시지 자동 사라짐 (5초 후)
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const checkAdminAuth = async () => {
    const token = await getCookie('accessToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
  };

  const loadHospitals = async () => {
    try {
      const list = await adminAPI.getHospitalList();
      setHospitals(list);
      if (list.length > 0) {
        setSelectedHospital(list[0].name);
      }
    } catch (error: any) {
      console.error('Failed to load hospitals:', error);
      if (error.message?.includes('401') || error.message?.includes('403')) {
        navigate('/admin/login');
      }
    }
  };

  const loadWeeklyStats = async (hospitalName: string) => {
    setLoading(true);
    try {
      const stats = await adminAPI.getHospitalWeeklyStats(hospitalName);
      const reversedStats = stats.reverse();
      setAllWeeklyStats(reversedStats);
      
      const recentStats = reversedStats.slice(Math.max(0, reversedStats.length - 10));
      setWeeklyStats(recentStats);
      setStartWeekIndex(Math.max(0, reversedStats.length - 10));
      setEndWeekIndex(reversedStats.length - 1);
      // 성공 시 메시지를 건드리지 않음 (handleUpdateStats의 성공 메시지 유지)
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      setMessage(`오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStats = async () => {
    if (!selectedHospital) return;
    
    setLoading(true);
    setMessage('');
    try {
      await adminAPI.updateHospitalStats(selectedHospital);
      setMessage('통계 업데이트 완료');
      await loadWeeklyStats(selectedHospital);
    } catch (error: any) {
      setMessage(`오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const formatPercent = (num: number | null) => {
    if (num === null) return '-';
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  // ⭐ 양수는 빨간색, 음수는 파란색 (한국 주식 스타일)
  const getPercentColor = (percent: number | null) => {
    if (percent === null) return '#9ca3af';
    if (percent > 0) return '#dc2626';
    if (percent < 0) return '#2563eb';
    return '#9ca3af';
  };

  // ⭐ 영업일 수 계산 (7 - 휴무일)
  const getWorkingDays = (closedDays: number) => Math.max(7 - closedDays, 1);

  // ⭐ 객단가 계산 (매출 / 전체환자)
  const getRevenuePerPatient = (revenue: number, patients: number) => {
    if (patients === 0) return 0;
    return Math.round(revenue / patients);
  };

  // ⭐ 일평균 데이터 계산
  const calculateDailyStats = useMemo(() => {
    return weeklyStats.map((stat, index) => {
      const workingDays = getWorkingDays(stat.closed_days);
      const prevStat = index > 0 ? weeklyStats[index - 1] : null;
      const prevWorkingDays = prevStat ? getWorkingDays(prevStat.closed_days) : null;

      // 일평균 값 계산
      const dailyRevenue = Math.round(stat.total_revenue / workingDays);
      const dailyNewPatients = stat.new_patients / workingDays;
      const dailyFirstVisit = stat.first_visit_patients / workingDays;
      const dailyReturn = stat.return_patients / workingDays;
      const dailyTotal = stat.total_patients / workingDays;

      // 이전 주 일평균
      const prevDailyRevenue = prevStat && prevWorkingDays ? Math.round(prevStat.total_revenue / prevWorkingDays) : null;
      const prevDailyNewPatients = prevStat && prevWorkingDays ? prevStat.new_patients / prevWorkingDays : null;
      const prevDailyFirstVisit = prevStat && prevWorkingDays ? prevStat.first_visit_patients / prevWorkingDays : null;
      const prevDailyReturn = prevStat && prevWorkingDays ? prevStat.return_patients / prevWorkingDays : null;
      const prevDailyTotal = prevStat && prevWorkingDays ? prevStat.total_patients / prevWorkingDays : null;

      // 일평균 기준 증감률 계산
      const calcChangePercent = (current: number, prev: number | null) => {
        if (prev === null || prev === 0) return null;
        return ((current - prev) / prev) * 100;
      };

      return {
        ...stat,
        working_days: workingDays,
        revenue_per_patient: getRevenuePerPatient(stat.total_revenue, stat.total_patients),
        // 일평균 값
        daily_revenue: dailyRevenue,
        daily_new_patients: dailyNewPatients,
        daily_first_visit: dailyFirstVisit,
        daily_return: dailyReturn,
        daily_total: dailyTotal,
        // 일평균 기준 증감률
        daily_revenue_change: calcChangePercent(dailyRevenue, prevDailyRevenue),
        daily_new_patients_change: calcChangePercent(dailyNewPatients, prevDailyNewPatients),
        daily_first_visit_change: calcChangePercent(dailyFirstVisit, prevDailyFirstVisit),
        daily_return_change: calcChangePercent(dailyReturn, prevDailyReturn),
        daily_total_change: calcChangePercent(dailyTotal, prevDailyTotal),
        // 객단가 증감률
        prev_revenue_per_patient: prevStat ? getRevenuePerPatient(prevStat.total_revenue, prevStat.total_patients) : null,
      };
    });
  }, [weeklyStats]);

  // 차트 데이터
  const chartData = weeklyStats.map(stat => ({
    week: stat.week_start.slice(5),
    매출: stat.total_revenue,
    신환: stat.new_patients,
    초진: stat.first_visit_patients,
    재진: stat.return_patients,
    전체환자: stat.total_patients,
  }));

  // 각 지표별 최대값 계산
  const maxRevenue = useMemo(() => {
    if (isDailyAverage) {
      return Math.max(...calculateDailyStats.map(stat => stat.daily_revenue), 1);
    }
    return Math.max(...weeklyStats.map(stat => stat.total_revenue), 1);
  }, [weeklyStats, calculateDailyStats, isDailyAverage]);

  const maxRevenuePerPatient = useMemo(() => {
    return Math.max(...calculateDailyStats.map(stat => stat.revenue_per_patient), 1);
  }, [calculateDailyStats]);

  const maxNewPatients = useMemo(() => {
    if (isDailyAverage) {
      return Math.max(...calculateDailyStats.map(stat => stat.daily_new_patients), 1);
    }
    return Math.max(...weeklyStats.map(stat => stat.new_patients), 1);
  }, [weeklyStats, calculateDailyStats, isDailyAverage]);

  const maxFirstVisitPatients = useMemo(() => {
    if (isDailyAverage) {
      return Math.max(...calculateDailyStats.map(stat => stat.daily_first_visit), 1);
    }
    return Math.max(...weeklyStats.map(stat => stat.first_visit_patients), 1);
  }, [weeklyStats, calculateDailyStats, isDailyAverage]);

  const maxReturnPatients = useMemo(() => {
    if (isDailyAverage) {
      return Math.max(...calculateDailyStats.map(stat => stat.daily_return), 1);
    }
    return Math.max(...weeklyStats.map(stat => stat.return_patients), 1);
  }, [weeklyStats, calculateDailyStats, isDailyAverage]);

  const maxTotalPatients = useMemo(() => {
    if (isDailyAverage) {
      return Math.max(...calculateDailyStats.map(stat => stat.daily_total), 1);
    }
    return Math.max(...weeklyStats.map(stat => stat.total_patients), 1);
  }, [weeklyStats, calculateDailyStats, isDailyAverage]);

  // ⭐ 각 연령대별 최대값 계산
  const maxAgeByGroup = useMemo(() => {
    const ageGroups = ['0', '10', '20', '30', '40', '50', '60', '70+'];
    const result: Record<string, number> = {};
    
    ageGroups.forEach(age => {
      const values = weeklyStats.map(stat => stat.age_groups?.[age] || 0);
      result[age] = Math.max(...values, 1);
    });
    
    return result;
  }, [weeklyStats]);

  // ⭐ Top 7 동 이름 추출
  const topDistricts = useMemo(() => {
    const districtTotal: Record<string, number> = {};
    
    weeklyStats.forEach(stat => {
      if (stat.top_districts_data) {
        Object.entries(stat.top_districts_data).forEach(([district, count]) => {
          districtTotal[district] = (districtTotal[district] || 0) + (count as number);
        });
      }
    });

    return Object.entries(districtTotal)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name]) => name);
  }, [weeklyStats]);

  // ⭐ 각 동별 최대값 계산
  const maxByDistrict = useMemo(() => {
    const result: Record<string, number> = {};
    
    topDistricts.forEach(district => {
      const values = weeklyStats.map(stat => stat.top_districts_data?.[district] || 0);
      result[district] = Math.max(...values, 1);
    });
    
    return result;
  }, [weeklyStats, topDistricts]);

  const weekOptions = allWeeklyStats.map((stat, index) => ({
    index,
    label: `${stat.week_start} (${index + 1}주차)`,
  }));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>병원 관리 대시보드</h1>
            {selectedHospital && (
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                선택된 병원: <span style={{ fontWeight: 500, color: '#374151' }}>{selectedHospital}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            로그아웃
          </button>
        </div>
      </div>

      <div style={{ padding: '32px 48px' }}>
        {/* 병원 선택 탭 */}
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', marginBottom: '24px', overflowX: 'auto', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex' }}>
            {hospitals.map((hospital) => (
              <button
                key={hospital.id}
                onClick={() => setSelectedHospital(hospital.name)}
                style={{
                  padding: '14px 24px',
                  fontSize: '13px',
                  fontWeight: selectedHospital === hospital.name ? 600 : 400,
                  color: selectedHospital === hospital.name ? '#111827' : '#9ca3af',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: selectedHospital === hospital.name ? '2px solid #111827' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {hospital.name}
              </button>
            ))}
          </div>
        </div>

        {/* 주차 범위 선택 & 액션 버튼 */}
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '24px' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
                기간 선택 ({allWeeklyStats.length}주)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={startWeekIndex}
                  onChange={(e) => setStartWeekIndex(Number(e.target.value))}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#374151',
                    backgroundColor: '#fff',
                    outline: 'none',
                  }}
                >
                  {weekOptions.map(option => (
                    <option key={option.index} value={option.index}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span style={{ color: '#9ca3af', fontSize: '13px' }}>~</span>
                <select
                  value={endWeekIndex}
                  onChange={(e) => setEndWeekIndex(Number(e.target.value))}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#374151',
                    backgroundColor: '#fff',
                    outline: 'none',
                  }}
                >
                  {weekOptions.map(option => (
                    <option 
                      key={option.index} 
                      value={option.index}
                      disabled={option.index < startWeekIndex}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleUpdateStats}
              disabled={loading || !selectedHospital}
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#fff',
                backgroundColor: loading || !selectedHospital ? '#d1d5db' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: loading || !selectedHospital ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {loading ? '업데이트 중...' : '통계 업데이트'}
            </button>
          </div>

          {message && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              backgroundColor: message.includes('오류') ? '#fef2f2' : '#f0fdf4',
              color: message.includes('오류') ? '#dc2626' : '#16a34a',
            }}>
              {message}
            </div>
          )}
        </div>

        {loading && weeklyStats.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '64px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>로딩 중...</p>
          </div>
        ) : weeklyStats.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '64px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>통계 데이터가 없습니다</p>
            <button
              onClick={handleUpdateStats}
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#fff',
                backgroundColor: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              통계 생성
            </button>
          </div>
        ) : (
          <>
            {/* 차트 섹션 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '16px' }}>매출 추이</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip 
                      formatter={(value: number) => formatNumber(value)}
                      contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="매출" 
                      stroke="#374151" 
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#374151' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* ⭐ 환자 수 추이 차트 with 토글 */}
              <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>환자 수 추이</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setShowNewPatients(!showNewPatients)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: showNewPatients ? '#fff' : '#6b7280',
                        backgroundColor: showNewPatients ? '#10b981' : 'transparent',
                        border: `1px solid ${showNewPatients ? '#10b981' : '#e5e7eb'}`,
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      신환
                    </button>
                    <button
                      onClick={() => setShowFirstVisitPatients(!showFirstVisitPatients)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: showFirstVisitPatients ? '#fff' : '#6b7280',
                        backgroundColor: showFirstVisitPatients ? '#0ea5e9' : 'transparent',
                        border: `1px solid ${showFirstVisitPatients ? '#0ea5e9' : '#e5e7eb'}`,
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      초진
                    </button>
                    <button
                      onClick={() => setShowReturnPatients(!showReturnPatients)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: showReturnPatients ? '#fff' : '#6b7280',
                        backgroundColor: showReturnPatients ? '#f59e0b' : 'transparent',
                        border: `1px solid ${showReturnPatients ? '#f59e0b' : '#e5e7eb'}`,
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      재진
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {showNewPatients && <Bar dataKey="신환" fill="#10b981" radius={[2, 2, 0, 0]} />}
                    {showFirstVisitPatients && <Bar dataKey="초진" fill="#0ea5e9" radius={[2, 2, 0, 0]} />}
                    {showReturnPatients && <Bar dataKey="재진" fill="#f59e0b" radius={[2, 2, 0, 0]} />}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 테이블 섹션 */}
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              {/* 테이블 상단 토글 */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  주간 통계 {isDailyAverage && <span style={{ color: '#6b7280', fontWeight: 400 }}>(일평균)</span>}
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>표시 기준:</span>
                  <button
                    onClick={() => setIsDailyAverage(false)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: !isDailyAverage ? '#fff' : '#6b7280',
                      backgroundColor: !isDailyAverage ? '#374151' : 'transparent',
                      border: `1px solid ${!isDailyAverage ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    주간 합계
                  </button>
                  <button
                    onClick={() => setIsDailyAverage(true)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: isDailyAverage ? '#fff' : '#6b7280',
                      backgroundColor: isDailyAverage ? '#374151' : 'transparent',
                      border: `1px solid ${isDailyAverage ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    일평균
                  </button>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th rowSpan={2} style={{ position: 'sticky', left: 0, zIndex: 10, backgroundColor: '#f9fafb', padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #e5e7eb', minWidth: '130px' }}>
                        기간
                      </th>
                      <th rowSpan={2} style={{ padding: '12px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #e5e7eb' }}>
                        영업일
                      </th>
                      <th colSpan={2} style={{ padding: '8px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #e5e7eb' }}>
                        매출
                      </th>
                      <th colSpan={2} style={{ padding: '8px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #e5e7eb' }}>
                        객단가
                      </th>
                      <th colSpan={2} style={{ padding: '8px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #e5e7eb' }}>
                        신환
                      </th>
                      <th colSpan={2} style={{ padding: '8px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #e5e7eb' }}>
                        초진
                      </th>
                      <th colSpan={2} style={{ padding: '8px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #e5e7eb' }}>
                        재진
                      </th>
                      <th colSpan={2} style={{ padding: '8px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #e5e7eb' }}>
                        전체
                      </th>
                      <th rowSpan={2} style={{ padding: '12px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Top동
                      </th>
                      <th rowSpan={2} style={{ padding: '12px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #e5e7eb' }}>
                        Top3동
                      </th>
                      <th colSpan={8} style={{ padding: '8px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #e5e7eb' }}>
                        연령별
                      </th>
                      <th colSpan={topDistricts.length} style={{ padding: '8px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        동별
                      </th>
                    </tr>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af' }}>금액</th>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', borderRight: '1px solid #e5e7eb' }}>%</th>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af' }}>금액</th>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', borderRight: '1px solid #e5e7eb' }}>%</th>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af' }}>인원</th>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', borderRight: '1px solid #e5e7eb' }}>%</th>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af' }}>인원</th>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', borderRight: '1px solid #e5e7eb' }}>%</th>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af' }}>인원</th>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', borderRight: '1px solid #e5e7eb' }}>%</th>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af' }}>인원</th>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', borderRight: '1px solid #e5e7eb' }}>%</th>
                      {['0', '10', '20', '30', '40', '50', '60', '70+'].map((age, idx, arr) => (
                        <th 
                          key={age} 
                          style={{ padding: '8px 8px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', borderRight: idx === arr.length - 1 ? '1px solid #e5e7eb' : undefined }}
                        >
                          {age}대
                        </th>
                      ))}
                      {topDistricts.map((district, idx) => (
                        <th key={idx} style={{ padding: '8px 8px', fontSize: '11px', fontWeight: 500, color: '#9ca3af' }} title={district}>
                          {parseDistrictName(district)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...calculateDailyStats].reverse().map((stat, index) => {
                      // 일평균/주간합계에 따른 값 선택
                      const displayRevenue = isDailyAverage ? stat.daily_revenue : stat.total_revenue;
                      const displayRevenueChange = isDailyAverage ? stat.daily_revenue_change : stat.revenue_change_percent;
                      const displayNewPatients = isDailyAverage ? stat.daily_new_patients : stat.new_patients;
                      const displayNewPatientsChange = isDailyAverage ? stat.daily_new_patients_change : stat.new_patients_change_percent;
                      const displayFirstVisit = isDailyAverage ? stat.daily_first_visit : stat.first_visit_patients;
                      const displayFirstVisitChange = isDailyAverage ? stat.daily_first_visit_change : stat.first_visit_patients_change_percent;
                      const displayReturn = isDailyAverage ? stat.daily_return : stat.return_patients;
                      const displayReturnChange = isDailyAverage ? stat.daily_return_change : stat.return_patients_change_percent;
                      const displayTotal = isDailyAverage ? stat.daily_total : stat.total_patients;
                      const displayTotalChange = isDailyAverage ? stat.daily_total_change : stat.total_patients_change_percent;
                      
                      // 객단가 증감률 계산
                      const revenuePerPatientChange = stat.prev_revenue_per_patient && stat.prev_revenue_per_patient > 0
                        ? ((stat.revenue_per_patient - stat.prev_revenue_per_patient) / stat.prev_revenue_per_patient) * 100
                        : null;

                      return (
                      <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ position: 'sticky', left: 0, zIndex: 10, backgroundColor: '#fff', padding: '12px 16px', whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 500, color: '#374151', borderRight: '1px solid #e5e7eb', minWidth: '130px' }}>
                          {stat.week_start}<br/>
                          <span style={{ color: '#9ca3af' }}>~ {stat.week_end.slice(5)}</span>
                        </td>
                        
                        {/* 영업일 */}
                        <td style={{ padding: '12px', whiteSpace: 'nowrap', fontSize: '11px', textAlign: 'center', color: '#374151', fontWeight: 600, borderRight: '1px solid #e5e7eb' }}>
                          {stat.working_days}일
                        </td>
                        
                        {/* 매출 */}
                        <td style={{ padding: '12px', minWidth: '180px' }}>
                          <RevenueBar 
                            value={displayRevenue}
                            max={maxRevenue}
                            color="#6b7280"
                          />
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontSize: '11px', textAlign: 'center', fontWeight: 600, borderRight: '1px solid #e5e7eb', color: getPercentColor(displayRevenueChange) }}>
                          {formatPercent(displayRevenueChange)}
                        </td>
                        
                        {/* 객단가 */}
                        <td style={{ padding: '12px', minWidth: '140px' }}>
                          <RevenueBar 
                            value={stat.revenue_per_patient}
                            max={maxRevenuePerPatient}
                            color="#8b5cf6"
                          />
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontSize: '11px', textAlign: 'center', fontWeight: 600, borderRight: '1px solid #e5e7eb', color: getPercentColor(revenuePerPatientChange) }}>
                          {formatPercent(revenuePerPatientChange)}
                        </td>
                        
                        {/* 신환 */}
                        <td style={{ padding: '12px', minWidth: '100px' }}>
                          <PatientBar 
                            value={isDailyAverage ? Number(displayNewPatients.toFixed(1)) : displayNewPatients}
                            max={maxNewPatients}
                            color="#10b981"
                          />
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontSize: '11px', textAlign: 'center', fontWeight: 600, borderRight: '1px solid #e5e7eb', color: getPercentColor(displayNewPatientsChange) }}>
                          {formatPercent(displayNewPatientsChange)}
                        </td>
                        
                        {/* 초진 */}
                        <td style={{ padding: '12px', minWidth: '100px' }}>
                          <PatientBar 
                            value={isDailyAverage ? Number(displayFirstVisit.toFixed(1)) : displayFirstVisit}
                            max={maxFirstVisitPatients}
                            color="#0ea5e9"
                          />
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontSize: '11px', textAlign: 'center', fontWeight: 600, borderRight: '1px solid #e5e7eb', color: getPercentColor(displayFirstVisitChange) }}>
                          {formatPercent(displayFirstVisitChange)}
                        </td>
                        
                        {/* 재진 */}
                        <td style={{ padding: '12px', minWidth: '100px' }}>
                          <PatientBar 
                            value={isDailyAverage ? Number(displayReturn.toFixed(1)) : displayReturn}
                            max={maxReturnPatients}
                            color="#f59e0b"
                          />
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontSize: '11px', textAlign: 'center', fontWeight: 600, borderRight: '1px solid #e5e7eb', color: getPercentColor(displayReturnChange) }}>
                          {formatPercent(displayReturnChange)}
                        </td>
                        
                        {/* 전체환자 */}
                        <td style={{ padding: '12px', minWidth: '100px' }}>
                          <PatientBar 
                            value={isDailyAverage ? Number(displayTotal.toFixed(1)) : displayTotal}
                            max={maxTotalPatients}
                            color="#8b5cf6"
                          />
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontSize: '11px', textAlign: 'center', fontWeight: 600, borderRight: '1px solid #e5e7eb', color: getPercentColor(displayTotalChange) }}>
                          {formatPercent(displayTotalChange)}
                        </td>
                        
                        <td style={{ padding: '12px', whiteSpace: 'nowrap', fontSize: '11px', textAlign: 'center', color: '#374151' }}>
                          {stat.top_districts_sum}
                          <span style={{ color: '#9ca3af', marginLeft: '4px' }}>({stat.top_districts_ratio.toFixed(0)}%)</span>
                        </td>
                        <td style={{ padding: '12px', whiteSpace: 'nowrap', fontSize: '11px', textAlign: 'center', color: '#374151', borderRight: '1px solid #e5e7eb' }}>
                          {stat.top_3_districts_sum}
                          <span style={{ color: '#9ca3af', marginLeft: '4px' }}>({stat.top_3_districts_ratio.toFixed(0)}%)</span>
                        </td>
                        
                        {/* 연령별 신환 */}
                        {['0', '10', '20', '30', '40', '50', '60', '70+'].map((age, idx, arr) => (
                          <td 
                            key={age} 
                            style={{ padding: '12px 8px', minWidth: '75px', borderRight: idx === arr.length - 1 ? '1px solid #e5e7eb' : undefined }}
                          >
                            <InlineBar 
                              value={stat.age_groups?.[age] || 0}
                              max={maxAgeByGroup[age]}
                              color="#14b8a6"
                            />
                          </td>
                        ))}
                        
                        {/* 동별 신환 */}
                        {topDistricts.map((district, idx) => (
                          <td key={idx} style={{ padding: '12px 8px', minWidth: '75px' }}>
                            <InlineBar 
                              value={stat.top_districts_data?.[district] || 0}
                              max={maxByDistrict[district]}
                              color="#6366f1"
                            />
                          </td>
                        ))}
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;