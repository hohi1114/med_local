"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const isDev = process.env.NODE_ENV === "development";
let mainWindow = null;
const createMainWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Set to true for better security if needed
            preload: path_1.default.join(__dirname, "preload.js"),
            webSecurity: false, // Required for external map scripts
            allowRunningInsecureContent: true, // Fixes potential HTTPS issues
        },
    });
    if (isDev) {
        mainWindow.loadURL("http://localhost:5173"); // Vite dev server
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, "../dist/index.html"));
    }
    mainWindow.on("closed", () => (mainWindow = null));
};
electron_1.app.whenReady().then(createMainWindow);
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
electron_1.app.on("activate", () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createMainWindow();
});
