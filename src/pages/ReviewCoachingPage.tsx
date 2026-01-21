import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCookie } from '../utils/api/cookie';

interface SavedPlace {
  id: string;
  naver_place_id: string;
  url: string;
  name: string | null;
  specialty: string | null;
  created_at: string;
}

interface NaverReview {
  externalId: string;
  reviewText: string;
}

interface PlaceInput {
  id: string;
  url: string;
  name: string;
  specialty: string;
  naverPlaceId: string;  // 네이버 place ID (크롤링 결과에서 가져옴)
  status: 'idle' | 'loading' | 'success' | 'error';
  reviews: NaverReview[];
  error?: string;
}

interface CuratedReview extends NaverReview {
  placeId: string;
  placeName: string;
  categories: string[];  // 중복 선택 지원
  specialty: string;
  lengthType: string;
  cleanedText?: string;  // 정제된 텍스트 (미리보기용)
  isCleaningInProgress?: boolean;  // 정제 중 상태
}

// 리뷰 텍스트 길이에 따른 자동 분류
// 16자 미만: short, 16~99자: middle, 100자 이상: long
const getAutoLengthType = (text: string): string => {
  const len = text.length;
  if (len < 16) return 'short';
  if (len < 100) return 'middle';
  return 'long';
};

const LENGTH_OPTIONS = [
  { value: 'short', label: '짧음', color: '#10B981' },
  { value: 'middle', label: '중간', color: '#F59E0B' },
  { value: 'long', label: '김', color: '#8B5CF6' },
];

const SPECIALTY_OPTIONS = [
  { value: '', label: '과 선택' },
  { value: 'orthopedics', label: '정형외과' },
  { value: 'neurology', label: '신경과' },
  { value: '365 hospital', label: '365의원' },
  { value: 'dermatology', label: '피부과' },
  { value: 'internal', label: '내과' },
  { value: 'dentistry', label: '치과' },
  { value: 'ophthalmology', label: '안과' },
  { value: 'ent', label: '이비인후과' },
  { value: 'obgyn', label: '산부인과' },
  { value: 'pediatrics', label: '소아과' },
  { value: 'psychiatry', label: '정신건강의학과' },
  { value: 'plastic', label: '성형외과' },
  { value: 'rehabilitation', label: '재활의학과' },
  { value: 'urology', label: '비뇨의학과' },
  { value: 'other', label: '기타' },
];

