/**
 * Analytics 병원 매핑 모달
 */

import React from 'react';

interface AnalyticsMappingModalProps {
  show: boolean;
  selectedHospital: string;
  newAnalyticsId: string;
  saving: boolean;
  onAnalyticsIdChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export const AnalyticsMappingModal: React.FC<AnalyticsMappingModalProps> = ({
  show,
  selectedHospital,
  newAnalyticsId,
  saving,
  onAnalyticsIdChange,
  onClose,
  onSave,
}) => {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '24px',
        borderRadius: '12px',
        width: '450px',
        maxWidth: '90%',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          Analytics DB 병원 매핑
        </h3>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
          현재 병원: <strong>{selectedHospital}</strong>
        </p>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
            새 DB의 병원 UUID *
          </label>
          <input
            type="text"
            value={newAnalyticsId}
            onChange={(e) => onAnalyticsIdChange(e.target.value)}
            placeholder="예: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          />
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            Supabase의 hospitals 테이블에서 해당 병원의 id를 입력하세요
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={onSave}
            disabled={saving || !newAnalyticsId.trim()}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#fff',
              backgroundColor: saving || !newAnalyticsId.trim() ? '#9ca3af' : '#10b981',
              border: 'none',
              borderRadius: '6px',
              cursor: saving || !newAnalyticsId.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsMappingModal;
