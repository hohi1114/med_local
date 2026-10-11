// src/pages/HospitalMapAnalysisPage.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { API_BASE_URL } from "../utils/api/config";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
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
interface HospitalLocation {
  lat: number;
  lng: number;
  name: string;
}

interface PatientData {
  lat: number;
  lng: number;
  age?: number;
  visit_type?: string;
  total_cost?: number;
  route?: string;
  age_group?: string;
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

interface AnalysisConfig {
  hospitalName: string;
  hospitalLocation: HospitalLocation;
  patients: PatientData[];
  competitors: CompetitorData[];
  apartments: ApartmentData[];
}

interface VisibleLayers {
  hospital: boolean;
  patients: boolean;
  competitors: boolean;
  apartments: boolean;
}

interface Stats {
  totalPatients: number;
  ageDistribution: Record<string, number>;
  visitTypeDistribution: Record<string, number>;
  departmentDistribution: Record<string, number>;
  totalApartments: number;
  totalHouseholds: number;
}

// ──────────────────────────────────────────────────────────
// 상수 설정
// ──────────────────────────────────────────────────────────
// Naver API 키 (실제 키로 교체 필요)
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

const AGE_COLORS: Record<string, string> = {
  "0-9": "#FFC0CB",
  "10-19": "#FFA500",
  "20-29": "#FF0000",
  "30-39": "#800080",
  "40-49": "#0000FF",
  "50-59": "#008000",
  "60+": "#000000",
  Unknown: "#808080",
};

// ──────────────────────────────────────────────────────────
// 유틸리티 함수
// ──────────────────────────────────────────────────────────
const createAgeGroup = (age?: number | string): string => {
  if (age === undefined || age === null) return "Unknown";
  const numAge = typeof age === "string" ? parseInt(age) : age;
  if (isNaN(numAge)) return "Unknown";
  if (numAge < 10) return "0-9";
  if (numAge < 20) return "10-19";
  if (numAge < 30) return "20-29";
  if (numAge < 40) return "30-39";
  if (numAge < 50) return "40-49";
  if (numAge < 60) return "50-59";
  return "60+";
};

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const getDefaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
};

