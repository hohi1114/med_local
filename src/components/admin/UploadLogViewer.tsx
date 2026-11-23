import React, { useCallback, useEffect, useState } from 'react';
import { adminAPI, UploadLog, UploadLogFile, UploadLogStep } from '../../utils/adminApi';

const STATUS_LABELS: Record<UploadLog['status'], { label: string; color: string }> = {
  failed: { label: '실패', color: '#dc2626' },
  empty: { label: '0행 업로드', color: '#ea580c' },
  warning: { label: '일부 파일 0행', color: '#ca8a04' },
  success: { label: '정상', color: '#16a34a' },
};
const PROBLEM_STATUSES = 'failed,empty,warning';
const cellStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid #e2e8f0',
  fontSize: '12px',
  textAlign: 'left',
  verticalAlign: 'top',
};

const formatTime = (iso: string) => new Date(iso).toLocaleString('ko-KR');

const describeFile = (file: UploadLogFile): string => {
  if (file.missing_required?.length) return `필수 컬럼 없음: ${file.missing_required.join(', ')}`;
  if (file.error) return file.error;
  return file.header_row ? `헤더 ${file.header_row}행 정상` : '검사 안 함';
};

const FileDetail: React.FC<{ file: UploadLogFile }> = ({ file }) => (
  <li style={{ marginBottom: '6px' }}>
    <strong>{file.file_name}</strong> ({Math.round(file.file_size / 1024)}KB) — {describeFile(file)}
    {file.missing_optional && file.missing_optional.length > 0 && (
      <div style={{ color: '#64748b' }}>선택 컬럼 없음: {file.missing_optional.join(', ')}</div>
    )}
    {file.found_headers && file.found_headers.length > 0 && (
      <div style={{ color: '#64748b' }}>파일의 실제 헤더: {file.found_headers.join(' | ')}</div>
    )}
  </li>
);

const describeEmptyFields = (step: UploadLogStep): string =>
  Object.entries(step.empty_fields)
    .map(([field, count]) => `${field} ${count}건`)
    .join(', ');

const StepDetail: React.FC<{ step: UploadLogStep }> = ({ step }) => (
  <div style={{ marginBottom: '10px', color: step.ok ? '#0f172a' : '#dc2626' }}>
    <div>
      <strong>{step.file_role ?? step.kind}</strong> · {step.step} · {step.ok ? `${step.rows ?? '-'}행` : '실패'} ·{' '}
      {step.duration_ms}ms
    </div>
    {step.error && <div>오류: {step.error}</div>}
    {describeEmptyFields(step) && <div style={{ color: '#64748b' }}>빈 값: {describeEmptyFields(step)}</div>}
    {step.files.length > 0 && (
      <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
        {step.files.map((file, index) => <FileDetail key={index} file={file} />)}
      </ul>
    )}
  </div>
);

const LogRow: React.FC<{ log: UploadLog }> = ({ log }) => {
  const [open, setOpen] = useState(false);
  const status = STATUS_LABELS[log.status];
  return (
    <>
      <tr onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        <td style={cellStyle}>{formatTime(log.created_at)}</td>
        <td style={cellStyle}>{log.hospital_name ?? log.user_id}</td>
        <td style={cellStyle}>{log.emr_type}</td>
        <td style={{ ...cellStyle, color: status.color, fontWeight: 600 }}>{status.label}</td>
        <td style={cellStyle}>{log.summary}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={5} style={{ ...cellStyle, backgroundColor: '#f8fafc' }}>
            {log.steps.map((step, index) => <StepDetail key={index} step={step} />)}
            <div style={{ color: '#64748b' }}>
              앱 버전 {log.app_version ?? '-'} · 소요 {log.duration_ms ?? '-'}ms · 백엔드 응답{' '}
              {JSON.stringify(log.backend_response)}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const UploadLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [problemsOnly, setProblemsOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setLogs(await adminAPI.getUploadLogs(problemsOnly ? PROBLEM_STATUSES : ''));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '로그를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [problemsOnly]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ margin: '0 0 12px', fontSize: '18px' }}>원내 데이터 업로드 로그</h2>
      <label style={{ fontSize: '13px', marginRight: '12px' }}>
        <input type="checkbox" checked={problemsOnly} onChange={(e) => setProblemsOnly(e.target.checked)} /> 문제 있는
        업로드만 보기
      </label>
      <button onClick={loadLogs} disabled={loading}>새로고침</button>
      {error && <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>}
      {!loading && !error && logs.length === 0 && <p style={{ fontSize: '13px' }}>기록된 로그가 없습니다.</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
        <thead>
          <tr>
            {['시각', '병원', 'EMR', '상태', '원인 요약 (행을 누르면 상세)'].map((title) => (
              <th key={title} style={{ ...cellStyle, color: '#64748b' }}>{title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => <LogRow key={log.id} log={log} />)}
        </tbody>
      </table>
    </div>
  );
};

export default UploadLogViewer;
