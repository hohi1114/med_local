import { apiRequest } from "./api/apihelper";
import { authApi } from "./api/apihelper";

// =============================================================================
// 타입
// =============================================================================

export interface HospitalSummary {
  id: string;
  name: string;
  director: string;
  specialistLicense: string;
  serviceLines: string[];
  locationHint: string;
  status: string;
  etlReviewStatus: string;
  pageUrl: string;
}

export interface MonthlyDb {
  databaseId: string;
  title: string;
  url: string;
}

export interface HospitalsResponse {
  hospitals: HospitalSummary[];
  monthlyDbs: MonthlyDb[];
}

export interface KeywordHospitalRequest {
  hospitalPageId: string;
  keywords: string[];
  emphasis?: string;
  hospitalSelectName?: string;
}

export interface BatchRequest {
  monthlyDbId?: string;
  hospitals: KeywordHospitalRequest[];
}

export interface RowPreview {
  title: string;
  additionalNote: string;
  pageBodyMarkdown: string;
  matchedTreatments: string[];
  matchedPersonas: string[];
  matchedMetaphors: string[];
  matchedDifferentiators: string[];
  matchingNote: string;
}

export interface RowResult {
  hospitalName: string;
  keyword: string;
  monthlyDbId: string;
  preview: RowPreview;
  created?: { id: string; url: string };
  warnings: string[];
}

export interface BatchResponse {
  monthlyDbId: string;
  total: number;
  rows: RowResult[];
  errors: Array<{ hospitalPageId: string; keyword: string; error: string }>;
}

export interface UpdateChange {
  field: string;
  before: string;
  after: string;
  summary: string;
}

export interface UpdatePreview {
  hospitalPageId: string;
  hospitalName: string;
  changes: UpdateChange[];
  beforeMarkdown: string;
  afterMarkdown: string;
}

// =============================================================================
// API
// =============================================================================

export const postingApi = {
  getHospitals: async (): Promise<HospitalsResponse> => {
    return apiRequest("get", "/api/posting/hospitals");
  },

  previewRows: async (req: BatchRequest): Promise<BatchResponse> => {
    return apiRequest("post", "/api/posting/preview-rows", req);
  },

  generateRows: async (req: BatchRequest): Promise<BatchResponse> => {
    return apiRequest("post", "/api/posting/generate-rows", req);
  },

  previewHospitalUpdate: async (
    hospitalPageId: string,
    changeNote: string,
  ): Promise<UpdatePreview> => {
    return apiRequest("post", "/api/posting/preview-hospital-update", {
      hospitalPageId,
      changeNote,
    });
  },

  commitHospitalUpdate: async (
    hospitalPageId: string,
    afterMarkdown: string,
    properties?: {
      serviceLines?: string[];
      specialistLicense?: string;
      serviceHours?: string;
      closedDays?: string;
      marketingRule?: string;
    },
  ): Promise<{ ok: true }> => {
    return apiRequest("post", "/api/posting/commit-hospital-update", {
      hospitalPageId,
      afterMarkdown,
      properties,
    });
  },

  importInterview: async (
    file?: File,
    text?: string,
  ): Promise<{ markdown: string }> => {
    const form = new FormData();
    if (file) form.append("interview", file);
    if (text) form.append("text", text);
    const res = await authApi.post("/api/posting/import-interview", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};
