import axios from "axios";
import { LoginParams } from "../../pages/LoginPage";
import { removeAuthTokens, saveTokensToCookie } from "./token";
import { getCookie, removeCookie } from "./cookie";
import { jwtDecode } from "jwt-decode";

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
  (config) => {
    const accessToken = getCookie("accessToken");

    const isLoginPage = window.location.pathname === "/login";
    if (!isLoginPage) {
      if (accessToken) {
        if (isTokenExpired(accessToken)) {
          logout();
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

    if (response.status === 401 && !isLoginPage) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const postLogin = async (loginData: LoginParams) => {
  try {
    const response = await authApi.post(`/auth/login`, loginData, {});
    await saveTokensToCookie({
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in
    });

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};

export const getUserInfo = async () => {
  try {
    const response = await authApi.get("/users/info");

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
