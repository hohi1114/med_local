import axios from "axios";
import { LoginParams } from "../../pages/LoginPage";
import { saveTokensToCookie } from "./token";

export const postLogin = async (loginData: LoginParams) => {
  try {
    const response = await axios.post(
      `http://localhost:3001/api/auth/login`,
      loginData,
      {}
    );
    await saveTokensToCookie({
      access_token: response.data.token,
      refresh_token: ""
    });

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