// ──────────────────────────────────────────────────────────
// Naver 지오코딩 API (백엔드 프록시 사용 권장)
// ──────────────────────────────────────────────────────────
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    // 백엔드 프록시를 통해 호출 (CORS 문제 방지)
    const response = await fetch(`${API_BASE_URL}/geocode/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.lat && data.lng) {
      return { lat: data.lat, lng: data.lng };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

// 엑셀 파싱 함수 (경쟁병원용 - 병원명, 주소, 진료과)
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
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const competitors: CompetitorData[] = [];
        const total = jsonData.length;

        for (let i = 0; i < jsonData.length; i++) {
          const row: any = jsonData[i];
          const name = row["병원명"] || row["name"] || "";
          const address = row["주소"] || row["address"] || "";
          const department = row["진료과"] || row["department"] || "기타";

          if (!name || !address) continue;

          setLoadingMessage(`경쟁병원 좌표 변환 중... (${i + 1}/${total})`);

          // 주소로 좌표 변환
          const coords = await geocodeAddress(address);

          if (coords) {
            competitors.push({
              name: name.trim(),
              address: address.trim(),
              lat: coords.lat,
              lng: coords.lng,
              department: department.trim(),
            });
          }

          // API 호출 제한 방지
          await new Promise((r) => setTimeout(r, 100));
        }

        resolve(competitors);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsBinaryString(file);
  });
};

// 엑셀 파싱 함수 (아파트용)
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
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const apartments: ApartmentData[] = [];
        const total = jsonData.length;

        for (let i = 0; i < jsonData.length; i++) {
          const row: any = jsonData[i];
          const name = row["단지명"] || "";
          const address = row["주소"] || "";
          const price = row["4주금액"] || "";
          const executed = row["집행 여부"] || "";
          const totalHouseholds = parseInt(row["총 세대 수"]) || 0;

          if (!name || !address) continue;

          setLoadingMessage(`아파트 좌표 변환 중... (${i + 1}/${total})`);

          // 주소로 좌표 변환
          const coords = await geocodeAddress(address);

          if (coords) {
            apartments.push({
              name: name.trim(),
              address: address.trim(),
              price: price.toString().trim(),
              executed: executed.trim(),
              totalHouseholds,
              lat: coords.lat,
              lng: coords.lng,
            });
          }

          // API 호출 제한 방지
          await new Promise((r) => setTimeout(r, 100));
        }

        resolve(apartments);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsBinaryString(file);
  });
};

// ──────────────────────────────────────────────────────────
// API 함수
// ──────────────────────────────────────────────────────────
const fetchHospitalInfo = async (
  token: string
): Promise<{ name: string; lat: number; lng: number }> => {
  const response = await fetch(`${API_BASE_URL}/users/info`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "병원 정보를 가져오는데 실패했습니다.");
  }

  const data = await response.json();
  const user = data.user;

  return {
    name: user?.hospital_name || user?.hospitalName || user?.name || "우리 병원",
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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "환자 데이터를 가져오는데 실패했습니다.");
  }

  const data = await response.json();
  const locations = data.locations || data.data || data || [];

  return locations.map((p: any) => ({
    lat: p.lat,
    lng: p.lng,
    age: p.age ? parseInt(p.age) : undefined,
    visit_type: p.visit_type || undefined,
    total_cost: p.total_cost || undefined,
    route: p.route || undefined,
    age_group: createAgeGroup(p.age),
  }));
};

// ──────────────────────────────────────────────────────────
// 지도 중심 변경 컴포넌트 (초기 로드 또는 center 변경 시에만 동작)
// ──────────────────────────────────────────────────────────
const ChangeMapView: React.FC<{ center: [number, number]; zoom: number }> = ({
  center,
  zoom,
}) => {
  const map = useMap();
  const prevCenterRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    // 초기 로드 또는 center가 실제로 변경된 경우에만 setView 호출
    const prevCenter = prevCenterRef.current;
    if (
      !prevCenter ||
      prevCenter[0] !== center[0] ||
      prevCenter[1] !== center[1]
    ) {
      map.setView(center, zoom);
      prevCenterRef.current = center;
    }
  }, [center, zoom, map]);

  return null;
};

// ──────────────────────────────────────────────────────────
// 커스텀 마커 아이콘 생성
// ──────────────────────────────────────────────────────────
const createHospitalIcon = () => {
  return L.divIcon({
    className: "custom-hospital-marker",
    html: `
      <div style="
        width: 44px;
        height: 44px;
        background: #3B82F6;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
      ">
        🏥
      </div>
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
        width: 12px;
        height: 12px;
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
        width: ${size}px;
        height: ${size}px;
        background: ${colors.bg};
        border-radius: 50%;
        border: 2px solid ${colors.border};
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${Math.max(12, size / 2.5)}px;
      ">
        🏠
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// 선택된 아파트 마커 아이콘 (파란색 테두리 + 체크마크)
const createSelectedApartmentIcon = (size: number) => {
  return L.divIcon({
    className: "custom-apartment-marker selected",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: rgba(37, 99, 235, 0.9);
        border-radius: 50%;
        border: 3px solid #1d4ed8;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3), 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${Math.max(14, size / 2)}px;
        cursor: pointer;
        color: white;
      ">
        ✓
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// 선택 모드일 때 아파트 마커 아이콘 (클릭 유도, 집행 여부에 따른 색상)
const createSelectableApartmentIcon = (size: number, executed: string) => {
  const colors = getApartmentColors(executed);
  return L.divIcon({
    className: "custom-apartment-marker selectable",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${colors.bgLight};
        border-radius: 50%;
        border: 2px dashed ${colors.border};
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${Math.max(12, size / 2.5)}px;
        cursor: pointer;
        animation: pulse 1.5s infinite;
      ">
        🏠
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// ──────────────────────────────────────────────────────────
// 메인 컴포넌트
// ──────────────────────────────────────────────────────────
const HospitalMapAnalysisPage: React.FC = () => {
  const navigate = useNavigate();

  // 인증 상태
  const [authToken, setAuthToken] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 기간 설정
  const defaultDates = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);

  // 설정 상태
  const [config, setConfig] = useState<AnalysisConfig>({
    hospitalName: "",
    hospitalLocation: { lat: 37.5665, lng: 126.978, name: "" },
    patients: [],
    competitors: [],
    apartments: [],
  });

  // UI 상태
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"auth" | "config" | "map">("auth");
  const [visibleLayers, setVisibleLayers] = useState<VisibleLayers>({
    hospital: true,
    patients: true,
    competitors: true,
    apartments: true,
  });
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // 아파트 선택 모드
  const [isSelectingApartments, setIsSelectingApartments] = useState(false);
  const [selectedApartmentIndices, setSelectedApartmentIndices] = useState<number[]>([]);

  // 통계
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    ageDistribution: {},
    visitTypeDistribution: {},
    departmentDistribution: {},
    totalApartments: 0,
    totalHouseholds: 0,
  });

  // ──────────────────────────────────────────────────────────
  // 클러스터 아이콘 생성 함수 (상대적 밀집도 - 5단계)
  // ──────────────────────────────────────────────────────────
  const createClusterIcon = useMemo(() => {
    const totalPatients = stats.totalPatients || 1;
    const clusterOpacity = isSelectingApartments ? 0.25 : 0.7;

    return (cluster: any) => {
      const count = cluster.getChildCount();
      const percentage = (count / totalPatients) * 100;

      let size: number;
      let fontSize: number;
      let bgColor: string;
      let borderColor: string;

      if (percentage >= 5) {
        size = 60;
        fontSize = 18;
        bgColor = `rgba(220, 38, 38, ${clusterOpacity})`;
        borderColor = isSelectingApartments ? "rgba(185, 28, 28, 0.4)" : "#b91c1c";
      } else if (percentage >= 2.5) {
        size = 52;
        fontSize = 16;
        bgColor = `rgba(234, 88, 12, ${clusterOpacity})`;
        borderColor = isSelectingApartments ? "rgba(194, 65, 12, 0.4)" : "#c2410c";
      } else if (percentage >= 1.25) {
        size = 45;
        fontSize = 15;
        bgColor = `rgba(234, 179, 8, ${clusterOpacity})`;
        borderColor = isSelectingApartments ? "rgba(202, 138, 4, 0.4)" : "#ca8a04";
      } else if (percentage >= 0.625) {
        size = 40;
        fontSize = 14;
        bgColor = `rgba(34, 197, 94, ${clusterOpacity})`;
        borderColor = isSelectingApartments ? "rgba(21, 128, 61, 0.4)" : "#15803d";
      } else {
        size = 35;
        fontSize = 13;
        bgColor = `rgba(59, 130, 246, ${clusterOpacity})`;
        borderColor = isSelectingApartments ? "rgba(29, 78, 216, 0.4)" : "#1d4ed8";
      }

      return L.divIcon({
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background: ${bgColor};
            border-radius: 50%;
            border: 3px solid ${borderColor};
            box-shadow: 0 3px 10px rgba(0,0,0,${isSelectingApartments ? 0.1 : 0.3});
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${isSelectingApartments ? "rgba(255,255,255,0.5)" : "white"};
            font-weight: bold;
            font-size: ${fontSize}px;
            text-shadow: 1px 1px 2px rgba(0,0,0,${isSelectingApartments ? 0.2 : 0.5});
            pointer-events: ${isSelectingApartments ? "none" : "auto"};
          ">
            ${count}
          </div>
        `,
        className: "custom-cluster-icon",
        iconSize: L.point(size, size),
      });
    };
  }, [stats.totalPatients, isSelectingApartments]);

  // ──────────────────────────────────────────────────────────
  // 아파트 마커 크기 계산 (상대적)
  // ──────────────────────────────────────────────────────────
  const getApartmentMarkerSize = useMemo(() => {
    const maxHouseholds = Math.max(...config.apartments.map((a) => a.totalHouseholds), 1);

    return (households: number) => {
      const ratio = households / maxHouseholds;
      const minSize = 24;
      const maxSize = 50;
      return Math.round(minSize + ratio * (maxSize - minSize));
    };
  }, [config.apartments]);

  // ──────────────────────────────────────────────────────────
  // 필터링된 데이터
  // ──────────────────────────────────────────────────────────
  const filteredPatients = useMemo(() => {
    if (selectedAgeGroup === "all") return config.patients;
    return config.patients.filter((p) => p.age_group === selectedAgeGroup);
  }, [config.patients, selectedAgeGroup]);

  const filteredCompetitors = useMemo(() => {
    if (selectedDepartment === "all") return config.competitors;
    return config.competitors.filter((c) => c.department === selectedDepartment);
  }, [config.competitors, selectedDepartment]);

  // ──────────────────────────────────────────────────────────
  // 데이터 로드
  // ──────────────────────────────────────────────────────────
  const loadDataFromAPI = async (token: string) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      setLoadingMessage("병원 정보 로드 중...");
      const hospitalInfo = await fetchHospitalInfo(token);

      setConfig((prev) => ({
        ...prev,
        hospitalName: hospitalInfo.name,
        hospitalLocation: {
          lat: hospitalInfo.lat,
          lng: hospitalInfo.lng,
          name: hospitalInfo.name,
        },
      }));

      setLoadingMessage("환자 위치 데이터 로드 중...");
      const patients = await fetchPatientLocations(token, startDate, endDate);

      setConfig((prev) => ({ ...prev, patients }));
      calculateStats(patients);

      setIsAuthenticated(true);
      setActiveTab("config");
      setLoadingMessage("");
    } catch (error: any) {
      setErrorMessage(error.message || "데이터 로드 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (patients: PatientData[]) => {
    const ageDistribution: Record<string, number> = {};
    const visitTypeDistribution: Record<string, number> = {};

    patients.forEach((p) => {
      const ageGroup = p.age_group || "Unknown";
      ageDistribution[ageGroup] = (ageDistribution[ageGroup] || 0) + 1;

      if (p.visit_type) {
        visitTypeDistribution[p.visit_type] =
          (visitTypeDistribution[p.visit_type] || 0) + 1;
      }
    });

    setStats((prev) => ({
      ...prev,
      totalPatients: patients.length,
      ageDistribution,
      visitTypeDistribution,
    }));
  };

  const handleLogin = async () => {
    if (!authToken.trim()) {
      setErrorMessage("토큰을 입력해주세요.");
      return;
    }
    await loadDataFromAPI(authToken);
  };

  const handleReloadData = async () => {
    if (!authToken) return;
    setIsLoading(true);
    setLoadingMessage("환자 데이터 재로드 중...");

    try {
      const patients = await fetchPatientLocations(authToken, startDate, endDate);
      setConfig((prev) => ({ ...prev, patients }));
      calculateStats(patients);
    } catch (error: any) {
      setErrorMessage(error.message || "데이터 로드 실패");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  // ──────────────────────────────────────────────────────────
  // 경쟁병원 엑셀 업로드
  // ──────────────────────────────────────────────────────────
  const handleCompetitorUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      const competitors = await parseCompetitorExcel(file, setLoadingMessage);
      setConfig((prev) => ({ ...prev, competitors }));

      const departmentDistribution: Record<string, number> = {};
      competitors.forEach((c) => {
        departmentDistribution[c.department] =
          (departmentDistribution[c.department] || 0) + 1;
      });

      setStats((prev) => ({ ...prev, departmentDistribution }));
      setLoadingMessage("");
    } catch (error: any) {
      setErrorMessage("엑셀 파일 처리 실패: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────
  // 아파트 엑셀 업로드
  // ──────────────────────────────────────────────────────────
  const handleApartmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      const apartments = await parseApartmentExcel(file, setLoadingMessage);
      setConfig((prev) => ({ ...prev, apartments }));

      const totalHouseholds = apartments.reduce((sum, a) => sum + a.totalHouseholds, 0);

      setStats((prev) => ({
        ...prev,
        totalApartments: apartments.length,
        totalHouseholds,
      }));
      setLoadingMessage("");
    } catch (error: any) {
      setErrorMessage("엑셀 파일 처리 실패: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────
  // 데이터 연동 페이지로 돌아가기
  // ──────────────────────────────────────────────────────────
  const handleBackToAuth = () => {
    setActiveTab("auth");
  };

  // ──────────────────────────────────────────────────────────
  // 렌더링
  // ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {/* 헤더 */}
      {/* 헤더 */}
            {/* 헤더 */}
        <header
        style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb" }}
        >
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
                onClick={() => navigate("/admin/dashboard")}
                style={{
                color: "#6b7280",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                }}
            >
                ← 대시보드로
            </button>
            <h1
                style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#111827",
                margin: 0,
                }}
            >
                🗺️ 병원 위치 분석 시스템
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
                    backgroundColor: activeTab === "auth" ? "#2563eb" : "#e5e7eb",
                    color: activeTab === "auth" ? "#fff" : "#374151",
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
                    backgroundColor: activeTab === "config" ? "#2563eb" : "#e5e7eb",
                    color: activeTab === "config" ? "#fff" : "#374151",
                }}
                >
                ⚙️ 설정
                </button>
                <button
                onClick={() => setActiveTab("map")}
                disabled={!config.hospitalLocation.lat}
                style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontWeight: 500,
                    fontSize: "14px",
                    border: "none",
                    cursor: config.hospitalLocation.lat ? "pointer" : "not-allowed",
                    backgroundColor: activeTab === "map" ? "#2563eb" : "#e5e7eb",
                    color: activeTab === "map" ? "#fff" : "#374151",
                    opacity: config.hospitalLocation.lat ? 1 : 0.5,
                }}
                >
                🗺️ 지도 보기
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
            <h2
            style={{
                fontSize: "20px",
                fontWeight: 600,
                marginBottom: "24px",
                textAlign: "center",
            }}
            >
            🔐 데이터 연동
            </h2>

            {/* ⭐ 분석 유형 선택 */}
            <div style={{ marginBottom: "24px" }}>
            <label
                style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: "#374151",
                marginBottom: "8px",
                }}
            >
                📊 분석 유형 선택
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
                <button
                style={{
                    flex: 1,
                    padding: "16px",
                    borderRadius: "8px",
                    border: "2px solid #2563eb",
                    backgroundColor: "#eff6ff",
                    cursor: "pointer",
                    textAlign: "center",
                }}
                >
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>📍</div>
                <div style={{ fontWeight: 600, color: "#1e40af" }}>환자 분포</div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                    현재 환자 위치 분석
                </div>
                </button>
                <button
                onClick={() => navigate("/admin/patient-comparison")}
                style={{
                    flex: 1,
                    padding: "16px",
                    borderRadius: "8px",
                    border: "2px solid #e5e7eb",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    textAlign: "center",
                }}
                >
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>📊</div>
                <div style={{ fontWeight: 600, color: "#374151" }}>기간 비교</div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                    두 기간 환자 수 비교
                </div>
                </button>
            </div>
            </div>

            <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
            }}
            >
            {/* 토큰 입력 */}
            <div>
                <label
                style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: "4px",
                }}
                >
                API 토큰
                </label>
                <input
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
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

            {/* 기간 설정 */}
            <div>
                <label
                style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: "4px",
                }}
                >
                📅 조회 기간
                </label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                    flex: 1,
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    }}
                />
                <span style={{ color: "#6b7280" }}>~</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                    flex: 1,
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    }}
                />
                </div>
            </div>

            {errorMessage && (
                <p
                style={{
                    color: "#dc2626",
                    fontSize: "14px",
                    margin: 0,
                    padding: "8px 12px",
                    backgroundColor: "#fef2f2",
                    borderRadius: "6px",
                }}
                >
                {errorMessage}
                </p>
            )}

            <button
                onClick={handleLogin}
                disabled={isLoading}
                style={{
                width: "100%",
                padding: "12px",
                backgroundColor: isLoading ? "#9ca3af" : "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: isLoading ? "not-allowed" : "pointer",
                }}
            >
                {isLoading ? loadingMessage : "데이터 불러오기"}
            </button>

            {isAuthenticated && (
                <p
                style={{
                    textAlign: "center",
                    color: "#16a34a",
                    fontSize: "14px",
                    margin: 0,
                }}
                >
                ✅ 연동 완료 - {stats.totalPatients.toLocaleString()}명 로드됨
                </p>
            )}
            </div>
        </div>
        )}

        {/* 설정 탭 */}
        {activeTab === "config" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px",
            }}
          >
            {/* 병원 정보 + 기간 설정 */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  marginBottom: "16px",
                }}
              >
                🏥 병원 정보 & 기간 설정
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                  }}
                >
                  <span style={{ color: "#6b7280" }}>병원명</span>
                  <span style={{ fontWeight: 500 }}>{config.hospitalName}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                  }}
                >
                  <span style={{ color: "#6b7280" }}>위치</span>
                  <span style={{ fontWeight: 500 }}>
                    {config.hospitalLocation.lat.toFixed(4)},{" "}
                    {config.hospitalLocation.lng.toFixed(4)}
                  </span>
                </div>

                <div style={{ marginTop: "8px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    📅 조회 기간
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    />
                    <span style={{ color: "#6b7280" }}>~</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                  <button
                    onClick={handleReloadData}
                    disabled={isLoading}
                    style={{
                      marginTop: "8px",
                      width: "100%",
                      padding: "10px",
                      backgroundColor: isLoading ? "#9ca3af" : "#059669",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: isLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {isLoading ? "로딩 중..." : "🔄 기간 변경 후 재로드"}
                  </button>
                </div>
              </div>
            </div>

            {/* 경쟁병원 업로드 */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  marginBottom: "16px",
                }}
              >
                🏢 경쟁병원 데이터
              </h2>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: "4px",
                  }}
                >
                  경쟁병원 엑셀 파일 (xlsx)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleCompetitorUpload}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  필수 컬럼: 병원명, 주소, 진료과
                </p>
                {config.competitors.length > 0 && (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#16a34a",
                      marginTop: "8px",
                    }}
                  >
                    ✅ {config.competitors.length}개 병원 로드됨
                  </p>
                )}
              </div>
            </div>

            {/* 아파트 업로드 */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  marginBottom: "16px",
                }}
              >
                🏠 아파트 데이터
              </h2>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: "4px",
                  }}
                >
                  아파트 엑셀 파일 (xlsx)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleApartmentUpload}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  필수 컬럼: 단지명, 주소, 4주금액, 집행 여부, 총 세대 수
                </p>
                {config.apartments.length > 0 && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "12px",
                      backgroundColor: "#f5f3ff",
                      borderRadius: "8px",
                      border: "1px solid #e9d5ff",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#16a34a",
                        margin: "0 0 8px 0",
                        fontWeight: 600,
                      }}
                    >
                      ✅ {config.apartments.length}개 단지 ({stats.totalHouseholds.toLocaleString()}세대) 로드됨
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#7c3aed",
                        margin: 0,
                      }}
                    >
                      💡 지도 페이지에서 아파트를 선택하여 비용을 계산할 수 있습니다
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 데이터 요약 - 환자 통계만 */}
            {stats.totalPatients > 0 && (
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  gridColumn: "1 / -1",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "16px",
                  }}
                >
                  📊 데이터 요약
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "24px",
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      backgroundColor: "#eff6ff",
                      borderRadius: "8px",
                    }}
                  >
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
                      환자 수
                    </p>
                    <p
                      style={{
                        fontSize: "28px",
                        fontWeight: "bold",
                        color: "#2563eb",
                        margin: "4px 0 0 0",
                      }}
                    >
                      {stats.totalPatients.toLocaleString()}명
                    </p>
                    <p style={{ fontSize: "11px", color: "#6b7280", margin: "4px 0 0 0" }}>
                      {startDate} ~ {endDate}
                    </p>
                  </div>

                  <div
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      backgroundColor: "#fef3c7",
                      borderRadius: "8px",
                    }}
                  >
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
                      경쟁병원
                    </p>
                    <p
                      style={{
                        fontSize: "28px",
                        fontWeight: "bold",
                        color: "#d97706",
                        margin: "4px 0 0 0",
                      }}
                    >
                      {config.competitors.length}개
                    </p>
                  </div>

                  <div
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      backgroundColor: "#f3e8ff",
                      borderRadius: "8px",
                    }}
                  >
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
                      아파트 단지
                    </p>
                    <p
                      style={{
                        fontSize: "28px",
                        fontWeight: "bold",
                        color: "#7c3aed",
                        margin: "4px 0 0 0",
                      }}
                    >
                      {config.apartments.length}개
                    </p>
                    <p style={{ fontSize: "11px", color: "#6b7280", margin: "4px 0 0 0" }}>
                      총 {stats.totalHouseholds.toLocaleString()}세대
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 지도 탭 */}
        {activeTab === "map" && (
          <div
            style={{
              display: "flex",
              gap: "16px",
              height: "calc(100vh - 140px)",
            }}
          >
            {/* 사이드바 */}
            <div
              style={{
                width: "280px",
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                overflowY: "auto",
              }}
            >
              <h3 style={{ fontWeight: 600, marginBottom: "16px" }}>
                🎛️ 레이어 컨트롤
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginBottom: "24px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={visibleLayers.hospital}
                    onChange={(e) =>
                      setVisibleLayers((prev) => ({
                        ...prev,
                        hospital: e.target.checked,
                      }))
                    }
                  />
                  <span>🏥 우리 병원</span>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={visibleLayers.patients}
                    onChange={(e) =>
                      setVisibleLayers((prev) => ({
                        ...prev,
                        patients: e.target.checked,
                      }))
                    }
                  />
                  <span>👥 환자 분포 ({filteredPatients.length}명)</span>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={visibleLayers.competitors}
                    onChange={(e) =>
                      setVisibleLayers((prev) => ({
                        ...prev,
                        competitors: e.target.checked,
                      }))
                    }
                  />
                  <span>🏢 경쟁병원 ({filteredCompetitors.length}개)</span>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={visibleLayers.apartments}
                    onChange={(e) =>
                      setVisibleLayers((prev) => ({
                        ...prev,
                        apartments: e.target.checked,
                      }))
                    }
                  />
                  <span>🏠 아파트 ({config.apartments.length}개)</span>
                </label>
              </div>

              {visibleLayers.patients && stats.totalPatients > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h4
                    style={{
                      fontWeight: 500,
                      fontSize: "14px",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    연령대 필터
                  </h4>
                  <select
                    value={selectedAgeGroup}
                    onChange={(e) => setSelectedAgeGroup(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <option value="all">전체 ({stats.totalPatients}명)</option>
                    {Object.entries(stats.ageDistribution)
                      .sort()
                      .map(([age, count]) => (
                        <option key={age} value={age}>
                          {age}세 ({count}명)
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {visibleLayers.competitors && config.competitors.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h4
                    style={{
                      fontWeight: 500,
                      fontSize: "14px",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    진료과 필터
                  </h4>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <option value="all">전체 ({config.competitors.length}개)</option>
                    {Object.entries(stats.departmentDistribution).map(
                      ([dept, count]) => (
                        <option key={dept} value={dept}>
                          {dept} ({count}개)
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              {/* 범례 */}
              <div
                style={{
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "16px",
                }}
              >
                <h4
                  style={{
                    fontWeight: 500,
                    fontSize: "14px",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  📊 밀집도 (총 {stats.totalPatients.toLocaleString()}명)
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                    fontSize: "11px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "rgba(220, 38, 38, 0.7)",
                        border: "2px solid #b91c1c",
                        flexShrink: 0,
                      }}
                    />
                    <span>5% 이상</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: "rgba(234, 88, 12, 0.7)",
                        border: "2px solid #c2410c",
                        flexShrink: 0,
                      }}
                    />
                    <span>2.5~5%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "rgba(234, 179, 8, 0.7)",
                        border: "2px solid #ca8a04",
                        flexShrink: 0,
                      }}
                    />
                    <span>1.25~2.5%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: "rgba(34, 197, 94, 0.7)",
                        border: "2px solid #15803d",
                        flexShrink: 0,
                      }}
                    />
                    <span>0.625~1.25%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "rgba(59, 130, 246, 0.7)",
                        border: "2px solid #1d4ed8",
                        flexShrink: 0,
                      }}
                    />
                    <span>0.625% 미만</span>
                  </div>
                </div>

                {/* 아파트 범례 */}
                {config.apartments.length > 0 && (
                  <>
                    <h4
                      style={{
                        fontWeight: 500,
                        fontSize: "14px",
                        color: "#374151",
                        marginBottom: "8px",
                        marginTop: "16px",
                      }}
                    >
                      🏠 아파트 (세대 수 기준)
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "11px",
                      }}
                    >
                      <span
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: "rgba(139, 92, 246, 0.7)",
                          border: "2px solid #7c3aed",
                        }}
                      />
                      <span>작음</span>
                      <span style={{ margin: "0 4px" }}>→</span>
                      <span
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "rgba(139, 92, 246, 0.7)",
                          border: "2px solid #7c3aed",
                        }}
                      />
                      <span>많음</span>
                    </div>
                  </>
                )}
              </div>

              {/* 🏠 아파트 선택 패널 */}
              {config.apartments.length > 0 && (
                <div
                  style={{
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: "16px",
                    marginTop: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <h4
                      style={{
                        fontWeight: 600,
                        fontSize: "14px",
                        color: "#374151",
                        margin: 0,
                      }}
                    >
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
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#7c3aed",
                        backgroundColor: "#f5f3ff",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        marginBottom: "12px",
                      }}
                    >
                      💡 지도에서 아파트를 클릭하여 선택/해제하세요
                    </p>
                  )}

                  {/* 선택된 아파트 통계 */}
                  {selectedApartmentIndices.length > 0 && (
                    <div
                      style={{
                        backgroundColor: "#f0fdf4",
                        borderRadius: "8px",
                        padding: "12px",
                        border: "1px solid #bbf7d0",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#15803d" }}>
                          ✅ {selectedApartmentIndices.length}개 선택됨
                        </span>
                        <button
                          onClick={() => setSelectedApartmentIndices([])}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#fee2e2",
                            color: "#dc2626",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          전체 해제
                        </button>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            padding: "10px",
                            backgroundColor: "#fff",
                            borderRadius: "6px",
                            textAlign: "center",
                          }}
                        >
                          <p style={{ margin: 0, fontSize: "10px", color: "#6b7280" }}>총 세대 수</p>
                          <p style={{ margin: "4px 0 0 0", fontSize: "16px", fontWeight: "bold", color: "#7c3aed" }}>
                            {selectedApartmentIndices
                              .reduce((sum, idx) => sum + (config.apartments[idx]?.totalHouseholds || 0), 0)
                              .toLocaleString()}
                          </p>
                        </div>
                        <div
                          style={{
                            padding: "10px",
                            backgroundColor: "#fff",
                            borderRadius: "6px",
                            textAlign: "center",
                          }}
                        >
                          <p style={{ margin: 0, fontSize: "10px", color: "#6b7280" }}>총 비용</p>
                          <p style={{ margin: "4px 0 0 0", fontSize: "16px", fontWeight: "bold", color: "#2563eb" }}>
                            {selectedApartmentIndices
                              .reduce((sum, idx) => {
                                const price = config.apartments[idx]?.price || "0";
                                const numericPrice = parseInt(price.replace(/[^0-9]/g, "")) || 0;
                                return sum + numericPrice;
                              }, 0)
                              .toLocaleString()}원
                          </p>
                        </div>
                      </div>

                      {/* 선택된 아파트 목록 */}
                      <div
                        style={{
                          maxHeight: "180px",
                          overflowY: "auto",
                        }}
                      >
                        {selectedApartmentIndices.map((idx) => {
                          const apartment = config.apartments[idx];
                          if (!apartment) return null;
                          return (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px",
                                backgroundColor: "#fff",
                                borderRadius: "6px",
                                marginBottom: "4px",
                                fontSize: "11px",
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {apartment.name}
                                </p>
                                <p style={{ margin: "2px 0 0 0", color: "#6b7280", fontSize: "10px" }}>
                                  {apartment.totalHouseholds.toLocaleString()}세대 · {apartment.price}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  setSelectedApartmentIndices((prev) => prev.filter((i) => i !== idx))
                                }
                                style={{
                                  padding: "3px 6px",
                                  backgroundColor: "#fee2e2",
                                  color: "#dc2626",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "10px",
                                  cursor: "pointer",
                                  flexShrink: 0,
                                  marginLeft: "8px",
                                }}
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
                          // 선택된 아파트 데이터 준비
                          const exportData = selectedApartmentIndices.map((idx) => {
                            const apt = config.apartments[idx];
                            return {
                              "단지명": apt?.name || "",
                              "집행여부": apt?.executed || "",
                              "4주금액": apt?.price || "",
                              "세대수": apt?.totalHouseholds || 0,
                            };
                          });

                          // 합계 행 추가
                          const totalHouseholds = selectedApartmentIndices.reduce(
                            (sum, idx) => sum + (config.apartments[idx]?.totalHouseholds || 0),
                            0
                          );
                          const totalPrice = selectedApartmentIndices.reduce((sum, idx) => {
                            const price = config.apartments[idx]?.price || "0";
                            return sum + (parseInt(price.replace(/[^0-9]/g, "")) || 0);
                          }, 0);

                          exportData.push({
                            "단지명": "합계",
                            "집행여부": "",
                            "4주금액": totalPrice.toLocaleString() + "원",
                            "세대수": totalHouseholds,
                          });

                          // 엑셀 파일 생성
                          const worksheet = XLSX.utils.json_to_sheet(exportData);
                          const workbook = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(workbook, worksheet, "선택된 아파트");

                          // 열 너비 설정
                          worksheet["!cols"] = [
                            { wch: 25 }, // 단지명
                            { wch: 10 }, // 집행여부
                            { wch: 15 }, // 4주금액
                            { wch: 10 }, // 세대수
                          ];

                          // 다운로드
                          const today = new Date().toISOString().split("T")[0];
                          XLSX.writeFile(workbook, `선택된_아파트_${today}.xlsx`);
                        }}
                        style={{
                          marginTop: "10px",
                          padding: "8px 12px",
                          backgroundColor: "#2563eb",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        📥 엑셀 다운로드
                      </button>
                    </div>
                  )}

                  {/* 아파트가 선택되지 않았을 때 */}
                  {selectedApartmentIndices.length === 0 && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        textAlign: "center",
                        padding: "16px",
                        backgroundColor: "#f9fafb",
                        borderRadius: "6px",
                      }}
                    >
                      {isSelectingApartments
                        ? "지도에서 아파트를 클릭하세요"
                        : "선택된 아파트가 없습니다"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Leaflet 지도 */}
            <div
              style={{
                flex: 1,
                backgroundColor: "#fff",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <MapContainer
                center={[
                  config.hospitalLocation.lat,
                  config.hospitalLocation.lng,
                ]}
                zoom={13}
                style={{ width: "100%", height: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ChangeMapView
                  center={[
                    config.hospitalLocation.lat,
                    config.hospitalLocation.lng,
                  ]}
                  zoom={13}
                />

                {/* 🏥 우리 병원 마커 */}
                {visibleLayers.hospital && config.hospitalLocation.lat !== 0 && (
                  <Marker
                    position={[
                      config.hospitalLocation.lat,
                      config.hospitalLocation.lng,
                    ]}
                    icon={createHospitalIcon()}
                  >
                    <Popup>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                          {config.hospitalName}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                          우리 병원
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* 👥 환자 마커 (클러스터링) */}
                {visibleLayers.patients && (
                  <MarkerClusterGroup
                    chunkedLoading
                    maxClusterRadius={80}
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={false}
                    iconCreateFunction={createClusterIcon}
                  >
                    {filteredPatients.map((patient, index) => (
                      <CircleMarker
                        key={`patient-${index}`}
                        center={[patient.lat, patient.lng]}
                        radius={8}
                        fillColor={AGE_COLORS[patient.age_group || "Unknown"]}
                        color="#fff"
                        weight={2}
                        opacity={isSelectingApartments ? 0.3 : 1}
                        fillOpacity={isSelectingApartments ? 0.2 : 0.9}
                      >
                        <Popup>
                          <div style={{ fontSize: "12px", minWidth: "140px" }}>
                            <div
                              style={{
                                fontWeight: "bold",
                                marginBottom: "6px",
                                borderBottom: "1px solid #eee",
                                paddingBottom: "4px",
                              }}
                            >
                              환자 정보
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                              <span style={{ color: "#666" }}>연령대</span>
                              <span style={{ fontWeight: 500 }}>{patient.age_group}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                              <span style={{ color: "#666" }}>방문유형</span>
                              <span>{patient.visit_type || "-"}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                              <span style={{ color: "#666" }}>진료비</span>
                              <span>₩{(patient.total_cost || 0).toLocaleString()}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#666" }}>경로</span>
                              <span>{patient.route || "-"}</span>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MarkerClusterGroup>
                )}

                {/* 🏢 경쟁병원 마커 */}
                {visibleLayers.competitors &&
                  filteredCompetitors.map((competitor, index) => (
                    <Marker
                      key={`competitor-${index}`}
                      position={[competitor.lat, competitor.lng]}
                      icon={createCompetitorIcon(
                        DEPARTMENT_COLORS[competitor.department] ||
                          DEPARTMENT_COLORS["기타"]
                      )}
                    >
                      <Popup>
                        <div style={{ fontSize: "12px", minWidth: "150px" }}>
                          <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                            {competitor.name}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                            <span style={{ color: "#666" }}>진료과</span>
                            <span
                              style={{
                                background:
                                  DEPARTMENT_COLORS[competitor.department] ||
                                  DEPARTMENT_COLORS["기타"],
                                color: "white",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                              }}
                            >
                              {competitor.department}
                            </span>
                          </div>
                          <div style={{ color: "#666", fontSize: "11px", marginTop: "4px" }}>
                            {competitor.address}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* 🏠 아파트 마커 */}
                {visibleLayers.apartments &&
                  config.apartments.map((apartment, index) => {
                    const isSelected = selectedApartmentIndices.includes(index);
                    const markerSize = getApartmentMarkerSize(apartment.totalHouseholds);

                    // 선택된 아파트는 파란색, 선택 모드에서는 점선 테두리, 일반 모드는 집행여부에 따른 색상
                    const icon = isSelected
                      ? createSelectedApartmentIcon(markerSize)
                      : isSelectingApartments
                      ? createSelectableApartmentIcon(markerSize, apartment.executed)
                      : createApartmentIcon(markerSize, apartment.executed);

                    return (
                      <Marker
                        key={`apartment-${index}`}
                        position={[apartment.lat, apartment.lng]}
                        icon={icon}
                        zIndexOffset={isSelectingApartments ? 1000 : 0}
                        eventHandlers={{
                          click: () => {
                            if (isSelectingApartments) {
                              // 선택 모드일 때: 선택/해제 토글
                              setSelectedApartmentIndices((prev) =>
                                prev.includes(index)
                                  ? prev.filter((i) => i !== index)
                                  : [...prev, index]
                              );
                            }
                          },
                        }}
                      >
                        <Popup>
                          <div style={{ fontSize: "12px", minWidth: "180px" }}>
                            <div style={{ fontWeight: "bold", marginBottom: "6px", fontSize: "13px" }}>
                              {isSelected ? "✅" : "🏠"} {apartment.name}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                              <span style={{ color: "#666" }}>총 세대 수</span>
                              <span style={{ fontWeight: 600, color: "#7c3aed" }}>
                                {apartment.totalHouseholds.toLocaleString()}세대
                              </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                              <span style={{ color: "#666" }}>4주 금액</span>
                              <span>{apartment.price}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                              <span style={{ color: "#666" }}>집행 여부</span>
                              <span
                                style={{
                                  color: apartment.executed === "집행" ? "#16a34a" : "#dc2626",
                                  fontWeight: 500,
                                }}
                              >
                                {apartment.executed}
                              </span>
                            </div>
                            <div
                              style={{
                                color: "#666",
                                fontSize: "11px",
                                marginTop: "6px",
                                paddingTop: "6px",
                                borderTop: "1px solid #eee",
                              }}
                            >
                              {apartment.address}
                            </div>
                            {isSelectingApartments && (
                              <button
                                onClick={() => {
                                  setSelectedApartmentIndices((prev) =>
                                    prev.includes(index)
                                      ? prev.filter((i) => i !== index)
                                      : [...prev, index]
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
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              padding: "24px",
              textAlign: "center",
              minWidth: "200px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "4px solid #2563eb",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto",
              }}
            />
            <p style={{ marginTop: "12px", color: "#374151", fontSize: "14px" }}>
              {loadingMessage || "처리 중..."}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .leaflet-container {
          font-family: inherit;
        }
        .custom-cluster-icon {
          background: transparent !important;
        }
        .marker-cluster {
          background: transparent !important;
        }
        .marker-cluster div {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default HospitalMapAnalysisPage;