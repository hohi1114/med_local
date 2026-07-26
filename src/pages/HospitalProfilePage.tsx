import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { getCookie } from '../utils/api/cookie';
import { API_BASE_URL as API_URL } from '../utils/api/config';

interface Hospital {
  id: string;
  name: string;
  naver_place_id: string;
}

interface Profile {
  id: string;
  hospital_id: string;
  department: string;
  positioning: string;
  strengths: string[];
  equipments: string[];  // 보유기기
  naver_place_url?: string;  // 네이버 플레이스 URL
  is_active: boolean;
  version: number;
  created_at: string;
}

export const HospitalProfilePage: React.FC = () => {
  const navigate = useNavigate();

  // 병원 목록
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');

  // 프로필 폼
  const [departments, setDepartments] = useState<string[]>(['']);
  const [positioning, setPositioning] = useState<string>('');
  const [strengths, setStrengths] = useState<string[]>(['']);
  const [equipments, setEquipments] = useState<string[]>(['']);  // 보유기기
  const [naverPlaceUrl, setNaverPlaceUrl] = useState<string>('');  // 네이버 플레이스 URL

  // 기존 프로필
  const [existingProfiles, setExistingProfiles] = useState<Profile[]>([]);

  // UI 상태
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 리뷰 생성 상태
  const [generateCount, setGenerateCount] = useState<number>(30);
  const [lengthDistribution, setLengthDistribution] = useState({ short: 20, middle: 60, long: 20 });
  const [availableSpecialties, setAvailableSpecialties] = useState<{ specialty: string; koreanName: string; total: number; short: number; middle: number; long: number }[]>([]);
  const [specialtyRatios, setSpecialtyRatios] = useState<{ specialty: string; koreanName: string; ratio: number }[]>([]);
  const [additionalPrompt, setAdditionalPrompt] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [generatedReviews, setGeneratedReviews] = useState<{ text: string; lengthType: string; referenceSample?: string }[]>([]);
  const [usedSamples, setUsedSamples] = useState<{ short: string[]; middle: string[]; long: string[] } | null>(null);

  // 인증 체크
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getCookie('accessToken');
      if (!token) {
        navigate('/admin/login');
      }
    };
    checkAuth();
  }, [navigate]);

  // 병원 목록 로드 + specialty 목록 로드
  useEffect(() => {
    fetchHospitals();
    fetchSpecialties();
  }, []);

  // specialty 목록 조회 (샘플 개수 파악용)
  const fetchSpecialties = async () => {
    try {
      const response = await fetch(`${API_URL}/reviews/specialties`);
      const data = await response.json();
      if (data.success) {
        setAvailableSpecialties(data.specialties);
      }
    } catch (error) {
      console.error('Failed to fetch specialties:', error);
    }
  };

  // 한글 department → 영문 specialty 매핑 (DB에 저장된 값과 일치)
  const departmentToSpecialty: Record<string, string> = {
    '피부과': 'dermatology',
    '정형외과': 'orthopedics',
    '내과': 'internal',
    '외과': 'surgery',
    '성형외과': 'plastic',
    '치과': 'dentistry',
    '안과': 'ophthalmology',
    '이비인후과': 'ent',
    '산부인과': 'obgyn',
    '소아과': 'pediatrics',
    '비뇨기과': 'urology',
    '신경과': 'neurology',
    '재활의학과': 'rehabilitation',
    '한의원': 'korean_medicine',
    '정신건강의학과': 'psychiatry',
    '365의원': '365 hospital',
  };

  // 선택된 병원 변경 시 프로필 로드
  useEffect(() => {
    if (selectedHospitalId) {
      fetchProfiles(selectedHospitalId);
    } else {
      setExistingProfiles([]);
    }
  }, [selectedHospitalId]);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/profile/hospitals`);
      const data = await response.json();
      if (data.success) {
        setHospitals(data.hospitals);
      }
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
      setMessage({ type: 'error', text: '병원 목록을 불러오는데 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async (hospitalId: string) => {
    try {
      const response = await fetch(`${API_URL}/profile/all/${hospitalId}`);
      const data = await response.json();
      if (data.success) {
        setExistingProfiles(data.profiles);

        // 프로필에서 department 목록 추출하여 specialtyRatios 설정
        const allDepartments: string[] = [];
        data.profiles.forEach((profile: Profile) => {
          const depts = profile.department.split(',').map((d: string) => d.trim()).filter((d: string) => d);
          depts.forEach((dept: string) => {
            if (!allDepartments.includes(dept)) {
              allDepartments.push(dept);
            }
          });
        });

        // 프로필의 department를 specialty로 매핑하여 비율 설정
        if (allDepartments.length > 0) {
          const equalRatio = Math.floor(100 / allDepartments.length);
          const remainder = 100 - (equalRatio * allDepartments.length);
          setSpecialtyRatios(allDepartments.map((dept, idx) => ({
            specialty: departmentToSpecialty[dept] || dept,
            koreanName: dept,
            ratio: equalRatio + (idx === 0 ? remainder : 0),
          })));
        } else {
          setSpecialtyRatios([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  // 부서 관련 핸들러
  const handleAddDepartment = () => {
    setDepartments([...departments, '']);
  };

  const handleRemoveDepartment = (index: number) => {
    if (departments.length > 1) {
      setDepartments(departments.filter((_, i) => i !== index));
    }
  };

  const handleDepartmentChange = (index: number, value: string) => {
    const newDepartments = [...departments];
    newDepartments[index] = value;
    setDepartments(newDepartments);
  };

  // 강점 관련 핸들러
  const handleAddStrength = () => {
    setStrengths([...strengths, '']);
  };

  const handleRemoveStrength = (index: number) => {
    if (strengths.length > 1) {
      setStrengths(strengths.filter((_, i) => i !== index));
    }
  };

  const handleStrengthChange = (index: number, value: string) => {
    const newStrengths = [...strengths];
    newStrengths[index] = value;
    setStrengths(newStrengths);
  };

  // 보유기기 관련 핸들러
  const handleAddEquipment = () => {
    setEquipments([...equipments, '']);
  };

  const handleRemoveEquipment = (index: number) => {
    if (equipments.length > 1) {
      setEquipments(equipments.filter((_, i) => i !== index));
    }
  };

  const handleEquipmentChange = (index: number, value: string) => {
    const newEquipments = [...equipments];
    newEquipments[index] = value;
    setEquipments(newEquipments);
  };

  const handleSave = async () => {
    // 유효성 검사
    if (!selectedHospitalId) {
      setMessage({ type: 'error', text: '병원을 선택해주세요.' });
      return;
    }
    const validDepartments = departments.filter(d => d.trim());
    if (validDepartments.length === 0) {
      setMessage({ type: 'error', text: '부서를 최소 1개 이상 입력해주세요.' });
      return;
    }
    if (!positioning.trim()) {
      setMessage({ type: 'error', text: '포지셔닝을 입력해주세요.' });
      return;
    }
    const validStrengths = strengths.filter(s => s.trim());
    if (validStrengths.length === 0) {
      setMessage({ type: 'error', text: '강점을 최소 1개 이상 입력해주세요.' });
      return;
    }
    const validEquipments = equipments.filter(e => e.trim());

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/profile/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: selectedHospitalId,
          departments: validDepartments,  // 배열로 전송
          positioning: positioning.trim(),
          strengths: validStrengths,
          equipments: validEquipments,  // 보유기기
          naverPlaceUrl: naverPlaceUrl.trim() || undefined,  // 네이버 플레이스 URL
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: '프로필이 저장되었습니다.' });
        // 폼 초기화
        setDepartments(['']);
        setPositioning('');
        setStrengths(['']);
        setEquipments(['']);
        setNaverPlaceUrl('');
        // 프로필 목록 새로고침
        fetchProfiles(selectedHospitalId);
      } else {
        setMessage({ type: 'error', text: data.error || '저장에 실패했습니다.' });
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      setMessage({ type: 'error', text: '저장 중 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditProfile = (profile: Profile) => {
    // department가 콤마로 구분된 문자열이면 배열로 변환
    const deptArray = profile.department
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0);
    setDepartments(deptArray.length > 0 ? deptArray : ['']);
    setPositioning(profile.positioning);
    setStrengths(profile.strengths.length > 0 ? profile.strengths : ['']);
    setEquipments(profile.equipments && profile.equipments.length > 0 ? profile.equipments : ['']);
    setNaverPlaceUrl(profile.naver_place_url || '');
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('이 프로필을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_URL}/profile/${profileId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: '프로필이 삭제되었습니다.' });
        fetchProfiles(selectedHospitalId);
      } else {
        setMessage({ type: 'error', text: data.error || '삭제에 실패했습니다.' });
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
      setMessage({ type: 'error', text: '삭제 중 오류가 발생했습니다.' });
    }
  };

  // 리뷰 생성
  const handleGenerateReviews = async () => {
    if (!selectedHospitalId) {
      setMessage({ type: 'error', text: '병원을 선택해주세요.' });
      return;
    }

    setGenerating(true);
    setMessage(null);
    setGeneratedReviews([]);
    setUsedSamples(null);

    try {
      const response = await fetch(`${API_URL}/reviews/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: selectedHospitalId,
          count: generateCount,
          lengthDistribution,
          specialtyRatios: specialtyRatios.filter(s => s.ratio > 0),  // 비율이 0보다 큰 것만 전송
          additionalPrompt: additionalPrompt.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedReviews(data.reviews);
        setUsedSamples(data.usedSamples);  // 사용된 샘플 저장
        setMessage({ type: 'success', text: `${data.count}개의 리뷰가 생성되었습니다.` });
      } else {
        setMessage({ type: 'error', text: data.error || '리뷰 생성에 실패했습니다.' });
      }
    } catch (error) {
      console.error('Failed to generate reviews:', error);
      setMessage({ type: 'error', text: '리뷰 생성 중 오류가 발생했습니다.' });
    } finally {
      setGenerating(false);
    }
  };

  // 생성된 리뷰 복사
  const handleCopyReviews = () => {
    const text = generatedReviews.map(r => r.text).join('\n\n');
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: '리뷰가 클립보드에 복사되었습니다.' });
  };

  // Excel 다운로드
  const handleDownloadExcel = () => {
    if (generatedReviews.length === 0) {
      setMessage({ type: 'error', text: '다운로드할 리뷰가 없습니다.' });
      return;
    }

    // 프로필에서 네이버 플레이스 URL 가져오기
    const profileUrl = existingProfiles.length > 0 ? existingProfiles[0].naver_place_url || '' : '';

    // 엑셀 데이터 생성
    const excelData = generatedReviews.map((review, idx) => ({
      '순번': idx + 1,
      '총 수량': 1,
      '일 수량': 1,
      '이미지 건당 개수': 0,
      '플레이스 주소': profileUrl,
      '발행 시작 날짜 지정 (선택)': '',
      '발행 요일 지정 (선택)': '',
      '발행 시간대 지정 (선택)': '',
      '이미지 랜덤여부(0:순서대로, 1:랜덤)(선택)': 0,
      '방문 일자 범위 (선택)': Math.floor(Math.random() * 3),  // 0, 1, 2 중 랜덤
      '가이드 라인 (선택)': '',
      '원고 직접 등록 (선택)': review.text,
    }));

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { wch: 6 },   // 순번
      { wch: 8 },   // 총 수량
      { wch: 8 },   // 일 수량
      { wch: 14 },  // 이미지 건당 개수
      { wch: 50 },  // 플레이스 주소
      { wch: 22 },  // 발행 시작 날짜 지정
      { wch: 18 },  // 발행 요일 지정
      { wch: 18 },  // 발행 시간대 지정
      { wch: 28 },  // 이미지 랜덤여부
      { wch: 14 },  // 방문 일자 범위
      { wch: 14 },  // 가이드 라인 입력
      { wch: 80 },  // 원고 직접 등록
    ];

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '리뷰');

    // 파일명 생성 (병원명 + 날짜)
    const hospitalName = hospitals.find(h => h.id === selectedHospitalId)?.name || 'hospital';
    const today = new Date().toISOString().split('T')[0];
    const fileName = `${hospitalName}_리뷰_${today}.xlsx`;

    // 다운로드
    XLSX.writeFile(workbook, fileName);
    setMessage({ type: 'success', text: `${fileName} 다운로드 완료` });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #334155',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/admin/review-coaching')}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #475569',
              color: '#94a3b8',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ← 리뷰 코칭으로 돌아가기
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>병원 프로필 관리</h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 메시지 */}
        {message && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '24px',
            borderRadius: '8px',
            backgroundColor: message.type === 'success' ? '#065f46' : '#7f1d1d',
            color: '#fff',
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* 왼쪽: 프로필 입력 폼 */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #334155',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>프로필 입력</h2>

            {/* 병원 선택 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                병원 선택 *
              </label>
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                }}
              >
                <option value="">병원을 선택하세요</option>
                {hospitals.map(hospital => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 부서 (여러 개 입력 가능) */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                부서 (Department) *
              </label>
              {departments.map((dept, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={dept}
                    onChange={(e) => handleDepartmentChange(index, e.target.value)}
                    placeholder={`부서 ${index + 1} (예: 정형외과)`}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      fontSize: '14px',
                    }}
                  />
                  {departments.length > 1 && (
                    <button
                      onClick={() => handleRemoveDepartment(index)}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#7f1d1d',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddDepartment}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1e40af',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                + 부서 추가
              </button>
            </div>

            {/* 포지셔닝 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                포지셔닝 (Positioning) *
              </label>
              <textarea
                value={positioning}
                onChange={(e) => setPositioning(e.target.value)}
                placeholder="예: 관절·척추 비수술 전문 병원, 환자 중심 1:1 맞춤 진료"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* 강점 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                강점 (Strengths) *
              </label>
              {strengths.map((strength, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={strength}
                    onChange={(e) => handleStrengthChange(index, e.target.value)}
                    placeholder={`강점 ${index + 1}`}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      fontSize: '14px',
                    }}
                  />
                  {strengths.length > 1 && (
                    <button
                      onClick={() => handleRemoveStrength(index)}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#7f1d1d',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddStrength}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1e40af',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                + 강점 추가
              </button>
            </div>

            {/* 네이버 플레이스 URL */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                네이버 플레이스 URL
              </label>
              <input
                type="text"
                value={naverPlaceUrl}
                onChange={(e) => setNaverPlaceUrl(e.target.value)}
                placeholder="예: https://m.place.naver.com/hospital/1234567890"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Excel 출력 시 병원 URL로 사용됩니다.
              </p>
            </div>

            {/* 보유기기 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                보유기기 (Equipments)
              </label>
              {equipments.map((equipment, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={equipment}
                    onChange={(e) => handleEquipmentChange(index, e.target.value)}
                    placeholder={`보유기기 ${index + 1} (예: 체외충격파, MRI)`}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      fontSize: '14px',
                    }}
                  />
                  {equipments.length > 1 && (
                    <button
                      onClick={() => handleRemoveEquipment(index)}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#7f1d1d',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddEquipment}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1e40af',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                + 보유기기 추가
              </button>
            </div>

            {/* 저장 버튼 */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: saving ? '#475569' : '#059669',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? '저장 중...' : '프로필 저장'}
            </button>
          </div>

          {/* 오른쪽: 기존 프로필 목록 */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #334155',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>
              저장된 프로필 {existingProfiles.length > 0 && `(${existingProfiles.length})`}
            </h2>

            {!selectedHospitalId ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>
                병원을 선택하면 저장된 프로필이 표시됩니다.
              </p>
            ) : existingProfiles.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>
                저장된 프로필이 없습니다.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {existingProfiles.map(profile => (
                  <div
                    key={profile.id}
                    style={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid #334155',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <span style={{
                          backgroundColor: '#1e40af',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}>
                          {profile.department}
                        </span>
                        <span style={{
                          marginLeft: '8px',
                          color: '#64748b',
                          fontSize: '12px',
                        }}>
                          v{profile.version}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEditProfile(profile)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#475569',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteProfile(profile.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#7f1d1d',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>포지셔닝:</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{profile.positioning}</p>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>강점:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {profile.strengths.map((strength, idx) => (
                          <span
                            key={idx}
                            style={{
                              backgroundColor: '#334155',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}
                          >
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>

                    {profile.equipments && profile.equipments.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>보유기기:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                          {profile.equipments.map((equipment, idx) => (
                            <span
                              key={idx}
                              style={{
                                backgroundColor: '#1e3a5f',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                              }}
                            >
                              {equipment}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.naver_place_url && (
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>네이버 플레이스:</span>
                        <a
                          href={profile.naver_place_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'block',
                            marginTop: '4px',
                            fontSize: '12px',
                            color: '#60a5fa',
                            textDecoration: 'underline',
                            wordBreak: 'break-all',
                          }}
                        >
                          {profile.naver_place_url}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 리뷰 생성 섹션 */}
        <div style={{
          marginTop: '32px',
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #334155',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>리뷰 생성</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* 왼쪽: 생성 설정 */}
            <div>
              {/* 생성 개수 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                  생성 개수
                </label>
                <input
                  type="number"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Math.min(100, Math.max(1, Number(e.target.value))))}
                  min={1}
                  max={100}
                  style={{
                    width: '120px',
                    padding: '12px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '14px',
                  }}
                />
                <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '14px' }}>개 (최대 100개)</span>
              </div>

              {/* 샘플 리뷰 과별 비율 (프로필에 과가 있을 때만) */}
              {specialtyRatios.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                    샘플 리뷰 과별 비율 (%)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {specialtyRatios.map((item, index) => {
                      const specInfo = availableSpecialties.find(s => s.specialty === item.specialty);
                      return (
                        <div key={item.specialty} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <label style={{ fontSize: '13px', color: '#e2e8f0', minWidth: '80px' }}>
                            {item.koreanName}
                          </label>
                          <input
                            type="number"
                            value={item.ratio}
                            onChange={(e) => {
                              const newRatios = [...specialtyRatios];
                              newRatios[index].ratio = Number(e.target.value);
                              setSpecialtyRatios(newRatios);
                            }}
                            min={0}
                            max={100}
                            style={{
                              width: '60px',
                              padding: '8px',
                              backgroundColor: '#0f172a',
                              border: '1px solid #334155',
                              borderRadius: '6px',
                              color: '#e2e8f0',
                              fontSize: '14px',
                            }}
                          />
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            (샘플: {specInfo?.total || 0}개 - 짧:{specInfo?.short || 0}, 중:{specInfo?.middle || 0}, 긴:{specInfo?.long || 0})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                    합계: {specialtyRatios.reduce((sum, r) => sum + r.ratio, 0)}%
                    {specialtyRatios.reduce((sum, r) => sum + r.ratio, 0) !== 100 &&
                      <span style={{ color: '#ef4444' }}> (100%가 되어야 합니다)</span>
                    }
                  </p>
                </div>
              )}

              {/* 길이 분포 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                  길이 분포 (%)
                </label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b' }}>짧음</label>
                    <input
                      type="number"
                      value={lengthDistribution.short}
                      onChange={(e) => setLengthDistribution({ ...lengthDistribution, short: Number(e.target.value) })}
                      min={0}
                      max={100}
                      style={{
                        width: '60px',
                        padding: '8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '14px',
                        marginLeft: '8px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b' }}>중간</label>
                    <input
                      type="number"
                      value={lengthDistribution.middle}
                      onChange={(e) => setLengthDistribution({ ...lengthDistribution, middle: Number(e.target.value) })}
                      min={0}
                      max={100}
                      style={{
                        width: '60px',
                        padding: '8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '14px',
                        marginLeft: '8px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b' }}>긴</label>
                    <input
                      type="number"
                      value={lengthDistribution.long}
                      onChange={(e) => setLengthDistribution({ ...lengthDistribution, long: Number(e.target.value) })}
                      min={0}
                      max={100}
                      style={{
                        width: '60px',
                        padding: '8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '14px',
                        marginLeft: '8px',
                      }}
                    />
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  합계: {lengthDistribution.short + lengthDistribution.middle + lengthDistribution.long}%
                  {lengthDistribution.short + lengthDistribution.middle + lengthDistribution.long !== 100 &&
                    <span style={{ color: '#ef4444' }}> (100%가 되어야 합니다)</span>
                  }
                </p>
              </div>

              {/* 추가 프롬프트 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                  추가 지시사항 (선택)
                </label>
                <textarea
                  value={additionalPrompt}
                  onChange={(e) => setAdditionalPrompt(e.target.value)}
                  placeholder="예: 최근 리모델링해서 시설이 깨끗하다는 점을 강조해줘"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* 생성 버튼 */}
              <button
                onClick={handleGenerateReviews}
                disabled={generating || !selectedHospitalId}
                style={{
                  padding: '14px 32px',
                  backgroundColor: generating || !selectedHospitalId ? '#475569' : '#7c3aed',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: generating || !selectedHospitalId ? 'not-allowed' : 'pointer',
                }}
              >
                {generating ? '생성 중...' : '리뷰 생성하기'}
              </button>
            </div>

            {/* 오른쪽: 생성된 리뷰 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                  생성된 리뷰 {generatedReviews.length > 0 && `(${generatedReviews.length}개)`}
                </span>
                {generatedReviews.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleCopyReviews}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#1e40af',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      전체 복사
                    </button>
                    <button
                      onClick={handleDownloadExcel}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#059669',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Excel 다운로드
                    </button>
                  </div>
                )}
              </div>
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                backgroundColor: '#0f172a',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #334155',
              }}>
                {generatedReviews.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>
                    {generating ? '리뷰를 생성하고 있습니다...' : '생성된 리뷰가 여기에 표시됩니다.'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {generatedReviews.map((review, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px',
                          backgroundColor: '#1e293b',
                          borderRadius: '6px',
                          border: '1px solid #334155',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: review.lengthType === 'short' ? '#10B981' :
                                           review.lengthType === 'middle' ? '#F59E0B' : '#8B5CF6',
                            color: '#fff',
                          }}>
                            {review.lengthType === 'short' ? '짧음' : review.lengthType === 'middle' ? '중간' : '긴'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>#{idx + 1}</span>
                        </div>
                        {/* 참고샘플 표시 */}
                        {review.referenceSample && (
                          <div style={{
                            marginBottom: '8px',
                            padding: '8px',
                            backgroundColor: '#0f172a',
                            borderRadius: '4px',
                            borderLeft: '3px solid #64748b',
                          }}>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>참고샘플:</span>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>{review.referenceSample}</p>
                          </div>
                        )}
                        {/* 생성된 리뷰 */}
                        <div style={{
                          padding: '8px',
                          backgroundColor: '#0f172a',
                          borderRadius: '4px',
                          borderLeft: '3px solid #22c55e',
                        }}>
                          <span style={{ fontSize: '10px', color: '#22c55e' }}>생성결과:</span>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', lineHeight: 1.5 }}>{review.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 사용된 샘플 표시 (테스트용) */}
        {usedSamples && (
          <div style={{
            marginTop: '32px',
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #334155',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: '#f59e0b' }}>
              [테스트] 참고된 샘플 리뷰
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              {/* 짧은 샘플 */}
              <div>
                <h3 style={{ fontSize: '14px', color: '#10B981', marginBottom: '12px' }}>
                  짧은 리뷰 샘플 ({usedSamples.short.length}개)
                </h3>
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #334155',
                }}>
                  {usedSamples.short.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '12px' }}>샘플 없음</p>
                  ) : (
                    usedSamples.short.map((text, idx) => (
                      <div key={idx} style={{
                        padding: '8px',
                        marginBottom: '8px',
                        backgroundColor: '#1e293b',
                        borderRadius: '4px',
                        fontSize: '12px',
                        borderLeft: '3px solid #10B981',
                      }}>
                        <span style={{ color: '#64748b' }}>#{idx + 1}</span> {text}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 중간 샘플 */}
              <div>
                <h3 style={{ fontSize: '14px', color: '#F59E0B', marginBottom: '12px' }}>
                  중간 리뷰 샘플 ({usedSamples.middle.length}개)
                </h3>
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #334155',
                }}>
                  {usedSamples.middle.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '12px' }}>샘플 없음</p>
                  ) : (
                    usedSamples.middle.map((text, idx) => (
                      <div key={idx} style={{
                        padding: '8px',
                        marginBottom: '8px',
                        backgroundColor: '#1e293b',
                        borderRadius: '4px',
                        fontSize: '12px',
                        borderLeft: '3px solid #F59E0B',
                      }}>
                        <span style={{ color: '#64748b' }}>#{idx + 1}</span> {text}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 긴 샘플 */}
              <div>
                <h3 style={{ fontSize: '14px', color: '#8B5CF6', marginBottom: '12px' }}>
                  긴 리뷰 샘플 ({usedSamples.long.length}개)
                </h3>
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #334155',
                }}>
                  {usedSamples.long.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '12px' }}>샘플 없음</p>
                  ) : (
                    usedSamples.long.map((text, idx) => (
                      <div key={idx} style={{
                        padding: '8px',
                        marginBottom: '8px',
                        backgroundColor: '#1e293b',
                        borderRadius: '4px',
                        fontSize: '12px',
                        borderLeft: '3px solid #8B5CF6',
                      }}>
                        <span style={{ color: '#64748b' }}>#{idx + 1}</span> {text}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalProfilePage;
