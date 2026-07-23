import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { autoUpdater } from "electron-updater";
import path from "path";
import si from "systeminformation";

import {
  parsePlaceFilesEuisarang,
  parseDaysFilesEuisarang,
} from "../src/local/ExcelParser";

import {
  parseDailyIncomeHanChart,
  parsePatientListHanChart,
} from "../src/local/excel/hanchartExcel";

import {
  parseDailyIncomecChart,
  parsePatientListcChart,
} from "../src/local/excel/cChartExcel";

import {
  parseDailyIncomeEgis,
  parsePatientListEgis,
} from "../src/local/excel/egisExcel";
import {
  parseDailyIncomeVegas,
  parsePatientListVegas,
} from "../src/local/excel/vegasExcel";

import {
  parseDailyIncomeVegas2,
  parsePatientListVegas2,
} from "../src/local/excel/vegas2Excel";

import {
  parseDaysFilesDentweb,
  parsePlaceFilesDentWeb,
} from "../src/local/excel/dentwebExcel";

import {
  parseDaysFilesDoctorP,
  parsePlaceFilesDoctorP,
} from "../src/local/excel/doctorpExcel";

import {
  parseDaysFilesDoctorP2,
  parsePlaceFilesDoctorP2,
} from "../src/local/excel/doctorpExcel2";

import {
  parseDailyIncomeBit,
  parsePatientListBit,
} from "../src/local/excel/bitExcel";

import {
  parseDailyIncomeBit2,
  parsePatientListBit2,
} from "../src/local/excel/bit2Excel";


import{
  parseDailyIncomeOrm, parsePatientListOrm
} from "../src/local/excel/ormExcel"

import{
parseDailyIncomeNeo,parsePatientListNeo
}from "../src/local/excel/neoExcel"

import {
  parseDailyIncomeSmartNC,
  parsePatientAddressSmartNC,
  parsePatientListSmartNC,
} from "../src/local/excel/smartncExcel";

import {
  parseDailyVisitSimEmr,
  parsePatientRouteSimEmr,
} from "../src/local/excel/simEmrExcel";


import {
  mergeDataDentWeb,
  mergeDataEgis,
  mergeDataEuisarang,
  mergeDataHanChart,
  mergeDataOrm,
  mergeDataVegas,
  mergeDataDoctorP,
  mergeDataDoctorP2,
  MergedDataCchart,
  mergeDataBit,
  mergeDataNeo,
  mergeDataSmartNC,
  mergeDataSimEmr,
} from "../src/local/dataMerge";
import {
  processDataLocally,
  processDataLocallyVegas,
  processDataLocallyHanChart,
  processDataLocallyDentWeb,
  processDataLocallyEgis,
  processDataLocallyDoctorP,
  processDataLocallyDoctorP2,
  processDataLocallycChart,
  processDataLocallyBit,
  processDataLocallyOrm,
  processDataLocallyNeo,
  processDataLocallySmartNC,
  processDataLocallySimEmr,
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
    mainWindow.loadURL(`https://htracker.org`);
  }

  mainWindow.on("closed", () => (mainWindow = null));
};

