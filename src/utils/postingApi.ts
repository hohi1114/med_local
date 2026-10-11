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
  hospitalPageId: string;
  hospitalSelectName: string;
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

export interface CommitPreviewItem {
  hospitalPageId: string;
  hospitalSelectName?: string;
  keyword: string;
  title: string;
  additionalNote?: string;
  pageBodyMarkdown: string;
}

export interface CommitPreviewResponse {
  monthlyDbId: string;
  total: number;
  created: Array<{
    keyword: string;
    title: string;
    notionId: string;
    notionUrl: string;
  }>;
  errors: Array<{ keyword: string; error: string }>;
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
    return apiRequest("get", "/posting/hospitals");
  },

  previewRows: async (req: BatchRequest): Promise<BatchResponse> => {
    return apiRequest("post", "/posting/preview-rows", req);
  },

  generateRows: async (req: BatchRequest): Promise<BatchResponse> => {
    return apiRequest("post", "/posting/generate-rows", req);
  },

  commitPreview: async (
    items: CommitPreviewItem[],
    monthlyDbId?: string,
  ): Promise<CommitPreviewResponse> => {
    return apiRequest("post", "/posting/commit-preview", { items, monthlyDbId });
  },

  previewHospitalUpdate: async (
    hospitalPageId: string,
    changeNote?: string,
    files?: File[],
  ): Promise<UpdatePreview> => {
    const form = new FormData();
    form.append("hospitalPageId", hospitalPageId);
    if (changeNote) form.append("changeNote", changeNote);
    (files || []).forEach((f) => form.append("interviews", f));
    const res = await authApi.post(
      "/posting/preview-hospital-update",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data;
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
    return apiRequest("post", "/posting/commit-hospital-update", {
      hospitalPageId,
      afterMarkdown,
      properties,
    });
  },

  importInterview: async (
    files?: File[],
    text?: string,
  ): Promise<{ markdown: string }> => {
    const form = new FormData();
    (files || []).forEach((f) => form.append("interviews", f));
    if (text) form.append("text", text);
    const res = await authApi.post("/posting/import-interview", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  previewImport: async (
    files?: File[],
    text?: string,
  ): Promise<StructuredImportData> => {
    const form = new FormData();
    (files || []).forEach((f) => form.append("interviews", f));
    if (text) form.append("text", text);
    const res = await authApi.post("/posting/preview-import", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  commitImport: async (
    data: StructuredImportData,
  ): Promise<CommitImportResult> => {
    return apiRequest("post", "/posting/commit-import", data);
  },
};

// =============================================================================
// 신규 인터뷰 자동 적재 타입
// =============================================================================

export interface StructuredImportData {
  profile: {
    hospitalName: string;
    director: string;
    specialistLicense: string;
    specialistMentionGuard: string;
    serviceLines: string[];
    address: string;
    locationHint: string;
    serviceHours: string;
    closedDays: string;
    parking: string;
    phone: string;
    homepageUrl: string;
    naverPlaceUrl: string;
    marketingRule: string;
    profileMarkdown: string;
  };
  treatments: Array<{
    name: string;
    category: string[];
    indication: string;
    mechanism: string;
    differentiator: string;
    clinicalNote: string;
    isSignature: boolean;
  }>;
  differentiators: Array<{
    point: string;
    otherHospital: string;
    ourHospital: string;
    reason: string;
    category: string[];
    strength: string;
  }>;
  metaphors: Array<{
    metaphor: string;
    shortDescription: string;
    category: string[];
    applyTo: string;
    originalQuote: string;
  }>;
  personas: Array<{
    persona: string;
    ageRanges: string[];
    gender: string;
    lifestyle: string;
    concern: string;
    purchaseDriver: string;
    matchedTreatment: string;
  }>;
}

export interface CommitImportResult {
  hospitalPageId: string;
  hospitalPageUrl: string;
  treatments: number;
  differentiators: number;
  metaphors: number;
  personas: number;
  errors: string[];
}
