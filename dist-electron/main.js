"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const systeminformation_1 = __importDefault(require("systeminformation"));
const isDev = process.env.NODE_ENV === "development";
let mainWindow = null;
const createMainWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false, // 보안을 위해 false로 설정
            contextIsolation: true, // 보안을 위해 true로 설정
            preload: path_1.default.join(__dirname, "preload.js"), // Preload 파일 경로 설정
            webSecurity: false, // 외부 맵 스크립트 등의 보안 문제 해결
            allowRunningInsecureContent: true, // HTTPS 관련 문제 해결
        },
    });
    if (isDev) {
        mainWindow.loadURL("http://localhost:5173"); // React 앱 로드
        mainWindow.webContents.openDevTools();
    }
    else {
        //mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
        mainWindow.loadURL("http://3.39.10.210");
    }
    mainWindow.on("closed", () => (mainWindow = null));
};
electron_1.app.whenReady().then(() => {
    createMainWindow();
    // 시스템 UUID를 가져오는 요청 처리
    electron_1.ipcMain.handle("get-system-uuid", async () => {
        const uuid = await systeminformation_1.default.uuid(); // systeminformation 라이브러리로 UUID 가져오기
        return uuid;
    });
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
electron_1.app.on("activate", () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createMainWindow();
});
