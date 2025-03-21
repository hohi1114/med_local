// electron.d.ts
declare global {
  interface Window {
    electron: {
      getSystemUUID: () => Promise<string>;
    };
  }
}

export {};
