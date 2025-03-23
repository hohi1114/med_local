// Interface for the backend response (adjust based on your backend's actual response)
export interface BackendResponse {
  message: string;
  processedRecords: number;
  geocodedRecords: number;
}

// Interfaces for your data structures
export interface VisitData {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
}

export interface PatientData {
  chartNumber: number;
  age: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}



// 일자별 수입 현황
export interface DailyIncomeEgis {
  chartNumber: number; // 1st column
  visitDate: string;   // 3rd column (date)
  totalCost: number;   // 8th column (총 진료비)
}

// 환자 목록
export interface PatientListEgis {
  chartNumber: number; // 1st column
  address: string;     // 8th column
}

// 환자별 수입 현황
export interface PatientIncomeEgis {
  chartNumber: number; // 1st column
  age: number;         // 4th column (나이)
}
