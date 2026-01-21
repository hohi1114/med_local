/**
 * 보고서 빌더 헤더 컴포넌트
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Hospital, WeeklyStat, AnalyticsHospital } from '../../types/report';
import type { NotionDatabaseRecord } from '../../utils/notionApi';
import type { BlogAccount } from '../../utils/adminApi';

interface ReportHeaderProps {
  // 병원 관련
  hospitals: Hospital[];
  selectedHospital: string;
  onHospitalChange: (name: string) => void;
  loading: boolean;

  // 기간 관련
  weeklyStats: WeeklyStat[];
  periodAStart: string;
  periodAEnd: string;
  periodBStart: string;
  periodBEnd: string;
  onPeriodAStartChange: (value: string) => void;
  onPeriodAEndChange: (value: string) => void;
  onPeriodBStartChange: (value: string) => void;
  onPeriodBEndChange: (value: string) => void;

  // Notion DB 관련
  notionDatabaseId: string;
  savedNotionDatabases: NotionDatabaseRecord[];
  onNotionDbChange: (id: string) => void;
  onShowAddDbModal: () => void;
  onDeleteNotionDb: (id: string) => void;

  // Analytics 병원 관련
  analyticsHospitals: AnalyticsHospital[];
  analyticsHospitalId: string;
  onAnalyticsIdChange: (id: string) => void;

  // 블로그 계정 관련
  blogAccounts: BlogAccount[];
  selectedBlogIds: string[];
  onBlogSelection: (blogId: string, checked: boolean) => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  hospitals,
  selectedHospital,
  onHospitalChange,
  loading,
  weeklyStats,
  periodAStart,
  periodAEnd,
  periodBStart,
  periodBEnd,
  onPeriodAStartChange,
  onPeriodAEndChange,
  onPeriodBStartChange,
  onPeriodBEndChange,
  notionDatabaseId,
  savedNotionDatabases,
  onNotionDbChange,
  onShowAddDbModal,
  onDeleteNotionDb,
  analyticsHospitals,
  analyticsHospitalId,
  onAnalyticsIdChange,
  blogAccounts,
  selectedBlogIds,
  onBlogSelection,
}) => {
  const navigate = useNavigate();

  const selectStyle = {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#374151',
    backgroundColor: '#fff',
  };

  const labelStyle = {
    display: 'block' as const,
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '8px',
    fontWeight: 500,
  };

  return (
    <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
      {/* 타이틀 영역 */}
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

      {/* 설정 영역 */}
      <div style={{ padding: '0 48px 20px 48px', borderTop: '1px solid #f3f4f6' }}>
        {/* 1행: 병원 선택, 분석 기간 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '20px' }}>
          <div>
            <label style={labelStyle}>병원 선택</label>
            <select
              value={selectedHospital}
              onChange={(e) => onHospitalChange(e.target.value)}
              style={{ ...selectStyle, width: '100%' }}
              disabled={loading}
            >
              {hospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.name}>
                  {hospital.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>분석 기간 (A)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={periodAStart}
                onChange={(e) => onPeriodAStartChange(e.target.value)}
                style={selectStyle}
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
                onChange={(e) => onPeriodAEndChange(e.target.value)}
                style={selectStyle}
                disabled={loading}
              >
                <option value="">종료 주</option>
                {weeklyStats.map((stat) => (
                  <option key={stat.id} value={stat.week_start}>
                    {stat.week_start}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2행: 비교 기간, Notion DB */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '12px' }}>
          <div>
            <label style={labelStyle}>비교 기간 (B)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={periodBStart}
                onChange={(e) => onPeriodBStartChange(e.target.value)}
                style={selectStyle}
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
                onChange={(e) => onPeriodBEndChange(e.target.value)}
                style={selectStyle}
                disabled={loading}
              >
                <option value="">종료 주</option>
                {weeklyStats.map((stat) => (
                  <option key={stat.id} value={stat.week_start}>
                    {stat.week_start}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notion Database (채널별 유입 성과용)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <select
                  value={notionDatabaseId}
                  onChange={(e) => onNotionDbChange(e.target.value)}
                  style={{ ...selectStyle, width: '100%' }}
                  disabled={loading}
                >
                  <option value="">Database 선택</option>
                  {savedNotionDatabases.map((db) => (
                    <option key={db.id} value={db.database_id}>
                      {db.database_name || db.database_id.substring(0, 8) + '...'}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={onShowAddDbModal}
                style={{
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#fff',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                disabled={loading}
              >
                + 추가
              </button>
            </div>
            {savedNotionDatabases.length > 0 && notionDatabaseId && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                  선택됨: {savedNotionDatabases.find(db => db.database_id === notionDatabaseId)?.database_name || notionDatabaseId.substring(0, 16) + '...'}
                </span>
                <button
                  onClick={() => {
                    const db = savedNotionDatabases.find(d => d.database_id === notionDatabaseId);
                    if (db) onDeleteNotionDb(db.id);
                  }}
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    color: '#ef4444',
                    backgroundColor: 'transparent',
                    border: '1px solid #ef4444',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3행: Analytics 병원 선택 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '12px' }}>
          <div>
            <label style={labelStyle}>Analytics DB 병원 (주요 이벤트용)</label>
            <select
              value={analyticsHospitalId}
              onChange={(e) => onAnalyticsIdChange(e.target.value)}
              style={{ ...selectStyle, width: '100%' }}
              disabled={loading}
            >
              <option value="">병원 선택</option>
              {analyticsHospitals.map((hospital) => (
                <option key={hospital.hospital_id} value={hospital.hospital_id}>
                  {hospital.name}
                </option>
              ))}
            </select>
            {analyticsHospitalId && (
              <p style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>
                선택됨: {analyticsHospitals.find(h => h.hospital_id === analyticsHospitalId)?.name || analyticsHospitalId.substring(0, 8) + '...'}
              </p>
            )}
          </div>

          {/* 블로그 계정 선택 (Analytics 병원 선택 시에만 표시) */}
          {analyticsHospitalId && (
            <div>
              <label style={labelStyle}>블로그 계정 선택 (네이버 블로그 분석용)</label>
              {blogAccounts.length > 0 ? (
                <div style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  backgroundColor: '#f9fafb',
                }}>
                  {blogAccounts.map((account) => (
                    <label
                      key={account.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 0',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#374151',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBlogIds.includes(account.id)}
                        onChange={(e) => onBlogSelection(account.id, e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span style={{ flex: 1 }}>
                        {account.name}
                        {account.isMain && (
                          <span style={{
                            marginLeft: '6px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            backgroundColor: '#dbeafe',
                            color: '#1d4ed8',
                            borderRadius: '4px',
                          }}>
                            메인
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {account.blogId}
                      </span>
                    </label>
                  ))}
                  {selectedBlogIds.length === 0 && (
                    <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                      * 최소 1개 이상의 블로그를 선택하세요
                    </p>
                  )}
                  {selectedBlogIds.length > 0 && (
                    <p style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>
                      * {selectedBlogIds.length}개 블로그 선택됨
                    </p>
                  )}
                </div>
              ) : (
                <div style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  backgroundColor: '#f9fafb',
                }}>
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                    등록된 블로그 계정이 없습니다
                  </p>
                </div>
              )}
            </div>
          )}
          {!analyticsHospitalId && <div />}
        </div>
      </div>
    </div>
  );
};

export default ReportHeader;
