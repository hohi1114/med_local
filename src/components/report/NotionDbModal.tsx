/**
 * Notion Database 추가 모달
 */

import React from 'react';

interface NotionDbModalProps {
  show: boolean;
  newDbId: string;
  newDbName: string;
  adding: boolean;
  onDbIdChange: (value: string) => void;
  onDbNameChange: (value: string) => void;
  onClose: () => void;
  onAdd: () => void;
}

export const NotionDbModal: React.FC<NotionDbModalProps> = ({
  show,
  newDbId,
  newDbName,
  adding,
  onDbIdChange,
  onDbNameChange,
  onClose,
  onAdd,
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
        width: '400px',
        maxWidth: '90%',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          Notion Database 추가
        </h3>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
            Database ID *
          </label>
          <input
            type="text"
            value={newDbId}
            onChange={(e) => onDbIdChange(e.target.value)}
            placeholder="예: 2ca7117064f4807d9e97..."
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
            Database 이름 (선택)
          </label>
          <input
            type="text"
            value={newDbName}
            onChange={(e) => onDbNameChange(e.target.value)}
            placeholder="예: 마케팅 캘린더"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          />
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            비워두면 Notion에서 자동으로 가져옵니다
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
            onClick={onAdd}
            disabled={adding || !newDbId.trim()}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#fff',
              backgroundColor: adding || !newDbId.trim() ? '#9ca3af' : '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              cursor: adding || !newDbId.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {adding ? '추가 중...' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotionDbModal;
