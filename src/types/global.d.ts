p// src/types/global.d.ts
declare global {
  interface Error {
    status?: string;
    response?: {
      data?: {
        error?: string;
      };
    };
  }
}
export {};
