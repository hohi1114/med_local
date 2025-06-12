import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import si from "systeminformation";

import {
  parsePlaceFilesEuisarang,
  parseDaysFilesEuisarang,
  parseDaysFilesOrm,
  parsePlaceFilesOrm,
} from "../src/local/ExcelParser";

import {
  parseDailyIncomeHanChart,
  parsePatientListHanChart,
} from "../src/local/excel/hanchartExcel";

import {
  parseDailyIncomeEgis,
  parsePatientListEgis,
} from "../src/local/excel/egisExcel";
import {
  parseDailyIncomeVegas,
  parsePatientListVegas,
} from "../src/local/excel/vegasExcel";

import {
  parseDaysFilesDentweb,
  parsePlaceFilesDentWeb,
} from "../src/local/excel/dentwebExcel";

import {
  mergeDataDentWeb,
  mergeDataEgis,
  mergeDataEuisarang,
  mergeDataHanChart,
  mergeDataOrm,
  mergeDataVegas,
} from "../src/local/dataMerge";
import {
  processDataLocally,
  processDataLocallyVegas,
  processDataLocallyHanChart,
  processDataLocallyDentWeb,
  processDataLocallyEgis,
} from "../src/local/locationProcessing";

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
      allowRunningInsecureContent: true, // HTTPS 관련 문제 해결
    },
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

  ipcMain.handle("parse-days-files-euisarang", async (event, fileBuffers) => {
    try {
      return await parseDaysFilesEuisarang(fileBuffers);
    } catch (error) {
      console.error("Error parsing days files:", error);
      throw error;
    }
  });

  // In main.ts, add this inside your app.whenReady().then() block:
  ipcMain.handle("parse-place-files-euisarang", async (event, fileBuffers) => {
    try {
      return await parsePlaceFilesEuisarang(fileBuffers);
    } catch (error) {
      console.error("Error parsing place files:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-days-files-orm", async (event, fileBuffers) => {
    try {
      return await parseDaysFilesOrm(fileBuffers);
    } catch (error) {
      console.error("Error parsing days files:", error);
      throw error;
    }
  });

  // In main.ts, add this inside your app.whenReady().then() block:
  ipcMain.handle("parse-place-files-orm", async (event, fileBuffers) => {
    try {
      return await parsePlaceFilesOrm(fileBuffers);
    } catch (error) {
      console.error("Error parsing place files:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-daily-income-egis", async (event, fileBuffers) => {
    try {
      return await parseDailyIncomeEgis(fileBuffers);
    } catch (error) {
      console.error("Error parsing daily income:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-patient-list-egis", async (event, fileBuffers) => {
    try {
      return await parsePatientListEgis(fileBuffers);
    } catch (error) {
      console.error("Error parsing patient list:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-days-files-dentweb", async (event, fileBuffers) => {
    try {
      return await parseDaysFilesDentweb(fileBuffers);
    } catch (error) {
      console.error("Error parsing days files (DentWeb):", error);
      throw error;
    }
  });

  ipcMain.handle("parse-place-files-dentweb", async (event, fileBuffers) => {
    try {
      return await parsePlaceFilesDentWeb(fileBuffers);
    } catch (error) {
      console.error("Error parsing place files (DentWeb):", error);
      throw error;
    }
  });

  ipcMain.handle("parse-daily-income-vegas", async (event, fileBuffers) => {
    try {
      return await parseDailyIncomeVegas(fileBuffers);
    } catch (error) {
      console.error("Error parsing daily income:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-patient-list-vegas", async (event, fileBuffers) => {
    try {
      return await parsePatientListVegas(fileBuffers);
    } catch (error) {
      console.error("Error parsing patient list:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-daily-income-hanchart", async (event, fileBuffers) => {
    try {
      return await parseDailyIncomeHanChart(fileBuffers);
    } catch (error) {
      console.error("Error parsing daily income:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-patient-list-hanchart", async (event, fileBuffers) => {
    try {
      return await parsePatientListHanChart(fileBuffers);
    } catch (error) {
      console.error("Error parsing patient list:", error);
      throw error;
    }
  });

  // Add these handlers
  ipcMain.handle("merge-data-euisarang", async (event, visits, patients) => {
    try {
      return mergeDataEuisarang(visits, patients);
    } catch (error) {
      console.error("Error merging Euisarang data:", error);
      throw error;
    }
  });

  ipcMain.handle("merge-data-dentweb", async (event, visits, patients) => {
    try {
      return mergeDataDentWeb(visits, patients);
    } catch (error) {
      console.error("Error merging DentWeb data:", error);
      throw error;
    }
  });

  ipcMain.handle("merge-data-egis", async (event, dailyIncome, patientList) => {
    try {
      return mergeDataEgis(dailyIncome, patientList);
    } catch (error) {
      console.error("Error merging Egis data:", error);
      throw error;
    }
  });

  ipcMain.handle("merge-data-orm", async (event, visits, patients) => {
    try {
      return mergeDataOrm(visits, patients);
    } catch (error) {
      console.error("Error merging Euisarang data:", error);
      throw error;
    }
  });

  ipcMain.handle("merge-data-vegas", async (event, visits, patients) => {
    try {
      return mergeDataVegas(visits, patients);
    } catch (error) {
      console.error("Error merging Euisarang data:", error);
      throw error;
    }
  });

  ipcMain.handle("merge-data-hanchart", async (event, visits, patients) => {
    try {
      return mergeDataHanChart(visits, patients);
    } catch (error) {
      console.error("Error merging Euisarang data:", error);
      throw error;
    }
  });

  // Final data processing
  ipcMain.handle(
    "process-data-locally",
    async (event, mergedData, accessToken) => {
      try {
        return await processDataLocally(
          mergedData,
          accessToken,
          (current, total) => {
            event.sender.send("geocoding-progress", { current, total });
          }
        );
      } catch (error) {
        console.error("Error processing data:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "process-data-locally-vegas",
    async (event, mergedData, accessToken) => {
      try {
        return await processDataLocallyVegas(
          mergedData,
          accessToken,
          (current, total) => {
            event.sender.send("geocoding-progress", { current, total });
          }
        );
      } catch (error) {
        console.error("Error processing data:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "process-data-locally-hanchart",
    async (event, mergedData, accessToken) => {
      try {
        return await processDataLocallyHanChart(
          mergedData,
          accessToken,
          (current, total) => {
            event.sender.send("geocoding-progress", { current, total });
          }
        );
      } catch (error) {
        console.error("Error processing data:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "process-data-locally-dentweb",
    async (event, mergedData, accessToken) => {
      try {
        return await processDataLocallyDentWeb(
          mergedData,
          accessToken,
          (current, total) => {
            event.sender.send("geocoding-progress", { current, total });
          }
        );
      } catch (error) {
        console.error("Error processing data:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "process-data-locally-egis",
    async (event, mergedData, accessToken) => {
      try {
        return await processDataLocallyEgis(
          mergedData,
          accessToken,
          (current, total) => {
            event.sender.send("geocoding-progress", { current, total });
          }
        );
      } catch (error) {
        console.error("Error processing data:", error);
        throw error;
      }
    }
  );
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