app.whenReady().then(() => {
  createMainWindow();

  // 자동 업데이트 설정 (Windows 전용)
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Windows 프로덕션에서만 자동 업데이트 체크
  if (!isDev && process.platform === "win32") {
    autoUpdater.checkForUpdatesAndNotify();
  }

  // 업데이트 이벤트 핸들러 (디버깅용 로그 포함)
  autoUpdater.on("checking-for-update", () => {
    console.log("업데이트 확인 중...");
  });

  autoUpdater.on("update-available", (info) => {
    console.log("업데이트 가능:", info.version);
    mainWindow?.webContents.send("update-available");

    // 네이티브 다이얼로그로 알림
    dialog.showMessageBox(mainWindow!, {
      type: "info",
      title: "업데이트 알림",
      message: `새 버전(${info.version})을 다운로드하고 있습니다.`,
      detail: "다운로드가 완료되면 자동으로 설치됩니다.",
      buttons: ["확인"],
    });
  });

  autoUpdater.on("update-not-available", () => {
    console.log("최신 버전입니다.");
  });

  autoUpdater.on("download-progress", (progress) => {
    console.log(`다운로드 중: ${Math.round(progress.percent)}%`);
    mainWindow?.webContents.send("update-progress", Math.round(progress.percent));
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("업데이트 다운로드 완료:", info.version);
    mainWindow?.webContents.send("update-downloaded");

    // 네이티브 다이얼로그로 재시작 확인
    dialog
      .showMessageBox(mainWindow!, {
        type: "info",
        title: "업데이트 준비 완료",
        message: `새 버전(${info.version})이 준비되었습니다.`,
        detail: "지금 재시작하여 업데이트를 적용하시겠습니까?",
        buttons: ["지금 재시작", "나중에"],
        defaultId: 0,
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.on("error", (err) => {
    console.error("업데이트 오류:", err);
  });

  // 업데이트 설치 및 재시작 요청 처리
  ipcMain.handle("install-update", () => {
    autoUpdater.quitAndInstall();
  });

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
      return await parseDailyIncomeOrm(fileBuffers);
    } catch (error) {
      console.error("Error parsing days files:", error);
      throw error;
    }
  });

  // In main.ts, add this inside your app.whenReady().then() block:
  ipcMain.handle("parse-place-files-orm", async (event, fileBuffers) => {
    try {
      return await parsePatientListOrm(fileBuffers);
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

  ipcMain.handle("parse-patient-list-neo", async (event, fileBuffers) => {
    try {
      return await parsePatientListNeo(fileBuffers);
    } catch (error) {
      console.error("Error parsing patient list:", error);
      throw error;
    }
  });


   ipcMain.handle("parse-daily-income-neo", async (event, fileBuffers) => {
    try {
      return await parseDailyIncomeNeo(fileBuffers);
    } catch (error) {
      console.error("Error parsing daily income:", error);
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

  ipcMain.handle("parse-daily-income-cChart", async (event, fileBuffers) => {
    try {
      return await parseDailyIncomecChart(fileBuffers);
    } catch (error) {
      console.error("Error parsing days files (DentWeb):", error);
      throw error;
    }
  });

  ipcMain.handle("parse-patient-list-cChart", async (event, fileBuffers) => {
    try {
      return await parsePatientListcChart(fileBuffers);
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

  ipcMain.handle("parse-patient-list-vegas2", async (event, fileBuffers) => {
    try {
      return await parsePatientListVegas2(fileBuffers);
    } catch (error) {
      console.error("Error parsing patient list:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-daily-income-vegas2", async (event, fileBuffers) => {
    try {
      return await parseDailyIncomeVegas2(fileBuffers);
    } catch (error) {
      console.error("Error parsing daily income:", error);
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


    ipcMain.handle("parse-daily-income-bit", async (event, fileBuffers) => {
    try {
      return await parseDailyIncomeBit(fileBuffers);
    } catch (error) {
      console.error("Error parsing daily income:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-patient-list-bit", async (event, fileBuffers) => {
    try {
      return await parsePatientListBit(fileBuffers);
    } catch (error) {
      console.error("Error parsing patient list:", error);
      throw error;
    }
  });

ipcMain.handle("parse-daily-income-bit2", async (event, fileBuffers) => {
  return await parseDailyIncomeBit2(fileBuffers);
});

ipcMain.handle("parse-patient-list-bit2", async (event, fileBuffers) => {
  return await parsePatientListBit2(fileBuffers);
});
  ipcMain.handle("parse-daily-income-doctorp2", async (_event, fileBuffers) => {
    try {
      return await parseDaysFilesDoctorP2(fileBuffers);
    } catch (error) {
      console.error("Error parsing daily income:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-patient-list-doctorp2", async (_event, fileBuffers) => {
    try {
      return await parsePlaceFilesDoctorP2(fileBuffers);
    } catch (error) {
      console.error("Error parsing patient list:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-daily-income-doctorp", async (event, fileBuffers) => {
    try {
      return await parseDaysFilesDoctorP(fileBuffers);
    } catch (error) {
      console.error("Error parsing daily income:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-patient-list-doctorp", async (event, fileBuffers) => {
    try {
      return await parsePlaceFilesDoctorP(fileBuffers);
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



  ipcMain.handle("merge-data-neo", async (event, dailyIncome, patientList) => {
    try {
      return mergeDataNeo(dailyIncome, patientList);
    } catch (error) {
      console.error("Error merging Neo data:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-daily-income-smartnc", async (event, fileBuffers) => {
    try {
      return await parseDailyIncomeSmartNC(fileBuffers);
    } catch (error) {
      console.error("Error parsing SmartNC daily income:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-patient-address-smartnc", async (event, fileBuffers) => {
    try {
      return await parsePatientAddressSmartNC(fileBuffers);
    } catch (error) {
      console.error("Error parsing SmartNC patient address:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-patient-list-smartnc", async (event, fileBuffers) => {
    try {
      return await parsePatientListSmartNC(fileBuffers);
    } catch (error) {
      console.error("Error parsing SmartNC patient list:", error);
      throw error;
    }
  });

  ipcMain.handle("merge-data-smartnc", async (event, dailyIncome, patientAddress, patientList) => {
    try {
      return mergeDataSmartNC(dailyIncome, patientAddress, patientList);
    } catch (error) {
      console.error("Error merging SmartNC data:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-daily-visit-simemr", async (event, fileBuffers) => {
    try {
      return await parseDailyVisitSimEmr(fileBuffers);
    } catch (error) {
      console.error("Error parsing SimEMR daily visit:", error);
      throw error;
    }
  });

  ipcMain.handle("parse-patient-list-simemr", async (event, fileBuffers) => {
    try {
      return await parsePatientRouteSimEmr(fileBuffers);
    } catch (error) {
      console.error("Error parsing SimEMR patient list:", error);
      throw error;
    }
  });

  ipcMain.handle("merge-data-simemr", async (event, dailyVisit, patientList) => {
    try {
      return mergeDataSimEmr(dailyVisit, patientList);
    } catch (error) {
      console.error("Error merging SimEMR data:", error);
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

  ipcMain.handle("merge-data-bit", async (event, visits, patients) => {
    try {
      return mergeDataBit(visits, patients);
    } catch (error) {
      console.error("Error merging Euisarang data:", error);
      throw error;
    }
  });

  ipcMain.handle("merge-data-doctorp2", async (_event, visits, patients) => {
    try {
      return mergeDataDoctorP2(visits, patients);
    } catch (error) {
      console.error("Error merging data:", error);
      throw error;
    }
  });

  ipcMain.handle("merge-data-doctorp", async (event, visits, patients) => {
    try {
      return mergeDataDoctorP(visits, patients);
    } catch (error) {
      console.error("Error merging Euisarang data:", error);
      throw error;
    }
  });

  ipcMain.handle("merge-data-cChart", async (event, visits, patients) => {
    try {
      return MergedDataCchart(visits, patients);
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
    "process-data-locally-orm",
    async (event, mergedData, accessToken) => {
      try {
        return await processDataLocallyOrm(
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
    "process-data-locally-bit",
    async (event, mergedData, accessToken) => {
      try {
        return await processDataLocallyBit(
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
    "process-data-locally-neo",
    async (event, mergedData, accessToken) => {
      try {
        return await processDataLocallyNeo(
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
    "process-data-locally-smartnc",
    async (event, mergedData, accessToken) => {
      try {
        return await processDataLocallySmartNC(
          mergedData,
          accessToken,
          (current, total) => {
            event.sender.send("geocoding-progress", { current, total });
          }
        );
      } catch (error) {
        console.error("Error processing SmartNC data:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "process-data-locally-simemr",
    async (event, mergedData, accessToken) => {
      try {
        return await processDataLocallySimEmr(
          mergedData,
          accessToken,
          (current, total) => {
            event.sender.send("geocoding-progress", { current, total });
          }
        );
      } catch (error) {
        console.error("Error processing SimEMR data:", error);
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
    "process-data-locally-doctorp2",
    async (event, mergedData, accessToken) => {
      try {
        return await processDataLocallyDoctorP2(
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
    "process-data-locally-doctorp",
    async (event, mergedData, accessToken) => {
      try {
        return await processDataLocallyDoctorP(
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
    "process-data-locally-cChart",
    async (event, mergedData, accessToken) => {
      try {
        return await processDataLocallycChart(
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
