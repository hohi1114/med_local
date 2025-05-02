import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import si from "systeminformation";

const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    webPreferences: {
      nodeIntegration: false, // 보안을 위해 false로 설정
      contextIsolation: true, // 보안을 위해 true로 설정
      preload: path.join(__dirname, "preload.js"), // Preload 파일 경로 설정
      webSecurity: false, // 외부 맵 스크립트 등의 보안 문제 해결
      allowRunningInsecureContent: true // HTTPS 관련 문제 해결
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173"); // React 앱 로드
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`http://3.39.10.210:8000`);
  }

  mainWindow.on("closed", () => (mainWindow = null));
};

app.whenReady().then(() => {
  createMainWindow();

  // 시스템 UUID를 가져오는 요청 처리
  ipcMain.handle("get-system-uuid", async () => {
    const uuid = await si.uuid(); // systeminformation 라이브러리로 UUID 가져오기
    return uuid;
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
