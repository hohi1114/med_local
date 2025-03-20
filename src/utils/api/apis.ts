import { BackendData } from "../../types/medi-types";
import { LoginParams } from "../../pages/LoginPage";
import { saveTokensToCookie } from "./token";
import { logout, apiRequest } from "./apihelper";
import { getCookie } from "./cookie";
import { RangeDate } from "../../hooks/useRangeDurationDatePicker";

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
/**유저정보 */
export const getUserInfo = async () => {
  return await apiRequest("get", "/users/info");
};

/**대시보드 */
export const getDashboardData = async (rangeDate: RangeDate) => {
  console.log(rangeDate);
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

export const getAllRegionsEtc = async () => {
  const data = await apiRequest("get", "/fetch/all_region_patient_cost");
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
export async function fetchDataFromBackend(): Promise<BackendData | undefined> {
  try {
    const data = await apiRequest("get", "/data/get_all");
    console.log("Fetched data:", data);
    return data as BackendData;
  } catch (error) {
    console.error("Error in fetchDataFromBackend:", error);
    return undefined;
  }
}

export async function uploadDataToBackend(
  dataToUpload: BackendData
): Promise<boolean> {
  try {
    await apiRequest("post", "/data/sync", dataToUpload);
    console.log("Successfully uploaded data to backend:", dataToUpload);
    return true; // Return true on successful upload
  } catch (error) {
    console.error("Error in uploadDataToBackend:", error);
    return false; // Return false on failure
  }
}
