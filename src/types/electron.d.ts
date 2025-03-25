// electron.d.ts
declare global {
  interface Window {
    electron: {
      getSystemUUID: () => Promise<SystemUUID>;
    };
  }
}

interface SystemUUID {
  hardware: string;
}

export {};
