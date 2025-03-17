// Interface for the backend response (adjust based on your backend's actual response)
interface BackendResponse {
  message: string;
  processedRecords: number;
  geocodedRecords: number;
}

// Interfaces for your data structures
interface VisitData {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
}

interface PatientData {
  chartNumber: number;
  age: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}
