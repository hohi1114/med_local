import { Cookies } from "react-cookie";

const cookies = new Cookies();

interface CookieOptions {
  path?: string;
  expires?: Date;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

const defaultOptions: CookieOptions = {
  path: "/",
  // secure: process.env.NODE_ENV === "production",
  sameSite: "strict"
};

export const setCookie = (
  name: string,
  value: string,
  options?: CookieOptions
) => {
  cookies.set(name, value, { ...defaultOptions, ...options });
};

export const getCookie = (name: string) => {
  return cookies.get(name);
};

export const removeCookie = (name: string, options?: CookieOptions) => {
  cookies.remove(name, { ...defaultOptions, ...options });
};
