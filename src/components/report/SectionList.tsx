/**
 * 보고서 섹션 목록 컴포넌트
 */

import React from 'react';
import type { ReportSection } from '../../types/report';

interface SectionListProps {
  sections: ReportSection[];
  selectedSectionId: string | null;
  generatingSections: Set<string>;
  onSelectSection: (id: string) => void;
  onToggleSection: (id: string) => void;
  onToggleIncludeInPdf: (id: string) => void;
  onGenerateDraft: (id: string) => void;
  onGeneratePdf: () => void;
}

export const SectionList: React.FC<SectionListProps> = ({
  sections,
  selectedSectionId,
  generatingSections,
  onSelectSection,
  onToggleSection,
  onToggleIncludeInPdf,
  onGenerateDraft,
  onGeneratePdf,
}) => {
  return (
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
              onClick={() => onSelectSection(section.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={section.enabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSection(section.id);
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
                        onGenerateDraft(section.id);
                      }}
                      disabled={generatingSections.has(section.id)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#fff',
                        backgroundColor: generatingSections.has(section.id) ? '#9ca3af' : '#3b82f6',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: generatingSections.has(section.id) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {generatingSections.has(section.id) ? '생성 중...' : '초안 생성'}
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
                            onToggleIncludeInPdf(section.id);
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
            onClick={onGeneratePdf}
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
  );
};

export default SectionList;
