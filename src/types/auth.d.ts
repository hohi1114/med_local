export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

export interface AuthError extends Error {
  statusCode?: number;
  code?: string;
}

export interface DecodedToken {
  sub: string; // 유저 ID
  exp: number; // 만료 시간
}
