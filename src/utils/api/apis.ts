import axios from "axios";
import { LoginParams } from "../../pages/LoginPage";
import { removeAuthTokens, saveTokensToCookie } from "./token";
import { getCookie, removeCookie } from "./cookie";
import { jwtDecode } from "jwt-decode";
import { apiRequest } from "./apihelper";

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

    const isLoginPage = window.location.pathname === "/login";
    if (!isLoginPage) {
      if (accessToken) {
        //토큰이 만료 되었을때
        if (isTokenExpired(accessToken)) {
          //refresh 토큰을 이용하여 다시 받아옴
          const newAccessToken = await postRefreshToken();
          await saveTokensToCookie({
            access_token: newAccessToken.access_token,
            refresh_token: newAccessToken.refresh_token,
            expires_in: newAccessToken.expires_in
          });
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
  const data = await apiRequest("post", `/auth/login`, loginData);
  await saveTokensToCookie({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in
  });

  return data;
};

export const getUserInfo = async () => {
  return await authApi.get("/users/info");
};

export const postRefreshToken = async () => {
  const refreshToken = getCookie("refreshToken");
  if (!refreshToken) {
    logout();
  }
  console.log(refreshToken);
  return await apiRequest("post", "/auth/refresh", {
    refresh_token: refreshToken
  });
};
