import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAdminLogin } from '../utils/api/apis'

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await postAdminLogin(email, password);
      
      console.log('Login response:', response);
      console.log('is_admin:', response.is_admin);

      if (!response.is_admin) {
        throw new Error('Admin 권한이 없습니다');
      }

      console.log('Navigating to dashboard...');
      window.location.href = '/admin/dashboard';
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#111827',
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          관리자 로그인
        </h1>
        
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '24px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '8px',
            }}>
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
                backgroundColor: '#fff',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#9ca3af'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              required
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '8px',
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
                backgroundColor: '#fff',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#9ca3af'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#fff',
              backgroundColor: loading ? '#d1d5db' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#1f2937';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#374151';
              }
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;