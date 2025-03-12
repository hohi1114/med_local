import axios, { AxiosError, AxiosRequestConfig } from "axios";
const REACT_APP_API_URL = "http://localhost:3001/api/";
export const apiRequest = async (
  method: "get" | "post" | "put" | "delete",
  url: string,
  data?: any,
  config?: AxiosRequestConfig
) => {
  try {
    const res = await axios({
      method,
      url: REACT_APP_API_URL + url,
      data,
      ...config
    });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw handleApiError(error);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

const handleApiError = (error: AxiosError) => {
  if (error.response) {
    const data = error.response.data as { message?: string };
    return new Error(data.message);
  }
};
