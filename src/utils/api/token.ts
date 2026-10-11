import { setCookie, removeCookie } from "./cookie";
import { AuthResponse } from "../../types/auth";

const AUTH_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken"
} as const;

const AUTO_LOGIN_KEY = "autoLogin";
const PERSIST_DAYS = 30; // 자동 로그인 유지 기간

// 자동 로그인 사용 여부 저장/조회 (refresh 시에도 동일하게 적용하기 위함)
export const setAutoLogin = (enabled: boolean) => {
  localStorage.setItem(AUTO_LOGIN_KEY, enabled ? "true" : "false");
};

export const isAutoLoginEnabled = () =>
  localStorage.getItem(AUTO_LOGIN_KEY) === "true";

export const saveTokensToCookie = async (response: AuthResponse) => {
  // 자동 로그인 O: 30일 영구쿠키 / X: 세션쿠키(브라우저 닫으면 만료)
  const persist = isAutoLoginEnabled();
  const expires = persist
    ? new Date(Date.now() + PERSIST_DAYS * 24 * 60 * 60 * 1000)
    : undefined;

  if (response.access_token) {
    setCookie(AUTH_KEYS.ACCESS_TOKEN, response.access_token, { expires });
  }

  if (response.refresh_token) {
    setCookie(AUTH_KEYS.REFRESH_TOKEN, response.refresh_token, { expires });
  }
};

export const removeAuthTokens = () => {
  removeCookie(AUTH_KEYS.ACCESS_TOKEN);
  removeCookie(AUTH_KEYS.REFRESH_TOKEN);
};
