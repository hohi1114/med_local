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

//요청 interceptor
authApi.interceptors.request.use(
  async (config) => {
    const accessToken = getCookie("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  async (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
let refreshTokenPromise = null;

//응답 interceptor
authApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const {
      config,
      response: { status }
    } = error;
    const accessToken = getCookie("accessToken");
    if (status === 401) {
      const originalRequest = config;
      if (isTokenExpired(accessToken)) {
        if (!isRefreshing) {
          isRefreshing = true;

          refreshTokenPromise = postRefreshToken()
            .then((newAccessToken) => {
              refreshSubscribers.forEach((callback) =>
                callback(newAccessToken)
              );
              refreshSubscribers = [];
              return newAccessToken;
            })
            .catch((error) => {
              logout();
              throw error;
            })
            .finally(() => {
              isRefreshing = false;
              console.log(isRefreshing);
            });
        }
      }
      return new Promise((resolve) => {
        console.log(refreshSubscribers.length);
        refreshSubscribers.push((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          resolve(authApi(originalRequest)); // 새 토큰으로 요청 재시도
        });
      });
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
