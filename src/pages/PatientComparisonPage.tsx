// src/pages/PatientComparisonPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { API_BASE_URL } from "../utils/api/config";
import * as XLSX from "xlsx";
import "leaflet/dist/leaflet.css";

// ──────────────────────────────────────────────────────────
// Leaflet 아이콘 수정
// ──────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ──────────────────────────────────────────────────────────
// 타입 정의
// ──────────────────────────────────────────────────────────
interface PatientData {
  lat: number;
  lng: number;
  age?: number;
  visit_type?: string;
  total_cost?: number;
  route?: string;
}

interface CompetitorData {
  name: string;
  address: string;
  lat: number;
  lng: number;
  department: string;
}

interface ApartmentData {
  name: string;
  address: string;
  price: string;
  executed: string;
  totalHouseholds: number;
  lat: number;
  lng: number;
}

interface GridChange {
  lat: number;
  lng: number;
  period1Count: number;
  period2Count: number;
  change: number;
}

interface VisibleLayers {
  hospital: boolean;
  changes: boolean;
  competitors: boolean;
  apartments: boolean;
}

// ──────────────────────────────────────────────────────────
// 상수 설정
// ──────────────────────────────────────────────────────────
const DEPARTMENT_COLORS: Record<string, string> = {
  치과: "#FFC0CB",
  정형외과: "#FFA500",
  내과: "#800080",
  소아과: "#ADD8E6",
  이비인후과: "#008000",
  피부과: "#90EE90",
  안과: "#00008B",
  산부인과: "#FF0000",
  비뇨기과: "#9400D3",
  신경과: "#006400",
  한의원: "#5F9EA0",
  재활의학과: "#A52A2A",
  마취통증의학과: "#000000",
  기타: "#808080",
};

// ──────────────────────────────────────────────────────────
// 유틸리티 함수
// ──────────────────────────────────────────────────────────
const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const getDefaultPeriods = () => {
  const now = new Date();
  
  // Period 2: 최근 1년
  const period2End = new Date(now);
  const period2Start = new Date(now);
  period2Start.setFullYear(period2Start.getFullYear() - 1);
  
  // Period 1: 그 이전 1년
  const period1End = new Date(period2Start);
  period1End.setDate(period1End.getDate() - 1);
  const period1Start = new Date(period1End);
  period1Start.setFullYear(period1Start.getFullYear() - 1);
  
  return {
    period1Start: formatDate(period1Start),
    period1End: formatDate(period1End),
    period2Start: formatDate(period2Start),
    period2End: formatDate(period2End),
  };
};

// 그리드 기반 위치 카운팅
const countLocationsByGrid = (
  patients: PatientData[],
  gridSize: number = 0.001
): Map<string, number> => {
  const counts = new Map<string, number>();
  
  patients.forEach((p) => {
    const latGrid = Math.round(p.lat / gridSize) * gridSize;
    const lngGrid = Math.round(p.lng / gridSize) * gridSize;
    const key = `${latGrid.toFixed(6)},${lngGrid.toFixed(6)}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  
  return counts;
};

// 두 기간 비교
const calculateGridChanges = (
  period1Patients: PatientData[],
  period2Patients: PatientData[],
  gridSize: number = 0.001
): GridChange[] => {
  const cnt1 = countLocationsByGrid(period1Patients, gridSize);
  const cnt2 = countLocationsByGrid(period2Patients, gridSize);
  
  const allLocations = new Set([...cnt1.keys(), ...cnt2.keys()]);
  const changes: GridChange[] = [];
  
  allLocations.forEach((key) => {
    const [lat, lng] = key.split(",").map(Number);
    const period1Count = cnt1.get(key) || 0;
    const period2Count = cnt2.get(key) || 0;
    const change = period2Count - period1Count;
    
    if (change !== 0) {
      changes.push({ lat, lng, period1Count, period2Count, change });
    }
  });
  
  return changes;
};

// 지오코딩 API
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/geocode/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.lat && data.lng ? { lat: data.lat, lng: data.lng } : null;
  } catch {
    return null;
  }
};

// ──────────────────────────────────────────────────────────
// API 함수
// ──────────────────────────────────────────────────────────
const fetchHospitalInfo = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/users/info`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) throw new Error("병원 정보 로드 실패");
  const data = await response.json();
  const user = data.user;
  return {
    name: user?.name || "우리 병원",
    lat: user?.location?.lat || 0,
    lng: user?.location?.long || user?.location?.lng || 0,
  };
};

const fetchPatientLocations = async (
  token: string,
  startDate: string,
  endDate: string
): Promise<PatientData[]> => {
  const response = await fetch(`${API_BASE_URL}/fetch/all_down_patient_location`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ startDate, endDate }),
  });
  if (!response.ok) throw new Error("환자 데이터 로드 실패");
  const data = await response.json();
  const locations = data.locations || data.data || data || [];
  return locations.map((p: any) => ({
    lat: p.lat,
    lng: p.lng,
    age: p.age ? parseInt(p.age) : undefined,
    visit_type: p.visit_type || undefined,
    total_cost: p.total_cost || undefined,
    route: p.route || undefined,
  }));
};

