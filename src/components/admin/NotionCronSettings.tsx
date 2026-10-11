import React, { useState, useEffect } from 'react';
import { adminAPI, NotionCronDatabase } from '../../utils/adminApi';

const NotionCronSettings: React.FC = () => {
  const [databases, setDatabases] = useState<NotionCronDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  // 새 DB 추가 폼 상태
  const [newDb, setNewDb] = useState({
    db_type: 'blog' as 'blog' | 'upload',
    database_id: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    description: '',
  });

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getNotionCronDatabases();
      setDatabases(data);
    } catch (error) {
      console.error('Failed to load databases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newDb.database_id || !newDb.month) {
      alert('DB ID와 월을 입력해주세요');
      return;
    }

    try {
      await adminAPI.addNotionCronDatabase(newDb);
      setShowAddForm(false);
      setNewDb({
        db_type: 'blog',
        database_id: '',
        month: new Date().toISOString().slice(0, 7),
        description: '',
      });
      loadDatabases();
    } catch (error: any) {
      const dbTypeName = newDb.db_type === 'blog' ? '블로그' : '업로드';
      if (error.message?.includes('409') || error.message?.includes('이미 등록')) {
        alert(`중복 등록: ${newDb.month}에 "${dbTypeName}" 타입이 이미 존재합니다.\n기존 항목을 삭제하거나 다른 월을 선택해주세요.`);
      } else {
        alert(error.message || '추가 실패');
      }
    }
  };

  const handleToggleActive = async (db: NotionCronDatabase) => {
    try {
      await adminAPI.updateNotionCronDatabase(db.id, { is_active: !db.is_active });
      loadDatabases();
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await adminAPI.deleteNotionCronDatabase(id);
      loadDatabases();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleTestCron = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const result = await adminAPI.testNotionDeadlineCron();
      setTestResult(result);
    } catch (error: any) {
      setTestResult({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    return `${year}년 ${parseInt(m)}월`;
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>;
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>노션 알림 DB 설정</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleTestCron}
            disabled={testing}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: testing ? 'not-allowed' : 'pointer',
              opacity: testing ? 0.6 : 1,
              fontSize: '13px',
            }}
          >
            {testing ? '테스트 중...' : '알림 테스트'}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {showAddForm ? '취소' : '+ 새 DB 추가'}
          </button>
        </div>
      </div>

      {/* 테스트 결과 */}
      {testResult && (
        <div
          style={{
            padding: '12px',
            marginBottom: '16px',
            backgroundColor: testResult.error ? '#fef2f2' : '#f0fdf4',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          {testResult.error ? (
            <span style={{ color: '#dc2626' }}>오류: {testResult.error}</span>
          ) : (
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px', color: '#166534' }}>테스트 완료</div>
              <div>블로그 마감 초과: {testResult.blogDeadlineOverdue}건</div>
              <div>블로그 검토 지연: {testResult.blogReviewOverdue}건</div>
              <div>업로드 마감 초과: {testResult.uploadOverdue}건</div>
              <div>Slack 전송: {testResult.slackSent ? '성공' : '없음'}</div>
            </div>
          )}
        </div>
      )}

      {/* 추가 폼 */}
      {showAddForm && (
        <div
          style={{
            padding: '16px',
            marginBottom: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                DB 타입
              </label>
              <select
                value={newDb.db_type}
                onChange={(e) => setNewDb({ ...newDb, db_type: e.target.value as 'blog' | 'upload' })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="blog">블로그 작업</option>
                <option value="upload">업로드 페이지</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>월</label>
              <input
                type="month"
                value={newDb.month}
                onChange={(e) => setNewDb({ ...newDb, month: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
              노션 Database ID
            </label>
            <input
              type="text"
              value={newDb.database_id}
              onChange={(e) => setNewDb({ ...newDb, database_id: e.target.value })}
              placeholder="예: 2d57117064f48093b06ce72551786d87"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
              설명 (선택)
            </label>
            <input
              type="text"
              value={newDb.description}
              onChange={(e) => setNewDb({ ...newDb, description: e.target.value })}
              placeholder="예: 2026년 1월 블로그 작업"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
          <button
            onClick={handleAdd}
            style={{
              padding: '8px 20px',
              backgroundColor: '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            추가
          </button>
        </div>
      )}

      {/* DB 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {databases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>등록된 DB가 없습니다</div>
        ) : (
          databases.map((db) => (
            <div
              key={db.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: db.is_active ? '#f0fdf4' : '#f8fafc',
                borderRadius: '8px',
                border: `1px solid ${db.is_active ? '#bbf7d0' : '#e2e8f0'}`,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      backgroundColor: db.db_type === 'blog' ? '#dbeafe' : '#fef3c7',
                      color: db.db_type === 'blog' ? '#1e40af' : '#92400e',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    {db.db_type === 'blog' ? '블로그' : '업로드'}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{formatMonth(db.month)}</span>
                  {db.is_active && (
                    <span
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#22c55e',
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '10px',
                      }}
                    >
                      활성
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {db.description || db.database_id.slice(0, 20) + '...'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleToggleActive(db)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: db.is_active ? '#f1f5f9' : '#22c55e',
                    color: db.is_active ? '#64748b' : '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  {db.is_active ? '비활성화' : '활성화'}
                </button>
                <button
                  onClick={() => handleDelete(db.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>
        * 매일 오전 9시에 활성화된 DB를 기준으로 마감 초과/검토 지연 알림이 Slack으로 전송됩니다.
      </div>
    </div>
  );
};

export default NotionCronSettings;
