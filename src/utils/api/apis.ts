import axios from "axios";
import { LoginParams } from "../../pages/LoginPage";
import { removeAuthTokens, saveTokensToCookie } from "./token";
import { getCookie, removeCookie } from "./cookie";
import { jwtDecode } from "jwt-decode";
import { apiRequest } from "./apihelper";
import { BackendData } from "../../types/medi-types";
import { BackendResponse,PatientData, VisitData,DailyIncomeEgis,PatientIncomeEgis,PatientListEgis} from "../../types/backend";

//axios instance
export const authApi = axios.create({
  baseURL: "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
  maxBodyLength: 50 * 1024 * 1024, // 50MB
  maxContentLength: 50 * 1024 * 1024, // 50MB
});

export const logout = () => {
  removeAuthTokens();
  window.location.href = "/login";
};

// 토큰의 만료 시간을 확인하는 함수
const getTokenExpiration = (token: string): number | null => {
  try {
    const decodedToken = jwtDecode(token);
    if (!decodedToken.exp) {
      console.error("Token does not have an expiration (exp) field.");
      return null;
    }

    return decodedToken.exp * 1000; // exp는 초 단위이므로 밀리초로 변환
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
};

// 토큰이 만료되었는지 체크
const isTokenExpired = (token: string): boolean => {
  const expirationTime = getTokenExpiration(token);

  if (!expirationTime) return true;

  const currentTime = new Date().getTime();
  return currentTime > expirationTime;
};

let isRefresing = false;
//요청 interceptor
authApi.interceptors.request.use(
  async (config) => {
    const accessToken = getCookie("accessToken");

    const isLoginPage = window.location.pathname === "/login";
    if (!isLoginPage) {
      if (accessToken) {
        //토큰이 만료 되었을때
        console.log(isTokenExpired(accessToken));
        if (isTokenExpired(accessToken)) {
          if (!isRefresing) {
            isRefresing = true;
            //refresh 토큰을 이용하여 다시 받아옴
            try {
              const newAccessToken = await postRefreshToken();
              console.log(newAccessToken);
              await saveTokensToCookie({
                access_token: newAccessToken.access_token,
                refresh_token: newAccessToken.refresh_token,
                expires_in: newAccessToken.expires_at,
              });

              config.headers.Authorization = `Bearer ${newAccessToken.access_token}`;
            } catch (error) {
              console.log("Failed to refresh token", error);
              // window.location.href = "/login";
            } finally {
              isRefresing = false;
            }
          }
        } else {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      } else {
        // window.location.href = "/login";
      }
    }
    return config;
  },
  async (error) => {
    return Promise.reject(error);
  }
);

//응답 interceptor
authApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const { response } = error;
    // const isLoginPage = window.location.pathname === "/login";

    // if (response.status === 401 && !isLoginPage) {
    //   window.location.href = "/login";
    // }
    return Promise.reject(error);
  }
);

export const postLogin = async (loginData: LoginParams) => {
  const data = await apiRequest("post", `/auth/login`, loginData);
  await saveTokensToCookie({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  });

  return data;
};

export const getUserInfo = async () => {
  return await apiRequest("get", "/users/info");
};

export const postRefreshToken = async () => {
  const refreshToken = await getCookie("refreshToken");
  if (!refreshToken) {
    // logout();
  }
  console.log(refreshToken);
  return await apiRequest("post", "/auth/refresh", {
    refresh_token: refreshToken,
  });
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
// Function to upload parsed data to the backend
export const uploadDataToBackendEuisarang = async (
  visits: VisitData[],
  patients: PatientData[]
): Promise<BackendResponse> => {
  const dataToUpload = { visits, patients };
  try {
    const response = await apiRequest("post", "/data/process_euisarang", dataToUpload);
    console.log("Successfully uploaded data to backend:", response);
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
    patientIncome: patientIncomeData,
  };

  try {
    const response = await apiRequest("post", "/data/process_egis", dataToUpload);
    console.log("✅ Successfully uploaded data to backend:", response);
    return response as BackendResponse;
  } catch (error) {
    console.error("❌ Error in uploadDataToBackendEgis:", error);
    throw error; // Re-throw to handle in the component
  }
};