// 엑셀 파싱
const parseCompetitorExcel = async (
  file: File,
  setLoadingMessage: (msg: string) => void
): Promise<CompetitorData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        const competitors: CompetitorData[] = [];
        for (let i = 0; i < jsonData.length; i++) {
          const row: any = jsonData[i];
          const name = row["병원명"] || row["name"] || "";
          const address = row["주소"] || row["address"] || "";
          const department = row["진료과"] || row["department"] || "기타";
          if (!name || !address) continue;
          
          setLoadingMessage(`경쟁병원 좌표 변환 중... (${i + 1}/${jsonData.length})`);
          const coords = await geocodeAddress(address);
          if (coords) {
            competitors.push({ name, address, lat: coords.lat, lng: coords.lng, department });
          }
          await new Promise((r) => setTimeout(r, 100));
        }
        resolve(competitors);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsBinaryString(file);
  });
};

const parseApartmentExcel = async (
  file: File,
  setLoadingMessage: (msg: string) => void
): Promise<ApartmentData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        const apartments: ApartmentData[] = [];
        for (let i = 0; i < jsonData.length; i++) {
          const row: any = jsonData[i];
          const name = row["단지명"] || "";
          const address = row["주소"] || "";
          const price = row["4주금액"] || "";
          const executed = row["집행 여부"] || "";
          const totalHouseholds = parseInt(row["총 세대 수"]) || 0;
          if (!name || !address) continue;
          
          setLoadingMessage(`아파트 좌표 변환 중... (${i + 1}/${jsonData.length})`);
          const coords = await geocodeAddress(address);
          if (coords) {
            apartments.push({
              name, address, price: String(price), executed, totalHouseholds,
              lat: coords.lat, lng: coords.lng,
            });
          }
          await new Promise((r) => setTimeout(r, 100));
        }
        resolve(apartments);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsBinaryString(file);
  });
};

