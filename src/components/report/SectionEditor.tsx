/**
 * 보고서 섹션 에디터 컴포넌트
 */

import React from 'react';
import type { ReportSection } from '../../types/report';

interface SectionEditorProps {
  section: ReportSection | null;
  generatingSection: string | null;
  onContentChange: (id: string, content: string) => void;
  onGenerateDraft: (id: string) => void;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  generatingSection,
  onContentChange,
  onGenerateDraft,
}) => {
  if (!section) {
    return (
      <div>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb', minHeight: '600px' }}>
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
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb', minHeight: '600px' }}>
        <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
            {section.title}
          </h3>
          {section.generated && (
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              아래 내용을 자유롭게 수정할 수 있습니다
            </p>
          )}
        </div>

        {!section.enabled ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              이 섹션을 사용하려면 먼저 체크박스를 선택하세요
            </p>
          </div>
        ) : !section.generated ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
              초안을 생성하여 시작하세요
            </p>
            <button
              onClick={() => onGenerateDraft(section.id)}
              disabled={generatingSection === section.id}
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#fff',
                backgroundColor: generatingSection === section.id ? '#9ca3af' : '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                cursor: generatingSection === section.id ? 'not-allowed' : 'pointer',
              }}
            >
              {generatingSection === section.id ? '생성 중...' : '초안 생성'}
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
                  value={section.contentHtml}
                  onChange={(e) => onContentChange(section.id, e.target.value)}
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
                  dangerouslySetInnerHTML={{ __html: section.contentHtml }}
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
      </div>
    </div>
  );
};

export default SectionEditor;
