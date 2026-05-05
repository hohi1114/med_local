import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, BlogAccount } from '../utils/adminApi';
import { getCookie } from '../utils/api/cookie';
import { generateWeeklyTrendChart, generateAgeAnalysisChart, generateWeeklyAgeHeatmapChart, generateAreaComparisonChart, generateWeeklyRegionHeatmapChart, generateWeeklyAreaConcentrationChart, generateRetentionRateChart } from '../utils/chartGenerator';
import { generateSummaryInterpretation, generateAgeInterpretation, generateWeeklyAgeTrendInterpretation, generateRegionInterpretation, generateWeeklyRegionTrendInterpretation, generateWeeklyAreaConcentrationInterpretation, generateSmartplaceInterpretation, classifyKeywords } from '../utils/openai';
import { getMarketingCalendar, MarketingCalendarEntry, getNotionDatabases, addNotionDatabase, deleteNotionDatabase, NotionDatabaseRecord } from '../utils/notionApi';
import { NotionDbModal, ReportHeader, SectionList, SectionEditor } from '../components/report';

interface AnalyticsHospital {
  hospital_id: string;
  name: string;
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

interface ReportSection {
  id: string;
  title: string;
  enabled: boolean;
  generated: boolean;
  includedInPdf: boolean;
  contentHtml: string;
  useDailyAverage?: boolean;
  showUnitPrice?: boolean;
  retentionStart?: string;
  retentionEnd?: string;
  excludedWeeksRetention?: string[];
}

export const ReportBuilderPage: React.FC = () => {
  const navigate = useNavigate();

  // 병원 및 데이터 상태
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingSections, setGeneratingSections] = useState<Set<string>>(new Set());

  // 기간 선택 (A: 분석 기간, B: 비교 기간)
  const [periodAStart, setPeriodAStart] = useState('');
  const [periodAEnd, setPeriodAEnd] = useState('');
  const [periodBStart, setPeriodBStart] = useState('');
  const [periodBEnd, setPeriodBEnd] = useState('');

  // 제외 주차
  const [excludedWeeksA, setExcludedWeeksA] = useState<string[]>([]);
  const [excludedWeeksB, setExcludedWeeksB] = useState<string[]>([]);

  const handlePeriodAStartChange = (v: string) => { setPeriodAStart(v); setExcludedWeeksA([]); };
  const handlePeriodAEndChange   = (v: string) => { setPeriodAEnd(v);   setExcludedWeeksA([]); };
  const handlePeriodBStartChange = (v: string) => { setPeriodBStart(v); setExcludedWeeksB([]); };
  const handlePeriodBEndChange   = (v: string) => { setPeriodBEnd(v);   setExcludedWeeksB([]); };

  // Notion Database ID (채널별 유입 성과용)
  const [notionDatabaseId, setNotionDatabaseId] = useState('');
  const [savedNotionDatabases, setSavedNotionDatabases] = useState<NotionDatabaseRecord[]>([]);
  const [showAddDbModal, setShowAddDbModal] = useState(false);
  const [newDbId, setNewDbId] = useState('');
  const [newDbName, setNewDbName] = useState('');
  const [addingDb, setAddingDb] = useState(false);

  // 새 DB (Analytics) 병원 상태
  const [analyticsHospitals, setAnalyticsHospitals] = useState<AnalyticsHospital[]>([]);
  const [analyticsHospitalId, setAnalyticsHospitalId] = useState('');

  // 블로그 계정 상태
  const [blogAccounts, setBlogAccounts] = useState<BlogAccount[]>([]);
  const [selectedBlogIds, setSelectedBlogIds] = useState<string[]>([]);

