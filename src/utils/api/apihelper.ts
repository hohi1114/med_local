import { AxiosRequestConfig } from "axios";
import axios from "axios";
import { removeAuthTokens } from "./token";
import { getCookie } from "./cookie";
import { jwtDecode } from "jwt-decode";
import { postRefreshToken } from "./apis";
import { API_BASE_URL } from "./config";

//axios instance
export const authApi = axios.create({
  baseURL: API_BASE_URL
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
// 새 토큰을 받았을 때 실행할 콜백들 (실패 시 null이 전달되어 펜딩 요청을 reject)
let refreshSubscribers: ((token: string | null) => void)[] = [];

// 인증 엔드포인트는 인터셉터의 토큰 갱신 로직에서 제외한다.
// - /auth/refresh: 여기서 갱신을 다시 트리거하면 무한 재귀/데드락 발생
// - /auth/login: 잘못된 자격증명(401)이 로그아웃·리다이렉트로 이어져 에러 메시지가 사라지는 것을 방지
const isAuthEndpoint = (url?: string) =>
  !!url && (url.includes("/auth/refresh") || url.includes("/auth/login"));

//응답 interceptor
authApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    // 401이 아니거나, 이미 재시도한 요청이거나, 인증 엔드포인트면 그대로 에러 전달
    if (
      status !== 401 ||
      originalRequest?._retry ||
      isAuthEndpoint(originalRequest?.url)
    ) {
      return Promise.reject(error);
    }

    // refresh 토큰이 없으면 복구 불가 → 로그아웃
    const refreshToken = getCookie("refreshToken");
    if (!refreshToken) {
      logout();
      return Promise.reject(error);
    }

    // access 토큰이 없거나 만료된 경우에만 갱신 (refresh 토큰은 살아있음)
    originalRequest._retry = true;
    if (!isRefreshing) {
      isRefreshing = true;
      postRefreshToken()
        .then((newAccessToken) => {
          refreshSubscribers.forEach((callback) => callback(newAccessToken));
        })
        .catch(() => {
          // 갱신 실패: 펜딩 요청들을 깨워서 reject시키고 로그아웃
          refreshSubscribers.forEach((callback) => callback(null));
          logout();
        })
        .finally(() => {
          refreshSubscribers = [];
          isRefreshing = false;
        });
    }

    return new Promise((resolve, reject) => {
      refreshSubscribers.push((newAccessToken) => {
        if (!newAccessToken) {
          reject(error);
          return;
        }
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        resolve(authApi(originalRequest)); // 새 토큰으로 요청 재시도
      });
    });
  }
);

// 앱 시작 시 세션 복원: refresh 토큰이 살아있으면 access 토큰을 미리 갱신
export const ensureValidSession = async (): Promise<boolean> => {
  const refreshToken = getCookie("refreshToken");
  if (!refreshToken) return false;

  const accessToken = getCookie("accessToken");
  if (accessToken && !isTokenExpired(accessToken)) return true;

  try {
    await postRefreshToken();
    return true;
  } catch {
    return false;
  }
};

export const apiRequest = async (
  method: "get" | "post" | "put" | "delete",
  url: string,
  data?: any,
  config?: AxiosRequestConfig
) => {
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
