import { setCookie, removeCookie } from "./cookie";
import { AuthResponse } from "../../types/auth";

const AUTH_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken"
} as const;

export const saveTokensToCookie = async (response: AuthResponse) => {
  if (response.access_token) {
    setCookie(AUTH_KEYS.ACCESS_TOKEN, response.access_token, {
      expires: new Date(
        Date.now() +
          24 * (response.expires_in ? response.expires_in : 3600) * 1000
      ) // 24시간
    });
  }

  if (response.refresh_token) {
    setCookie(AUTH_KEYS.REFRESH_TOKEN, response.refresh_token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일
    });
  }
};

export const removeAuthTokens = () => {
  removeCookie(AUTH_KEYS.ACCESS_TOKEN);
  removeCookie(AUTH_KEYS.REFRESH_TOKEN);
};
