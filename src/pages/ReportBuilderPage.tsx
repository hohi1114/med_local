import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../utils/adminApi';
import { generateWeeklyTrendChart, generateAgeAnalysisChart, generateWeeklyAgeHeatmapChart, generateAreaComparisonChart, generateWeeklyRegionHeatmapChart, generateWeeklyAreaConcentrationChart } from '../utils/chartGenerator';
import { generateSummaryInterpretation, generateAgeInterpretation, generateWeeklyAgeTrendInterpretation, generateRegionInterpretation, generateWeeklyRegionTrendInterpretation, generateWeeklyAreaConcentrationInterpretation } from '../utils/openai';

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
}

export const ReportBuilderPage: React.FC = () => {
  const navigate = useNavigate();

  // 병원 및 데이터 상태
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);

  // 기간 선택 (A: 분석 기간, B: 비교 기간)
  const [periodAStart, setPeriodAStart] = useState('');
  const [periodAEnd, setPeriodAEnd] = useState('');
  const [periodBStart, setPeriodBStart] = useState('');
  const [periodBEnd, setPeriodBEnd] = useState('');

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
      id: 'conclusion',
      title: '총평',
      enabled: false,
      generated: false,
      includedInPdf: false,
      contentHtml: '',
    },
  ]);

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // 초기 로딩
  useEffect(() => {
    loadHospitals();
  }, []);

  // 병원 선택 시 데이터 로드
  useEffect(() => {
    if (selectedHospital) {
      loadWeeklyStats(selectedHospital);
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

  const loadWeeklyStats = async (hospitalName: string) => {
    setLoading(true);
    try {
      const stats = await adminAPI.getHospitalWeeklyStats(hospitalName);
      const reversedStats = stats.reverse();
      setWeeklyStats(reversedStats);

      // 최근 4주를 기본 Period A로 설정
      if (reversedStats.length >= 4) {
        setPeriodAStart(reversedStats[reversedStats.length - 4].week_start);
        setPeriodAEnd(reversedStats[reversedStats.length - 1].week_end);
      }

      // 그 이전 4주를 Period B로 설정
      if (reversedStats.length >= 8) {
        setPeriodBStart(reversedStats[reversedStats.length - 8].week_start);
        setPeriodBEnd(reversedStats[reversedStats.length - 5].week_end);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
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

  // 개요 생성 함수
  const generateOverview = (): string => {
    if (!selectedHospital || !periodAStart || !periodAEnd) {
      return '<p>병원과 기간을 선택해주세요.</p>';
    }

    // Period A 데이터 집계
    const periodAStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodAStart && stat.week_end <= periodAEnd
    );

    // Period B 데이터 집계
    const periodBStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodBStart && stat.week_end <= periodBEnd
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
            <td>${formatDate(periodAStart)} – ${formatDate(periodAEnd)} (${periodADays}일)</td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600;">휴무일</td>
            <td>${periodAClosedDays > 0 ? `(총 ${periodAClosedDays}일)` : '없음.'}</td>
          </tr>
          ${hasComparisonPeriod ? `
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600;">비교 기간</td>
            <td>${formatDate(periodBStart)} – ${formatDate(periodBEnd)} (${periodBDays}일)</td>
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
    const periodAStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodAStart && stat.week_end <= periodAEnd
    );
    const periodBStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodBStart && stat.week_end <= periodBEnd
    );

    if (periodAStats.length === 0) {
      return '<p>선택한 기간에 데이터가 없습니다.</p>';
    }

    const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num);

    // 합계 계산
    const periodA = {
      revenue: periodAStats.reduce((sum, stat) => sum + stat.total_revenue, 0),
      newPatients: periodAStats.reduce((sum, stat) => sum + stat.new_patients, 0),
      firstVisit: periodAStats.reduce((sum, stat) => sum + stat.first_visit_patients, 0),
      returnPatients: periodAStats.reduce((sum, stat) => sum + stat.return_patients, 0),
      totalPatients: periodAStats.reduce((sum, stat) => sum + stat.total_patients, 0),
    };

    const periodB = {
      revenue: periodBStats.reduce((sum, stat) => sum + stat.total_revenue, 0),
      newPatients: periodBStats.reduce((sum, stat) => sum + stat.new_patients, 0),
      firstVisit: periodBStats.reduce((sum, stat) => sum + stat.first_visit_patients, 0),
      returnPatients: periodBStats.reduce((sum, stat) => sum + stat.return_patients, 0),
      totalPatients: periodBStats.reduce((sum, stat) => sum + stat.total_patients, 0),
    };

    // 차이 계산
    const diff = {
      revenue: periodA.revenue - periodB.revenue,
      newPatients: periodA.newPatients - periodB.newPatients,
      firstVisit: periodA.firstVisit - periodB.firstVisit,
      returnPatients: periodA.returnPatients - periodB.returnPatients,
      totalPatients: periodA.totalPatients - periodB.totalPatients,
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

    let html = '<h2>2. 유입 추이 분석</h2><h3>a. 요약</h3>';

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

    // 기간 비교 테이블
    html += `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th></th>
            <th>매출</th>
            <th>신환</th>
            <th>초진</th>
            <th>재진</th>
            <th>전체 방문 수</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600;">A(분석 기간)</td>
            <td style="${getCellStyle(diff.revenue)}">${formatNumber(periodA.revenue)}</td>
            <td style="${getCellStyle(diff.newPatients)}">${formatNumber(periodA.newPatients)}</td>
            <td style="${getCellStyle(diff.firstVisit)}">${formatNumber(periodA.firstVisit)}</td>
            <td style="${getCellStyle(diff.returnPatients)}">${formatNumber(periodA.returnPatients)}</td>
            <td style="${getCellStyle(diff.totalPatients)}">${formatNumber(periodA.totalPatients)}</td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600;">B(비교 기간)</td>
            <td>${formatNumber(periodB.revenue)}</td>
            <td>${formatNumber(periodB.newPatients)}</td>
            <td>${formatNumber(periodB.firstVisit)}</td>
            <td>${formatNumber(periodB.returnPatients)}</td>
            <td>${formatNumber(periodB.totalPatients)}</td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600;">A - B</td>
            <td>${diff.revenue >= 0 ? '+' : ''}${formatNumber(diff.revenue)}</td>
            <td>${diff.newPatients >= 0 ? '+' : ''}${formatNumber(diff.newPatients)}</td>
            <td>${diff.firstVisit >= 0 ? '+' : ''}${formatNumber(diff.firstVisit)}</td>
            <td>${diff.returnPatients >= 0 ? '+' : ''}${formatNumber(diff.returnPatients)}</td>
            <td>${diff.totalPatients >= 0 ? '+' : ''}${formatNumber(diff.totalPatients)}</td>
          </tr>
        </tbody>
      </table>
    `;

    // 주별 상세 테이블
    html += '<h3 style="margin-top: 32px;">b. 주별 상세 데이터</h3>';

    html += `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th>/day</th>
            <th>매출</th>
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
      if (previousValue === null) return ''; // 첫 주는 비교 대상 없음

      if (currentValue > previousValue) {
        return 'background-color: #d1fae5; font-weight: 600;'; // 증가 - 초록
      } else if (currentValue < previousValue) {
        return 'background-color: #fee2e2; font-weight: 600;'; // 감소 - 빨강
      }
      return ''; // 동일
    };

    allWeeks.forEach((stat, idx) => {
      const weekLabel = formatWeekLabel(stat.week_start);
      const isInPeriodA = stat.week_start >= periodAStart && stat.week_end <= periodAEnd;
      const isInPeriodB = stat.week_start >= periodBStart && stat.week_end <= periodBEnd;

      // A기간에 속하면 연한 초록, B기간에 속하면 연한 핑크
      let rowStyle = '';
      if (isInPeriodA) {
        rowStyle = 'background-color: #d1fae5;'; // 연한 초록
      } else if (isInPeriodB) {
        rowStyle = 'background-color: #fee2e2 ;'; // 연한 핑크
      }

      // 이전 주 데이터
      const prevStat = idx > 0 ? allWeeks[idx - 1] : null;

      // 각 셀의 증감 스타일 (주/day 컬럼은 제외)
      const revenueStyle = getChangeColorStyle(
        stat.total_revenue,
        prevStat?.total_revenue || null
      );
      const newPatientsStyle = getChangeColorStyle(
        stat.new_patients,
        prevStat?.new_patients || null
      );
      const firstVisitStyle = getChangeColorStyle(
        stat.first_visit_patients,
        prevStat?.first_visit_patients || null
      );
      const returnPatientsStyle = getChangeColorStyle(
        stat.return_patients,
        prevStat?.return_patients || null
      );
      const totalPatientsStyle = getChangeColorStyle(
        stat.total_patients,
        prevStat?.total_patients || null
      );

      html += `
        <tr style="${rowStyle}">
          <td style="font-weight: 600;">${weekLabel}</td>
          <td style="${revenueStyle}">${formatNumber(stat.total_revenue)}</td>
          <td style="${newPatientsStyle}">${formatNumber(stat.new_patients)}</td>
          <td style="${firstVisitStyle}">${formatNumber(stat.first_visit_patients)}</td>
          <td style="${returnPatientsStyle}">${formatNumber(stat.return_patients)}</td>
          <td style="${totalPatientsStyle}">${formatNumber(stat.total_patients)}</td>
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
        periodALabel: `${periodAStart} ~ ${periodAEnd}`,
        periodBLabel: `${periodBStart} ~ ${periodBEnd}`,
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

      html += `<p style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 16px;">${summaryInterpretation}</p>`;
    } catch (error) {
      console.error('AI 해석 생성 오류:', error);
      html += '<p style="margin-top: 16px;"><em>주별 추이에 대한 해석을 여기에 작성하세요...</em></p>';
    }

    return html;
  };

  // 연령대별 분석 생성
  const generateAgeAnalysis = async (): Promise<string> => {
    const periodAStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodAStart && stat.week_end <= periodAEnd
    );
    const periodBStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodBStart && stat.week_end <= periodBEnd
    );

    if (periodAStats.length === 0) {
      return '<p>선택한 기간에 데이터가 없습니다.</p>';
    }

    const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num);

    // 연령대별 합계
    const ageGroups = ['0', '10', '20', '30', '40', '50', '60', '70+'];
    const periodAAge: Record<string, number> = {};
    const periodBAge: Record<string, number> = {};

    ageGroups.forEach(age => {
      periodAAge[age] = periodAStats.reduce((sum, stat) => sum + (stat.age_groups?.[age] || 0), 0);
      periodBAge[age] = periodBStats.reduce((sum, stat) => sum + (stat.age_groups?.[age] || 0), 0);
    });

    let html = '<h3>b. 연령대별 신환 유입 추이 분석</h3>';

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
            <td style="background-color: #f3f4f6; font-weight: 600;">A(분석 기간)</td>
            ${ageGroups.map(age => {
              const style = getCompareStyle(periodAAge[age], periodBAge[age]);
              return `<td style="${style}">${formatNumber(periodAAge[age])}</td>`;
            }).join('')}
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: 600;">B(비교 기간)</td>
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
              return `<td style="${diffStyle}">${sign}${formatNumber(diff)}</td>`;
            }).join('')}
          </tr>
        </tbody>
      </table>
    `;

    // AI 해석 생성
    try {
      const ageInterpretation = await generateAgeInterpretation({
        periodALabel: `${periodAStart} ~ ${periodAEnd}`,
        periodBLabel: `${periodBStart} ~ ${periodBEnd}`,
        periodA: periodAAge,
        periodB: periodBAge,
      });

      html += `<p style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6;">${ageInterpretation}</p>`;
    } catch (error) {
      console.error('AI 해석 생성 오류:', error);
      html += '<p><em>연령대별 분석 해석 및 드라이버 분석을 여기에 작성하세요...</em></p>';
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
      const isInPeriodA = stat.week_start >= periodAStart && stat.week_end <= periodAEnd;
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

      html += `
        <tr>
          <td style="background-color: #f3f4f6; font-weight: 600;">${weekLabel}</td>
          ${ages.map(age => {
            const value = stat.age_groups?.[age] || 0;
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
        const isInPeriodA = stat.week_start >= periodAStart && stat.week_end <= periodAEnd;
        return {
          week: formatWeekLabel(stat.week_start),
          period: isInPeriodA ? 'A' as const : 'B' as const,
          ageGroups: stat.age_groups || {},
        };
      });

      const weeklyAgeTrendInterpretation = await generateWeeklyAgeTrendInterpretation({
        periodALabel: `${periodAStart} ~ ${periodAEnd}`,
        periodBLabel: `${periodBStart} ~ ${periodBEnd}`,
        weeklyData: weeklyAgeTrendData,
      });

      html += `<p style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 16px;">${weeklyAgeTrendInterpretation}</p>`;
    } catch (error) {
      console.error('AI 해석 생성 오류:', error);
      html += '<p style="margin-top: 16px;"><em>주별 신환 추이에 대한 해석을 여기에 작성하세요...</em></p>';
    }

    return html;
  };

  // 지역별 분석 생성
  const generateRegionAnalysis = async (): Promise<string> => {
    const periodAStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodAStart && stat.week_end <= periodAEnd
    );
    const periodBStats = weeklyStats.filter(
      (stat) => stat.week_start >= periodBStart && stat.week_end <= periodBEnd
    );

    if (periodAStats.length === 0) {
      return '<p>선택한 기간에 데이터가 없습니다.</p>';
    }

    const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num);

    // 동별 데이터 집계
    const districtsA: Record<string, number> = {};
    const districtsB: Record<string, number> = {};

    periodAStats.forEach(stat => {
      if (stat.top_districts_data) {
        Object.entries(stat.top_districts_data).forEach(([district, count]) => {
          districtsA[district] = (districtsA[district] || 0) + (count as number);
        });
      }
    });

    periodBStats.forEach(stat => {
      if (stat.top_districts_data) {
        Object.entries(stat.top_districts_data).forEach(([district, count]) => {
          districtsB[district] = (districtsB[district] || 0) + (count as number);
        });
      }
    });

    // TOP 7 동 추출
    const allDistricts = new Set([...Object.keys(districtsA), ...Object.keys(districtsB)]);
    const sortedDistricts = Array.from(allDistricts)
      .map(district => ({
        name: district,
        countA: districtsA[district] || 0,
        countB: districtsB[district] || 0,
      }))
      .sort((a, b) => b.countA - a.countA)
      .slice(0, 7);

    // 전체 신환 환자 수 계산
    const totalA = periodAStats.reduce((sum, stat) => sum + stat.new_patients, 0);
    const totalB = periodBStats.reduce((sum, stat) => sum + stat.new_patients, 0);
    
    // TOP3, TOP7 합계
    const top3A = sortedDistricts.slice(0, 3).reduce((sum, d) => sum + d.countA, 0);
    const top3B = sortedDistricts.slice(0, 3).reduce((sum, d) => sum + d.countB, 0);
    const top7A = sortedDistricts.reduce((sum, d) => sum + d.countA, 0);
    const top7B = sortedDistricts.reduce((sum, d) => sum + d.countB, 0);

    let html = '<h3>c. 지역별 유입 추이 분석</h3>';

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
            <th>분석 기간 (A)</th>
            <th>비교 기간 (B)</th>
            <th>A - B</th>
          </tr>
        </thead>
        <tbody>
    `;

    sortedDistricts.forEach(district => {
      const diff = district.countA - district.countB;
      html += `
        <tr>
          <td><strong>${district.name.split(' ').pop()}</strong></td>
          <td>${formatNumber(district.countA)}</td>
          <td>${formatNumber(district.countB)}</td>
          <td>${diff >= 0 ? '+' : ''}${formatNumber(diff)}</td>
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
        <td>TOP7 합계 (비율)</td>
        <td>${formatNumber(top7A)} (${((top7A / totalA) * 100).toFixed(0)}%)</td>
        <td>${formatNumber(top7B)} (${((top7B / totalB) * 100).toFixed(0)}%)</td>
        <td>-</td>
      </tr>
    `;

    html += '</tbody></table>';

    // AI 해석 생성
    try {
      const regionInterpretation = await generateRegionInterpretation({
        periodALabel: `${periodAStart} ~ ${periodAEnd}`,
        periodBLabel: `${periodBStart} ~ ${periodBEnd}`,
        top7: sortedDistricts.map(d => ({
          name: d.name.split(' ').pop() || d.name,
          countA: d.countA,
          countB: d.countB,
        })),
        totalA,
        totalB,
      });

      html += `<p style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6;">${regionInterpretation}</p>`;
    } catch (error) {
      console.error('AI 해석 생성 오류:', error);
      html += '<p><em>지역별 분석 해석 및 집중도 변화에 대한 분석을 여기에 작성하세요...</em></p>';
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

    // 히트맵 차트 생성
    try {
      const regionHeatmapImageBase64 = await generateWeeklyRegionHeatmapChart({
        weeks,
        regions: topRegionNames,
        matrix: regionWeeklyMatrix,
      });

      html += `
        <div style="margin: 24px 0; text-align: center;">
          <img src="${regionHeatmapImageBase64}" alt="주별 지역별 신환 추이" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;">
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

      html += `
        <tr>
          <td style="background-color: #f3f4f6; font-weight: 600;">${weekLabel}</td>
          ${sortedDistricts.map(district => {
            const value = stat.top_districts_data?.[district.name] || 0;
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
        const isInPeriodA = stat.week_start >= periodAStart && stat.week_end <= periodAEnd;
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
        periodALabel: `${periodAStart} ~ ${periodAEnd}`,
        periodBLabel: `${periodBStart} ~ ${periodBEnd}`,
        regions: topRegionNames,
        weeklyData: weeklyRegionTrendData,
      });

      html += `<p style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 16px;">${weeklyRegionTrendInterpretation}</p>`;
    } catch (error) {
      console.error('AI 해석 생성 오류:', error);
      html += '<p style="margin-top: 16px;"><em>주별 지역별 신환 추이에 대한 해석을 여기에 작성하세요...</em></p>';
    }

    // e. 주별 유입 추이 (TOP3 vs TOP7 + 집중도)
    html += '<h3 style="margin-top: 48px;">e. 주별 TOP3/TOP7 집중도 추이</h3>';

    // 주별 TOP3, TOP7 데이터 계산
    const top3Districts = sortedDistricts.slice(0, 3);
    const top7Districts = sortedDistricts;

    const weeklyTop3Counts: number[] = [];
    const weeklyTop7Counts: number[] = [];
    const weeklyTop3Ratios: number[] = [];
    const weeklyTop7Ratios: number[] = [];

    allPeriodStats.forEach(stat => {
      // TOP3 합계
      const top3Sum = top3Districts.reduce((sum, d) => sum + (stat.top_districts_data?.[d.name] || 0), 0);
      // TOP7 합계
      const top7Sum = top7Districts.reduce((sum, d) => sum + (stat.top_districts_data?.[d.name] || 0), 0);
      // 해당 주의 전체 신환 수
      const weeklyTotal = stat.new_patients;

      weeklyTop3Counts.push(top3Sum);
      weeklyTop7Counts.push(top7Sum);
      weeklyTop3Ratios.push(weeklyTotal > 0 ? (top3Sum / weeklyTotal) * 100 : 0);
      weeklyTop7Ratios.push(weeklyTotal > 0 ? (top7Sum / weeklyTotal) * 100 : 0);
    });

    // 히트맵 차트 생성
    try {
      const concentrationChartBase64 = await generateWeeklyAreaConcentrationChart({
        weeks,
        top3Counts: weeklyTop3Counts,
        top7Counts: weeklyTop7Counts,
        top3Ratios: weeklyTop3Ratios,
        top7Ratios: weeklyTop7Ratios,
      });

      html += `
        <div style="margin: 24px 0; text-align: center;">
          <img src="${concentrationChartBase64}" alt="주별 TOP3/TOP7 집중도 추이" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;">
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
            <th>TOP7 동</th>
            <th>TOP7 동 비율</th>
          </tr>
        </thead>
        <tbody>
    `;

    // 최신 주부터 역순으로 표시
    [...allPeriodStats].reverse().forEach((stat, idx) => {
      const weekLabel = formatWeekLabel(stat.week_start);
      const reversedIdx = allPeriodStats.length - 1 - idx;
      const top3Count = weeklyTop3Counts[reversedIdx];
      const top7Count = weeklyTop7Counts[reversedIdx];
      const top3Ratio = weeklyTop3Ratios[reversedIdx];
      const top7Ratio = weeklyTop7Ratios[reversedIdx];

      html += `
        <tr>
          <td style="background-color: #f3f4f6; font-weight: 600;">${weekLabel}</td>
          <td>${formatNumber(top3Count)}</td>
          <td>${top3Ratio.toFixed(0)}%</td>
          <td>${formatNumber(top7Count)}</td>
          <td>${top7Ratio.toFixed(0)}%</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    // 주별 TOP3/TOP7 집중도 AI 해석 생성
    try {
      const weeklyConcentrationData = allPeriodStats.map((stat, idx) => {
        const isInPeriodA = stat.week_start >= periodAStart && stat.week_end <= periodAEnd;
        return {
          week: formatWeekLabel(stat.week_start),
          period: isInPeriodA ? 'A' as const : 'B' as const,
          top3Count: weeklyTop3Counts[idx],
          top7Count: weeklyTop7Counts[idx],
          top3Ratio: weeklyTop3Ratios[idx],
          top7Ratio: weeklyTop7Ratios[idx],
          totalNewPatients: stat.new_patients,
        };
      });

      const concentrationInterpretation = await generateWeeklyAreaConcentrationInterpretation({
        periodALabel: `${periodAStart} ~ ${periodAEnd}`,
        periodBLabel: `${periodBStart} ~ ${periodBEnd}`,
        weeklyData: weeklyConcentrationData,
      });

      html += `<p style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 16px;">${concentrationInterpretation}</p>`;
    } catch (error) {
      console.error('AI 해석 생성 오류:', error);
      html += '<p style="margin-top: 16px;"><em>주별 TOP3/TOP7 집중도 추이에 대한 해석을 여기에 작성하세요...</em></p>';
    }

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

  // 초안 생성
  const handleGenerateDraft = async (id: string) => {
    setGeneratingSection(id);
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
        case 'conclusion':
          content = generateConclusion();
          break;
        default:
          content = '<h2>' + sections.find(s => s.id === id)?.title + '</h2><p>생성된 초안 내용...</p>';
      }

      setSections(sections.map(section =>
        section.id === id
          ? {
              ...section,
              generated: true,
              contentHtml: content
            }
          : section
      ));
    } finally {
      setGeneratingSection(null);
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
          <strong>분석 기간 (A):</strong> ${periodAStart} ~ ${periodAEnd}<br/>
          <strong>비교 기간 (B):</strong> ${periodBStart} ~ ${periodBEnd}
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
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
              자동화된 보고서 생성
            </h1>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              섹션을 선택하고 내용을 편집한 후 PDF로 내보내세요
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/dashboard')}
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
            ← 대시보드로 돌아가기
          </button>
        </div>

        {/* 병원 및 기간 선택 */}
        <div style={{ padding: '0 48px 20px 48px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '20px' }}>
            {/* 병원 선택 */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>
                병원 선택
              </label>
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#374151',
                  backgroundColor: '#fff',
                }}
                disabled={loading}
              >
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.name}>
                    {hospital.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 기간 A 선택 */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>
                분석 기간 (A)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={periodAStart}
                  onChange={(e) => setPeriodAStart(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#374151',
                    backgroundColor: '#fff',
                  }}
                  disabled={loading}
                >
                  <option value="">시작 주</option>
                  {weeklyStats.map((stat) => (
                    <option key={stat.id} value={stat.week_start}>
                      {stat.week_start}
                    </option>
                  ))}
                </select>
                <span style={{ color: '#9ca3af' }}>~</span>
                <select
                  value={periodAEnd}
                  onChange={(e) => setPeriodAEnd(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#374151',
                    backgroundColor: '#fff',
                  }}
                  disabled={loading}
                >
                  <option value="">종료 주</option>
                  {weeklyStats.map((stat) => (
                    <option key={stat.id} value={stat.week_end}>
                      {stat.week_end}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 비교 기간 B 선택 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>
                비교 기간 (B)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={periodBStart}
                  onChange={(e) => setPeriodBStart(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#374151',
                    backgroundColor: '#fff',
                  }}
                  disabled={loading}
                >
                  <option value="">시작 주</option>
                  {weeklyStats.map((stat) => (
                    <option key={stat.id} value={stat.week_start}>
                      {stat.week_start}
                    </option>
                  ))}
                </select>
                <span style={{ color: '#9ca3af' }}>~</span>
                <select
                  value={periodBEnd}
                  onChange={(e) => setPeriodBEnd(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#374151',
                    backgroundColor: '#fff',
                  }}
                  disabled={loading}
                >
                  <option value="">종료 주</option>
                  {weeklyStats.map((stat) => (
                    <option key={stat.id} value={stat.week_end}>
                      {stat.week_end}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div></div>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
          {/* Left Panel - 섹션 선택 */}
          <div>
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>
                보고서 구성 요소
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sections.map((section) => (
                  <div
                    key={section.id}
                    style={{
                      padding: '12px',
                      backgroundColor: selectedSectionId === section.id ? '#f3f4f6' : '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => setSelectedSectionId(section.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="checkbox"
                        checked={section.enabled}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSection(section.id);
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151', flex: 1 }}>
                        {section.title}
                      </span>
                    </div>

                    {section.enabled && (
                      <div style={{ marginLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {!section.generated ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateDraft(section.id);
                            }}
                            disabled={generatingSection === section.id}
                            style={{
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: 500,
                              color: '#fff',
                              backgroundColor: generatingSection === section.id ? '#9ca3af' : '#3b82f6',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: generatingSection === section.id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {generatingSection === section.id ? '생성 중...' : '초안 생성'}
                          </button>
                        ) : (
                          <>
                            <span style={{ fontSize: '11px', color: '#10b981' }}>
                              ✓ 생성 완료
                            </span>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                              <input
                                type="checkbox"
                                checked={section.includedInPdf}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleIncludeInPdf(section.id);
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              <span style={{ color: section.includedInPdf ? '#374151' : '#9ca3af' }}>
                                PDF에 포함
                              </span>
                            </label>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={handleGeneratePdf}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#fff',
                    backgroundColor: sections.some(s => s.includedInPdf) ? '#10b981' : '#d1d5db',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: sections.some(s => s.includedInPdf) ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease',
                  }}
                  disabled={!sections.some(s => s.includedInPdf)}
                >
                  📄 PDF 생성
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - 에디터 */}
          <div>
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb', minHeight: '600px' }}>
              {selectedSection ? (
                <>
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                      {selectedSection.title}
                    </h3>
                    {selectedSection.generated && (
                      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        아래 내용을 자유롭게 수정할 수 있습니다
                      </p>
                    )}
                  </div>

                  {!selectedSection.enabled ? (
                    <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                      <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                        이 섹션을 사용하려면 먼저 체크박스를 선택하세요
                      </p>
                    </div>
                  ) : !selectedSection.generated ? (
                    <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                      <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
                        초안을 생성하여 시작하세요
                      </p>
                      <button
                        onClick={() => handleGenerateDraft(selectedSection.id)}
                        disabled={generatingSection === selectedSection.id}
                        style={{
                          padding: '10px 20px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#fff',
                          backgroundColor: generatingSection === selectedSection.id ? '#9ca3af' : '#3b82f6',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: generatingSection === selectedSection.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {generatingSection === selectedSection.id ? '생성 중...' : '초안 생성'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* HTML 에디터와 미리보기 */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* 왼쪽: HTML 편집 */}
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>
                            HTML 편집
                          </label>
                          <textarea
                            value={selectedSection.contentHtml}
                            onChange={(e) => handleContentChange(selectedSection.id, e.target.value)}
                            style={{
                              width: '100%',
                              height: '500px',
                              padding: '16px',
                              fontSize: '12px',
                              color: '#374151',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              fontFamily: 'monospace',
                              resize: 'none',
                              lineHeight: '1.6',
                              overflow: 'auto',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        {/* 오른쪽: 미리보기 */}
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>
                            미리보기
                          </label>
                          <div
                            dangerouslySetInnerHTML={{ __html: selectedSection.contentHtml }}
                            style={{
                              height: '500px',
                              maxHeight: '500px',
                              padding: '16px',
                              fontSize: '13px',
                              color: '#374151',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              backgroundColor: '#fff',
                              overflowY: 'scroll',
                              lineHeight: '1.7',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                    왼쪽에서 섹션을 선택하여 편집을 시작하세요
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilderPage;
