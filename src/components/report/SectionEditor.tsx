/**
 * 보고서 섹션 에디터 컴포넌트
 */

import React, { useState, useMemo } from 'react';
import type { ReportSection } from '../../types/report';

// 일평균 옵션을 지원하는 섹션 ID
const DAILY_AVERAGE_SECTIONS = ['summary', 'age_analysis', 'region_analysis'];

interface WeeklyStat {
  id: string;
  week_start: string;
  week_end: string;
  [key: string]: any;
}

interface SectionEditorProps {
  section: ReportSection | null;
  generatingSections: Set<string>;
  onContentChange: (id: string, content: string) => void;
  onGenerateDraft: (id: string) => void;
  onDailyAverageChange: (id: string, checked: boolean) => void;
  onUnitPriceChange: (id: string, checked: boolean) => void;
  weeklyStats?: WeeklyStat[];
  onRetentionPeriodChange?: (id: string, start: string, end: string) => void;
  onRetentionExcludedWeeksChange?: (id: string, weeks: string[]) => void;
}

// 해석 라벨 매핑
const interpretationLabels: Record<string, string> = {
  summary: '요약 분석 해석',
  age: '연령대별 분석 해석',
  weeklyAgeTrend: '주별 연령대 추이 해석',
  region: '지역별 분석 해석',
  weeklyRegionTrend: '주별 지역별 추이 해석',
  concentration: 'TOP3/Sub4 집중도 해석',
  smartplace: '스마트플레이스 유입 해석',
};

// HTML에서 해석 부분 추출
const extractInterpretations = (html: string): Array<{ id: string; label: string; text: string }> => {
  const interpretations: Array<{ id: string; label: string; text: string }> = [];
  const regex = /<p[^>]*data-interpretation="([^"]+)"[^>]*data-raw="([^"]*)"[^>]*>/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const id = match[1];
    const rawText = match[2] ? decodeURIComponent(match[2]) : '';
    interpretations.push({
      id,
      label: interpretationLabels[id] || id,
      text: rawText,
    });
  }

  return interpretations;
};

// HTML 내 해석 업데이트
const updateInterpretationInHtml = (html: string, interpretationId: string, newText: string): string => {
  // 줄바꿈 포맷팅 (문장 끝에 <br> 추가)
  const formattedText = newText
    .replace(/\. /g, '.<br>')
    .replace(/\n/g, '<br>');

  const encodedRaw = encodeURIComponent(newText);

  // 정규식으로 해당 해석 부분 찾아서 교체
  const regex = new RegExp(
    `(<p[^>]*data-interpretation="${interpretationId}"[^>]*data-raw=")[^"]*("[^>]*>)[\\s\\S]*?(<\\/p>)`,
    'g'
  );

  return html.replace(regex, `$1${encodedRaw}$2${formattedText}$3`);
};