// ──────────────────────────────────────────────────────────
// 지도 중심 변경 컴포넌트
// ──────────────────────────────────────────────────────────
const ChangeMapView: React.FC<{ center: [number, number]; zoom: number }> = ({
  center,
  zoom,
}) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// ──────────────────────────────────────────────────────────
// 커스텀 마커
// ──────────────────────────────────────────────────────────
const createHospitalIcon = () => {
  return L.divIcon({
    className: "custom-hospital-marker",
    html: `
      <div style="
        width: 44px; height: 44px;
        background: #1e3a8a;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
        font-size: 22px;
      ">🏥</div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

const createCompetitorIcon = (color: string) => {
  return L.divIcon({
    className: "custom-competitor-marker",
    html: `
      <div style="
        width: 12px; height: 12px;
        background: ${color};
        border: 2px solid #fff;
        box-shadow: 0 0 0 1px ${color}, 0 2px 4px rgba(0,0,0,0.4);
        transform: rotate(45deg);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

// 집행 여부에 따른 색상 (집행: 초록, 미집행: 주황)
const getApartmentColors = (executed: string) => {
  if (executed === "집행") {
    return {
      bg: "rgba(22, 163, 74, 0.7)",
      border: "#15803d",
      bgLight: "rgba(22, 163, 74, 0.5)",
    };
  } else {
    return {
      bg: "rgba(249, 115, 22, 0.7)",
      border: "#ea580c",
      bgLight: "rgba(249, 115, 22, 0.5)",
    };
  }
};

const createApartmentIcon = (size: number, executed: string) => {
  const colors = getApartmentColors(executed);
  return L.divIcon({
    className: "custom-apartment-marker",
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        background: ${colors.bg};
        border-radius: 50%;
        border: 2px solid ${colors.border};
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        font-size: ${Math.max(12, size / 2.5)}px;
      ">🏠</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// 선택된 아파트 마커 아이콘 (파란색)
const createSelectedApartmentIcon = (size: number) => {
  return L.divIcon({
    className: "custom-apartment-marker selected",
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        background: rgba(37, 99, 235, 0.9);
        border-radius: 50%;
        border: 3px solid #1d4ed8;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3), 0 2px 8px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
        font-size: ${Math.max(14, size / 2)}px;
        cursor: pointer;
        color: white;
      ">✓</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// 선택 모드일 때 아파트 마커 아이콘 (집행 여부에 따른 색상 + 점선)
const createSelectableApartmentIcon = (size: number, executed: string) => {
  const colors = getApartmentColors(executed);
  return L.divIcon({
    className: "custom-apartment-marker selectable",
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        background: ${colors.bgLight};
        border-radius: 50%;
        border: 2px dashed ${colors.border};
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        font-size: ${Math.max(12, size / 2.5)}px;
        cursor: pointer;
      ">🏠</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// ──────────────────────────────────────────────────────────
// 메인 컴포넌트
// ──────────────────────────────────────────────────────────
const PatientComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 인증
  const [authToken, setAuthToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 기간 설정
  const defaultPeriods = getDefaultPeriods();
  const [period1Start, setPeriod1Start] = useState(defaultPeriods.period1Start);
  const [period1End, setPeriod1End] = useState(defaultPeriods.period1End);
  const [period2Start, setPeriod2Start] = useState(defaultPeriods.period2Start);
  const [period2End, setPeriod2End] = useState(defaultPeriods.period2End);
  
  // 신환만 필터링
  const [newPatientsOnly, setNewPatientsOnly] = useState(true);
  
  // 병원 정보
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalLocation, setHospitalLocation] = useState({ lat: 37.5665, lng: 126.978 });
  
  // 환자 데이터
  const [period1Patients, setPeriod1Patients] = useState<PatientData[]>([]);
  const [period2Patients, setPeriod2Patients] = useState<PatientData[]>([]);
  const [gridChanges, setGridChanges] = useState<GridChange[]>([]);
  
  // 경쟁병원 & 아파트
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  
  // UI 상태
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"auth" | "config" | "map">("auth");
  const [visibleLayers, setVisibleLayers] = useState<VisibleLayers>({
    hospital: true,
    changes: true,
    competitors: true,
    apartments: true,
  });

  // 아파트 선택 모드
  const [isSelectingApartments, setIsSelectingApartments] = useState(false);
  const [selectedApartmentIndices, setSelectedApartmentIndices] = useState<number[]>([]);

  // ──────────────────────────────────────────────────────────
  // 통계 계산
  // ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const increases = gridChanges.filter((g) => g.change > 0);
    const decreases = gridChanges.filter((g) => g.change < 0);
    
    const totalIncrease = increases.reduce((sum, g) => sum + g.change, 0);
    const totalDecrease = decreases.reduce((sum, g) => sum + Math.abs(g.change), 0);
    
    const maxChange = gridChanges.length > 0 
      ? Math.max(...gridChanges.map((g) => Math.abs(g.change))) 
      : 1;
    
    const period1Total = period1Patients.length;
    const period2Total = period2Patients.length;
    const netChange = period2Total - period1Total;
    
    return {
      increaseCount: increases.length,
      decreaseCount: decreases.length,
      totalIncrease,
      totalDecrease,
      maxChange,
      period1Total,
      period2Total,
      netChange,
    };
  }, [gridChanges, period1Patients, period2Patients]);

  // 아파트 마커 크기
  const getApartmentMarkerSize = useMemo(() => {
    const maxHouseholds = Math.max(...apartments.map((a) => a.totalHouseholds), 1);
    return (households: number) => {
      const ratio = households / maxHouseholds;
      return Math.round(24 + ratio * 26);
    };
  }, [apartments]);

  // ──────────────────────────────────────────────────────────
  // 데이터 로드
  // ──────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!authToken.trim()) {
      setErrorMessage("토큰을 입력해주세요.");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      // 병원 정보
      setLoadingMessage("병원 정보 로드 중...");
      const hospital = await fetchHospitalInfo(authToken);
      setHospitalName(hospital.name);
      setHospitalLocation({ lat: hospital.lat, lng: hospital.lng });
      
      // Period 1 환자 데이터
      setLoadingMessage(`Period 1 데이터 로드 중... (${period1Start} ~ ${period1End})`);
      const p1 = await fetchPatientLocations(authToken, period1Start, period1End);
      
      // Period 2 환자 데이터
      setLoadingMessage(`Period 2 데이터 로드 중... (${period2Start} ~ ${period2End})`);
      const p2 = await fetchPatientLocations(authToken, period2Start, period2End);
      
      // 신환만 필터링
      const filtered1 = newPatientsOnly ? p1.filter((p) => p.visit_type === "신환") : p1;
      const filtered2 = newPatientsOnly ? p2.filter((p) => p.visit_type === "신환") : p2;
      
      setPeriod1Patients(filtered1);
      setPeriod2Patients(filtered2);
      
      // 그리드 변화 계산
      setLoadingMessage("변화 분석 중...");
      const changes = calculateGridChanges(filtered1, filtered2);
      setGridChanges(changes);
      
      setIsAuthenticated(true);
      setActiveTab("config");
    } catch (error: any) {
      setErrorMessage(error.message || "데이터 로드 실패");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleReloadData = async () => {
    if (!authToken) return;
    
    setIsLoading(true);
    try {
      setLoadingMessage(`Period 1 재로드 중...`);
      const p1 = await fetchPatientLocations(authToken, period1Start, period1End);
      
      setLoadingMessage(`Period 2 재로드 중...`);
      const p2 = await fetchPatientLocations(authToken, period2Start, period2End);
      
      const filtered1 = newPatientsOnly ? p1.filter((p) => p.visit_type === "신환") : p1;
      const filtered2 = newPatientsOnly ? p2.filter((p) => p.visit_type === "신환") : p2;
      
      setPeriod1Patients(filtered1);
      setPeriod2Patients(filtered2);
      
      const changes = calculateGridChanges(filtered1, filtered2);
      setGridChanges(changes);
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  // 경쟁병원 업로드
  const handleCompetitorUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const data = await parseCompetitorExcel(file, setLoadingMessage);
      setCompetitors(data);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  // 아파트 업로드
  const handleApartmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const data = await parseApartmentExcel(file, setLoadingMessage);
      setApartments(data);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  // ──────────────────────────────────────────────────────────
  // 마커 색상 및 크기
  // ──────────────────────────────────────────────────────────
  const getChangeColor = (change: number): string => {
    if (change > 0) {
      // 파란색 (증가)
      const ratio = Math.min(change / stats.maxChange, 1);
      const r = Math.round(30 + (100 - 30) * (1 - ratio));
      const g = Math.round(64 + (150 - 64) * (1 - ratio));
      const b = Math.round(175 + (220 - 175) * (1 - ratio));
      return `rgba(${r},${g},${b},0.8)`;
    } else {
      // 빨간색 (감소)
      const ratio = Math.min(Math.abs(change) / stats.maxChange, 1);
      const r = Math.round(180 + (220 - 180) * ratio);
      const g = Math.round(30 + (60 - 30) * (1 - ratio));
      const b = Math.round(30 + (60 - 30) * (1 - ratio));
      return `rgba(${r},${g},${b},0.8)`;
    }
  };

  const getChangeRadius = (change: number): number => {
    const ratio = Math.abs(change) / stats.maxChange;
    return 8 + ratio * 40;
  };

  // ──────────────────────────────────────────────────────────
  // 렌더링
  // ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {/* 헤더 */}
        {/* 헤더 */}
        <header style={{ backgroundColor: "#1e3a8a", borderBottom: "1px solid #1e40af" }}>
        <div
            style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
                onClick={() => navigate("/admin/hospital-map")}
                style={{
                color: "#93c5fd",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                }}
            >
                ← 환자 분포 분석으로
            </button>
            <h1
                style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#fff",
                margin: 0,
                }}
            >
                📊 환자 기간 비교 분석
            </h1>
            </div>

            {isAuthenticated && (
            <div style={{ display: "flex", gap: "8px" }}>
                <button
                onClick={() => setActiveTab("auth")}
                style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontWeight: 500,
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: activeTab === "auth" ? "#fff" : "rgba(255,255,255,0.2)",
                    color: activeTab === "auth" ? "#1e3a8a" : "#fff",
                }}
                >
                🔐 데이터 연동
                </button>
                <button
                onClick={() => setActiveTab("config")}
                style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontWeight: 500,
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: activeTab === "config" ? "#fff" : "rgba(255,255,255,0.2)",
                    color: activeTab === "config" ? "#1e3a8a" : "#fff",
                }}
                >
                ⚙️ 설정
                </button>
                <button
                onClick={() => setActiveTab("map")}
                disabled={!hospitalLocation.lat}
                style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontWeight: 500,
                    fontSize: "14px",
                    border: "none",
                    cursor: hospitalLocation.lat ? "pointer" : "not-allowed",
                    backgroundColor: activeTab === "map" ? "#fff" : "rgba(255,255,255,0.2)",
                    color: activeTab === "map" ? "#1e3a8a" : "#fff",
                    opacity: hospitalLocation.lat ? 1 : 0.5,
                }}
                >
                🗺️ 비교 지도
                </button>
            </div>
            )}
        </div>
        </header>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "16px" }}>
        {/* 인증 탭 */}
        {activeTab === "auth" && (
          <div
            style={{
              maxWidth: "500px",
              margin: "40px auto",
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "32px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px", textAlign: "center" }}>
              🔐 데이터 연동 & 기간 설정
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* 토큰 입력 */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>
                  API 토큰
                </label>
                <input
                  type="password"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                  placeholder="토큰을 입력하세요"
                />
              </div>

              {/* Period 1 */}
              <div style={{ padding: "16px", backgroundColor: "#eff6ff", borderRadius: "8px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#1e40af", marginBottom: "8px" }}>
                  📅 Period 1 (이전 기간)
                </label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="date"
                    value={period1Start}
                    onChange={(e) => setPeriod1Start(e.target.value)}
                    style={{ flex: 1, padding: "8px", border: "1px solid #93c5fd", borderRadius: "6px", fontSize: "13px" }}
                  />
                  <span style={{ color: "#1e40af" }}>~</span>
                  <input
                    type="date"
                    value={period1End}
                    onChange={(e) => setPeriod1End(e.target.value)}
                    style={{ flex: 1, padding: "8px", border: "1px solid #93c5fd", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Period 2 */}
              <div style={{ padding: "16px", backgroundColor: "#fef3c7", borderRadius: "8px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#92400e", marginBottom: "8px" }}>
                  📅 Period 2 (최근 기간)
                </label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="date"
                    value={period2Start}
                    onChange={(e) => setPeriod2Start(e.target.value)}
                    style={{ flex: 1, padding: "8px", border: "1px solid #fcd34d", borderRadius: "6px", fontSize: "13px" }}
                  />
                  <span style={{ color: "#92400e" }}>~</span>
                  <input
                    type="date"
                    value={period2End}
                    onChange={(e) => setPeriod2End(e.target.value)}
                    style={{ flex: 1, padding: "8px", border: "1px solid #fcd34d", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* 신환만 필터 */}
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={newPatientsOnly}
                  onChange={(e) => setNewPatientsOnly(e.target.checked)}
                />
                <span style={{ fontSize: "14px" }}>신환(신규환자)만 분석</span>
              </label>

              {errorMessage && (
                <p style={{ color: "#dc2626", fontSize: "14px", margin: 0, padding: "8px 12px", backgroundColor: "#fef2f2", borderRadius: "6px" }}>
                  {errorMessage}
                </p>
              )}

              <button
                onClick={handleLogin}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: isLoading ? "#9ca3af" : "#1e3a8a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? loadingMessage : "데이터 불러오기 & 분석 시작"}
              </button>

              {isAuthenticated && (
                <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#ecfdf5", borderRadius: "8px" }}>
                  <p style={{ color: "#059669", fontSize: "14px", margin: 0, fontWeight: 500 }}>
                    ✅ 분석 완료
                  </p>
                  <p style={{ color: "#6b7280", fontSize: "12px", margin: "4px 0 0 0" }}>
                    Period 1: {stats.period1Total}명 | Period 2: {stats.period2Total}명
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 설정 탭 */}
        {activeTab === "config" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            {/* 분석 결과 요약 */}
            <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", gridColumn: "1 / -1" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
                📊 {newPatientsOnly ? "신환" : "전체 환자"} 수 변화 분석 결과
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
                <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#eff6ff", borderRadius: "8px" }}>
                  <p style={{ fontSize: "12px", color: "#1e40af", margin: 0 }}>Period 1</p>
                  <p style={{ fontSize: "24px", fontWeight: "bold", color: "#1e3a8a", margin: "4px 0 0 0" }}>
                    {stats.period1Total.toLocaleString()}명
                  </p>
                  <p style={{ fontSize: "10px", color: "#6b7280", margin: "4px 0 0 0" }}>
                    {period1Start} ~ {period1End}
                  </p>
                </div>

                <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#fef3c7", borderRadius: "8px" }}>
                  <p style={{ fontSize: "12px", color: "#92400e", margin: 0 }}>Period 2</p>
                  <p style={{ fontSize: "24px", fontWeight: "bold", color: "#d97706", margin: "4px 0 0 0" }}>
                    {stats.period2Total.toLocaleString()}명
                  </p>
                  <p style={{ fontSize: "10px", color: "#6b7280", margin: "4px 0 0 0" }}>
                    {period2Start} ~ {period2End}
                  </p>
                </div>

                <div style={{ textAlign: "center", padding: "16px", backgroundColor: stats.netChange >= 0 ? "#ecfdf5" : "#fef2f2", borderRadius: "8px" }}>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>순 변화</p>
                  <p style={{ fontSize: "24px", fontWeight: "bold", color: stats.netChange >= 0 ? "#059669" : "#dc2626", margin: "4px 0 0 0" }}>
                    {stats.netChange >= 0 ? "+" : ""}{stats.netChange.toLocaleString()}명
                  </p>
                </div>

                <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#dbeafe", borderRadius: "8px" }}>
                  <p style={{ fontSize: "12px", color: "#1e40af", margin: 0 }}>증가 지역</p>
                  <p style={{ fontSize: "20px", fontWeight: "bold", color: "#1e3a8a", margin: "4px 0 0 0" }}>
                    {stats.increaseCount}곳
                  </p>
                  <p style={{ fontSize: "11px", color: "#3b82f6", margin: "2px 0 0 0" }}>
                    +{stats.totalIncrease}명
                  </p>
                </div>

                <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#fee2e2", borderRadius: "8px" }}>
                  <p style={{ fontSize: "12px", color: "#991b1b", margin: 0 }}>감소 지역</p>
                  <p style={{ fontSize: "20px", fontWeight: "bold", color: "#dc2626", margin: "4px 0 0 0" }}>
                    {stats.decreaseCount}곳
                  </p>
                  <p style={{ fontSize: "11px", color: "#ef4444", margin: "2px 0 0 0" }}>
                    -{stats.totalDecrease}명
                  </p>
                </div>
              </div>

              <button
                onClick={handleReloadData}
                disabled={isLoading}
                style={{
                  marginTop: "16px",
                  padding: "10px 20px",
                  backgroundColor: isLoading ? "#9ca3af" : "#059669",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "로딩 중..." : "🔄 기간 변경 후 재분석"}
              </button>
            </div>

            {/* 경쟁병원 업로드 */}
            <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>🏢 경쟁병원 데이터</h2>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleCompetitorUpload}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
              />
              <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>필수 컬럼: 병원명, 주소, 진료과</p>
              {competitors.length > 0 && (
                <p style={{ fontSize: "14px", color: "#16a34a", marginTop: "8px" }}>✅ {competitors.length}개 병원</p>
              )}
            </div>

            {/* 아파트 업로드 */}
            <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>🏠 아파트 데이터</h2>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleApartmentUpload}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
              />
              <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>필수 컬럼: 단지명, 주소, 4주금액, 집행 여부, 총 세대 수</p>
              {apartments.length > 0 && (
                <p style={{ fontSize: "14px", color: "#16a34a", marginTop: "8px" }}>✅ {apartments.length}개 단지</p>
              )}
            </div>
          </div>
        )}

        {/* 지도 탭 */}
        {activeTab === "map" && (
          <div style={{ display: "flex", gap: "16px", height: "calc(100vh - 140px)" }}>
            {/* 사이드바 */}
            <div style={{ width: "300px", backgroundColor: "#fff", borderRadius: "12px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflowY: "auto" }}>
              <h3 style={{ fontWeight: 600, marginBottom: "16px" }}>🎛️ 레이어 컨트롤</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={visibleLayers.hospital} onChange={(e) => setVisibleLayers((prev) => ({ ...prev, hospital: e.target.checked }))} />
                  <span>🏥 우리 병원</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={visibleLayers.changes} onChange={(e) => setVisibleLayers((prev) => ({ ...prev, changes: e.target.checked }))} />
                  <span>📊 환자 변화 ({gridChanges.length}곳)</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={visibleLayers.competitors} onChange={(e) => setVisibleLayers((prev) => ({ ...prev, competitors: e.target.checked }))} />
                  <span>🏢 경쟁병원 ({competitors.length}개)</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={visibleLayers.apartments} onChange={(e) => setVisibleLayers((prev) => ({ ...prev, apartments: e.target.checked }))} />
                  <span>🏠 아파트 ({apartments.length}개)</span>
                </label>
              </div>

              {/* 범례 */}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
                <h4 style={{ fontWeight: 500, fontSize: "14px", color: "#374151", marginBottom: "12px" }}>
                  📊 {newPatientsOnly ? "신환" : "환자"} 수 변화
                </h4>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(30, 64, 175, 0.8)", border: "2px solid #1e3a8a" }} />
                    <span>증가 (파란색)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(180, 30, 30, 0.8)", border: "2px solid #991b1b" }} />
                    <span>감소 (빨간색)</span>
                  </div>
                  <p style={{ color: "#6b7280", fontSize: "11px", margin: "8px 0 0 0" }}>
                    ※ 원 크기 = 변화량에 비례<br />
                    ※ 색 진하기 = 변화 정도
                  </p>
                </div>

                <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f9fafb", borderRadius: "8px", fontSize: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span>Period 1:</span>
                    <span style={{ fontWeight: 600 }}>{stats.period1Total.toLocaleString()}명</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span>Period 2:</span>
                    <span style={{ fontWeight: 600 }}>{stats.period2Total.toLocaleString()}명</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e5e7eb", paddingTop: "4px", marginTop: "4px" }}>
                    <span style={{ fontWeight: 600 }}>순 변화:</span>
                    <span style={{ fontWeight: 600, color: stats.netChange >= 0 ? "#059669" : "#dc2626" }}>
                      {stats.netChange >= 0 ? "+" : ""}{stats.netChange.toLocaleString()}명
                    </span>
                  </div>
                </div>

                {/* 아파트 색상 범례 */}
                {apartments.length > 0 && (
                  <div style={{ marginTop: "16px" }}>
                    <h4 style={{ fontWeight: 500, fontSize: "14px", color: "#374151", marginBottom: "8px" }}>
                      🏠 아파트 집행 상태
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "rgba(22, 163, 74, 0.7)", border: "2px solid #15803d" }} />
                        <span>집행 중</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "rgba(249, 115, 22, 0.7)", border: "2px solid #ea580c" }} />
                        <span>미집행</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 🏠 아파트 선택 패널 */}
              {apartments.length > 0 && (
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px", marginTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ fontWeight: 600, fontSize: "14px", color: "#374151", margin: 0 }}>
                      🏠 아파트 선택
                    </h4>
                    <button
                      onClick={() => setIsSelectingApartments(!isSelectingApartments)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: isSelectingApartments ? "#dc2626" : "#7c3aed",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {isSelectingApartments ? "✕ 종료" : "선택 모드"}
                    </button>
                  </div>

                  {isSelectingApartments && (
                    <p style={{ fontSize: "12px", color: "#7c3aed", backgroundColor: "#f5f3ff", padding: "8px 12px", borderRadius: "6px", marginBottom: "12px" }}>
                      💡 지도에서 아파트를 클릭하여 선택/해제하세요
                    </p>
                  )}

                  {/* 선택된 아파트 통계 */}
                  {selectedApartmentIndices.length > 0 && (
                    <div style={{ backgroundColor: "#f0fdf4", borderRadius: "8px", padding: "12px", border: "1px solid #bbf7d0", marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#15803d" }}>
                          ✅ {selectedApartmentIndices.length}개 선택됨
                        </span>
                        <button
                          onClick={() => setSelectedApartmentIndices([])}
                          style={{ padding: "4px 8px", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                        >
                          전체 해제
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                        <div style={{ padding: "10px", backgroundColor: "#fff", borderRadius: "6px", textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: "10px", color: "#6b7280" }}>총 세대 수</p>
                          <p style={{ margin: "4px 0 0 0", fontSize: "16px", fontWeight: "bold", color: "#7c3aed" }}>
                            {selectedApartmentIndices.reduce((sum, idx) => sum + (apartments[idx]?.totalHouseholds || 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <div style={{ padding: "10px", backgroundColor: "#fff", borderRadius: "6px", textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: "10px", color: "#6b7280" }}>총 비용</p>
                          <p style={{ margin: "4px 0 0 0", fontSize: "16px", fontWeight: "bold", color: "#2563eb" }}>
                            {selectedApartmentIndices.reduce((sum, idx) => {
                              const price = apartments[idx]?.price || "0";
                              return sum + (parseInt(price.replace(/[^0-9]/g, "")) || 0);
                            }, 0).toLocaleString()}원
                          </p>
                        </div>
                      </div>

                      {/* 선택된 아파트 목록 */}
                      <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                        {selectedApartmentIndices.map((idx) => {
                          const apt = apartments[idx];
                          if (!apt) return null;
                          return (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px", backgroundColor: "#fff", borderRadius: "6px", marginBottom: "4px", fontSize: "11px" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{apt.name}</p>
                                <p style={{ margin: "2px 0 0 0", color: "#6b7280", fontSize: "10px" }}>
                                  {apt.totalHouseholds.toLocaleString()}세대 · {apt.price}
                                </p>
                              </div>
                              <button
                                onClick={() => setSelectedApartmentIndices((prev) => prev.filter((i) => i !== idx))}
                                style={{ padding: "3px 6px", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "4px", fontSize: "10px", cursor: "pointer", flexShrink: 0, marginLeft: "8px" }}
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* 엑셀 다운로드 버튼 */}
                      <button
                        onClick={() => {
                          const exportData = selectedApartmentIndices.map((idx) => {
                            const apt = apartments[idx];
                            return {
                              "단지명": apt?.name || "",
                              "집행여부": apt?.executed || "",
                              "4주금액": apt?.price || "",
                              "세대수": apt?.totalHouseholds || 0,
                            };
                          });
                          const totalHouseholds = selectedApartmentIndices.reduce((sum, idx) => sum + (apartments[idx]?.totalHouseholds || 0), 0);
                          const totalPrice = selectedApartmentIndices.reduce((sum, idx) => {
                            const price = apartments[idx]?.price || "0";
                            return sum + (parseInt(price.replace(/[^0-9]/g, "")) || 0);
                          }, 0);
                          exportData.push({ "단지명": "합계", "집행여부": "", "4주금액": totalPrice.toLocaleString() + "원", "세대수": totalHouseholds });

                          const worksheet = XLSX.utils.json_to_sheet(exportData);
                          const workbook = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(workbook, worksheet, "선택된 아파트");
                          worksheet["!cols"] = [{ wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 10 }];
                          const today = new Date().toISOString().split("T")[0];
                          XLSX.writeFile(workbook, `선택된_아파트_${today}.xlsx`);
                        }}
                        style={{ marginTop: "10px", padding: "8px 12px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      >
                        📥 엑셀 다운로드
                      </button>
                    </div>
                  )}

                  {/* 아파트가 선택되지 않았을 때 */}
                  {selectedApartmentIndices.length === 0 && (
                    <p style={{ fontSize: "12px", color: "#6b7280", textAlign: "center", padding: "16px", backgroundColor: "#f9fafb", borderRadius: "6px" }}>
                      {isSelectingApartments ? "지도에서 아파트를 클릭하세요" : "선택된 아파트가 없습니다"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 지도 */}
            <div style={{ flex: 1, backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <MapContainer
                center={[hospitalLocation.lat, hospitalLocation.lng]}
                zoom={12}
                style={{ width: "100%", height: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ChangeMapView center={[hospitalLocation.lat, hospitalLocation.lng]} zoom={12} />

                {/* 병원 마커 */}
                {visibleLayers.hospital && hospitalLocation.lat !== 0 && (
                  <Marker position={[hospitalLocation.lat, hospitalLocation.lng]} icon={createHospitalIcon()}>
                    <Popup>
                      <div style={{ textAlign: "center", minWidth: "150px" }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px", color: "#1e3a8a" }}>🏥 {hospitalName}</div>
                        <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>분석 기준점</div>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* 변화 마커 */}
                {visibleLayers.changes && gridChanges.map((item, index) => (
                  <CircleMarker
                    key={`change-${index}`}
                    center={[item.lat, item.lng]}
                    radius={getChangeRadius(item.change)}
                    fillColor={getChangeColor(item.change)}
                    color="#fff"
                    weight={2}
                    opacity={1}
                    fillOpacity={0.9}
                  >
                    <Popup>
                      <div style={{ fontSize: "12px", minWidth: "160px", textAlign: "center" }}>
                        <div style={{ fontWeight: "bold", marginBottom: "8px", padding: "6px", backgroundColor: item.change > 0 ? "#dbeafe" : "#fee2e2", borderRadius: "4px" }}>
                          {newPatientsOnly ? "신환" : "환자"} 수 {item.change > 0 ? "증가" : "감소"}
                        </div>
                        <div style={{ fontSize: "20px", fontWeight: "bold", color: item.change > 0 ? "#1e3a8a" : "#991b1b", margin: "8px 0" }}>
                          {item.change > 0 ? "+" : ""}{item.change}명
                        </div>
                        <div style={{ fontSize: "11px", color: "#666", lineHeight: 1.6 }}>
                          Period 1: {item.period1Count}명<br />
                          Period 2: {item.period2Count}명
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}

                {/* 경쟁병원 */}
                {visibleLayers.competitors && competitors.map((c, i) => (
                  <Marker key={`comp-${i}`} position={[c.lat, c.lng]} icon={createCompetitorIcon(DEPARTMENT_COLORS[c.department] || DEPARTMENT_COLORS["기타"])}>
                    <Popup>
                      <div style={{ fontSize: "12px", minWidth: "150px" }}>
                        <div style={{ fontWeight: "bold", marginBottom: "6px" }}>{c.name}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                          <span style={{ color: "#666" }}>진료과</span>
                          <span style={{ background: DEPARTMENT_COLORS[c.department] || DEPARTMENT_COLORS["기타"], color: "white", padding: "1px 6px", borderRadius: "4px", fontSize: "11px" }}>
                            {c.department}
                          </span>
                        </div>
                        <div style={{ color: "#666", fontSize: "11px", marginTop: "4px" }}>{c.address}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* 아파트 */}
                {visibleLayers.apartments && apartments.map((a, i) => {
                  const isSelected = selectedApartmentIndices.includes(i);
                  const markerSize = getApartmentMarkerSize(a.totalHouseholds);
                  const icon = isSelected
                    ? createSelectedApartmentIcon(markerSize)
                    : isSelectingApartments
                    ? createSelectableApartmentIcon(markerSize, a.executed)
                    : createApartmentIcon(markerSize, a.executed);

                  return (
                    <Marker
                      key={`apt-${i}`}
                      position={[a.lat, a.lng]}
                      icon={icon}
                      zIndexOffset={isSelectingApartments ? 1000 : 0}
                      eventHandlers={{
                        click: () => {
                          if (isSelectingApartments) {
                            setSelectedApartmentIndices((prev) =>
                              prev.includes(i) ? prev.filter((idx) => idx !== i) : [...prev, i]
                            );
                          }
                        },
                      }}
                    >
                      <Popup>
                        <div style={{ fontSize: "12px", minWidth: "180px" }}>
                          <div style={{ fontWeight: "bold", marginBottom: "6px", fontSize: "13px" }}>
                            {isSelected ? "✅" : "🏠"} {a.name}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                            <span style={{ color: "#666" }}>총 세대 수</span>
                            <span style={{ fontWeight: 600, color: "#7c3aed" }}>{a.totalHouseholds.toLocaleString()}세대</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                            <span style={{ color: "#666" }}>4주 금액</span>
                            <span>{a.price}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                            <span style={{ color: "#666" }}>집행 여부</span>
                            <span style={{ color: a.executed === "집행" ? "#16a34a" : "#dc2626", fontWeight: 500 }}>{a.executed}</span>
                          </div>
                          <div style={{ color: "#666", fontSize: "11px", marginTop: "6px", paddingTop: "6px", borderTop: "1px solid #eee" }}>{a.address}</div>
                          {isSelectingApartments && (
                            <button
                              onClick={() => {
                                setSelectedApartmentIndices((prev) =>
                                  prev.includes(i) ? prev.filter((idx) => idx !== i) : [...prev, i]
                                );
                              }}
                              style={{
                                marginTop: "10px",
                                padding: "6px 12px",
                                backgroundColor: isSelected ? "#fee2e2" : "#f0fdf4",
                                color: isSelected ? "#dc2626" : "#16a34a",
                                border: `1px solid ${isSelected ? "#fecaca" : "#bbf7d0"}`,
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                width: "100%",
                              }}
                            >
                              {isSelected ? "✕ 선택 해제" : "✓ 선택하기"}
                            </button>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        )}
      </main>

      {isLoading && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "24px", textAlign: "center", minWidth: "200px" }}>
            <div style={{ width: "32px", height: "32px", border: "4px solid #1e3a8a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
            <p style={{ marginTop: "12px", color: "#374151", fontSize: "14px" }}>{loadingMessage || "처리 중..."}</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-container { font-family: inherit; }
      `}</style>
    </div>
  );
};

export default PatientComparisonPage;