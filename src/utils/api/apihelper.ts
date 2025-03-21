import { AxiosRequestConfig } from "axios";
import axios from "axios";
import { removeAuthTokens } from "./token";
import { getCookie } from "./cookie";
import { jwtDecode } from "jwt-decode";
import { postRefreshToken } from "./apis";

//axios instance
export const authApi = axios.create({
  baseURL: "http://localhost:3001/api"
});
authApi.defaults.headers.common["Content-Type"] = "application/json";

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
    if (config.url !== "/auth/login") {
      if (accessToken) {
        //토큰이 만료 되었을때
        if (isTokenExpired(accessToken)) {
          if (!isRefresing) {
            isRefresing = true;
            //refresh 토큰을 이용하여 다시 받아옴
            try {
              const newAccessToken = await postRefreshToken();
              config.headers.Authorization = `Bearer ${newAccessToken}`;
            } catch (error) {
              console.log("Failed to refresh token", error);
              window.location.href = "/login";
            } finally {
              isRefresing = false;
            }
          }
        } else {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      } else {
        window.location.href = "/login";
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
    const isLoginPage = window.location.pathname === "/login";

    if (response?.status === 401 && !isLoginPage) {
      window.location.href = "/login"; //로그인 페이지가 아닌 경우 로그아웃
    }
    return Promise.reject(error);
  }
);

export const apiRequest = async (
  method: "get" | "post" | "put" | "delete",
  url: string,
  data?: any,
  config?: AxiosRequestConfig
) => {
  console.log("📢 API 요청:", { method, url, data, config });
  try {
    const response =
      method === "get"
        ? await authApi[method](url, config)
        : await authApi[method](url, data, config);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