export const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  generatingSections,
  onContentChange,
  onGenerateDraft,
  onDailyAverageChange,
  onUnitPriceChange,
  weeklyStats = [],
  onRetentionPeriodChange,
  onRetentionExcludedWeeksChange,
}) => {
  // 편집 모드: 'interpretation' = 해석만 편집, 'html' = HTML 전체 편집
  const [editMode, setEditMode] = useState<'interpretation' | 'html'>('interpretation');

  // 해석 부분 추출
  const interpretations = useMemo(() => {
    if (!section?.contentHtml) return [];
    return extractInterpretations(section.contentHtml);
  }, [section?.contentHtml]);

  // 해당 섹션에 해석이 있는지 확인
  const hasInterpretations = interpretations.length > 0;

  // 해석 텍스트 변경 핸들러
  const handleInterpretationChange = (interpretationId: string, newText: string) => {
    if (!section) return;
    const updatedHtml = updateInterpretationInHtml(section.contentHtml, interpretationId, newText);
    onContentChange(section.id, updatedHtml);
  };

  // 재방문율 기간 설정 UI용 헬퍼
  const fmtChip = (dateStr: string): string => {
    const [, m, d] = dateStr.split('-');
    return `${parseInt(m)}/${parseInt(d)}`;
  };

  const retentionWeeks = useMemo(() => {
    if (!section || section.id !== 'retention_analysis') return [];
    const start = section.retentionStart || '';
    const end = section.retentionEnd || '';
    if (!start || !end) return [];
    return weeklyStats.filter(s => s.week_start >= start && s.week_start <= end);
  }, [section, weeklyStats]);

  const renderRetentionPeriodUI = () => {
    if (!section || section.id !== 'retention_analysis') return null;
    const retStart = section.retentionStart || '';
    const retEnd = section.retentionEnd || '';
    const excluded = section.excludedWeeksRetention || [];

    const handleToggleWeek = (weekStart: string) => {
      if (!onRetentionExcludedWeeksChange) return;
      const next = excluded.includes(weekStart)
        ? excluded.filter(w => w !== weekStart)
        : [...excluded, weekStart];
      onRetentionExcludedWeeksChange(section.id, next);
    };

    return (
      <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#166534', marginBottom: '10px' }}>신환 재방문율 분석 기간</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={retStart}
            onChange={(e) => onRetentionPeriodChange?.(section.id, e.target.value, retEnd)}
            style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
          >
            <option value="">시작 주 선택</option>
            {weeklyStats.map(s => (
              <option key={s.week_start} value={s.week_start}>{fmtChip(s.week_start)}</option>
            ))}
          </select>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>~</span>
          <select
            value={retEnd}
            onChange={(e) => onRetentionPeriodChange?.(section.id, retStart, e.target.value)}
            style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
          >
            <option value="">종료 주 선택</option>
            {weeklyStats.filter(s => !retStart || s.week_start >= retStart).map(s => (
              <option key={s.week_start} value={s.week_start}>{fmtChip(s.week_start)}</option>
            ))}
          </select>
        </div>
        {retentionWeeks.length > 0 && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {retentionWeeks.map(s => {
              const isExcluded = excluded.includes(s.week_start);
              return (
                <button
                  key={s.week_start}
                  onClick={() => handleToggleWeek(s.week_start)}
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    borderRadius: '12px',
                    border: `1px solid ${isExcluded ? '#d1d5db' : '#86efac'}`,
                    backgroundColor: isExcluded ? '#f3f4f6' : '#dcfce7',
                    color: isExcluded ? '#9ca3af' : '#166534',
                    cursor: 'pointer',
                    textDecoration: isExcluded ? 'line-through' : 'none',
                  }}
                >
                  {fmtChip(s.week_start)}
                </button>
              );
            })}
            {excluded.length > 0 && (
              <span style={{ fontSize: '11px', color: '#9ca3af', alignSelf: 'center' }}>{excluded.length}주 제외</span>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!section) {
    return (
      <div>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb', minHeight: '800px' }}>
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              왼쪽에서 섹션을 선택하여 편집을 시작하세요
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb', minHeight: '800px' }}>
        <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                {section.title}
              </h3>
              {section.generated && (
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  아래 내용을 자유롭게 수정할 수 있습니다
                </p>
              )}
            </div>

          {/* 재작성 버튼 + 일평균 체크박스 + 편집 모드 토글 */}
          {section.generated && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {DAILY_AVERAGE_SECTIONS.includes(section.id) && (
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#374151',
                    padding: '6px 10px',
                    backgroundColor: section.useDailyAverage ? '#eff6ff' : '#f9fafb',
                    border: `1px solid ${section.useDailyAverage ? '#93c5fd' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={section.useDailyAverage ?? false}
                    onChange={(e) => onDailyAverageChange(section.id, e.target.checked)}
                    style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: section.useDailyAverage ? 600 : 400 }}>일평균</span>
                </label>
              )}
              {section.id === 'summary' && (
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#374151',
                    padding: '6px 10px',
                    backgroundColor: section.showUnitPrice ? '#fef3c7' : '#f9fafb',
                    border: `1px solid ${section.showUnitPrice ? '#fcd34d' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={section.showUnitPrice ?? false}
                    onChange={(e) => onUnitPriceChange(section.id, e.target.checked)}
                    style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: section.showUnitPrice ? 600 : 400 }}>객단가</span>
                </label>
              )}
              <button
                onClick={() => onGenerateDraft(section.id)}
                disabled={generatingSections.has(section.id)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: generatingSections.has(section.id) ? '#9ca3af' : '#f59e0b',
                  backgroundColor: 'transparent',
                  border: `1px solid ${generatingSections.has(section.id) ? '#e5e7eb' : '#fcd34d'}`,
                  borderRadius: '6px',
                  cursor: generatingSections.has(section.id) ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {generatingSections.has(section.id) ? '생성 중...' : '↺ 재작성'}
              </button>
              {hasInterpretations && (
                <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '3px' }}>
                  <button
                    onClick={() => setEditMode('interpretation')}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: editMode === 'interpretation' ? '#fff' : '#6b7280',
                      backgroundColor: editMode === 'interpretation' ? '#3b82f6' : 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    해석 편집
                  </button>
                  <button
                    onClick={() => setEditMode('html')}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: editMode === 'html' ? '#fff' : '#6b7280',
                      backgroundColor: editMode === 'html' ? '#3b82f6' : 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    HTML 편집
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
          {section.generated && renderRetentionPeriodUI()}
        </div>

        {!section.enabled ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              이 섹션을 사용하려면 먼저 체크박스를 선택하세요
            </p>
          </div>
        ) : !section.generated ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            {renderRetentionPeriodUI()}
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
              초안을 생성하여 시작하세요
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
              {DAILY_AVERAGE_SECTIONS.includes(section.id) && (
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#374151',
                    padding: '8px 14px',
                    backgroundColor: section.useDailyAverage ? '#eff6ff' : '#f9fafb',
                    border: `1px solid ${section.useDailyAverage ? '#93c5fd' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={section.useDailyAverage ?? false}
                    onChange={(e) => onDailyAverageChange(section.id, e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: section.useDailyAverage ? 600 : 400 }}>
                    일평균 기준으로 작성
                  </span>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>(영업일 수로 나눈 값)</span>
                </label>
              )}
              {section.id === 'summary' && (
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#374151',
                    padding: '8px 14px',
                    backgroundColor: section.showUnitPrice ? '#fef3c7' : '#f9fafb',
                    border: `1px solid ${section.showUnitPrice ? '#fcd34d' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={section.showUnitPrice ?? false}
                    onChange={(e) => onUnitPriceChange(section.id, e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: section.showUnitPrice ? 600 : 400 }}>
                    객단가 포함
                  </span>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>(매출 ÷ 전체 방문수)</span>
                </label>
              )}
            </div>
            <br />
            <button
              onClick={() => onGenerateDraft(section.id)}
              disabled={generatingSections.has(section.id)}
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#fff',
                backgroundColor: generatingSections.has(section.id) ? '#9ca3af' : '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                cursor: generatingSections.has(section.id) ? 'not-allowed' : 'pointer',
              }}
            >
              {generatingSections.has(section.id) ? '생성 중...' : '초안 생성'}
            </button>
          </div>
        ) : editMode === 'interpretation' && hasInterpretations ? (
          /* 해석 편집 모드 */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* 왼쪽: 해석 편집 영역 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
                AI 해석 편집
              </label>
              <div style={{
                height: '700px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                paddingRight: '8px',
              }}>
                {interpretations.map((interp) => (
                  <div key={interp.id} style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#3b82f6',
                      marginBottom: '8px',
                    }}>
                      {interp.label}
                    </label>
                    <textarea
                      value={interp.text}
                      onChange={(e) => handleInterpretationChange(interp.id, e.target.value)}
                      placeholder="해석 내용을 입력하세요..."
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '10px',
                        fontSize: '13px',
                        color: '#374151',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        resize: 'vertical',
                        lineHeight: '1.7',
                        boxSizing: 'border-box',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 오른쪽: 미리보기 */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>
                미리보기
              </label>
              <div
                dangerouslySetInnerHTML={{ __html: section.contentHtml }}
                style={{
                  height: '700px',
                  maxHeight: '700px',
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
        ) : (
          /* HTML 편집 모드 */
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* 왼쪽: HTML 편집 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>
                  HTML 편집
                </label>
                <textarea
                  value={section.contentHtml}
                  onChange={(e) => onContentChange(section.id, e.target.value)}
                  style={{
                    width: '100%',
                    height: '700px',
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
                  dangerouslySetInnerHTML={{ __html: section.contentHtml }}
                  style={{
                    height: '700px',
                    maxHeight: '700px',
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
      </div>
    </div>
  );
};

export default SectionEditor;
