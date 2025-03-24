import { app, BrowserWindow } from "electron";
import {session} from "electron";
import path from "path";



const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Set to true for better security if needed
            preload: path.join(__dirname, "preload.js"),
            webSecurity: false, // Required for external map scripts
            allowRunningInsecureContent: true, // Fixes potential HTTPS issues
        },
    });

    if (isDev) {
        mainWindow.loadURL("http://localhost:5173"); // Vite dev server
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }

    mainWindow.on("closed", () => (mainWindow = null));
};


app.whenReady().then(createMainWindow);



app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