const CATEGORY_OPTIONS = [
  { value: 'friendly', label: '서비스(친절함)', color: '#3B82F6' },
  { value: 'wait_time', label: '치료효과', color: '#10B981' },
  { value: 'treatment', label: '시설(주차)', color: '#8B5CF6' },
  { value: 'facility', label: '가격(합리적)', color: '#F59E0B' },
  { value: 'price', label: '의료진 언급', color: '#EF4444' },
  { value: 'other', label: '기타', color: '#6B7280' },
];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const ReviewCoachingPage: React.FC = () => {
  const navigate = useNavigate();

  // Place URL 입력 관리
  const [placeInputs, setPlaceInputs] = useState<PlaceInput[]>([
    { id: '1', url: '', name: '', specialty: '', naverPlaceId: '', status: 'idle', reviews: [] }
  ]);
  // 리뷰 범위 지정 (1-100, 101-200 등)
  const [startIndex, setStartIndex] = useState(1);
  const [endIndex, setEndIndex] = useState(100);
  const [loadingPlaces, setLoadingPlaces] = useState(true);

  // 큐레이션된 리뷰
  const [curatedReviews, setCuratedReviews] = useState<CuratedReview[]>([]);

  // 자동 카테고리 분류 상태
  const [autoCategorizingAll, setAutoCategorizingAll] = useState(false);

  // 저장된 리뷰 조회 관련 상태
  const [savedReviews, setSavedReviews] = useState<any[]>([]);
  const [loadingSavedReviews, setLoadingSavedReviews] = useState(false);
  const [savedReviewFilter, setSavedReviewFilter] = useState({
    hospital: 'all',  // 'all' 또는 hospital_id
    category: 'all',  // 'all' 또는 카테고리 값
    length: 'all',    // 'all' 또는 길이 타입
    specialty: 'all', // 'all' 또는 과 값
  });

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

  // DB에서 저장된 Place URL 불러오기
  useEffect(() => {
    const loadSavedPlaces = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/reviews/places`);
        const data = await response.json();

        if (data.success && data.places.length > 0) {
          const loadedPlaces: PlaceInput[] = data.places.map((p: SavedPlace) => ({
            id: p.id,
            url: p.url,
            name: p.name || '',
            specialty: p.specialty || '',
            naverPlaceId: p.naver_place_id || '',
            status: 'idle' as const,
            reviews: [],
          }));
          setPlaceInputs(loadedPlaces);
        }
      } catch (error) {
        console.error('Failed to load saved places:', error);
      } finally {
        setLoadingPlaces(false);
      }
    };

    loadSavedPlaces();
  }, []);

  // Place URL 추가
  const addPlaceInput = () => {
    const newId = String(Date.now());
    setPlaceInputs([...placeInputs, { id: newId, url: '', name: '', specialty: '', naverPlaceId: '', status: 'idle', reviews: [] }]);
  };

  // Place URL 삭제 (DB에서도 삭제)
  const removePlaceInput = async (id: string) => {
    if (placeInputs.length > 1) {
      setPlaceInputs(placeInputs.filter(p => p.id !== id));
      // DB에서도 삭제 시도
      try {
        await fetch(`${API_BASE_URL}/reviews/places/${id}`, { method: 'DELETE' });
      } catch (error) {
        console.error('Failed to delete place from DB:', error);
      }
    }
  };

  // Place URL 업데이트
  const updatePlaceUrl = (id: string, url: string) => {
    setPlaceInputs(placeInputs.map(p =>
      p.id === id ? { ...p, url } : p
    ));
  };

  // Place specialty 업데이트
  const updatePlaceSpecialty = (id: string, specialty: string) => {
    setPlaceInputs(placeInputs.map(p =>
      p.id === id ? { ...p, specialty } : p
    ));
  };

  // Place URL DB에 저장 (blur 이벤트에서 호출)
  const savePlaceToDb = async (url: string, name?: string, specialty?: string) => {
    if (!url) return;
    try {
      await fetch(`${API_BASE_URL}/reviews/places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name, specialty }),
      });
    } catch (error) {
      console.error('Failed to save place to DB:', error);
    }
  };

  // 단일 Place 크롤링
  const crawlPlace = async (id: string) => {
    const place = placeInputs.find(p => p.id === id);
    if (!place || !place.url) return;

    setPlaceInputs(prev => prev.map(p =>
      p.id === id ? { ...p, status: 'loading', error: undefined } : p
    ));

    try {
      const response = await fetch(`${API_BASE_URL}/reviews/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeUrl: place.url, startIndex, endIndex }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('=== Crawl success ===');
        console.log('data.data.placeId:', data.data.placeId);
        console.log('data.data.placeName:', data.data.placeName);

        setPlaceInputs(prev => prev.map(p =>
          p.id === id ? {
            ...p,
            status: 'success',
            name: data.data.placeName,
            naverPlaceId: data.data.placeId,  // 네이버 place ID 저장
            reviews: data.data.reviews
          } : p
        ));
        // 크롤링 성공 시 장소 이름도 DB에 저장
        savePlaceToDb(place.url, data.data.placeName, place.specialty);
      } else {
        setPlaceInputs(prev => prev.map(p =>
          p.id === id ? { ...p, status: 'error', error: data.error } : p
        ));
      }
    } catch (error) {
      setPlaceInputs(prev => prev.map(p =>
        p.id === id ? { ...p, status: 'error', error: '네트워크 오류' } : p
      ));
    }
  };

  // 전체 크롤링
  const crawlAll = async () => {
    const validPlaces = placeInputs.filter(p => p.url && p.status !== 'loading');
    for (const place of validPlaces) {
      await crawlPlace(place.id);
    }
  };

  // 리뷰 승인 (O) - 길이 자동 분류 적용 + 정제 API 호출
  const approveReview = async (placeId: string, placeName: string, specialty: string, review: NaverReview) => {
    console.log('=== approveReview called ===');
    console.log('placeId:', placeId);
    console.log('placeName:', placeName);

    // 중복 체크
    if (curatedReviews.find(r => r.externalId === review.externalId)) {
      return;
    }

    const curatedReview: CuratedReview = {
      ...review,
      placeId,
      placeName,
      categories: [],  // 초기값 빈 배열
      specialty,
      lengthType: getAutoLengthType(review.reviewText),  // 자동 분류
      isCleaningInProgress: true,  // 정제 중 표시
    };

    // 먼저 리뷰 추가 (정제 중 상태로)
    setCuratedReviews(prev => [...prev, curatedReview]);

    // 정제 API 호출
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/clean-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews: [{ externalId: review.externalId, reviewText: review.reviewText }]
        }),
      });

      const data = await response.json();

      if (data.success && data.cleanedReviews?.[0]) {
        const cleanedText = data.cleanedReviews[0].cleanedText;
        // 정제된 텍스트로 업데이트
        setCuratedReviews(prev => prev.map(r =>
          r.externalId === review.externalId
            ? { ...r, cleanedText, isCleaningInProgress: false }
            : r
        ));
      } else {
        // 정제 실패 시 원본 사용
        setCuratedReviews(prev => prev.map(r =>
          r.externalId === review.externalId
            ? { ...r, cleanedText: review.reviewText, isCleaningInProgress: false }
            : r
        ));
      }
    } catch (error) {
      console.error('Clean preview error:', error);
      // 에러 시 원본 사용
      setCuratedReviews(prev => prev.map(r =>
        r.externalId === review.externalId
          ? { ...r, cleanedText: review.reviewText, isCleaningInProgress: false }
          : r
      ));
    }
  };

  // 리뷰 거부 (X) - 큐레이션 목록에서 제거
  const rejectReview = (externalId: string) => {
    setCuratedReviews(curatedReviews.filter(r => r.externalId !== externalId));
  };

  // 카테고리 토글 (중복 선택)
  const toggleCategory = (externalId: string, category: string) => {
    setCuratedReviews(curatedReviews.map(r => {
      if (r.externalId !== externalId) return r;
      const hasCategory = r.categories.includes(category);
      return {
        ...r,
        categories: hasCategory
          ? r.categories.filter(c => c !== category)  // 제거
          : [...r.categories, category],  // 추가
      };
    }));
  };

  // 길이 타입 변경
  const updateLengthType = (externalId: string, lengthType: string) => {
    setCuratedReviews(curatedReviews.map(r =>
      r.externalId === externalId ? { ...r, lengthType } : r
    ));
  };

  // 자동 카테고리 분류 (OpenAI 사용) - 배열 반환
  const autoCategorizeSingle = async (review: CuratedReview): Promise<string[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/openai/categorize-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewText: review.reviewText }),
      });

      const data = await response.json();
      if (data.success && data.category) {
        // 단일 카테고리를 배열로 변환
        return [data.category];
      }
    } catch (error) {
      console.error('Auto-categorize error:', error);
    }
    return review.categories;
  };

  // 전체 자동 카테고리화
  const autoCategorizeAll = async () => {
    setAutoCategorizingAll(true);

    const updatedReviews = [...curatedReviews];
    for (let i = 0; i < updatedReviews.length; i++) {
      const categories = await autoCategorizeSingle(updatedReviews[i]);
      updatedReviews[i] = { ...updatedReviews[i], categories };
      setCuratedReviews([...updatedReviews]);
    }

    setAutoCategorizingAll(false);
  };

  // DB에 저장 (정제된 텍스트 사용)
  const saveToDB = async () => {
    console.log('=== saveToDB called ===');
    console.log('curatedReviews:', curatedReviews);
    console.log('curatedReviews count:', curatedReviews.length);

    // 아직 정제 중인 리뷰가 있는지 체크
    const stillCleaning = curatedReviews.some(r => r.isCleaningInProgress);
    if (stillCleaning) {
      alert('아직 정제 중인 리뷰가 있습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 정제된 텍스트를 reviewText로 대체하여 전송
    const reviewsToSave = curatedReviews.map(r => ({
      ...r,
      reviewText: r.cleanedText || r.reviewText,  // 정제된 텍스트 사용
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/reviews/save-cleaned`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: reviewsToSave }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`${data.savedCount}개 리뷰가 저장되었습니다.`);
        // 저장 성공 시 큐레이션 목록 초기화
        setCuratedReviews([]);
      } else {
        alert('저장 실패: ' + data.error);
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 카테고리별 통계 (중복 카테고리 포함)
  const getCategoryStats = () => {
    const stats: Record<string, number> = {};
    for (const review of curatedReviews) {
      for (const category of review.categories) {
        stats[category] = (stats[category] || 0) + 1;
      }
    }
    return stats;
  };

  // 길이별 통계
  const getLengthStats = () => {
    const stats: Record<string, number> = {};
    for (const review of curatedReviews) {
      stats[review.lengthType] = (stats[review.lengthType] || 0) + 1;
    }
    return stats;
  };

  // 저장된 리뷰 불러오기
  const loadSavedReviews = async () => {
    setLoadingSavedReviews(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/saved`);
      const data = await response.json();
      if (data.success) {
        setSavedReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to load saved reviews:', error);
    } finally {
      setLoadingSavedReviews(false);
    }
  };

  // 저장된 리뷰 필터링
  const getFilteredSavedReviews = () => {
    return savedReviews.filter(review => {
      // 병원 필터
      if (savedReviewFilter.hospital !== 'all' && review.hospital_id !== savedReviewFilter.hospital) {
        return false;
      }
      // 카테고리 필터
      if (savedReviewFilter.category !== 'all') {
        const categories = (review.category || '').split(',');
        if (!categories.includes(savedReviewFilter.category)) {
          return false;
        }
      }
      // 길이 필터
      if (savedReviewFilter.length !== 'all' && review.length_type !== savedReviewFilter.length) {
        return false;
      }
      // 과(specialty) 필터
      if (savedReviewFilter.specialty !== 'all' && review.specialty !== savedReviewFilter.specialty) {
        return false;
      }
      return true;
    });
  };

  // 과 목록 추출 (저장된 리뷰에서)
  const getSpecialtyList = () => {
    const specialties = new Map<string, number>();
    for (const review of savedReviews) {
      if (review.specialty) {
        specialties.set(review.specialty, (specialties.get(review.specialty) || 0) + 1);
      }
    }
    return Array.from(specialties.entries()).sort((a, b) => b[1] - a[1]);
  };

  // 병원 목록 추출 (저장된 리뷰에서)
  const getHospitalList = () => {
    const hospitals = new Map<string, string>();
    for (const review of savedReviews) {
      if (review.hospitals_review) {
        hospitals.set(review.hospital_id, review.hospitals_review.name);
      }
    }
    return Array.from(hospitals.entries());
  };

  const categoryStats = getCategoryStats();
  const lengthStats = getLengthStats();
  const filteredSavedReviews = getFilteredSavedReviews();
  const hospitalList = getHospitalList();
  const specialtyList = getSpecialtyList();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#e2e8f0',
      padding: '24px'
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            리뷰 코칭 시스템
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '4px' }}>
            네이버 플레이스 리뷰를 크롤링하고 교육용 코칭 자료를 만듭니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/admin/hospital-profile')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            병원 프로필 관리
          </button>
          <button
            onClick={() => navigate('/admin/dashboard')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#334155',
              color: '#e2e8f0',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            ← 대시보드로
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* 왼쪽: URL 입력 및 크롤링 */}
        <div style={{ flex: '1', minWidth: '400px' }}>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>플레이스 URL 입력</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '14px', color: '#94a3b8' }}>
                  리뷰 범위:
                </label>
                <input
                  type="number"
                  value={startIndex}
                  onChange={(e) => setStartIndex(Number(e.target.value))}
                  style={{
                    width: '60px',
                    padding: '4px 8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                  }}
                />
                <span style={{ color: '#64748b' }}>~</span>
                <input
                  type="number"
                  value={endIndex}
                  onChange={(e) => setEndIndex(Number(e.target.value))}
                  style={{
                    width: '60px',
                    padding: '4px 8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                  }}
                />
              </div>
            </div>

            {loadingPlaces ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                저장된 플레이스 불러오는 중...
              </div>
            ) : placeInputs.map((place, index) => (
              <div key={place.id} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    color: '#64748b',
                    width: '24px',
                    fontSize: '14px'
                  }}>
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    placeholder="https://m.place.naver.com/hospital/..."
                    value={place.url}
                    onChange={(e) => updatePlaceUrl(place.id, e.target.value)}
                    onBlur={(e) => savePlaceToDb(e.target.value, place.name, place.specialty)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#e2e8f0',
                      fontSize: '14px',
                    }}
                  />
                  <select
                    value={place.specialty}
                    onChange={(e) => {
                      updatePlaceSpecialty(place.id, e.target.value);
                      if (place.url) {
                        savePlaceToDb(place.url, place.name, e.target.value);
                      }
                    }}
                    style={{
                      padding: '10px 8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#e2e8f0',
                      fontSize: '13px',
                      minWidth: '100px',
                    }}
                  >
                    {SPECIALTY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => crawlPlace(place.id)}
                    disabled={!place.url || place.status === 'loading'}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: place.status === 'loading' ? '#475569' : '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: place.url && place.status !== 'loading' ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                    }}
                  >
                    {place.status === 'loading' ? '...' : '크롤링'}
                  </button>
                  {placeInputs.length > 1 && (
                    <button
                      onClick={() => removePlaceInput(place.id)}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#7f1d1d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* 상태 표시 */}
                {place.status === 'success' && (
                  <div style={{
                    marginTop: '8px',
                    marginLeft: '32px',
                    color: '#10B981',
                    fontSize: '13px'
                  }}>
                    ✓ {place.name} - {place.reviews.length}개 리뷰 로드됨
                  </div>
                )}
                {place.status === 'error' && (
                  <div style={{
                    marginTop: '8px',
                    marginLeft: '32px',
                    color: '#EF4444',
                    fontSize: '13px'
                  }}>
                    ✕ 오류: {place.error}
                  </div>
                )}
              </div>
            ))}

            {!loadingPlaces && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={addPlaceInput}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#334155',
                  color: '#e2e8f0',
                  border: '1px dashed #475569',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                + URL 추가
              </button>
              <button
                onClick={crawlAll}
                disabled={!placeInputs.some(p => p.url)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: placeInputs.some(p => p.url) ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                }}
              >
                전체 크롤링
              </button>
            </div>
            )}
          </div>

          {/* 크롤링된 리뷰 목록 */}
          {placeInputs.filter(p => p.reviews.length > 0).map(place => (
            <div key={place.id} style={{
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '16px',
                marginBottom: '16px',
                color: '#f1f5f9'
              }}>
                {place.name} ({place.reviews.length}개)
              </h3>

              {place.reviews.map((review, idx) => {
                const isApproved = curatedReviews.some(r => r.externalId === review.externalId);

                return (
                  <div key={review.externalId} style={{
                    backgroundColor: isApproved ? '#1e3a5f' : '#0f172a',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                    border: isApproved ? '1px solid #3B82F6' : '1px solid #334155',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                        리뷰 #{idx + 1}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!isApproved ? (
                          <>
                            <button
                              onClick={() => approveReview(place.naverPlaceId, place.name, place.specialty, review)}
                              style={{
                                padding: '4px 12px',
                                backgroundColor: '#166534',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                              }}
                            >
                              O
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => rejectReview(review.externalId)}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: '#7f1d1d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                          >
                            X
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#e2e8f0'
                    }}>
                      {review.reviewText}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* 오른쪽: 큐레이션된 리뷰 */}
        <div style={{ flex: '1', minWidth: '400px' }}>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '20px',
            position: 'sticky',
            top: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>
                선택된 리뷰 ({curatedReviews.length}개)
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={autoCategorizeAll}
                  disabled={curatedReviews.length === 0 || autoCategorizingAll}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: autoCategorizingAll ? '#475569' : '#7C3AED',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: curatedReviews.length > 0 && !autoCategorizingAll ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                  }}
                >
                  {autoCategorizingAll ? '분류 중...' : '자동 분류'}
                </button>
                <button
                  onClick={saveToDB}
                  disabled={curatedReviews.length === 0}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: curatedReviews.length > 0 ? '#059669' : '#475569',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: curatedReviews.length > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                  }}
                >
                  DB 저장
                </button>
              </div>
            </div>

            {/* 카테고리별 통계 */}
            {curatedReviews.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#0f172a',
                borderRadius: '8px',
              }}>
                <div style={{ width: '100%', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>카테고리:</span>
                </div>
                {CATEGORY_OPTIONS.map(cat => (
                  <span key={cat.value} style={{
                    padding: '4px 10px',
                    backgroundColor: cat.color + '20',
                    color: cat.color,
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}>
                    {cat.label}: {categoryStats[cat.value] || 0}
                  </span>
                ))}
                <div style={{ width: '100%', marginTop: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>길이:</span>
                </div>
                {LENGTH_OPTIONS.map(len => (
                  <span key={len.value} style={{
                    padding: '4px 10px',
                    backgroundColor: len.color + '20',
                    color: len.color,
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}>
                    {len.label}: {lengthStats[len.value] || 0}
                  </span>
                ))}
              </div>
            )}

            {/* 큐레이션된 리뷰 목록 */}
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {curatedReviews.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#64748b'
                }}>
                  왼쪽에서 리뷰를 선택하세요 (O 버튼)
                </div>
              ) : (
                curatedReviews.map(review => {
                  // 첫 번째 선택된 카테고리의 색상 사용 (없으면 회색)
                  const borderColor = review.categories.length > 0
                    ? CATEGORY_OPTIONS.find(c => c.value === review.categories[0])?.color || '#6B7280'
                    : '#6B7280';

                  return (
                  <div key={review.externalId} style={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                    borderLeft: `4px solid ${borderColor}`,
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                        {review.placeName}
                      </span>
                      <button
                        onClick={() => rejectReview(review.externalId)}
                        style={{
                          padding: '2px 8px',
                          backgroundColor: 'transparent',
                          color: '#EF4444',
                          border: '1px solid #EF4444',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        제거
                      </button>
                    </div>
                    {/* 정제 중 표시 */}
                    {review.isCleaningInProgress && (
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#1e3a5f',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        color: '#60a5fa',
                        fontSize: '13px',
                      }}>
                        정제 중...
                      </div>
                    )}
                    {/* 정제된 텍스트 표시 (원본과 다른 경우 비교) */}
                    {!review.isCleaningInProgress && review.cleanedText && review.cleanedText !== review.reviewText && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{
                          fontSize: '11px',
                          color: '#10B981',
                          marginBottom: '4px',
                          fontWeight: 500,
                        }}>
                          ✓ 정제됨
                        </div>
                        <p style={{
                          margin: 0,
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: '#e2e8f0',
                          padding: '8px',
                          backgroundColor: '#064e3b20',
                          borderRadius: '4px',
                          border: '1px solid #10B98130',
                        }}>
                          {review.cleanedText}
                        </p>
                        <details style={{ marginTop: '8px' }}>
                          <summary style={{
                            fontSize: '11px',
                            color: '#64748b',
                            cursor: 'pointer',
                          }}>
                            원본 보기
                          </summary>
                          <p style={{
                            margin: '4px 0 0 0',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            color: '#94a3b8',
                            textDecoration: 'line-through',
                          }}>
                            {review.reviewText}
                          </p>
                        </details>
                      </div>
                    )}
                    {/* 정제 불필요한 경우 또는 정제 중인 경우 원본 표시 */}
                    {!review.isCleaningInProgress && (!review.cleanedText || review.cleanedText === review.reviewText) && (
                      <p style={{
                        margin: '0 0 12px 0',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#e2e8f0'
                      }}>
                        {review.reviewText}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>카테고리:</span>
                      {CATEGORY_OPTIONS.map(cat => {
                        const isSelected = review.categories.includes(cat.value);
                        return (
                        <button
                          key={cat.value}
                          onClick={() => toggleCategory(review.externalId, cat.value)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: isSelected ? cat.color : 'transparent',
                            color: isSelected ? 'white' : cat.color,
                            border: `1px solid ${cat.color}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            transition: 'all 0.2s',
                          }}
                        >
                          {cat.label}
                        </button>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>길이:</span>
                      {LENGTH_OPTIONS.map(len => (
                        <button
                          key={len.value}
                          onClick={() => updateLengthType(review.externalId, len.value)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: review.lengthType === len.value ? len.color : 'transparent',
                            color: review.lengthType === len.value ? 'white' : len.color,
                            border: `1px solid ${len.color}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            transition: 'all 0.2s',
                          }}
                        >
                          {len.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 저장된 리뷰 조회 섹션 */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '24px',
        marginTop: '24px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>저장된 리뷰 조회</h2>
          <button
            onClick={loadSavedReviews}
            disabled={loadingSavedReviews}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loadingSavedReviews ? 'not-allowed' : 'pointer',
              opacity: loadingSavedReviews ? 0.6 : 1,
            }}
          >
            {loadingSavedReviews ? '불러오는 중...' : '리뷰 불러오기'}
          </button>
        </div>

        {/* 필터 */}
        {savedReviews.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}>
            {/* 병원 필터 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px', color: '#94a3b8' }}>병원:</label>
              <select
                value={savedReviewFilter.hospital}
                onChange={(e) => setSavedReviewFilter(prev => ({ ...prev, hospital: e.target.value }))}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  minWidth: '150px',
                }}
              >
                <option value="all">전체 ({savedReviews.length})</option>
                {hospitalList.map(([id, name]) => {
                  const count = savedReviews.filter(r => r.hospital_id === id).length;
                  return (
                    <option key={id} value={id}>{name} ({count})</option>
                  );
                })}
              </select>
            </div>

            {/* 카테고리 필터 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px', color: '#94a3b8' }}>카테고리:</label>
              <select
                value={savedReviewFilter.category}
                onChange={(e) => setSavedReviewFilter(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                }}
              >
                <option value="all">전체</option>
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* 길이 필터 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px', color: '#94a3b8' }}>길이:</label>
              <select
                value={savedReviewFilter.length}
                onChange={(e) => setSavedReviewFilter(prev => ({ ...prev, length: e.target.value }))}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                }}
              >
                <option value="all">전체</option>
                {LENGTH_OPTIONS.map(len => (
                  <option key={len.value} value={len.value}>{len.label}</option>
                ))}
              </select>
            </div>

            {/* 과(specialty) 필터 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px', color: '#94a3b8' }}>과:</label>
              <select
                value={savedReviewFilter.specialty}
                onChange={(e) => setSavedReviewFilter(prev => ({ ...prev, specialty: e.target.value }))}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  minWidth: '120px',
                }}
              >
                <option value="all">전체</option>
                {specialtyList.map(([specialty, count]) => {
                  const specOption = SPECIALTY_OPTIONS.find(s => s.value === specialty);
                  return (
                    <option key={specialty} value={specialty}>
                      {specOption?.label || specialty} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 필터 결과 카운트 */}
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#0f172a',
              borderRadius: '6px',
              color: '#10B981',
              fontSize: '14px',
            }}>
              {filteredSavedReviews.length}개 리뷰
            </div>
          </div>
        )}

        {/* 리뷰 목록 */}
        <div style={{
          maxHeight: '500px',
          overflowY: 'auto',
        }}>
          {savedReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              '리뷰 불러오기' 버튼을 클릭하여 저장된 리뷰를 조회하세요
            </div>
          ) : filteredSavedReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              필터 조건에 맞는 리뷰가 없습니다
            </div>
          ) : (
            filteredSavedReviews.map(review => {
              const categories = (review.category || '').split(',').filter(Boolean);
              const categoryColor = categories.length > 0
                ? CATEGORY_OPTIONS.find(c => c.value === categories[0])?.color || '#6B7280'
                : '#6B7280';
              const lengthOption = LENGTH_OPTIONS.find(l => l.value === review.length_type);

              return (
                <div
                  key={review.id}
                  style={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                    borderLeft: `4px solid ${categoryColor}`,
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                      {review.hospitals_review?.name || '알 수 없음'}
                      {review.specialty && ` · ${review.specialty}`}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {/* 카테고리 태그 */}
                      {categories.map((cat: string) => {
                        const catOption = CATEGORY_OPTIONS.find(c => c.value === cat);
                        return catOption ? (
                          <span
                            key={cat}
                            style={{
                              padding: '2px 8px',
                              backgroundColor: catOption.color,
                              color: 'white',
                              borderRadius: '10px',
                              fontSize: '11px',
                            }}
                          >
                            {catOption.label}
                          </span>
                        ) : null;
                      })}
                      {/* 길이 태그 */}
                      {lengthOption && (
                        <span
                          style={{
                            padding: '2px 8px',
                            backgroundColor: lengthOption.color,
                            color: 'white',
                            borderRadius: '10px',
                            fontSize: '11px',
                          }}
                        >
                          {lengthOption.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#e2e8f0',
                  }}>
                    {review.review_text}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewCoachingPage;
