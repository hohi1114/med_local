import { AxiosRequestConfig } from "axios";
import { authApi } from "./apis";

export const apiRequest = async (
  method: "get" | "post" | "put" | "delete",
  url: string,
  data?: any,
  config?: AxiosRequestConfig
) => {
  try {
    const response = await authApi[method](url, data || {});
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
