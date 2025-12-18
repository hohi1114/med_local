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

// ⭐ 4주 단위 통계 타입
interface AggregatedStat extends WeeklyStat {
  period_label: string;
  period_weeks: number;
  working_days: number;
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
  
  // ⭐ 4주 단위 모드 토글
  const [is4WeekMode, setIs4WeekMode] = useState(false);

  useEffect(() => {
    checkAdminAuth();
    loadHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospital) {
      setMessage('');
      loadWeeklyStats(selectedHospital);
    }
  }, [selectedHospital]);

  useEffect(() => {
    if (allWeeklyStats.length > 0) {
      const filtered = allWeeklyStats.slice(startWeekIndex, endWeekIndex + 1);
      setWeeklyStats(filtered);
    }
  }, [startWeekIndex, endWeekIndex, allWeeklyStats]);

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

  const getPercentColor = (percent: number | null) => {
    if (percent === null) return '#9ca3af';
    if (percent > 0) return '#dc2626';
    if (percent < 0) return '#2563eb';
    return '#9ca3af';
  };

  const getWorkingDays = (closedDays: number) => Math.max(7 - closedDays, 1);

  const getRevenuePerPatient = (revenue: number, patients: number) => {
    if (patients === 0) return 0;
    return Math.round(revenue / patients);
  };

  // ⭐ 4주 단위 데이터 집계
  const aggregated4WeekStats = useMemo((): AggregatedStat[] => {
    if (!is4WeekMode || weeklyStats.length === 0) return [];
    
    const result: AggregatedStat[] = [];
    
    // ⭐ 뒤에서부터 4주씩 묶기 (최근 데이터 기준)
    for (let i = weeklyStats.length; i > 0; i -= 4) {
      const startIdx = Math.max(0, i - 4);
      const chunk = weeklyStats.slice(startIdx, i);
      if (chunk.length === 0) continue;
      
      // 기간 정보
      const periodStart = chunk[0].week_start;
      const periodEnd = chunk[chunk.length - 1].week_end;
      const periodWeeks = chunk.length;
      
      // 합산
      const totalClosedDays = chunk.reduce((sum, s) => sum + s.closed_days, 0);
      const totalRevenue = chunk.reduce((sum, s) => sum + s.total_revenue, 0);
      const totalNewPatients = chunk.reduce((sum, s) => sum + s.new_patients, 0);
      const totalFirstVisit = chunk.reduce((sum, s) => sum + s.first_visit_patients, 0);
      const totalReturn = chunk.reduce((sum, s) => sum + s.return_patients, 0);
      const totalPatients = chunk.reduce((sum, s) => sum + s.total_patients, 0);
      const workingDays = (7 * periodWeeks) - totalClosedDays;
      
      // 연령별 합산
      const ageGroups: Record<string, number> = {};
      ['0', '10', '20', '30', '40', '50', '60', '70+'].forEach(age => {
        ageGroups[age] = chunk.reduce((sum, s) => sum + (s.age_groups?.[age] || 0), 0);
      });
      
      // 동별 합산
      const districtsData: Record<string, number> = {};
      chunk.forEach(s => {
        if (s.top_districts_data) {
          Object.entries(s.top_districts_data).forEach(([district, count]) => {
            districtsData[district] = (districtsData[district] || 0) + (count as number);
          });
        }
      });
      
      // Top 동 합계/비율 계산
      const sortedDistricts = Object.entries(districtsData).sort((a, b) => b[1] - a[1]);
      const topDistrictsSum = sortedDistricts.slice(0, 7).reduce((sum, [, count]) => sum + count, 0);
      const top3DistrictsSum = sortedDistricts.slice(0, 3).reduce((sum, [, count]) => sum + count, 0);
      const topDistrictsRatio = totalNewPatients > 0 ? (topDistrictsSum / totalNewPatients) * 100 : 0;
      const top3DistrictsRatio = totalNewPatients > 0 ? (top3DistrictsSum / totalNewPatients) * 100 : 0;
      
      result.unshift({  // ⭐ unshift로 앞에 추가 (시간순 유지)
        week_start: periodStart,
        week_end: periodEnd,
        period_label: `${periodStart} ~ ${periodEnd.slice(5)}`,
        period_weeks: periodWeeks,
        closed_days: totalClosedDays,
        working_days: workingDays,
        total_revenue: totalRevenue,
        revenue_change_percent: 0,
        new_patients: totalNewPatients,
        new_patients_change_percent: 0,
        first_visit_patients: totalFirstVisit,
        first_visit_patients_change_percent: 0,
        return_patients: totalReturn,
        return_patients_change_percent: 0,
        total_patients: totalPatients,
        total_patients_change_percent: 0,
        age_groups: ageGroups,
        top_districts_data: districtsData,
        top_districts_sum: topDistrictsSum,
        top_districts_ratio: topDistrictsRatio,
        top_3_districts_sum: top3DistrictsSum,
        top_3_districts_ratio: top3DistrictsRatio,
      });
    }
    
    // 증감률 계산
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1];
      const curr = result[i];
      
      const calcChange = (current: number, previous: number) => {
        if (previous === 0) return null;
        return ((current - previous) / previous) * 100;
      };
      
      curr.revenue_change_percent = calcChange(curr.total_revenue, prev.total_revenue) || 0;
      curr.new_patients_change_percent = calcChange(curr.new_patients, prev.new_patients) || 0;
      curr.first_visit_patients_change_percent = calcChange(curr.first_visit_patients, prev.first_visit_patients) || 0;
      curr.return_patients_change_percent = calcChange(curr.return_patients, prev.return_patients) || 0;
      curr.total_patients_change_percent = calcChange(curr.total_patients, prev.total_patients) || 0;
    }
    
    return result;
  }, [weeklyStats, is4WeekMode]);

  // ⭐ 표시할 데이터 (1주 or 4주)
  const displayStats = useMemo(() => {
    return is4WeekMode ? aggregated4WeekStats : weeklyStats;
  }, [is4WeekMode, aggregated4WeekStats, weeklyStats]);

  // ⭐ 일평균 데이터 계산 (수정됨)
  const calculateDailyStats = useMemo(() => {
    return displayStats.map((stat, index) => {
      const workingDays = is4WeekMode 
        ? (stat as AggregatedStat).working_days 
        : getWorkingDays(stat.closed_days);
      const prevStat = index > 0 ? displayStats[index - 1] : null;
      const prevWorkingDays = prevStat 
        ? (is4WeekMode 
            ? (prevStat as AggregatedStat).working_days 
            : getWorkingDays(prevStat.closed_days))
        : null;

      const dailyRevenue = Math.round(stat.total_revenue / workingDays);
      const dailyNewPatients = stat.new_patients / workingDays;
      const dailyFirstVisit = stat.first_visit_patients / workingDays;
      const dailyReturn = stat.return_patients / workingDays;
      const dailyTotal = stat.total_patients / workingDays;

      const prevDailyRevenue = prevStat && prevWorkingDays ? Math.round(prevStat.total_revenue / prevWorkingDays) : null;
      const prevDailyNewPatients = prevStat && prevWorkingDays ? prevStat.new_patients / prevWorkingDays : null;
      const prevDailyFirstVisit = prevStat && prevWorkingDays ? prevStat.first_visit_patients / prevWorkingDays : null;
      const prevDailyReturn = prevStat && prevWorkingDays ? prevStat.return_patients / prevWorkingDays : null;
      const prevDailyTotal = prevStat && prevWorkingDays ? prevStat.total_patients / prevWorkingDays : null;

      const calcChangePercent = (current: number, prev: number | null) => {
        if (prev === null || prev === 0) return null;
        return ((current - prev) / prev) * 100;
      };

      return {
        ...stat,
        working_days: workingDays,
        revenue_per_patient: getRevenuePerPatient(stat.total_revenue, stat.total_patients),
        daily_revenue: dailyRevenue,
        daily_new_patients: dailyNewPatients,
        daily_first_visit: dailyFirstVisit,
        daily_return: dailyReturn,
        daily_total: dailyTotal,
        daily_revenue_change: calcChangePercent(dailyRevenue, prevDailyRevenue),
        daily_new_patients_change: calcChangePercent(dailyNewPatients, prevDailyNewPatients),
        daily_first_visit_change: calcChangePercent(dailyFirstVisit, prevDailyFirstVisit),
        daily_return_change: calcChangePercent(dailyReturn, prevDailyReturn),
        daily_total_change: calcChangePercent(dailyTotal, prevDailyTotal),
        prev_revenue_per_patient: prevStat ? getRevenuePerPatient(prevStat.total_revenue, prevStat.total_patients) : null,
      };
    });
  }, [displayStats, is4WeekMode]);

  // 차트 데이터 (수정됨)
  const chartData = displayStats.map(stat => ({
    week: is4WeekMode 
      ? `${stat.week_start.slice(5)}~${stat.week_end.slice(5)}`
      : stat.week_start.slice(5),
    매출: stat.total_revenue,
    신환: stat.new_patients,
    초진: stat.first_visit_patients,
    재진: stat.return_patients,
    전체환자: stat.total_patients,
  }));

  // 각 지표별 최대값 계산 (수정됨)
  const maxRevenue = useMemo(() => {
    if (isDailyAverage) {
      return Math.max(...calculateDailyStats.map(stat => stat.daily_revenue), 1);
    }
    return Math.max(...displayStats.map(stat => stat.total_revenue), 1);
  }, [displayStats, calculateDailyStats, isDailyAverage]);

  const maxRevenuePerPatient = useMemo(() => {
    return Math.max(...calculateDailyStats.map(stat => stat.revenue_per_patient), 1);
  }, [calculateDailyStats]);

  const maxNewPatients = useMemo(() => {
    if (isDailyAverage) {
      return Math.max(...calculateDailyStats.map(stat => stat.daily_new_patients), 1);
    }
    return Math.max(...displayStats.map(stat => stat.new_patients), 1);
  }, [displayStats, calculateDailyStats, isDailyAverage]);

  const maxFirstVisitPatients = useMemo(() => {
    if (isDailyAverage) {
      return Math.max(...calculateDailyStats.map(stat => stat.daily_first_visit), 1);
    }
    return Math.max(...displayStats.map(stat => stat.first_visit_patients), 1);
  }, [displayStats, calculateDailyStats, isDailyAverage]);

  const maxReturnPatients = useMemo(() => {
    if (isDailyAverage) {
      return Math.max(...calculateDailyStats.map(stat => stat.daily_return), 1);
    }
    return Math.max(...displayStats.map(stat => stat.return_patients), 1);
  }, [displayStats, calculateDailyStats, isDailyAverage]);

  const maxTotalPatients = useMemo(() => {
    if (isDailyAverage) {
      return Math.max(...calculateDailyStats.map(stat => stat.daily_total), 1);
    }
    return Math.max(...displayStats.map(stat => stat.total_patients), 1);
  }, [displayStats, calculateDailyStats, isDailyAverage]);

  // ⭐ 각 연령대별 최대값 계산 (수정됨)
  const maxAgeByGroup = useMemo(() => {
    const ageGroups = ['0', '10', '20', '30', '40', '50', '60', '70+'];
    const result: Record<string, number> = {};
    
    ageGroups.forEach(age => {
      const values = displayStats.map(stat => stat.age_groups?.[age] || 0);
      result[age] = Math.max(...values, 1);
    });
    
    return result;
  }, [displayStats]);

  // ⭐ Top 7 동 이름 추출 (수정됨)
  const topDistricts = useMemo(() => {
    const districtTotal: Record<string, number> = {};
    
    displayStats.forEach(stat => {
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
  }, [displayStats]);

  // ⭐ 각 동별 최대값 계산 (수정됨)
  const maxByDistrict = useMemo(() => {
    const result: Record<string, number> = {};
    
    topDistricts.forEach(district => {
      const values = displayStats.map(stat => stat.top_districts_data?.[district] || 0);
      result[district] = Math.max(...values, 1);
    });
    
    return result;
  }, [displayStats, topDistricts]);

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
          {/* ⭐ 버튼 그룹 */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* 🗺️ 위치 분석 버튼 추가 */}
            <button
              onClick={() => navigate('/admin/hospital-map')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#fff',
                backgroundColor: '#10b981',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🗺️ 위치 분석
            </button>
            
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

            {/* ⭐ 1주/4주 단위 토글 추가 */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
                집계 단위
              </label>
              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
                <button
                  onClick={() => setIs4WeekMode(false)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: !is4WeekMode ? '#fff' : '#6b7280',
                    backgroundColor: !is4WeekMode ? '#374151' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  1주
                </button>
                <button
                  onClick={() => setIs4WeekMode(true)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: is4WeekMode ? '#fff' : '#6b7280',
                    backgroundColor: is4WeekMode ? '#374151' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  4주
                </button>
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

        {loading && displayStats.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '64px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>로딩 중...</p>
          </div>
        ) : displayStats.length === 0 ? (
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
                <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '16px' }}>
                  매출 추이 {is4WeekMode && <span style={{ color: '#6b7280', fontWeight: 400 }}>(4주 단위)</span>}
                </h3>
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
                  <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                    환자 수 추이 {is4WeekMode && <span style={{ color: '#6b7280', fontWeight: 400 }}>(4주 단위)</span>}
                  </h3>
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
                  {is4WeekMode ? '4주 단위 통계' : '주간 통계'} {isDailyAverage && <span style={{ color: '#6b7280', fontWeight: 400 }}>(일평균)</span>}
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
                    {is4WeekMode ? '4주 합계' : '주간 합계'}
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
                      
                      const revenuePerPatientChange = stat.prev_revenue_per_patient && stat.prev_revenue_per_patient > 0
                        ? ((stat.revenue_per_patient - stat.prev_revenue_per_patient) / stat.prev_revenue_per_patient) * 100
                        : null;

                      return (
                      <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ position: 'sticky', left: 0, zIndex: 10, backgroundColor: '#fff', padding: '12px 16px', whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 500, color: '#374151', borderRight: '1px solid #e5e7eb', minWidth: '130px' }}>
                          {stat.week_start}<br/>
                          <span style={{ color: '#9ca3af' }}>~ {stat.week_end.slice(5)}</span>
                          {is4WeekMode && (
                            <span style={{ display: 'block', color: '#3b82f6', fontSize: '10px', marginTop: '2px' }}>
                              ({(stat as AggregatedStat).period_weeks}주)
                            </span>
                          )}
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