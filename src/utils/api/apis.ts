import { BackendData } from "../../types/medi-types";
import { LoginParams } from "../../pages/LoginPage";
import { saveTokensToCookie } from "./token";
import { logout, apiRequest } from "./apihelper";
import { getCookie } from "./cookie";
import { DateRange } from "../../hooks/useRangeDurationDatePicker";
import {
  postActiveLicenseParams,
  RegionPrivateParams,
  regionAnalysisParams,
  RegisterCardParams,
  StartSubscriptionParams
} from "../../types/params";
import {
  VisitData,
  PatientData,
  DailyIncomeEgis,
  PatientListEgis,
  PatientIncomeEgis,
  BackendResponse,
  PatientDataDentWeb
} from "../ExcelParser";

/**로그인 */
export const postLogin = async (loginData: LoginParams) => {
  const data = await apiRequest("post", `/auth/login`, loginData);
  await saveTokensToCookie({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in
  });

  return data;
};

export const postActiveLicense = async (
  licenseActiveParams: postActiveLicenseParams
) => {
  const data = await apiRequest("post", "/auth/activate", licenseActiveParams);
  return data;
};

export const postVerifyCode = async (hardwareNumber: string) => {
  const data = await apiRequest("post", "/auth/verify", {
    hardwareFingerprint: hardwareNumber
  });
  return data;
};

/**유저정보 */
export const getUserInfo = async () => {
  const data = await apiRequest("get", "/users/info");
  console.log(data);
  return data;
};

/** 멤버십 */
export const getMemberships = async () => {
  const data = await apiRequest("get", "/payment/memberships");
  return data;
};

export const postRegisterCard = async (cardInfo: RegisterCardParams) => {
  const data = await apiRequest("post", "/payment/register-card", cardInfo);
  return data;
};

export const postStratSubscription = async (
  membershipType: StartSubscriptionParams
) => {
  const data = await apiRequest(
    "post",
    "/payment/start-subscription",
    membershipType
  );
  return data;
};

export const postDeleteCard = async () => {
  const data = await apiRequest("post", "/payment/delete-card");
  return data;
};

export const getCardInfo = async () => {
  const data = await apiRequest("get", "/payment/card-info");
  return data;
};

export const postBilling = async (membershipType: string) => {
  const data = await apiRequest("post", "/payment/billing", {
    membershipType: membershipType
  });
  return data;
};

export const postManageCancelSubscription = async () => {
  const data = await apiRequest("post", "/payment/manage-cancel");
  return data;
};

export const changeSubscription = async (membershipType: string) => {
  const data = await apiRequest("post", "/payment/update", {
    membershipType: membershipType
  });
  return data;
};

export const postCancelSubscription = async () => {
  const data = await apiRequest("post", "/payment/cancel-subscription");
  return data;
};

export const postStartImmediately = async () => {
  const data = await apiRequest("post", "/payment/start-immediately");
  return data;
};

export const getPaymentHistory = async () => {
  const data = await apiRequest("get", "/payment/history");
  return data;
};

/**대시보드 */
export const getDashboardData = async (rangeDate: DateRange) => {
  const data = await apiRequest(
    "post",
    "/fetch/dashboard_date_patient",
    rangeDate
  );

  return data;
};

/**지도 */
export const getAllRegions = async () => {
  const data = await apiRequest("get", "/fetch/all_regions");
  return data;
};

export const getAllRegionsEtc = async (rangeDate: DateRange) => {
  const data = await apiRequest(
    "post",
    "/fetch/all_region_patient_cost",
    rangeDate
  );

  return data;
};

export const getRegionPrivateData = async (
  regionprivateParams: RegionPrivateParams
) => {
  const data = await apiRequest(
    "post",
    "/fetch/region_date_patient_info",
    regionprivateParams
  );

  return data;
};

/**지역별 분석 */
export const getRegionAnalysis = async (
  regionAnalysisParams: regionAnalysisParams
) => {
  const { region, rangeDate } = regionAnalysisParams;
  const data = await apiRequest(
    "post",
    `/fetch/dashboard_${region}_date_region`,
    rangeDate
  );
  return data;
};

export const postRefreshToken = async () => {
  const refreshToken = await getCookie("refreshToken");
  if (!refreshToken) {
    logout();
  }
  const data = await apiRequest("post", "/auth/refresh", {
    refresh_token: refreshToken
  });
  await saveTokensToCookie({
    access_token: data.access_token,
    refresh_token: data.refresh_token
  });

  return data.access_token;
};

export const getUploadedDates = async () => {
  const data = await apiRequest("get", "/fetch/dates");
  return data;
};

export const getUserEMR = async () => {
  try {
    const data = await apiRequest("post", "/auth/getemr");

    if (!data || data.error) {
      console.error("Error fetching EMR:", data?.error || "No data returned");
      return null;
    }

    return data.emr;
  } catch (error) {
    console.error("Error in getUserEMR function:", error);
    return null;
  }
};
export async function fetchDataFromBackend(): Promise<BackendData | undefined> {
  try {
    const data = await apiRequest("get", "/data/get_all");
    return data as BackendData;
  } catch (error) {
    console.error("Error in fetchDataFromBackend:", error);
    return undefined;
  }
}

// Function to upload parsed data to the backend
export const uploadDataToBackendEuisarang = async (
  visits: VisitData[],
  patients: PatientData[]
): Promise<BackendResponse> => {
  const dataToUpload = { visits, patients };
  try {
    const response = await apiRequest(
      "post",
      "/data/process_euisarang",
      dataToUpload
    );

    return response as BackendResponse;
  } catch (error) {
    console.error("Error in uploadDataToBackend:", error);
    throw error; // Re-throw to handle in the component
  }
};

// Function to upload parsed data to the backend
export const uploadDataToBackendEgis = async (
  dailyIncomeData: DailyIncomeEgis[],
  patientListData: PatientListEgis[],
  patientIncomeData: PatientIncomeEgis[]
): Promise<BackendResponse> => {
  const dataToUpload = {
    dailyIncome: dailyIncomeData,
    patientList: patientListData,
    patientIncome: patientIncomeData
  };

  try {
    const response = await apiRequest(
      "post",
      "/data/process_egis",
      dataToUpload
    );

    return response as BackendResponse;
  } catch (error) {
    console.error("❌ Error in uploadDataToBackendEgis:", error);
    throw error; // Re-throw to handle in the component
  }
};

// Function to upload parsed data to the backend
export const uploadDataToBackendDentWeb = async (
  visits: VisitData[],
  patients: PatientDataDentWeb[]
): Promise<BackendResponse> => {
  const dataToUpload = { visits, patients };
  try {
    const response = await apiRequest(
      "post",
      "/data/process_dentweb",
      dataToUpload
    );

    return response as BackendResponse;
  } catch (error) {
    console.error("Error in uploadDataToBackend:", error);
    throw error; // Re-throw to handle in the component
  }
};