  // 보고서 섹션 상태
  const [sections, setSections] = useState<ReportSection[]>([
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
      id: 'retention_analysis',
      title: '유입 추이 분석 - 신환 재방문율',
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
      id: 'conclusion',
      title: '총평',
      enabled: false,
      generated: false,
      includedInPdf: false,
      contentHtml: '',
    },
  ]);

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // 인증 체크
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getCookie('accessToken');
      if (!token) {
        navigate('/admin/login');
      }
    };
    checkAuth();
  }, [navigate]);

  // 초기 로딩
  useEffect(() => {
    loadHospitals();
    loadAnalyticsHospitals();
  }, []);

  // 병원 선택 시 데이터 로드 및 매핑 불러오기
  useEffect(() => {
    if (selectedHospital) {
      loadWeeklyStats(selectedHospital);
      loadAnalyticsMapping(selectedHospital);
    }
  }, [selectedHospital]);

  const loadHospitals = async () => {
    try {
      const list = await adminAPI.getHospitalList();
      setHospitals(list);
      if (list.length > 0) {
        setSelectedHospital(list[0].name);
      }
    } catch (error) {
      console.error('Failed to load hospitals:', error);
    }
  };

  const loadAnalyticsHospitals = async () => {
    try {
      const list = await adminAPI.getAnalyticsHospitals();
      setAnalyticsHospitals(list);
    } catch (error) {
      console.error('Failed to load analytics hospitals:', error);
    }
  };

  const loadAnalyticsMapping = async (hospitalName: string) => {
    try {
      const mappedId = await adminAPI.getAnalyticsMapping(hospitalName);
      setAnalyticsHospitalId(mappedId || '');
      // 블로그 계정도 함께 로드
      if (mappedId) {
        loadBlogAccounts(mappedId);
      } else {
        setBlogAccounts([]);
        setSelectedBlogIds([]);
      }
    } catch (error) {
      console.error('Failed to load analytics mapping:', error);
    }
  };

  const handleAnalyticsHospitalChange = async (id: string) => {
    setAnalyticsHospitalId(id);
    if (selectedHospital) {
      try {
        await adminAPI.saveAnalyticsMapping(selectedHospital, id || null);
      } catch (error) {
        console.error('Failed to save analytics mapping:', error);
      }
    }
    // 블로그 계정 로드
    if (id) {
      loadBlogAccounts(id);
    } else {
      setBlogAccounts([]);
      setSelectedBlogIds([]);
    }
  };

  const loadBlogAccounts = async (hospitalId: string) => {
    try {
      const accounts = await adminAPI.getBlogAccounts(hospitalId);
      setBlogAccounts(accounts);
      // 기본적으로 모든 블로그 선택
      setSelectedBlogIds(accounts.map(a => a.id));
    } catch (error) {
      console.error('Failed to load blog accounts:', error);
      setBlogAccounts([]);
    }
  };

  const handleBlogSelection = (blogId: string, checked: boolean) => {
    if (checked) {
      setSelectedBlogIds(prev => [...prev, blogId]);
    } else {
      setSelectedBlogIds(prev => prev.filter(id => id !== blogId));
    }
  };


  const loadWeeklyStats = async (hospitalName: string) => {
    setLoading(true);
    try {
      const stats = await adminAPI.getHospitalWeeklyStats(hospitalName);
      const reversedStats = stats.reverse();
      setWeeklyStats(reversedStats);

      // 최근 4주를 기본 Period A로 설정 (시작~종료 모두 week_start 사용)
      if (reversedStats.length >= 4) {
        setPeriodAStart(reversedStats[reversedStats.length - 4].week_start);
        setPeriodAEnd(reversedStats[reversedStats.length - 1].week_start);
      }

      // 그 이전 4주를 Period B로 설정 (시작~종료 모두 week_start 사용)
      if (reversedStats.length >= 8) {
        setPeriodBStart(reversedStats[reversedStats.length - 8].week_start);
        setPeriodBEnd(reversedStats[reversedStats.length - 5].week_start);
      }

      // 선택된 병원의 user_id로 Notion DB 목록 로드
      const hospital = hospitals.find(h => h.name === hospitalName);
      if (hospital) {
        loadNotionDatabases(hospital.id);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Notion Database 목록 로드
  const loadNotionDatabases = async (userId: string) => {
    try {
      const databases = await getNotionDatabases(userId);
      setSavedNotionDatabases(databases);
      // 첫 번째 DB가 있으면 자동 선택, 없으면 초기화
      if (databases.length > 0) {
        setNotionDatabaseId(databases[0].database_id);
      } else {
        setNotionDatabaseId('');
      }
    } catch (error) {
      console.error('Failed to load Notion databases:', error);
      setSavedNotionDatabases([]);
      setNotionDatabaseId('');
    }
  };

  // Notion Database 추가
  const handleAddNotionDatabase = async () => {
    if (!newDbId.trim()) return;

    const hospital = hospitals.find(h => h.name === selectedHospital);
    if (!hospital) return;

    setAddingDb(true);
    try {
      await addNotionDatabase(hospital.id, newDbId.trim(), newDbName.trim() || undefined);
      await loadNotionDatabases(hospital.id);
      setNewDbId('');
      setNewDbName('');
      setShowAddDbModal(false);
    } catch (error: any) {
      alert(error.message || 'Database 추가 중 오류가 발생했습니다.');
    } finally {
      setAddingDb(false);
    }
  };

  // Notion Database 삭제
  const handleDeleteNotionDatabase = async (id: string) => {
    if (!confirm('이 Database를 삭제하시겠습니까?')) return;

    try {
      await deleteNotionDatabase(id);
      const hospital = hospitals.find(h => h.name === selectedHospital);
      if (hospital) {
        await loadNotionDatabases(hospital.id);
      }
      // 삭제된 DB가 선택된 경우 초기화
      const deletedDb = savedNotionDatabases.find(db => db.id === id);
      if (deletedDb && notionDatabaseId === deletedDb.database_id) {
        setNotionDatabaseId('');
      }
    } catch (error: any) {
      alert(error.message || 'Database 삭제 중 오류가 발생했습니다.');
    }
  };

  // 섹션 활성화/비활성화
  const toggleSection = (id: string) => {
    setSections(sections.map(section =>
      section.id === id
        ? { ...section, enabled: !section.enabled }
        : section
    ));
  };

  // 선택된 섹션 가져오기
  const selectedSection = sections.find(s => s.id === selectedSectionId);

  // 선택된 week_start에 해당하는 week_end 찾기 (종료일은 해당 주의 끝까지 포함)
  const getWeekEnd = (weekStart: string): string => {
    const stat = weeklyStats.find(s => s.week_start === weekStart);
    return stat ? stat.week_end : weekStart;
  };

  // GPT 해석 텍스트에 줄바꿈 추가 (문장 끝마다)
  const formatInterpretation = (text: string): string => {
    // 다양한 문장 종결 패턴을 처리
    return text
      // 먼저 기존 줄바꿈을 <br/>로 변환
      .replace(/\n/g, '<br/><br/>')
      // 마침표+공백 → 줄바꿈 (이미 <br/>이 있는 경우 제외)
      .replace(/\.(?!<br\/>)(\s)/g, '.<br/><br/>')
      // 연속된 <br/> 정리 (4개 이상을 2개로)
      .replace(/(<br\/>){3,}/g, '<br/><br/>');
  };

  // 개요 생성 함수
  const generateOverview = (): string => {
    if (!selectedHospital || !periodAStart || !periodAEnd) {
      return '<p>병원과 기간을 선택해주세요.</p>';
    }

    // 종료일을 해당 주의 week_end로 변환
    const actualPeriodAEnd = getWeekEnd(periodAEnd);
    const actualPeriodBEnd = getWeekEnd(periodBEnd);

    // Period A 데이터 집계
    const periodAStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodAStart && stat.week_end <= actualPeriodAEnd
        && !excludedWeeksA.includes(stat.week_start)
    );

    // Period B 데이터 집계
    const periodBStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodBStart && stat.week_end <= actualPeriodBEnd
        && !excludedWeeksB.includes(stat.week_start)
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

  // 요약 섹션 생성 (차트 포함)
  const generateSummaryWithChart = async (): Promise<string> => {
    // 섹션별 설정 읽기
    const summarySec = sections.find(s => s.id === 'summary');
    const useDailyAverage = summarySec?.useDailyAverage ?? false;
    const showUnitPrice = summarySec?.showUnitPrice ?? false;

    // 종료일을 해당 주의 week_end로 변환
    const actualPeriodAEnd = getWeekEnd(periodAEnd);
    const actualPeriodBEnd = getWeekEnd(periodBEnd);

    const periodAStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodAStart && stat.week_end <= actualPeriodAEnd
        && !excludedWeeksA.includes(stat.week_start)
    );
    const periodBStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodBStart && stat.week_end <= actualPeriodBEnd
        && !excludedWeeksB.includes(stat.week_start)
    );

    if (periodAStats.length === 0) {
      return '<p>선택한 기간에 데이터가 없습니다.</p>';
    }

    const formatNumber = (num: number) =>
      useDailyAverage
        ? new Intl.NumberFormat('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(num)
        : new Intl.NumberFormat('ko-KR').format(Math.round(num));

    // 영업일 수 계산
    const periodAWorkDays = periodAStats.reduce((sum, stat) => sum + (7 - stat.closed_days), 0);
    const periodBWorkDays = periodBStats.reduce((sum, stat) => sum + (7 - stat.closed_days), 0);

    // 합계 계산
    const periodARaw = {
      revenue: periodAStats.reduce((sum, stat) => sum + stat.total_revenue, 0),
      newPatients: periodAStats.reduce((sum, stat) => sum + stat.new_patients, 0),
      firstVisit: periodAStats.reduce((sum, stat) => sum + stat.first_visit_patients, 0),
      returnPatients: periodAStats.reduce((sum, stat) => sum + stat.return_patients, 0),
      totalPatients: periodAStats.reduce((sum, stat) => sum + stat.total_patients, 0),
    };

    const periodBRaw = {
      revenue: periodBStats.reduce((sum, stat) => sum + stat.total_revenue, 0),
      newPatients: periodBStats.reduce((sum, stat) => sum + stat.new_patients, 0),
      firstVisit: periodBStats.reduce((sum, stat) => sum + stat.first_visit_patients, 0),
      returnPatients: periodBStats.reduce((sum, stat) => sum + stat.return_patients, 0),
      totalPatients: periodBStats.reduce((sum, stat) => sum + stat.total_patients, 0),
    };

    // 일평균 모드일 때 영업일 수로 나누기
    const divA = useDailyAverage && periodAWorkDays > 0 ? periodAWorkDays : 1;
    const divB = useDailyAverage && periodBWorkDays > 0 ? periodBWorkDays : 1;

    const periodA = {
      revenue: periodARaw.revenue / divA,
      newPatients: periodARaw.newPatients / divA,
      firstVisit: periodARaw.firstVisit / divA,
      returnPatients: periodARaw.returnPatients / divA,
      totalPatients: periodARaw.totalPatients / divA,
    };

    const periodB = {
      revenue: periodBRaw.revenue / divB,
      newPatients: periodBRaw.newPatients / divB,
      firstVisit: periodBRaw.firstVisit / divB,
      returnPatients: periodBRaw.returnPatients / divB,
      totalPatients: periodBRaw.totalPatients / divB,
    };

    // 차이 계산
    const diff = {
      revenue: periodA.revenue - periodB.revenue,
      newPatients: periodA.newPatients - periodB.newPatients,
      firstVisit: periodA.firstVisit - periodB.firstVisit,
      returnPatients: periodA.returnPatients - periodB.returnPatients,
      totalPatients: periodA.totalPatients - periodB.totalPatients,
    };

    // 증감률 계산 함수
    const calcChangeRate = (a: number, b: number): string => {
      if (b === 0) return '-';
      const rate = ((a - b) / b) * 100;
      const sign = rate >= 0 ? '+' : '';
      return `${sign}${rate.toFixed(1)}%`;
    };

    // 셀 배경색 생성 함수 (증가=연한초록, 감소=연한빨강)
    const getCellStyle = (diffValue: number): string => {
      if (diffValue > 0) {
        return 'background-color: #d1fae5;'; // 연한 초록
      } else if (diffValue < 0) {
        return 'background-color: #fee2e2;'; // 연한 빨강
      }
      return '';
    };

    const dailyLabel = useDailyAverage ? ' (일평균)' : '';
    let html = `<h2>2. 유입 추이 분석</h2><h3>a. 요약${dailyLabel}</h3>`;

    // 주별 데이터 테이블 - 모든 주를 보여줌 (A기간 + B기간)
    const allWeeks = [...periodBStats, ...periodAStats].sort((a, b) =>
      a.week_start.localeCompare(b.week_start)
    );

    // 주차 포맷 함수 (예: 2024-12-23 → 12.W4)
    const formatWeekLabel = (weekStart: string): string => {
      const date = new Date(weekStart);
      const month = date.getMonth() + 1;
      const dayOfMonth = date.getDate();

      // 해당 월의 몇 번째 주인지 계산
      const weekOfMonth = Math.ceil(dayOfMonth / 7);

      return `${month}.W${weekOfMonth}`;
    };

    // 차트를 먼저 생성하고 표시
    try {
      const chartData = allWeeks.map((stat) => ({
        week: formatWeekLabel(stat.week_start),
        revenue: stat.total_revenue,
        newPatients: stat.new_patients,
      }));

      const chartImageBase64 = await generateWeeklyTrendChart(chartData);

      html += `
        <div style="margin: 24px 0; text-align: center;">
          <img src="${chartImageBase64}" alt="주별 유입 추이" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;">
        </div>
      `;
    } catch (error) {
      console.error('차트 생성 오류:', error);
      html += `
        <div style="background-color: #fee2e2; padding: 16px; border: 1px solid #fca5a5; border-radius: 8px; margin: 16px 0; text-align: center;">
          <p style="color: #991b1b; font-size: 14px; margin: 0;">
            ⚠️ 차트 생성 중 오류가 발생했습니다.
          </p>
        </div>
      `;
    }

    // 객단가 계산 (매출 / 전체 방문수) - 비율이므로 일평균 나누기 불필요
    const unitPriceA = periodARaw.totalPatients > 0 ? periodARaw.revenue / periodARaw.totalPatients : 0;
    const unitPriceB = periodBRaw.totalPatients > 0 ? periodBRaw.revenue / periodBRaw.totalPatients : 0;
    const unitPriceDiff = unitPriceA - unitPriceB;
    const formatPrice = (n: number) => new Intl.NumberFormat('ko-KR').format(Math.round(n));

    // 기간 비교 테이블
    html += `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th></th>
            <th>매출</th>
            ${showUnitPrice ? '<th>객단가</th>' : ''}
            <th>신환</th>
            <th>초진</th>
            <th>재진</th>
            <th>전체 방문 수</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600;">A(분석 기간)${useDailyAverage ? `<div style="font-size: 11px; color: #6b7280; font-weight: 400;">영업일 ${periodAWorkDays}일</div>` : ''}</td>
            <td style="${getCellStyle(diff.revenue)}">${formatNumber(periodA.revenue)}</td>
            ${showUnitPrice ? `<td style="${getCellStyle(unitPriceDiff)}">${formatPrice(unitPriceA)}</td>` : ''}
            <td style="${getCellStyle(diff.newPatients)}">${formatNumber(periodA.newPatients)}</td>
            <td style="${getCellStyle(diff.firstVisit)}">${formatNumber(periodA.firstVisit)}</td>
            <td style="${getCellStyle(diff.returnPatients)}">${formatNumber(periodA.returnPatients)}</td>
            <td style="${getCellStyle(diff.totalPatients)}">${formatNumber(periodA.totalPatients)}</td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600;">B(비교 기간)${useDailyAverage ? `<div style="font-size: 11px; color: #6b7280; font-weight: 400;">영업일 ${periodBWorkDays}일</div>` : ''}</td>
            <td>${formatNumber(periodB.revenue)}</td>
            ${showUnitPrice ? `<td>${formatPrice(unitPriceB)}</td>` : ''}
            <td>${formatNumber(periodB.newPatients)}</td>
            <td>${formatNumber(periodB.firstVisit)}</td>
            <td>${formatNumber(periodB.returnPatients)}</td>
            <td>${formatNumber(periodB.totalPatients)}</td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600;">A - B</td>
            <td style="vertical-align: middle;">${diff.revenue >= 0 ? '+' : ''}${formatNumber(diff.revenue)}<div style="font-size: 11px; color: ${diff.revenue >= 0 ? '#059669' : '#dc2626'}; margin-top: 4px;">(${calcChangeRate(periodA.revenue, periodB.revenue)})</div></td>
            ${showUnitPrice ? `<td style="vertical-align: middle;">${unitPriceDiff >= 0 ? '+' : ''}${formatPrice(unitPriceDiff)}<div style="font-size: 11px; color: ${unitPriceDiff >= 0 ? '#059669' : '#dc2626'}; margin-top: 4px;">(${calcChangeRate(unitPriceA, unitPriceB)})</div></td>` : ''}
            <td style="vertical-align: middle;">${diff.newPatients >= 0 ? '+' : ''}${formatNumber(diff.newPatients)}<div style="font-size: 11px; color: ${diff.newPatients >= 0 ? '#059669' : '#dc2626'}; margin-top: 4px;">(${calcChangeRate(periodA.newPatients, periodB.newPatients)})</div></td>
            <td style="vertical-align: middle;">${diff.firstVisit >= 0 ? '+' : ''}${formatNumber(diff.firstVisit)}<div style="font-size: 11px; color: ${diff.firstVisit >= 0 ? '#059669' : '#dc2626'}; margin-top: 4px;">(${calcChangeRate(periodA.firstVisit, periodB.firstVisit)})</div></td>
            <td style="vertical-align: middle;">${diff.returnPatients >= 0 ? '+' : ''}${formatNumber(diff.returnPatients)}<div style="font-size: 11px; color: ${diff.returnPatients >= 0 ? '#059669' : '#dc2626'}; margin-top: 4px;">(${calcChangeRate(periodA.returnPatients, periodB.returnPatients)})</div></td>
            <td style="vertical-align: middle;">${diff.totalPatients >= 0 ? '+' : ''}${formatNumber(diff.totalPatients)}<div style="font-size: 11px; color: ${diff.totalPatients >= 0 ? '#059669' : '#dc2626'}; margin-top: 4px;">(${calcChangeRate(periodA.totalPatients, periodB.totalPatients)})</div></td>
          </tr>
        </tbody>
      </table>
    `;

    // 주별 상세 테이블
    html += `<h3 style="margin-top: 32px;">b. 주별 상세 데이터${dailyLabel}</h3>`;

    html += `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th>Week</th>
            <th>매출</th>
            ${showUnitPrice ? '<th>객단가</th>' : ''}
            <th>신환</th>
            <th>초진</th>
            <th>재진</th>
            <th>전체 방문 수</th>
          </tr>
        </thead>
        <tbody>
    `;

    // 이전 주 대비 증감 색상 계산 함수
    const getChangeColorStyle = (currentValue: number, previousValue: number | null): string => {
      if (previousValue === null) return 'font-weight: 600;'; // 첫 주는 비교 대상 없음

      if (currentValue > previousValue) {
        return 'background-color: #d1fae5; font-weight: 600;'; // 증가 - 초록
      } else if (currentValue < previousValue) {
        return 'background-color: #fee2e2; font-weight: 600;'; // 감소 - 빨강
      }
      return 'font-weight: 600;'; // 동일
    };

    allWeeks.forEach((stat, idx) => {
      const weekLabel = formatWeekLabel(stat.week_start);
      const isInPeriodA = stat.week_start >= periodAStart && stat.week_end <= actualPeriodAEnd;
      const isInPeriodB = stat.week_start >= periodBStart && stat.week_end <= actualPeriodBEnd;

      // A기간에 속하면 연한 초록, B기간에 속하면 연한 핑크
      let rowStyle = '';
      if (isInPeriodA) {
        rowStyle = 'background-color: #d1fae5;'; // 연한 초록
      } else if (isInPeriodB) {
        rowStyle = 'background-color: #fee2e2 ;'; // 연한 핑크
      }

      // 일평균 모드일 때 해당 주 영업일 수로 나누기
      const weekWorkDays = 7 - stat.closed_days;
      const weekDiv = useDailyAverage && weekWorkDays > 0 ? weekWorkDays : 1;

      const revenue = stat.total_revenue / weekDiv;
      const newPatients = stat.new_patients / weekDiv;
      const firstVisit = stat.first_visit_patients / weekDiv;
      const returnPatients = stat.return_patients / weekDiv;
      const totalPatients = stat.total_patients / weekDiv;

      // 이전 주 데이터
      const prevStat = idx > 0 ? allWeeks[idx - 1] : null;
      const prevWorkDays = prevStat ? (7 - prevStat.closed_days) : 1;
      const prevDiv = useDailyAverage && prevWorkDays > 0 ? prevWorkDays : 1;

      // 각 셀의 증감 스타일 (주/day 컬럼은 제외)
      const revenueStyle = getChangeColorStyle(
        revenue,
        prevStat ? prevStat.total_revenue / prevDiv : null
      );
      const newPatientsStyle = getChangeColorStyle(
        newPatients,
        prevStat ? prevStat.new_patients / prevDiv : null
      );
      const firstVisitStyle = getChangeColorStyle(
        firstVisit,
        prevStat ? prevStat.first_visit_patients / prevDiv : null
      );
      const returnPatientsStyle = getChangeColorStyle(
        returnPatients,
        prevStat ? prevStat.return_patients / prevDiv : null
      );
      const totalPatientsStyle = getChangeColorStyle(
        totalPatients,
        prevStat ? prevStat.total_patients / prevDiv : null
      );

      const weekDaysInfo = useDailyAverage ? ` <span style="font-size: 10px; color: #6b7280;">(${weekWorkDays}일)</span>` : '';

      // 객단가: 해당 주 매출 / 전체 방문수 (비율이므로 일평균 나누기 불필요)
      const weekUnitPrice = stat.total_patients > 0 ? stat.total_revenue / stat.total_patients : 0;
      const prevUnitPrice = prevStat && prevStat.total_patients > 0 ? prevStat.total_revenue / prevStat.total_patients : null;
      const unitPriceStyle = getChangeColorStyle(weekUnitPrice, prevUnitPrice);

      html += `
        <tr style="${rowStyle}">
          <td style="font-weight: 600;">${weekLabel}${weekDaysInfo}</td>
          <td style="${revenueStyle}">${formatNumber(revenue)}</td>
          ${showUnitPrice ? `<td style="${unitPriceStyle}">${formatPrice(weekUnitPrice)}</td>` : ''}
          <td style="${newPatientsStyle}">${formatNumber(newPatients)}</td>
          <td style="${firstVisitStyle}">${formatNumber(firstVisit)}</td>
          <td style="${returnPatientsStyle}">${formatNumber(returnPatients)}</td>
          <td style="${totalPatientsStyle}">${formatNumber(totalPatients)}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    // AI 해석 생성
    try {
      const summaryInterpretation = await generateSummaryInterpretation({
        periodALabel: `${periodAStart} ~ ${actualPeriodAEnd}`,
        periodBLabel: `${periodBStart} ~ ${actualPeriodBEnd}`,
        periodA: {
          totalRevenue: periodA.revenue,
          newPatients: periodA.newPatients,
          firstVisit: periodA.firstVisit,
          returnPatients: periodA.returnPatients,
          totalPatients: periodA.totalPatients,
        },
        periodB: {
          totalRevenue: periodB.revenue,
          newPatients: periodB.newPatients,
          firstVisit: periodB.firstVisit,
          returnPatients: periodB.returnPatients,
          totalPatients: periodB.totalPatients,
        },
        weeklyTrend: allWeeks.map((stat) => ({
          week: formatWeekLabel(stat.week_start),
          revenue: stat.total_revenue,
          newPatients: stat.new_patients,
          firstVisit: stat.first_visit_patients,
          returnPatients: stat.return_patients,
          totalPatients: stat.total_patients,
        })),
      });

      html += `<p data-interpretation="summary" data-raw="${encodeURIComponent(summaryInterpretation)}" style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 16px; line-height: 1.8;">${formatInterpretation(summaryInterpretation)}</p>`;
    } catch (error) {
      console.error('AI 해석 생성 오류:', error);
      html += '<p data-interpretation="summary" data-raw="" style="margin-top: 16px;"><em>주별 추이에 대한 해석을 여기에 작성하세요...</em></p>';
    }

    return html;
  };

  // 연령대별 분석 생성
  const generateAgeAnalysis = async (): Promise<string> => {
    // 섹션별 일평균 설정 읽기
    const useDailyAverage = sections.find(s => s.id === 'age_analysis')?.useDailyAverage ?? false;

    // 종료일을 해당 주의 week_end로 변환
    const actualPeriodAEnd = getWeekEnd(periodAEnd);
    const actualPeriodBEnd = getWeekEnd(periodBEnd);

    const periodAStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodAStart && stat.week_end <= actualPeriodAEnd
        && !excludedWeeksA.includes(stat.week_start)
    );
    const periodBStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodBStart && stat.week_end <= actualPeriodBEnd
        && !excludedWeeksB.includes(stat.week_start)
    );

    if (periodAStats.length === 0) {
      return '<p>선택한 기간에 데이터가 없습니다.</p>';
    }

    const formatNumber = (num: number) =>
      useDailyAverage
        ? new Intl.NumberFormat('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(num)
        : new Intl.NumberFormat('ko-KR').format(Math.round(num));

    // 영업일 수 계산
    const periodAWorkDays = periodAStats.reduce((sum, stat) => sum + (7 - (stat.closed_days || 0)), 0);
    const periodBWorkDays = periodBStats.reduce((sum, stat) => sum + (7 - (stat.closed_days || 0)), 0);
    const divA = useDailyAverage && periodAWorkDays > 0 ? periodAWorkDays : 1;
    const divB = useDailyAverage && periodBWorkDays > 0 ? periodBWorkDays : 1;
    const dailyLabel = useDailyAverage ? ' (일평균)' : '';

    // 연령대별 합계
    const ageGroups = ['0', '10', '20', '30', '40', '50', '60', '70+'];
    const periodAAge: Record<string, number> = {};
    const periodBAge: Record<string, number> = {};

    ageGroups.forEach(age => {
      periodAAge[age] = periodAStats.reduce((sum, stat) => sum + (stat.age_groups?.[age] || 0), 0) / divA;
      periodBAge[age] = periodBStats.reduce((sum, stat) => sum + (stat.age_groups?.[age] || 0), 0) / divB;
    });

    let html = `<h3>b. 연령대별 신환 유입 추이 분석${dailyLabel}</h3>`;

    // 차트 생성
    try {
      const chartImageBase64 = await generateAgeAnalysisChart({
        periodA: periodAAge,
        periodB: periodBAge,
      });

      html += `
        <div style="margin: 24px 0; text-align: center;">
          <h4 style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 16px;">연령대별 신환 유입 추이</h4>
          <img src="${chartImageBase64}" alt="연령대별 신환 유입 추이" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;">
        </div>
      `;
    } catch (error) {
      console.error('차트 생성 오류:', error);
      html += `
        <div style="background-color: #fee2e2; padding: 16px; border: 1px solid #fca5a5; border-radius: 8px; margin: 16px 0; text-align: center;">
          <p style="color: #991b1b; font-size: 14px; margin: 0;">
            ⚠️ 차트 생성 중 오류가 발생했습니다.
          </p>
        </div>
      `;
    }

    // A와 B 비교 색상 스타일 함수
    const getCompareStyle = (valueA: number, valueB: number): string => {
      if (valueA > valueB) {
        return 'background-color: #d1fae5; font-weight: 600;'; // 증가 - 초록
      } else if (valueA < valueB) {
        return 'background-color: #fee2e2; font-weight: 600;'; // 감소 - 빨강
      }
      return ''; // 동일
    };

    // A-B 색상 스타일 함수
    const getDiffStyle = (diff: number): string => {
      if (diff > 0) {
        return 'color: #2E7D32; background-color: rgba(46, 125, 50, 0.1); font-weight: 600;';
      } else if (diff < 0) {
        return 'color: #C62828; background-color: rgba(198, 40, 40, 0.1); font-weight: 600;';
      } else {
        return 'color: #666; background-color: rgba(102, 102, 102, 0.05);';
      }
    };

    // 증감률 계산 함수
    const calcChangeRate = (a: number, b: number): string => {
      if (b === 0) return '-';
      const rate = ((a - b) / b) * 100;
      const sign = rate >= 0 ? '+' : '';
      return `${sign}${rate.toFixed(1)}%`;
    };

    // 테이블 생성 - 가로형 (연령대가 컬럼) - 원래대로
    html += `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th>연령대</th>
            <th>0대</th>
            <th>10대</th>
            <th>20대</th>
            <th>30대</th>
            <th>40대</th>
            <th>50대</th>
            <th>60대</th>
            <th>70대</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600;">A(분석 기간)${useDailyAverage ? `<div style="font-size: 11px; color: #6b7280; font-weight: 400;">영업일 ${periodAWorkDays}일</div>` : ''}</td>
            ${ageGroups.map(age => {
              const style = getCompareStyle(periodAAge[age], periodBAge[age]);
              return `<td style="${style}">${formatNumber(periodAAge[age])}</td>`;
            }).join('')}
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600;">B(비교 기간)${useDailyAverage ? `<div style="font-size: 11px; color: #6b7280; font-weight: 400;">영업일 ${periodBWorkDays}일</div>` : ''}</td>
            ${ageGroups.map(age => {
              const style = getCompareStyle(periodBAge[age], periodAAge[age]);
              return `<td style="${style}">${formatNumber(periodBAge[age])}</td>`;
            }).join('')}
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600;">A - B</td>
            ${ageGroups.map(age => {
              const diff = periodAAge[age] - periodBAge[age];
              const diffStyle = getDiffStyle(diff);
              const sign = diff > 0 ? '+' : '';
              const changeRate = calcChangeRate(periodAAge[age], periodBAge[age]);
              return `<td style="${diffStyle}">${sign}${formatNumber(diff)}<div style="font-size: 11px; margin-top: 2px;">(${changeRate})</div></td>`;
            }).join('')}
          </tr>
        </tbody>
      </table>
    `;

    // AI 해석 생성
    try {
      const ageInterpretation = await generateAgeInterpretation({
        periodALabel: `${periodAStart} ~ ${actualPeriodAEnd}`,
        periodBLabel: `${periodBStart} ~ ${actualPeriodBEnd}`,
        periodA: periodAAge,
        periodB: periodBAge,
      });

      html += `<p data-interpretation="age" data-raw="${encodeURIComponent(ageInterpretation)}" style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; line-height: 1.8;">${formatInterpretation(ageInterpretation)}</p>`;
    } catch (error) {
      console.error('AI 해석 생성 오류:', error);
      html += '<p data-interpretation="age" data-raw="" style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; line-height: 1.8;"><em>연령대별 분석 해석 및 드라이버 분석을 여기에 작성하세요...</em></p>';
    }

    // 주별 신환 추이 Heatmap 추가
    html += '<h3 style="margin-top: 48px;">c. 주별 신환 추이</h3>';

    // 주차 포맷 함수 (예: 2024-12-23 → 12.W4)
    const formatWeekLabel = (weekStart: string): string => {
      const date = new Date(weekStart);
      const month = date.getMonth() + 1;
      const dayOfMonth = date.getDate();
      const weekOfMonth = Math.ceil(dayOfMonth / 7);
      return `${month}.W${weekOfMonth}`;
    };

    // A와 B 기간 모두 포함하여 정렬
    const allPeriodStats = [...periodBStats, ...periodAStats].sort((a, b) =>
      a.week_start.localeCompare(b.week_start)
    );

    const weeks = allPeriodStats.map(stat => formatWeekLabel(stat.week_start));
    const periodLabels = allPeriodStats.map(stat => {
      const isInPeriodA = stat.week_start >= periodAStart && stat.week_end <= actualPeriodAEnd;
      return isInPeriodA ? 'A' : 'B';
    });
    const ages = ['0', '10', '20', '30', '40', '50', '60', '70+'];
    const matrix: number[][] = allPeriodStats.map(stat => {
      return ages.map(age => stat.age_groups?.[age] || 0);
    });

    // Heatmap 차트 생성 (테이블 제외)
    try {
      const heatmapImageBase64 = await generateWeeklyAgeHeatmapChart({
        weeks,
        ages,
        matrix,
        periodLabels,
      });

      html += `
        <div style="margin: 24px 0; text-align: center;">
          <img src="${heatmapImageBase64}" alt="주별 신환 추이" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;">
        </div>
      `;
    } catch (error) {
      console.error('Heatmap 차트 생성 오류:', error);
      html += `
        <div style="background-color: #fee2e2; padding: 16px; border: 1px solid #fca5a5; border-radius: 8px; margin: 16px 0; text-align: center;">
          <p style="color: #991b1b; font-size: 14px; margin: 0;">
            ⚠️ Heatmap 차트 생성 중 오류가 발생했습니다.
          </p>
        </div>
      `;
    }

    // HTML 테이블 생성 (연령대별 분석 표와 동일한 스타일)
    html += `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th>Week</th>
            <th>0대</th>
            <th>10대</th>
            <th>20대</th>
            <th>30대</th>
            <th>40대</th>
            <th>50대</th>
            <th>60대</th>
            <th>70대</th>
          </tr>
        </thead>
        <tbody>
    `;

    allPeriodStats.forEach((stat) => {
      const weekLabel = formatWeekLabel(stat.week_start);
      const weekWorkDays = 7 - (stat.closed_days || 0);
      const weekDiv = useDailyAverage && weekWorkDays > 0 ? weekWorkDays : 1;
      const weekDaysInfo = useDailyAverage ? ` <span style="font-size: 10px; color: #6b7280;">(${weekWorkDays}일)</span>` : '';

      html += `
        <tr>
          <td style="background-color: #f3f4f6; font-weight: 600;">${weekLabel}${weekDaysInfo}</td>
          ${ages.map(age => {
            const value = (stat.age_groups?.[age] || 0) / weekDiv;
            return `<td>${formatNumber(value)}</td>`;
          }).join('')}
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    // 주별 신환 추이 AI 해석 생성
    try {
      const weeklyAgeTrendData = allPeriodStats.map(stat => {
        const isInPeriodA = stat.week_start >= periodAStart && stat.week_end <= actualPeriodAEnd;
        return {
          week: formatWeekLabel(stat.week_start),
          period: isInPeriodA ? 'A' as const : 'B' as const,
          ageGroups: stat.age_groups || {},
        };
      });

      const weeklyAgeTrendInterpretation = await generateWeeklyAgeTrendInterpretation({
        periodALabel: `${periodAStart} ~ ${actualPeriodAEnd}`,
        periodBLabel: `${periodBStart} ~ ${actualPeriodBEnd}`,
        weeklyData: weeklyAgeTrendData,
      });

      html += `<p data-interpretation="weeklyAgeTrend" data-raw="${encodeURIComponent(weeklyAgeTrendInterpretation)}" style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 16px; line-height: 1.8;">${formatInterpretation(weeklyAgeTrendInterpretation)}</p>`;
    } catch (error) {
      console.error('AI 해석 생성 오류:', error);
      html += '<p data-interpretation="weeklyAgeTrend" data-raw="" style="margin-top: 16px;"><em>주별 신환 추이에 대한 해석을 여기에 작성하세요...</em></p>';
    }

    return html;
  };

  // 지역별 분석 생성
  const generateRegionAnalysis = async (): Promise<string> => {
    // 섹션별 일평균 설정 읽기
    const useDailyAverage = sections.find(s => s.id === 'region_analysis')?.useDailyAverage ?? false;

    // 종료일을 해당 주의 week_end로 변환
    const actualPeriodAEnd = getWeekEnd(periodAEnd);
    const actualPeriodBEnd = getWeekEnd(periodBEnd);

    const periodAStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodAStart && stat.week_end <= actualPeriodAEnd
        && !excludedWeeksA.includes(stat.week_start)
    );
    const periodBStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodBStart && stat.week_end <= actualPeriodBEnd
        && !excludedWeeksB.includes(stat.week_start)
    );

    if (periodAStats.length === 0) {
      return '<p>선택한 기간에 데이터가 없습니다.</p>';
    }

    const formatNumber = (num: number) =>
      useDailyAverage
        ? new Intl.NumberFormat('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(num)
        : new Intl.NumberFormat('ko-KR').format(Math.round(num));

    // 영업일 수 계산
    const periodAWorkDays = periodAStats.reduce((sum, stat) => sum + (7 - (stat.closed_days || 0)), 0);
    const periodBWorkDays = periodBStats.reduce((sum, stat) => sum + (7 - (stat.closed_days || 0)), 0);
    const divA = useDailyAverage && periodAWorkDays > 0 ? periodAWorkDays : 1;
    const divB = useDailyAverage && periodBWorkDays > 0 ? periodBWorkDays : 1;
    const dailyLabel = useDailyAverage ? ' (일평균)' : '';

    // 동별 데이터 집계
    const districtsARaw: Record<string, number> = {};
    const districtsBRaw: Record<string, number> = {};

    periodAStats.forEach(stat => {
      if (stat.top_districts_data) {
        Object.entries(stat.top_districts_data).forEach(([district, count]) => {
          districtsARaw[district] = (districtsARaw[district] || 0) + (count as number);
        });
      }
    });

    periodBStats.forEach(stat => {
      if (stat.top_districts_data) {
        Object.entries(stat.top_districts_data).forEach(([district, count]) => {
          districtsBRaw[district] = (districtsBRaw[district] || 0) + (count as number);
        });
      }
    });

    // TOP 7 동 추출 (일평균 적용)
    const allDistricts = new Set([...Object.keys(districtsARaw), ...Object.keys(districtsBRaw)]);
    const sortedDistricts = Array.from(allDistricts)
      .map(district => ({
        name: district,
        countA: (districtsARaw[district] || 0) / divA,
        countB: (districtsBRaw[district] || 0) / divB,
      }))
      .sort((a, b) => b.countA - a.countA)
      .slice(0, 7);

    // 전체 신환 환자 수 계산 (일평균 적용)
    const totalA = periodAStats.reduce((sum, stat) => sum + stat.new_patients, 0) / divA;
    const totalB = periodBStats.reduce((sum, stat) => sum + stat.new_patients, 0) / divB;

    // TOP3, Sub4 합계
    const top3A = sortedDistricts.slice(0, 3).reduce((sum, d) => sum + d.countA, 0);
    const top3B = sortedDistricts.slice(0, 3).reduce((sum, d) => sum + d.countB, 0);
    const sub4A = sortedDistricts.slice(3, 7).reduce((sum, d) => sum + d.countA, 0);
    const sub4B = sortedDistricts.slice(3, 7).reduce((sum, d) => sum + d.countB, 0);

    // 증감률 계산 함수
    const calcChangeRate = (a: number, b: number): string => {
      if (b === 0) return '-';
      const rate = ((a - b) / b) * 100;
      const sign = rate >= 0 ? '+' : '';
      return `${sign}${rate.toFixed(1)}%`;
    };

    let html = `<h3>c. 지역별 유입 추이 분석${dailyLabel}</h3>`;

    // 분석 기간 전체 신규 환자 수 표시
    html += `
      <div style="margin: 16px 0; padding: 16px; background-color: #f9fafb; border-radius: 8px; display: flex; gap: 32px;">
        <div>
          <span style="font-size: 13px; color: #6b7280;">분석 기간 (A) 전체 신규 환자 수${dailyLabel}:</span>
          <span style="font-size: 15px; font-weight: 600; color: #059669; margin-left: 8px;">${formatNumber(totalA)}명</span>
        </div>
        <div>
          <span style="font-size: 13px; color: #6b7280;">비교 기간 (B) 전체 신규 환자 수:</span>
          <span style="font-size: 15px; font-weight: 600; color: #dc2626; margin-left: 8px;">${formatNumber(totalB)}명</span>
        </div>
      </div>
    `;

    // 지역별 차트 생성 (표 위에 배치)
    try {
      const areaChartData = sortedDistricts.map(district => ({
        area: district.name.split(' ').pop() || district.name,
        periodA: district.countA,
        periodB: district.countB,
      }));

      const areaChartImageBase64 = await generateAreaComparisonChart(areaChartData);

      html += `
        <div style="margin: 24px 0; text-align: center;">
          <img src="${areaChartImageBase64}" alt="지역별 신환 유입 추이" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;">
        </div>
      `;
    } catch (error) {
      console.error('지역별 차트 생성 오류:', error);
      html += `
        <div style="background-color: #fee2e2; padding: 16px; border: 1px solid #fca5a5; border-radius: 8px; margin: 16px 0; text-align: center;">
          <p style="color: #991b1b; font-size: 14px; margin: 0;">
            ⚠️ 지역별 차트 생성 중 오류가 발생했습니다.
          </p>
        </div>
      `;
    }

    html += `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th>동</th>
            <th>분석 기간 (A)${useDailyAverage ? `<div style="font-size: 11px; color: #6b7280; font-weight: 400;">영업일 ${periodAWorkDays}일</div>` : ''}</th>
            <th>비교 기간 (B)${useDailyAverage ? `<div style="font-size: 11px; color: #6b7280; font-weight: 400;">영업일 ${periodBWorkDays}일</div>` : ''}</th>
            <th>A - B</th>
          </tr>
        </thead>
        <tbody>
    `;

    sortedDistricts.forEach(district => {
      const diff = district.countA - district.countB;
      const changeRate = calcChangeRate(district.countA, district.countB);
      const diffColor = diff >= 0 ? '#059669' : '#dc2626';
      html += `
        <tr>
          <td><strong>${district.name.split(' ').pop()}</strong></td>
          <td>${formatNumber(district.countA)}</td>
          <td>${formatNumber(district.countB)}</td>
          <td style="color: ${diffColor}; font-weight: 600;">${diff >= 0 ? '+' : ''}${formatNumber(diff)}<div style="font-size: 11px; margin-top: 2px;">(${changeRate})</div></td>
        </tr>
      `;
    });

    html += `
      <tr style="background-color: #f9fafb; font-weight: 600;">
        <td>TOP3 합계 (비율)</td>
        <td>${formatNumber(top3A)} (${((top3A / totalA) * 100).toFixed(0)}%)</td>
        <td>${formatNumber(top3B)} (${((top3B / totalB) * 100).toFixed(0)}%)</td>
        <td>-</td>
      </tr>
      <tr style="background-color: #f9fafb; font-weight: 600;">
        <td>Sub4 합계 (비율)</td>
        <td>${formatNumber(sub4A)} (${((sub4A / totalA) * 100).toFixed(0)}%)</td>
        <td>${formatNumber(sub4B)} (${((sub4B / totalB) * 100).toFixed(0)}%)</td>
        <td>-</td>
      </tr>
    `;

    html += '</tbody></table>';

    // AI 해석 생성
    try {
      const regionInterpretation = await generateRegionInterpretation({
        periodALabel: `${periodAStart} ~ ${actualPeriodAEnd}`,
        periodBLabel: `${periodBStart} ~ ${actualPeriodBEnd}`,
        top7: sortedDistricts.map(d => ({
          name: d.name.split(' ').pop() || d.name,
          countA: d.countA,
          countB: d.countB,
        })),
        totalA,
        totalB,
      });

      html += `<p data-interpretation="region" data-raw="${encodeURIComponent(regionInterpretation)}" style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; line-height: 1.8;">${formatInterpretation(regionInterpretation)}</p>`;
    } catch (error) {
      console.error('AI 해석 생성 오류:', error);
      html += '<p data-interpretation="region" data-raw="" style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; line-height: 1.8;"><em>지역별 분석 해석 및 집중도 변화에 대한 분석을 여기에 작성하세요...</em></p>';
    }

    // 주별 지역별 신환 추이 섹션 추가
    html += '<h3 style="margin-top: 48px;">d. 주별 지역별 신환 추이</h3>';

    // 주차 포맷 함수
    const formatWeekLabel = (weekStart: string): string => {
      const date = new Date(weekStart);
      const month = date.getMonth() + 1;
      const dayOfMonth = date.getDate();
      const weekOfMonth = Math.ceil(dayOfMonth / 7);
      return `${month}.W${weekOfMonth}`;
    };

    // A와 B 기간 모두 포함하여 정렬
    const allPeriodStats = [...periodBStats, ...periodAStats].sort((a, b) =>
      a.week_start.localeCompare(b.week_start)
    );

    const weeks = allPeriodStats.map(stat => formatWeekLabel(stat.week_start));
    const topRegionNames = sortedDistricts.map(d => d.name.split(' ').pop() || d.name);

    // 지역별 주간 데이터 matrix 생성 [regionIdx][weekIdx]
    const regionWeeklyMatrix: number[][] = sortedDistricts.map(district => {
      return allPeriodStats.map(stat => {
        return stat.top_districts_data?.[district.name] || 0;
      });
    });

    // 멀티 라인 차트 생성 (TOP3 / 4~7위 별도 스케일)
    try {
      const [regionTop3ImageBase64, regionRestImageBase64] = await generateWeeklyRegionHeatmapChart({
        weeks,
        regions: topRegionNames,
        matrix: regionWeeklyMatrix,
      });

      html += `
        <div style="margin: 24px 0; text-align: center;">
          <img src="${regionTop3ImageBase64}" alt="TOP3 지역 주별 신환 추이" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;">
        </div>
        <div style="margin: 24px 0; text-align: center;">
          <img src="${regionRestImageBase64}" alt="4~7위 지역 주별 신환 추이" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;">
        </div>
      `;
    } catch (error) {
      console.error('지역별 히트맵 차트 생성 오류:', error);
      html += `
        <div style="background-color: #fee2e2; padding: 16px; border: 1px solid #fca5a5; border-radius: 8px; margin: 16px 0; text-align: center;">
          <p style="color: #991b1b; font-size: 14px; margin: 0;">
            ⚠️ 히트맵 차트 생성 중 오류가 발생했습니다.
          </p>
        </div>
      `;
    }

    // 주별 지역별 테이블 생성
    html += `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th></th>
            ${topRegionNames.map(name => `<th>${name}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    // 최신 주부터 역순으로 표시
    [...allPeriodStats].reverse().forEach((stat) => {
      const weekLabel = formatWeekLabel(stat.week_start);
      const weekWorkDays = 7 - (stat.closed_days || 0);
      const weekDiv = useDailyAverage && weekWorkDays > 0 ? weekWorkDays : 1;
      const weekDaysInfo = useDailyAverage ? ` <span style="font-size: 10px; color: #6b7280;">(${weekWorkDays}일)</span>` : '';

      html += `
        <tr>
          <td style="background-color: #f3f4f6; font-weight: 600;">${weekLabel}${weekDaysInfo}</td>
          ${sortedDistricts.map(district => {
            const value = (stat.top_districts_data?.[district.name] || 0) / weekDiv;
            return `<td>${formatNumber(value)}</td>`;
          }).join('')}
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    // 주별 지역별 AI 해석 생성
    try {
      const weeklyRegionTrendData = allPeriodStats.map(stat => {
        const isInPeriodA = stat.week_start >= periodAStart && stat.week_end <= actualPeriodAEnd;
        const regionCounts: Record<string, number> = {};
        sortedDistricts.forEach(district => {
          const shortName = district.name.split(' ').pop() || district.name;
          regionCounts[shortName] = stat.top_districts_data?.[district.name] || 0;
        });
        return {
          week: formatWeekLabel(stat.week_start),
          period: isInPeriodA ? 'A' as const : 'B' as const,
          regionCounts,
        };
      });

      const weeklyRegionTrendInterpretation = await generateWeeklyRegionTrendInterpretation({
        periodALabel: `${periodAStart} ~ ${actualPeriodAEnd}`,
        periodBLabel: `${periodBStart} ~ ${actualPeriodBEnd}`,
        regions: topRegionNames,
        weeklyData: weeklyRegionTrendData,
      });

      html += `<p data-interpretation="weeklyRegionTrend" data-raw="${encodeURIComponent(weeklyRegionTrendInterpretation)}" style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 16px; line-height: 1.8;">${formatInterpretation(weeklyRegionTrendInterpretation)}</p>`;
    } catch (error) {
      console.error('AI 해석 생성 오류:', error);
      html += '<p data-interpretation="weeklyRegionTrend" data-raw="" style="margin-top: 16px;"><em>주별 지역별 신환 추이에 대한 해석을 여기에 작성하세요...</em></p>';
    }

    // e. 주별 유입 추이 (TOP3 vs Sub4 + 집중도)
    html += '<h3 style="margin-top: 48px;">e. 주별 TOP3/Sub4 집중도 추이</h3>';

    // 주별 TOP3, Sub4 데이터 계산
    const top3Districts = sortedDistricts.slice(0, 3);
    const sub4Districts = sortedDistricts.slice(3, 7); // 하위 4개 동 (4~7위)

    const weeklyTop3Counts: number[] = [];
    const weeklySub4Counts: number[] = [];
    const weeklyTop3Ratios: number[] = [];
    const weeklySub4Ratios: number[] = [];

    allPeriodStats.forEach(stat => {
      const weekWorkDays = 7 - (stat.closed_days || 0);
      const weekDiv = useDailyAverage && weekWorkDays > 0 ? weekWorkDays : 1;
      // TOP3 합계
      const top3Sum = top3Districts.reduce((sum, d) => sum + (stat.top_districts_data?.[d.name] || 0), 0) / weekDiv;
      // Sub4 합계 (4~7위)
      const sub4Sum = sub4Districts.reduce((sum, d) => sum + (stat.top_districts_data?.[d.name] || 0), 0) / weekDiv;
      // 해당 주의 전체 신환 수
      const weeklyTotal = stat.new_patients / weekDiv;

      weeklyTop3Counts.push(top3Sum);
      weeklySub4Counts.push(sub4Sum);
      weeklyTop3Ratios.push(weeklyTotal > 0 ? (top3Sum / weeklyTotal) * 100 : 0);
      weeklySub4Ratios.push(weeklyTotal > 0 ? (sub4Sum / weeklyTotal) * 100 : 0);
    });

    // 히트맵 차트 생성
    try {
      const concentrationChartBase64 = await generateWeeklyAreaConcentrationChart({
        weeks,
        top3Counts: weeklyTop3Counts,
        top7Counts: weeklySub4Counts,
        top3Ratios: weeklyTop3Ratios,
        top7Ratios: weeklySub4Ratios,
      });

      html += `
        <div style="margin: 24px 0; text-align: center;">
          <img src="${concentrationChartBase64}" alt="주별 TOP3/Sub4 집중도 추이" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;">
        </div>
      `;
    } catch (error) {
      console.error('집중도 히트맵 차트 생성 오류:', error);
      html += `
        <div style="background-color: #fee2e2; padding: 16px; border: 1px solid #fca5a5; border-radius: 8px; margin: 16px 0; text-align: center;">
          <p style="color: #991b1b; font-size: 14px; margin: 0;">
            ⚠️ 집중도 히트맵 차트 생성 중 오류가 발생했습니다.
          </p>
        </div>
      `;
    }

    // 테이블 생성 (최신 주부터 역순)
    html += `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th></th>
            <th>TOP3 동</th>
            <th>TOP3 동 비율</th>
            <th>Sub4 동</th>
            <th>Sub4 동 비율</th>
          </tr>
        </thead>
        <tbody>
    `;

    // 최신 주부터 역순으로 표시
    [...allPeriodStats].reverse().forEach((stat, idx) => {
      const weekLabel = formatWeekLabel(stat.week_start);
      const reversedIdx = allPeriodStats.length - 1 - idx;
      const top3Count = weeklyTop3Counts[reversedIdx];
      const sub4Count = weeklySub4Counts[reversedIdx];
      const top3Ratio = weeklyTop3Ratios[reversedIdx];
      const sub4Ratio = weeklySub4Ratios[reversedIdx];

      html += `
        <tr>
          <td style="background-color: #f3f4f6; font-weight: 600;">${weekLabel}</td>
          <td>${formatNumber(top3Count)}</td>
          <td>${top3Ratio.toFixed(0)}%</td>
          <td>${formatNumber(sub4Count)}</td>
          <td>${sub4Ratio.toFixed(0)}%</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    // 주별 TOP3/Sub4 집중도 AI 해석 생성
    try {
      const weeklyConcentrationData = allPeriodStats.map((stat, idx) => {
        const isInPeriodA = stat.week_start >= periodAStart && stat.week_end <= actualPeriodAEnd;
        return {
          week: formatWeekLabel(stat.week_start),
          period: isInPeriodA ? 'A' as const : 'B' as const,
          top3Count: weeklyTop3Counts[idx],
          top7Count: weeklySub4Counts[idx],
          top3Ratio: weeklyTop3Ratios[idx],
          top7Ratio: weeklySub4Ratios[idx],
          totalNewPatients: stat.new_patients,
        };
      });

      const concentrationInterpretation = await generateWeeklyAreaConcentrationInterpretation({
        periodALabel: `${periodAStart} ~ ${actualPeriodAEnd}`,
        periodBLabel: `${periodBStart} ~ ${actualPeriodBEnd}`,
        weeklyData: weeklyConcentrationData,
      });

      html += `<p data-interpretation="concentration" data-raw="${encodeURIComponent(concentrationInterpretation)}" style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 16px; line-height: 1.8;">${formatInterpretation(concentrationInterpretation)}</p>`;
    } catch (error) {
      console.error('AI 해석 생성 오류:', error);
      html += '<p data-interpretation="concentration" data-raw="" style="margin-top: 16px;"><em>주별 TOP3/Sub4 집중도 추이에 대한 해석을 여기에 작성하세요...</em></p>';
    }

    return html;
  };

  // 신환 2주 내 재방문율 분석 생성
  const generateRetentionAnalysis = async (): Promise<string> => {
    const retentionSec = sections.find(s => s.id === 'retention_analysis');
    const retStart = retentionSec?.retentionStart || '';
    const retEnd = retentionSec?.retentionEnd || '';
    const excludedRetention = retentionSec?.excludedWeeksRetention || [];

    if (!selectedHospital || !retStart || !retEnd) {
      return '<p>신환 재방문율 분석을 위한 기간을 설정해주세요.</p>';
    }

    const actualRetEnd = getWeekEnd(retEnd);

    const retentionStats = weeklyStats.filter(
      (s) => s.week_start >= retStart && s.week_end <= actualRetEnd
        && !excludedRetention.includes(s.week_start)
    );

    if (retentionStats.length === 0) {
      return '<p>선택한 기간에 데이터가 없습니다.</p>';
    }

    // 시간 순 정렬 (단일 기간이므로 period 구분 없이 'A'로 통일)
    type StatWithPeriod = (typeof weeklyStats[0]) & { period: 'A' | 'B' };
    const allStats: StatWithPeriod[] = retentionStats
      .map(s => ({ ...s, period: 'A' as const }))
      .sort((a, b) => a.week_start.localeCompare(b.week_start));

    // API 조회 범위: B+A 전체 중 가장 이른 날 ~ 가장 늦은 날
    const queryStart = allStats[0].week_start;
    const queryEnd = allStats[allStats.length - 1].week_end;

    let visits: { chart_number: number; visit_date: string; visittype: string }[] = [];
    try {
      visits = await adminAPI.getPatientVisits(selectedHospital, queryStart, queryEnd);
    } catch (e) {
      console.error('환자 방문 데이터 로드 오류:', e);
      return '<p style="color:#ef4444;">⚠️ 환자 방문 데이터를 불러오지 못했습니다.</p>';
    }
    if (visits.length === 0) {
      return '<p style="color:#ef4444;">⚠️ 해당 기간의 환자 데이터가 없습니다.</p>';
    }

    const addDays = (dateStr: string, days: number): string => {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    const visitsByChart = new Map<number, string[]>();
    for (const row of visits) {
      if (!visitsByChart.has(row.chart_number)) visitsByChart.set(row.chart_number, []);
      visitsByChart.get(row.chart_number)!.push(row.visit_date);
    }

    const lastDataDate = visits.reduce((max, r) => (r.visit_date > max ? r.visit_date : max), '');

    const weekLabels: string[] = [];
    const rates: (number | null)[] = [];
    const newCounts: number[] = [];
    const returnCounts: (number | null)[] = [];
    const periods: ('A' | 'B')[] = [];

    for (const stat of allStats) {
      const [, m, d] = stat.week_start.split('-');
      weekLabels.push(`${parseInt(m)}/${parseInt(d)}`);
      periods.push(stat.period);

      const newPatientNums = new Set<number>();
      for (const row of visits) {
        if (row.visittype === '신환' && row.visit_date >= stat.week_start && row.visit_date <= stat.week_end) {
          newPatientNums.add(row.chart_number);
        }
      }
      newCounts.push(newPatientNums.size);

      const cutoff = addDays(stat.week_end, 14);
      if (cutoff > lastDataDate) {
        rates.push(null);
        returnCounts.push(null);
        continue;
      }

      let returning = 0;
      for (const chartNum of newPatientNums) {
        const chartVisits = visitsByChart.get(chartNum) ?? [];
        if (chartVisits.some(v => v > stat.week_end && v <= cutoff)) returning++;
      }
      returnCounts.push(returning);
      rates.push(newPatientNums.size > 0 ? (returning / newPatientNums.size) * 100 : 0);
    }

    let html = '<h2>2-3. 유입 추이 분석 - 신환 2주 내 재방문율</h2>';
    html += `
      <p style="font-size:13px; color:#6b7280; margin-bottom:16px;">
        각 주차에 신환으로 내원한 환자가 <strong>2주(14일) 이내</strong>에 재방문한 비율입니다.
        마지막 데이터 기준일로부터 2주가 지나지 않은 주차는 집계중으로 표시됩니다.
      </p>`;

    try {
      const chartImg = await generateRetentionRateChart({ weeks: weekLabels, rates, newCounts, returnCounts, periods });
      html += `
        <div style="margin: 24px 0; text-align: center;">
          <img src="${chartImg}" alt="신환 2주 내 재방문율" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;">
        </div>`;
    } catch (e) {
      console.error('재방문율 차트 생성 오류:', e);
    }

    html += `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 13px;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="text-align: center; padding: 10px;">기간</th>
            <th style="text-align: center; padding: 10px;">주차</th>
            <th style="text-align: center; padding: 10px;">신환 수</th>
            <th style="text-align: center; padding: 10px;">2주 내 재방문</th>
            <th style="text-align: center; padding: 10px;">재방문율</th>
          </tr>
        </thead>
        <tbody>`;

    allStats.forEach((stat, i) => {
      const r = rates[i];
      const rc = returnCounts[i];
      const nc = newCounts[i];
      const periodLabel = stat.period === 'A'
        ? '<span style="color:#3b82f6; font-weight:600;">A</span>'
        : '<span style="color:#ef4444; font-weight:600;">B</span>';
      const rateCell = r === null
        ? '<span style="color:#9ca3af;">집계중</span>'
        : `<span style="color:${r < 20 ? '#ef4444' : r < 40 ? '#b45309' : '#059669'}; font-weight:600;">${r.toFixed(1)}%</span>`;
      html += `
          <tr style="background:${stat.period === 'A' ? '#f0f9ff' : '#fff5f5'}">
            <td style="text-align: center;">${periodLabel}</td>
            <td style="text-align: center;">${stat.week_start} ~ ${stat.week_end}</td>
            <td style="text-align: center;">${nc}명</td>
            <td style="text-align: center;">${rc === null ? '–' : `${rc}명`}</td>
            <td style="text-align: center;">${rateCell}</td>
          </tr>`;
    });

    html += `</tbody></table>`;
    return html;
  };

  // 채널별 유입 성과 보고 생성
  const generateChannelPerformance = async (): Promise<string> => {
    let html = '<h2>3. 채널별 유입 성과 보고</h2>';

    // 날짜 포맷 함수
    const formatPeriodDate = (date: string) => date.replace(/-/g, '.');

    // 종료일을 해당 주의 week_end로 변환
    const actualPeriodAEnd = getWeekEnd(periodAEnd);
    const actualPeriodBEnd = getWeekEnd(periodBEnd);

    // Notion 데이터 로드 (에러 시에도 계속 진행)
    let calendarData: { periodA: MarketingCalendarEntry[]; periodB: MarketingCalendarEntry[] } = { periodA: [], periodB: [] };
    if (notionDatabaseId) {
      try {
        calendarData = await getMarketingCalendar(
          notionDatabaseId,
          periodAStart,
          actualPeriodAEnd,
          periodBStart,
          actualPeriodBEnd
        );
      } catch (error) {
        console.error('Notion 데이터 로드 오류:', error);
      }
    }

    // A기간 타임라인 표
    if (calendarData.periodA.length > 0) {
      html += generateTimelineTable(calendarData.periodA, `A기간 마케팅 활동 (${formatPeriodDate(periodAStart)} ~ ${formatPeriodDate(actualPeriodAEnd)})`);
    }

    // 컨텐츠 종류별 통계 (A기간만)
    if (calendarData.periodA.length > 0) {
      html += generateContentTypeStats(calendarData.periodA);
    }

    // A. 네이버 플레이스 섹션
    html += await generateNaverPlaceSection();

    // B. 네이버 블로그 섹션
    html += await generateNaverBlogSection();

    return html;
  };

  // A. 네이버 플레이스 섹션 생성
  const generateNaverPlaceSection = async (): Promise<string> => {
    let html = '<h3 style="margin-top: 32px; font-size: 16px; font-weight: 600;">A. 네이버 플레이스</h3>';

    // 가. 당월 운영 목표
    html += `
      <h4 style="margin-top: 24px;">가. 당월 운영 목표</h4>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tbody>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600; width: 150px;">핵심 목표</td>
            <td><em style="color: #9ca3af;">(내용을 입력해주세요)</em></td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600;">주요 관리 키워드</td>
            <td><em style="color: #9ca3af;">(키워드를 입력해주세요)</em></td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600;">운영 전략 요약</td>
            <td><em style="color: #9ca3af;">(전략을 입력해주세요)</em></td>
          </tr>
        </tbody>
      </table>
    `;

    // 나. 주요 이벤트 (플레이스 순위 그래프)
    html += await generatePlaceRankSection();

    // 다. 유입 통계 분석
    html += await generateSmartplaceStatsSection();

    // 라. 후속 전략
    html += `
      <h4 style="margin-top: 24px;">라. 후속 전략</h4>
      <ul style="color: #374151;">
        <li><em style="color: #9ca3af;">(전략 1을 입력해주세요)</em></li>
        <li><em style="color: #9ca3af;">(전략 2를 입력해주세요)</em></li>
        <li><em style="color: #9ca3af;">(전략 3을 입력해주세요)</em></li>
      </ul>
    `;

    return html;
  };

  // 나. 주요 이벤트 - 플레이스 순위 그래프
  const generatePlaceRankSection = async (): Promise<string> => {
    let html = '<h4 style="margin-top: 24px;">나. 주요 이벤트</h4>';
    html += '<p style="font-size: 14px; color: #6b7280; margin-bottom: 16px;">키워드 순위 변동 추이</p>';

    if (!analyticsHospitalId) {
      html += `
        <div style="background-color: #fef3c7; padding: 16px; border: 1px solid #f59e0b; border-radius: 8px; margin: 16px 0;">
          <p style="color: #92400e; margin: 0;">
            Analytics DB 병원 ID가 설정되지 않았습니다. 상단에서 병원을 먼저 선택해주세요.
          </p>
        </div>
      `;
      return html;
    }

    try {
      const placeData = await adminAPI.getPlaceRankHistory(analyticsHospitalId);
      const { keyword, rankHistory } = placeData;

      if (!keyword || rankHistory.length === 0) {
        html += `
          <div style="background-color: #fef3c7; padding: 16px; border: 1px solid #f59e0b; border-radius: 8px; margin: 16px 0;">
            <p style="color: #92400e; margin: 0;">
              플레이스 순위 데이터가 없습니다. (키워드: ${keyword || '미설정'})
            </p>
          </div>
        `;
        return html;
      }

      // 분석 기간에 맞춰 데이터 필터링
      const periodStart = periodAStart ? new Date(periodAStart) : null;
      const periodEnd = periodAEnd ? new Date(periodAEnd) : null;
      if (periodEnd) {
        periodEnd.setDate(periodEnd.getDate() + 6);
        periodEnd.setHours(23, 59, 59, 999);
      }

      const sortedHistory = [...rankHistory]
        .sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime())
        .filter(item => {
          const itemDate = new Date(item.checked_at);
          if (periodStart && itemDate < periodStart) return false;
          if (periodEnd && itemDate > periodEnd) return false;
          return true;
        });

      if (sortedHistory.length === 0) {
        html += `
          <div style="background-color: #fef3c7; padding: 16px; border: 1px solid #f59e0b; border-radius: 8px; margin: 16px 0;">
            <p style="color: #92400e; margin: 0;">
              선택한 분석 기간(${periodAStart} ~ ${periodAEnd}) 내 플레이스 순위 데이터가 없습니다.
            </p>
          </div>
        `;
        return html;
      }

      // 기간 내 첫 순위와 마지막 순위 비교
      const firstRank = sortedHistory[0]?.rank;
      const latestRank = sortedHistory[sortedHistory.length - 1]?.rank;
      const rankChange = firstRank - latestRank;

      let changeDisplay = '-';
      let changeColor = '#9ca3af';
      if (rankChange > 0) {
        changeDisplay = `▲${rankChange}`;
        changeColor = '#10b981';
      } else if (rankChange < 0) {
        changeDisplay = `▼${Math.abs(rankChange)}`;
        changeColor = '#ef4444';
      }

      // 차트용 SVG 생성
      const chartWidth = 600;
      const chartHeight = 200;
      const padding = { top: 20, right: 30, bottom: 40, left: 50 };
      const innerWidth = chartWidth - padding.left - padding.right;
      const innerHeight = chartHeight - padding.top - padding.bottom;

      const recentHistory = sortedHistory;
      const maxRank = Math.max(...recentHistory.map(d => d.rank), 10);
      const minRank = Math.min(...recentHistory.map(d => d.rank), 1);

      const points = recentHistory.map((d, i) => {
        const x = padding.left + (i / Math.max(recentHistory.length - 1, 1)) * innerWidth;
        const y = padding.top + ((d.rank - minRank) / Math.max(maxRank - minRank, 1)) * innerHeight;
        return { x, y, rank: d.rank, date: d.checked_at };
      });

      const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      };

      const periodLabel = periodAStart && periodAEnd ? `(${periodAStart} ~ ${periodAEnd})` : '';

      html += `
        <div style="background-color: #f0fdf4; padding: 24px; border: 1px solid #86efac; border-radius: 8px; margin: 16px 0;">
          <h5 style="margin: 0 0 8px 0; color: #166534;">"${keyword}" 키워드 순위 변동 추이</h5>
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b7280;">분석 기간: ${periodLabel} (${sortedHistory.length}건 기록)</p>
          <div style="background-color: #fff; padding: 16px; border-radius: 8px;">
            <svg width="${chartWidth}" height="${chartHeight}" style="display: block; margin: 0 auto;">
              ${Array.from({ length: 5 }, (_, i) => {
                const y = padding.top + (i / 4) * innerHeight;
                const rank = Math.round(minRank + (i / 4) * (maxRank - minRank));
                return `
                  <line x1="${padding.left}" y1="${y}" x2="${chartWidth - padding.right}" y2="${y}" stroke="#e5e7eb" stroke-dasharray="4"/>
                  <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="12" fill="#6b7280">${rank}위</text>
                `;
              }).join('')}
              <path d="${pathD}" fill="none" stroke="#10b981" stroke-width="2"/>
              ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#10b981"/>`).join('')}
              ${recentHistory.length > 0 ? `
                <text x="${padding.left}" y="${chartHeight - 10}" text-anchor="start" font-size="11" fill="#6b7280">${formatDate(recentHistory[0].checked_at)}</text>
                <text x="${chartWidth - padding.right}" y="${chartHeight - 10}" text-anchor="end" font-size="11" fill="#6b7280">${formatDate(recentHistory[recentHistory.length - 1].checked_at)}</text>
              ` : ''}
            </svg>
          </div>
        </div>
      `;

      // 순위 현황 테이블
      html += `
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th>키워드</th>
              <th>기간 시작 순위</th>
              <th>기간 종료 순위</th>
              <th>변동</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${keyword}</td>
              <td style="text-align: center;">${firstRank}위 (${formatDate(sortedHistory[0].checked_at)})</td>
              <td style="text-align: center; font-weight: 600;">${latestRank}위 (${formatDate(sortedHistory[sortedHistory.length - 1].checked_at)})</td>
              <td style="text-align: center; color: ${changeColor}; font-weight: 600;">${changeDisplay}</td>
            </tr>
          </tbody>
        </table>
      `;

      return html;
    } catch (error) {
      console.error('플레이스 순위 섹션 생성 오류:', error);
      html += `
        <div style="background-color: #fee2e2; padding: 16px; border: 1px solid #fca5a5; border-radius: 8px; margin: 16px 0;">
          <p style="color: #991b1b; margin: 0;">
            Analytics 데이터를 불러오는 중 오류가 발생했습니다.
          </p>
        </div>
      `;
      return html;
    }
  };

  // 다. 유입 통계 분석 - 스마트플레이스 데이터
  const generateSmartplaceStatsSection = async (): Promise<string> => {
    let html = '<h4 style="margin-top: 24px;">다. 유입 통계 분석</h4>';

    if (!analyticsHospitalId) {
      html += `
        <div style="background-color: #fef3c7; padding: 16px; border: 1px solid #f59e0b; border-radius: 8px; margin: 16px 0;">
          <p style="color: #92400e; margin: 0;">
            Analytics DB 병원 ID가 설정되지 않았습니다. 상단에서 병원을 먼저 선택해주세요.
          </p>
        </div>
      `;
      return html;
    }

    try {
      const statsData = await adminAPI.getSmartplaceStats(analyticsHospitalId);

      if (!statsData || statsData.length === 0) {
        html += `
          <div style="background-color: #fef3c7; padding: 16px; border: 1px solid #f59e0b; border-radius: 8px; margin: 16px 0;">
            <p style="color: #92400e; margin: 0;">
              스마트플레이스 유입 통계 데이터가 없습니다.
            </p>
          </div>
        `;
        return html;
      }

      // range 날짜 파싱 (형식: "26. 1. 5. 월 - 1. 11. 일")
      const parseRangeDate = (range: string): { start: Date; end: Date } | null => {
        try {
          const parts = range.split(' - ');
          if (parts.length !== 2) return null;

          const startParts = parts[0].replace(/\./g, '').trim().split(' ');
          const endParts = parts[1].replace(/\./g, '').trim().split(' ');

          const year = parseInt(startParts[0]) + 2000;
          const startMonth = parseInt(startParts[1]) - 1;
          const startDay = parseInt(startParts[2]);
          const endMonth = parseInt(endParts[0]) - 1;
          const endDay = parseInt(endParts[1]);

          return {
            start: new Date(year, startMonth, startDay),
            end: new Date(year, endMonth, endDay)
          };
        } catch {
          return null;
        }
      };

      // 기간 A, B 파싱
      const periodAStartDate = periodAStart ? new Date(periodAStart) : null;
      const periodAEndDate = periodAEnd ? new Date(periodAEnd) : null;
      if (periodAEndDate) periodAEndDate.setDate(periodAEndDate.getDate() + 6);

      const periodBStartDate = periodBStart ? new Date(periodBStart) : null;
      const periodBEndDate = periodBEnd ? new Date(periodBEnd) : null;
      if (periodBEndDate) periodBEndDate.setDate(periodBEndDate.getDate() + 6);

      // 기간별 데이터 필터링
      const filterByPeriod = (start: Date | null, end: Date | null) => {
        return statsData.filter(stat => {
          const rangeDates = parseRangeDate(stat.range);
          if (!rangeDates || !start || !end) return false;
          return rangeDates.start >= start && rangeDates.end <= end;
        });
      };

      const periodAStats = filterByPeriod(periodAStartDate, periodAEndDate);
      const periodBStats = filterByPeriod(periodBStartDate, periodBEndDate);

      // 집계 함수
      const aggregateStats = (stats: typeof statsData) => {
        const totalVisits = stats.reduce((sum, stat) => sum + stat.visitCount, 0);
        const channelTotals: Record<string, number> = {};
        const channelPercentages: Record<string, number> = {};
        const keywordTotals: Record<string, number> = {};

        stats.forEach(stat => {
          stat.channels.forEach(ch => {
            const visits = stat.visitCount * ch.percentage / 100;
            channelTotals[ch.name] = (channelTotals[ch.name] || 0) + visits;
          });
          stat.keywords.forEach(kw => {
            const visits = stat.visitCount * kw.percentage / 100;
            keywordTotals[kw.name] = (keywordTotals[kw.name] || 0) + visits;
          });
        });

        // 비율 계산
        Object.keys(channelTotals).forEach(name => {
          channelPercentages[name] = totalVisits > 0 ? (channelTotals[name] / totalVisits) * 100 : 0;
        });

        return { totalVisits, channelTotals, channelPercentages, keywordTotals };
      };

      const periodAAgg = aggregateStats(periodAStats.length > 0 ? periodAStats : [statsData[0]]);
      const periodBAgg = periodBStats.length > 0 ? aggregateStats(periodBStats) : null;

      const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(Math.round(num));
      const formatDecimal = (num: number) => num.toFixed(1);
      const formatDate = (date: string) => date.replace(/-/g, '.');

      // 0. 전체 유입량 표시 (검정색 글씨 한 줄)
      const periodALabel = periodAStart && periodAEnd ? `${formatDate(periodAStart)} ~ ${formatDate(periodAEnd)}` : '분석 기간';
      const periodBLabelForTable = periodBStart && periodBEnd ? `${formatDate(periodBStart)} ~ ${formatDate(periodBEnd)}` : '';
      html += `
        <p style="font-size: 16px; color: #111827; margin: 16px 0;">
          전체 유입량 <strong>${formatNumber(periodAAgg.totalVisits)}회</strong> (${periodALabel})
        </p>
      `;

      // 모든 채널명 수집
      const allChannels = new Set<string>();
      Object.keys(periodAAgg.channelTotals).forEach(name => allChannels.add(name));
      if (periodBAgg) Object.keys(periodBAgg.channelTotals).forEach(name => allChannels.add(name));
      const channelNames = Array.from(allChannels);

      // 1. 유입량 테이블 (A기간 vs B기간)
      html += `
        <h5 style="margin-top: 24px;">채널별 유입량</h5>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th>유입량</th>
              <th>전체</th>
              ${channelNames.map(name => `<th>${name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: 600; font-size: 12px;">${periodALabel}</td>
              <td style="text-align: center; font-weight: 600;">${formatNumber(periodAAgg.totalVisits)}</td>
              ${channelNames.map(name => `<td style="text-align: center;">${formatNumber(periodAAgg.channelTotals[name] || 0)}</td>`).join('')}
            </tr>
            ${periodBAgg ? `
            <tr>
              <td style="font-weight: 600; font-size: 12px;">${periodBLabelForTable}</td>
              <td style="text-align: center; font-weight: 600;">${formatNumber(periodBAgg.totalVisits)}</td>
              ${channelNames.map(name => `<td style="text-align: center;">${formatNumber(periodBAgg.channelTotals[name] || 0)}</td>`).join('')}
            </tr>
            ` : ''}
          </tbody>
        </table>
      `;

      // 2. 유입비율 테이블 (A기간 vs B기간)
      html += `
        <h5 style="margin-top: 24px;">채널별 유입비율 (%)</h5>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th>유입비율</th>
              ${channelNames.map(name => `<th>${name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: 600; font-size: 12px;">${periodALabel}</td>
              ${channelNames.map(name => `<td style="text-align: center;">${formatDecimal(periodAAgg.channelPercentages[name] || 0)}</td>`).join('')}
            </tr>
            ${periodBAgg ? `
            <tr>
              <td style="font-weight: 600; font-size: 12px;">${periodBLabelForTable}</td>
              ${channelNames.map(name => `<td style="text-align: center;">${formatDecimal(periodBAgg.channelPercentages[name] || 0)}</td>`).join('')}
            </tr>
            ` : ''}
          </tbody>
        </table>
      `;

      // 3. 주요 검색 키워드 테이블 (분석 기간)
      const totalKeywordVisits = Object.values(periodAAgg.keywordTotals).reduce((sum, v) => sum + v, 0);
      const sortedKeywords = Object.entries(periodAAgg.keywordTotals).sort((a, b) => b[1] - a[1]).slice(0, 10);

      html += `
        <h5 style="margin-top: 24px;">주요 검색 키워드 (${periodALabel})</h5>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th>키워드</th>
              <th>유입량</th>
              <th>비율</th>
            </tr>
          </thead>
          <tbody>
      `;

      sortedKeywords.forEach(([name, visits]) => {
        const percentage = totalKeywordVisits > 0 ? (visits / totalKeywordVisits) * 100 : 0;
        html += `
          <tr>
            <td>${name}</td>
            <td style="text-align: center;">${formatNumber(visits)}</td>
            <td style="text-align: center;">${formatDecimal(percentage)}%</td>
          </tr>
        `;
      });

      html += `
        </tbody>
      </table>
      `;

      // GPT 해석 요약 생성
      const sortedChannelsForGPT = Object.entries(periodAAgg.channelTotals).sort((a, b) => b[1] - a[1]);
      const periodAChannels = sortedChannelsForGPT.map(([name, visits]) => ({
        name,
        visits: Math.round(visits),
        percentage: periodAAgg.channelPercentages[name] || 0
      }));

      const periodAKeywords = sortedKeywords.map(([name, visits]) => ({
        name,
        visits: Math.round(visits),
        percentage: totalKeywordVisits > 0 ? (visits / totalKeywordVisits) * 100 : 0
      }));

      const periodBLabel = periodBStart && periodBEnd ? `${formatDate(periodBStart)} ~ ${formatDate(periodBEnd)}` : '';

      const gptData = {
        periodALabel,
        periodBLabel,
        periodA: {
          totalVisits: Math.round(periodAAgg.totalVisits),
          channels: periodAChannels,
          keywords: periodAKeywords
        },
        periodB: periodBAgg ? {
          totalVisits: Math.round(periodBAgg.totalVisits),
          channels: Object.entries(periodBAgg.channelTotals).map(([name, visits]) => ({
            name,
            visits: Math.round(visits),
            percentage: periodBAgg.channelPercentages[name] || 0
          }))
        } : null
      };

      try {
        const gptInterpretation = await generateSmartplaceInterpretation(gptData);
        html += `<p data-interpretation="smartplace" data-raw="${encodeURIComponent(gptInterpretation)}" style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 16px; line-height: 1.8;">${formatInterpretation(gptInterpretation)}</p>`;
      } catch (gptError) {
        console.error('GPT 해석 생성 오류:', gptError);
        html += '<p data-interpretation="smartplace" data-raw="" style="margin-top: 16px;"><em>유입 통계 분석에 대한 해석을 여기에 작성하세요...</em></p>';
      }

      return html;
    } catch (error) {
      console.error('스마트플레이스 통계 섹션 생성 오류:', error);
      html += `
        <div style="background-color: #fee2e2; padding: 16px; border: 1px solid #fca5a5; border-radius: 8px; margin: 16px 0;">
          <p style="color: #991b1b; margin: 0;">
            스마트플레이스 데이터를 불러오는 중 오류가 발생했습니다.
          </p>
        </div>
      `;
      return html;
    }
  };

  // B. 네이버 블로그 섹션 생성
  const generateNaverBlogSection = async (): Promise<string> => {
    let html = '<h3 style="margin-top: 48px; font-size: 16px; font-weight: 600;">B. 네이버 블로그</h3>';

    // 블로그 계정이 없는 경우
    if (blogAccounts.length === 0) {
      html += `
        <div style="background-color: #fef3c7; padding: 16px; border: 1px solid #f59e0b; border-radius: 8px; margin: 16px 0;">
          <p style="color: #92400e; margin: 0;">
            등록된 블로그 계정이 없습니다. Analytics DB에서 블로그 정보를 확인해주세요.
          </p>
        </div>
      `;
      return html;
    }

    // 선택된 블로그들의 데이터만 사용
    const selectedAccounts = blogAccounts.filter(a => selectedBlogIds.includes(a.id));

    if (selectedAccounts.length === 0) {
      html += `
        <div style="background-color: #fef3c7; padding: 16px; border: 1px solid #f59e0b; border-radius: 8px; margin: 16px 0;">
          <p style="color: #92400e; margin: 0;">
            분석할 블로그를 선택해주세요.
          </p>
        </div>
      `;
      return html;
    }

    // 공통 함수들
    const formatDate = (date: string) => date.replace(/-/g, '.');
    const periodALabel = periodAStart && periodAEnd ? `${formatDate(periodAStart)} ~ ${formatDate(periodAEnd)}` : '기준기간';
    const periodBLabel = periodBStart && periodBEnd ? `${formatDate(periodBStart)} ~ ${formatDate(periodBEnd)}` : '비교기간';
    const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(Math.round(num));
    const formatDecimal = (num: number) => num.toFixed(1);

    // startFrom 형식: "20251006" -> Date로 변환
    const parseStartFrom = (startFrom: string) => {
      const year = parseInt(startFrom.substring(0, 4));
      const month = parseInt(startFrom.substring(4, 6)) - 1;
      const day = parseInt(startFrom.substring(6, 8));
      return new Date(year, month, day);
    };

    // 가. 당월 운영 목표 (공통)
    html += `
      <h4 style="margin-top: 24px;">가. 당월 운영 목표</h4>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tbody>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600; width: 150px;">운영 방향</td>
            <td><em style="color: #9ca3af;">(내용을 입력해주세요)</em></td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600;">키워드 운영 전략</td>
            <td><em style="color: #9ca3af;">(전략을 입력해주세요)</em></td>
          </tr>
        </tbody>
      </table>
    `;

    // 각 블로그별로 개별 섹션 생성
    for (let blogIndex = 0; blogIndex < selectedAccounts.length; blogIndex++) {
      const account = selectedAccounts[blogIndex];
      const blogLabel = account.isMain ? `${account.name}` : `${account.blogId}`;

      html += `
        <div style="margin-top: 32px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #fafafa;">
          <h5 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #1f2937;">
            📊 ${blogLabel}
            ${account.isMain ? '<span style="margin-left: 8px; padding: 2px 8px; font-size: 11px; background-color: #dbeafe; color: #1d4ed8; border-radius: 4px;">메인</span>' : ''}
          </h5>
      `;

      // 1. 타겟 키워드 운영
      try {
        const keywordsA: string[] = [];
        const keywordsB: string[] = [];

        if (periodAStart && periodAEnd) {
          const dataA = await adminAPI.getBlogKeywords(account.blogId, periodAStart, periodAEnd);
          dataA.topKeywords.forEach(kw => {
            if (!keywordsA.includes(kw.keyword)) keywordsA.push(kw.keyword);
          });
        }
        if (periodBStart && periodBEnd) {
          const dataB = await adminAPI.getBlogKeywords(account.blogId, periodBStart, periodBEnd);
          dataB.topKeywords.forEach(kw => {
            if (!keywordsB.includes(kw.keyword)) keywordsB.push(kw.keyword);
          });
        }

        // LLM으로 키워드 분류 (모든 키워드를 한 번에 분류)
        const allKeywords = [...new Set([...keywordsA, ...keywordsB])];
        let localKeywordsSet = new Set<string>();

        if (allKeywords.length > 0) {
          try {
            const classificationResult = await classifyKeywords(allKeywords);
            localKeywordsSet = new Set(classificationResult.local || []);
          } catch (classifyError) {
            console.error('키워드 분류 오류:', classifyError);
            // 분류 실패 시 모든 키워드를 전국구로 처리
          }
        }

        // 키워드 셀 스타일 (지역: 연파랑, 전국구: 진파랑)
        const getKeywordCellStyle = (keyword: string): string => {
          if (localKeywordsSet.has(keyword)) {
            return 'background-color: #dbeafe; color: #1e40af;'; // 연파랑 배경
          }
          return 'background-color: #3b82f6; color: #ffffff;'; // 진파랑 배경
        };

        html += `
          <p style="font-weight: 600; margin: 16px 0 8px 0;">타겟 키워드 운영</p>
          <div style="display: flex; gap: 12px; margin-bottom: 8px; font-size: 11px;">
            <span><span style="display: inline-block; width: 12px; height: 12px; background-color: #dbeafe; border: 1px solid #93c5fd; margin-right: 4px;"></span>지역 키워드</span>
            <span><span style="display: inline-block; width: 12px; height: 12px; background-color: #3b82f6; margin-right: 4px;"></span>전국구 키워드</span>
          </div>
          <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 16px; font-size: 13px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="width: 30px;">No</th>
                <th>비교기간 (${periodBLabel})</th>
                <th>기준기간 (${periodALabel})</th>
              </tr>
            </thead>
            <tbody>
        `;

        const maxKeywords = Math.max(keywordsA.length, keywordsB.length, 5);
        for (let i = 0; i < Math.min(maxKeywords, 10); i++) {
          const kwB = keywordsB[i];
          const kwA = keywordsA[i];
          html += `
            <tr>
              <td style="text-align: center;">${i + 1}</td>
              <td style="${kwB ? getKeywordCellStyle(kwB) : ''}">${kwB || '<em style="color: #9ca3af;">-</em>'}</td>
              <td style="${kwA ? getKeywordCellStyle(kwA) : ''}">${kwA || '<em style="color: #9ca3af;">-</em>'}</td>
            </tr>
          `;
        }

        html += '</tbody></table>';
      } catch (error) {
        console.error('Failed to load blog keywords for', account.blogId, error);
        html += '<p style="color: #9ca3af; font-size: 13px;">키워드 데이터를 불러올 수 없습니다.</p>';
      }

      // 2. 블로그 성과 지표 (조회수) - visitStats가 있는 경우만
      if (account.visitStats && account.visitStats.length > 0) {
        const aggregateVisits = (startDate: string, endDate: string) => {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setDate(end.getDate() + 6);

          return account.visitStats
            .filter(stat => {
              const statStart = parseStartFrom(stat.startFrom);
              return statStart >= start && statStart <= end;
            })
            .reduce((sum, stat) => sum + stat.total, 0);
        };

        const totalVisitsA = periodAStart && periodAEnd ? aggregateVisits(periodAStart, periodAEnd) : 0;
        const totalVisitsB = periodBStart && periodBEnd ? aggregateVisits(periodBStart, periodBEnd) : 0;

        html += `
          <p style="font-weight: 600; margin: 16px 0 8px 0;">블로그 성과 지표</p>
          <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 16px; font-size: 13px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th>기간</th>
                <th>총 조회수</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 600; font-size: 12px;">${periodALabel}</td>
                <td style="text-align: center; font-weight: 600;">${formatNumber(totalVisitsA)}</td>
              </tr>
              ${periodBStart && periodBEnd ? `
              <tr>
                <td style="font-weight: 600; font-size: 12px;">${periodBLabel}</td>
                <td style="text-align: center;">${formatNumber(totalVisitsB)}</td>
              </tr>
              ` : ''}
            </tbody>
          </table>
        `;
      }

      // 3. 유입 경로 분석 - refererStats가 있는 경우만
      if (account.refererStats && account.refererStats.length > 0) {
        // visitStats와 refererStats를 매칭하여 유입 수 계산
        const calcRefererVisits = (startDate: string, endDate: string) => {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setDate(end.getDate() + 6);

          let placeVisits = 0;
          let searchVisits = 0;
          let totalVisits = 0;

          // refererStats 기반으로 계산
          account.refererStats
            .filter(stat => {
              const statStart = parseStartFrom(stat.startFrom);
              return statStart >= start && statStart <= end;
            })
            .forEach(refererStat => {
              // 같은 주차의 visitStats 찾기
              const visitStat = account.visitStats?.find(v => v.startFrom === refererStat.startFrom);
              const weekTotal = visitStat?.total || 0;
              totalVisits += weekTotal;

              if (refererStat.entries && weekTotal > 0) {
                refererStat.entries.forEach(entry => {
                  const visits = weekTotal * (entry.percentage / 100);
                  if (entry.source.includes('플레이스')) {
                    placeVisits += visits;
                  } else if (entry.source.includes('통합검색') || entry.source.includes('블로그검색')) {
                    searchVisits += visits;
                  }
                });
              }
            });

          return { placeVisits, searchVisits, totalVisits };
        };

        const resultA = periodAStart && periodAEnd ? calcRefererVisits(periodAStart, periodAEnd) : { placeVisits: 0, searchVisits: 0, totalVisits: 0 };
        const resultB = periodBStart && periodBEnd ? calcRefererVisits(periodBStart, periodBEnd) : { placeVisits: 0, searchVisits: 0, totalVisits: 0 };

        const placeRefererA = resultA.totalVisits > 0 ? (resultA.placeVisits / resultA.totalVisits) * 100 : 0;
        const searchRefererA = resultA.totalVisits > 0 ? (resultA.searchVisits / resultA.totalVisits) * 100 : 0;
        const placeRefererB = resultB.totalVisits > 0 ? (resultB.placeVisits / resultB.totalVisits) * 100 : 0;
        const searchRefererB = resultB.totalVisits > 0 ? (resultB.searchVisits / resultB.totalVisits) * 100 : 0;

        html += `
          <p style="font-weight: 600; margin: 16px 0 8px 0;">유입 경로 분석</p>
          <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 16px; font-size: 13px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th>기간</th>
                <th>플레이스 유입</th>
                <th>검색 유입</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 600; font-size: 12px;">${periodALabel}</td>
                <td style="text-align: center;">${formatDecimal(placeRefererA)}% (${formatNumber(resultA.placeVisits)}명)</td>
                <td style="text-align: center;">${formatDecimal(searchRefererA)}% (${formatNumber(resultA.searchVisits)}명)</td>
              </tr>
              ${periodBStart && periodBEnd ? `
              <tr>
                <td style="font-weight: 600; font-size: 12px;">${periodBLabel}</td>
                <td style="text-align: center;">${formatDecimal(placeRefererB)}% (${formatNumber(resultB.placeVisits)}명)</td>
                <td style="text-align: center;">${formatDecimal(searchRefererB)}% (${formatNumber(resultB.searchVisits)}명)</td>
              </tr>
              ` : ''}
            </tbody>
          </table>
        `;
      }

      // 데이터가 없는 경우 메시지
      if ((!account.visitStats || account.visitStats.length === 0) && (!account.refererStats || account.refererStats.length === 0)) {
        html += '<p style="color: #9ca3af; font-size: 13px; margin: 16px 0;">유입 통계 데이터가 없습니다.</p>';
      }

      html += '</div>'; // 블로그 섹션 닫기
    }

    // 다. 후속 전략 (공통)
    html += `
      <h4 style="margin-top: 24px;">나. 후속 전략</h4>
      <ul style="color: #374151;">
        <li><em style="color: #9ca3af;">(전략 1을 입력해주세요)</em></li>
        <li><em style="color: #9ca3af;">(전략 2를 입력해주세요)</em></li>
        <li><em style="color: #9ca3af;">(전략 3을 입력해주세요)</em></li>
      </ul>
    `;

    return html;
  };

  // Type별 색상 맵 (Notion 스타일)
  const getTypeStyle = (type: string): string => {
    const typeColorMap: Record<string, { bg: string; text: string }> = {
      // 분홍 (pink)
      '특이사항': { bg: '#fce7f3', text: '#9d174d' },
      // 갈색 (brown)
      '월간 전략': { bg: '#fef3c7', text: '#92400e' },
      '주간 모니터링': { bg: '#fef3c7', text: '#92400e' },
      '주요 원내 일정': { bg: '#fef3c7', text: '#92400e' },
      // 초록 (green)
      '블로그': { bg: '#d1fae5', text: '#065f46' },
      // 주황 (orange)
      '디자인': { bg: '#ffedd5', text: '#9a3412' },
      // 빨강 (red)
      '악성 리뷰': { bg: '#fee2e2', text: '#991b1b' },
      // 보라 (purple)
      '플레이스 리뷰': { bg: '#ede9fe', text: '#5b21b6' },
      '플레이스 콘텐츠': { bg: '#ede9fe', text: '#5b21b6' },
      '플레이스 순위': { bg: '#ede9fe', text: '#5b21b6' },
      // 파랑 (blue)
      'META 광고': { bg: '#dbeafe', text: '#1e40af' },
      '플레이스 광고': { bg: '#dbeafe', text: '#1e40af' },
      // 노랑 (yellow)
      '커뮤니티 마케팅': { bg: '#fef9c3', text: '#854d0e' },
      '미팅': { bg: '#fef9c3', text: '#854d0e' },
      // 회색 (gray)
      '오프라인 마케팅': { bg: '#f3f4f6', text: '#374151' },
      '의료광고심의': { bg: '#f3f4f6', text: '#374151' },
    };

    const colors = typeColorMap[type] || { bg: '#f3f4f6', text: '#374151' };
    return `background-color: ${colors.bg}; color: ${colors.text}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; display: inline-block;`;
  };

  // 일자별 타임라인 표 생성
  const generateTimelineTable = (entries: MarketingCalendarEntry[], title: string): string => {
    if (entries.length === 0) return '';

    // 날짜순 정렬
    const sortedEntries = [...entries].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let html = `<h3 style="margin-top: 24px;">${title}</h3>`;
    html += `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="width: 100px;">날짜</th>
            <th style="width: 120px;">Type</th>
            <th style="width: 80px;">진행 현황</th>
            <th>제목</th>
            <th style="width: 100px;">담당자</th>
          </tr>
        </thead>
        <tbody>
    `;

    sortedEntries.forEach(entry => {
      // 상태에 따른 배경색
      let statusStyle = '';
      const statusLower = entry.status.toLowerCase();
      if (statusLower.includes('완료') || statusLower.includes('done') || statusLower.includes('complete')) {
        statusStyle = 'background-color: #d1fae5; color: #065f46;';
      } else if (statusLower.includes('진행') || statusLower.includes('progress') || statusLower.includes('ing')) {
        statusStyle = 'background-color: #fef3c7; color: #92400e;';
      } else if (statusLower.includes('예정') || statusLower.includes('todo') || statusLower.includes('plan') || statusLower.includes('시작 전')) {
        statusStyle = 'background-color: #f3f4f6; color: #374151;';
      } else if (statusLower.includes('보류')) {
        statusStyle = 'background-color: #fee2e2; color: #991b1b;';
      }

      const formattedDate = entry.date ? entry.date.replace(/-/g, '.') : '-';
      const typeHtml = entry.type ? `<span style="${getTypeStyle(entry.type)}">${entry.type}</span>` : '-';

      html += `
        <tr>
          <td style="font-weight: 500;">${formattedDate}</td>
          <td>${typeHtml}</td>
          <td style="${statusStyle} text-align: center; font-weight: 500;">${entry.status || '-'}</td>
          <td>${entry.title || '-'}</td>
          <td>${entry.assignee || '-'}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    return html;
  };

  // 컨텐츠 종류별 통계 생성 (A기간만)
  const generateContentTypeStats = (periodA: MarketingCalendarEntry[]): string => {
    // 컨텐츠 종류별 카운트
    const statsA: Record<string, number> = {};

    periodA.forEach(entry => {
      if (entry.type) {
        statsA[entry.type] = (statsA[entry.type] || 0) + 1;
      }
    });

    // 내림차순 정렬 (많이 한 순서)
    const sortedTypes = Object.entries(statsA)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);

    if (sortedTypes.length === 0) return '';

    let html = '<h3 style="margin-top: 32px;">업무분야별 활동 현황</h3>';
    html += `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="width: 200px;">업무 분야</th>
            <th style="width: 100px;">활동 수</th>
          </tr>
        </thead>
        <tbody>
    `;

    sortedTypes.forEach(type => {
      const count = statsA[type] || 0;
      const typeHtml = `<span style="${getTypeStyle(type)}">${type}</span>`;

      html += `
        <tr>
          <td>${typeHtml}</td>
          <td style="text-align: center; font-weight: 500;">${count}건</td>
        </tr>
      `;
    });

    // 합계 행
    const totalA = periodA.length;

    html += `
      <tr style="background-color: #f9fafb; font-weight: 600;">
        <td>합계</td>
        <td style="text-align: center;">${totalA}건</td>
      </tr>
    `;

    html += '</tbody></table>';
    return html;
  };

  // 총평 생성
  const generateConclusion = (): string => {
    return `
      <h2>4. 총평</h2>
      <h3>a. 요약</h3>
      <ul>
        <li><em>핵심 변화 요약 1</em></li>
        <li><em>핵심 변화 요약 2</em></li>
        <li><em>핵심 변화 요약 3</em></li>
      </ul>

      <h3>b. 후속 전략</h3>
      <ul>
        <li><em>전략 제안 1</em></li>
        <li><em>전략 제안 2</em></li>
        <li><em>전략 제안 3</em></li>
      </ul>
    `;
  };

  // 초안 생성 (동시에 여러 섹션 생성 가능)
  const handleGenerateDraft = async (id: string) => {
    // 이미 생성 중인 섹션이면 무시
    if (generatingSections.has(id)) return;

    // 생성 중 목록에 추가
    setGeneratingSections(prev => new Set(prev).add(id));
    let content = '';

    try {
      switch (id) {
        case 'overview':
          content = generateOverview();
          break;
        case 'summary':
          content = await generateSummaryWithChart();
          break;
        case 'age_analysis':
          content = await generateAgeAnalysis();
          break;
        case 'region_analysis':
          content = await generateRegionAnalysis();
          break;
        case 'retention_analysis':
          content = await generateRetentionAnalysis();
          break;
        case 'channel_performance':
          content = await generateChannelPerformance();
          break;
        case 'conclusion':
          content = generateConclusion();
          break;
        default:
          content = '<h2>' + sections.find(s => s.id === id)?.title + '</h2><p>생성된 초안 내용...</p>';
      }

      setSections(prev => prev.map(section =>
        section.id === id
          ? {
              ...section,
              generated: true,
              contentHtml: content
            }
          : section
      ));
    } catch (err) {
      console.error(`섹션 생성 오류 [${id}]:`, err);
      setSections(prev => prev.map(section =>
        section.id === id
          ? {
              ...section,
              generated: true,
              contentHtml: `<p style="color:#ef4444;">⚠️ 생성 중 오류가 발생했습니다: ${err instanceof Error ? err.message : String(err)}</p>`
            }
          : section
      ));
    } finally {
      // 생성 중 목록에서 제거
      setGeneratingSections(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // PDF 포함 토글
  const toggleIncludeInPdf = (id: string) => {
    setSections(sections.map(section =>
      section.id === id
        ? { ...section, includedInPdf: !section.includedInPdf }
        : section
    ));
  };

  // 에디터 내용 변경
  const handleContentChange = (id: string, content: string) => {
    setSections(sections.map(section =>
      section.id === id
        ? { ...section, contentHtml: content }
        : section
    ));
  };

  const handleDailyAverageChange = (id: string, checked: boolean) => {
    setSections(sections.map(section =>
      section.id === id
        ? { ...section, useDailyAverage: checked }
        : section
    ));
  };

  const handleUnitPriceChange = (id: string, checked: boolean) => {
    setSections(sections.map(section =>
      section.id === id
        ? { ...section, showUnitPrice: checked }
        : section
    ));
  };

  const handleRetentionPeriodChange = (id: string, start: string, end: string) => {
    setSections(sections.map(s =>
      s.id === id ? { ...s, retentionStart: start, retentionEnd: end, excludedWeeksRetention: [] } : s
    ));
  };

  const handleRetentionExcludedWeeksChange = (id: string, weeks: string[]) => {
    setSections(sections.map(s => s.id === id ? { ...s, excludedWeeksRetention: weeks } : s));
  };

  // PDF 생성 함수
  const handleGeneratePdf = () => {
    // PDF에 포함할 섹션만 필터링
    const includedSections = sections.filter(s => s.includedInPdf);

    if (includedSections.length === 0) {
      alert('PDF에 포함할 섹션을 선택해주세요.');
      return;
    }

    // HTML 컨텐츠 병합
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${selectedHospital} - 마케팅 데이터 분석 보고서</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          body {
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.7;
            color: #1f2937;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 8px;
            border-bottom: 3px solid #374151;
            padding-bottom: 8px;
          }
          h2 {
            font-size: 20px;
            font-weight: 600;
            color: #111827;
            margin-top: 32px;
            margin-bottom: 16px;
          }
          h3 {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-top: 24px;
            margin-bottom: 12px;
          }
          h4 {
            font-size: 15px;
            font-weight: 600;
            color: #374151;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          h5 {
            font-size: 14px;
            font-weight: 600;
            color: #4b5563;
            margin-top: 16px;
            margin-bottom: 8px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
            font-size: 13px;
          }
          th {
            background-color: #f3f4f6;
            padding: 10px 12px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border: 1px solid #d1d5db;
          }
          td {
            padding: 8px 12px;
            border: 1px solid #e5e7eb;
          }
          p {
            margin: 12px 0;
            font-size: 14px;
          }
          em {
            color: #6b7280;
            font-style: italic;
          }
          strong {
            font-weight: 600;
            color: #111827;
          }
          ul {
            margin: 12px 0;
            padding-left: 24px;
          }
          li {
            margin: 8px 0;
            font-size: 14px;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .period-info {
            background-color: #f9fafb;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 32px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${selectedHospital}</h1>
          <p style="font-size: 18px; font-weight: 600; color: #6b7280; margin-top: 8px;">
            마케팅 데이터 분석 보고서
          </p>
        </div>

        <div class="period-info">
          <strong>분석 기간 (A):</strong> ${periodAStart} ~ ${getWeekEnd(periodAEnd)}<br/>
          <strong>비교 기간 (B):</strong> ${periodBStart} ~ ${getWeekEnd(periodBEnd)}
        </div>

        ${includedSections.map(section => section.contentHtml).join('\n\n')}

        <div style="margin-top: 48px; padding-top: 24px; border-top: 2px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>생성일: ${new Date().toLocaleDateString('ko-KR')}</p>
        </div>
      </body>
      </html>
    `;

    // 새 창에서 HTML 열고 출력 대화상자 표시
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // 이미지 등이 있을 경우를 대비해 로딩 대기
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <ReportHeader
        hospitals={hospitals}
        selectedHospital={selectedHospital}
        onHospitalChange={setSelectedHospital}
        loading={loading}
        weeklyStats={weeklyStats}
        periodAStart={periodAStart}
        periodAEnd={periodAEnd}
        periodBStart={periodBStart}
        periodBEnd={periodBEnd}
        onPeriodAStartChange={handlePeriodAStartChange}
        onPeriodAEndChange={handlePeriodAEndChange}
        onPeriodBStartChange={handlePeriodBStartChange}
        onPeriodBEndChange={handlePeriodBEndChange}
        excludedWeeksA={excludedWeeksA}
        excludedWeeksB={excludedWeeksB}
        onExcludedWeeksAChange={setExcludedWeeksA}
        onExcludedWeeksBChange={setExcludedWeeksB}
        notionDatabaseId={notionDatabaseId}
        savedNotionDatabases={savedNotionDatabases}
        onNotionDbChange={setNotionDatabaseId}
        onShowAddDbModal={() => setShowAddDbModal(true)}
        onDeleteNotionDb={handleDeleteNotionDatabase}
        analyticsHospitals={analyticsHospitals}
        analyticsHospitalId={analyticsHospitalId}
        onAnalyticsIdChange={handleAnalyticsHospitalChange}
        blogAccounts={blogAccounts}
        selectedBlogIds={selectedBlogIds}
        onBlogSelection={handleBlogSelection}
      />

      {/* Notion Database 추가 모달 */}
      <NotionDbModal
        show={showAddDbModal}
        newDbId={newDbId}
        newDbName={newDbName}
        adding={addingDb}
        onDbIdChange={setNewDbId}
        onDbNameChange={setNewDbName}
        onClose={() => {
          setShowAddDbModal(false);
          setNewDbId('');
          setNewDbName('');
        }}
        onAdd={handleAddNotionDatabase}
      />

      <div style={{ padding: '32px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
          {/* Left Panel - 섹션 선택 */}
          <SectionList
            sections={sections}
            selectedSectionId={selectedSectionId}
            generatingSections={generatingSections}
            onSelectSection={setSelectedSectionId}
            onToggleSection={toggleSection}
            onToggleIncludeInPdf={toggleIncludeInPdf}
            onGenerateDraft={handleGenerateDraft}
            onGeneratePdf={handleGeneratePdf}
          />

          {/* Right Panel - 에디터 */}
          <SectionEditor
            section={selectedSection ?? null}
            generatingSections={generatingSections}
            onContentChange={handleContentChange}
            onGenerateDraft={handleGenerateDraft}
            onDailyAverageChange={handleDailyAverageChange}
            onUnitPriceChange={handleUnitPriceChange}
            weeklyStats={weeklyStats}
            onRetentionPeriodChange={handleRetentionPeriodChange}
            onRetentionExcludedWeeksChange={handleRetentionExcludedWeeksChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportBuilderPage;
