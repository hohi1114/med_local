import { contextBridge, ipcRenderer } from "electron";
import {
  processDataLocallycChart,
  processDataLocallyDentWeb,
  processDataLocallyHanChart,
  processDataLocallyVegas,
} from "../src/local/locationProcessing";
import { MergedDataDoctorP } from "../src/local/dataMerge";

contextBridge.exposeInMainWorld("electron", {
  ping: () => "pong",
  getSystemUUID: () => ipcRenderer.invoke("get-system-uuid"),

  // File processing - Euisarang
  parseDaysFilesEuisarang: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-days-files-euisarang", fileBuffers),
  parsePlaceFilesEuisarang: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-place-files-euisarang", fileBuffers),

  parseDaysFilesOrm: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-days-files-orm", fileBuffers),
  parsePlaceFilesOrm: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-place-files-orm", fileBuffers),

  // File processing - DentWeb
  parseDaysFilesDentweb: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-days-files-dentweb", fileBuffers),
  parsePlaceFilesDentWeb: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-place-files-dentweb", fileBuffers),

  // File processing - Egis
  parseDailyIncomeEgis: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-daily-income-egis", fileBuffers),
  parsePatientListEgis: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-patient-list-egis", fileBuffers),

  // File processing - Egis
  parseDailyIncomeVegas: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-daily-income-vegas", fileBuffers),
  parsePatientListVegas: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-patient-list-vegas", fileBuffers),

  parseDailyIncomeBit: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-daily-income-bit", fileBuffers),
  parsePatientListBit: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-patient-list-bit", fileBuffers),

  // File processing - Egis
  parseDailyIncomeVegas2: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-daily-income-vegas2", fileBuffers),
  parsePatientListVegas2: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-patient-list-vegas2", fileBuffers),

  parseDailyIncomeHanChart: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-daily-income-hanchart", fileBuffers),
  parsePatientListHanChart: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-patient-list-hanchart", fileBuffers),

  parseDaysFilesDoctorP: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-daily-income-doctorp", fileBuffers),
  parsePatientListDoctorP: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-patient-list-doctorp", fileBuffers),

  parseDailyIncomecChart: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-daily-income-cChart", fileBuffers),
  parsePatientListcChart: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-patient-list-cChart", fileBuffers),

  // Data merging
  mergeDataEuisarang: (visits: any[], patients: any[]) =>
    ipcRenderer.invoke("merge-data-euisarang", visits, patients),
  mergeDataDentWeb: (dailyIncome: any[], patients: any[]) =>
    ipcRenderer.invoke("merge-data-dentweb", dailyIncome, patients),
  mergeDataEgis: (dailyIncome: any[], patientList: any[]) =>
    ipcRenderer.invoke("merge-data-egis", dailyIncome, patientList),
  mergeDataOrm: (visits: any[], patients: any[]) =>
    ipcRenderer.invoke("merge-data-euisarang", visits, patients),
  mergeDataVegas: (dailyIncome: any[], patientList: any[]) =>
    ipcRenderer.invoke("merge-data-vegas", dailyIncome, patientList),
  mergeDataHanChart: (dailyIncome: any[], patientList: any[]) =>
    ipcRenderer.invoke("merge-data-hanchart", dailyIncome, patientList),
  mergeDataDoctorP: (dailyIncome: any[], patientList: any[]) =>
    ipcRenderer.invoke("merge-data-doctorp", dailyIncome, patientList),
  mergeDataBit: (dailyIncome: any[], patientList: any[]) =>
    ipcRenderer.invoke("merge-data-bit", dailyIncome, patientList),

  mergeDatacChart: (dailyIncome: any[], patientList: any[]) =>
    ipcRenderer.invoke("merge-data-cChart", dailyIncome, patientList),

  // Final data processing
  processDataLocally: (mergedData: any[], accessToken: string) =>
    ipcRenderer.invoke("process-data-locally", mergedData, accessToken),

  // Final data processing
  processDataLocallyVegas: (mergedData: any[], accessToken: string) =>
    ipcRenderer.invoke("process-data-locally-vegas", mergedData, accessToken),

  processDataLocallyHanChart: (mergedData: any[], accessToken: string) =>
    ipcRenderer.invoke(
      "process-data-locally-hanchart",
      mergedData,
      accessToken
    ),

  processDataLocallyDentWeb: (mergedData: any[], accessToken: string) =>
    ipcRenderer.invoke("process-data-locally-dentweb", mergedData, accessToken),

  processDataLocallyEgis: (mergedData: any[], accessToken: string) =>
    ipcRenderer.invoke("process-data-locally-egis", mergedData, accessToken),

  processDataLocallyDoctorP: (mergedData: any[], accessToken: string) =>
    ipcRenderer.invoke("process-data-locally-doctorp", mergedData, accessToken),

  processDataLocallycChart: (mergedData: any[], accessToken: string) =>
    ipcRenderer.invoke("process-data-locally-cChart", mergedData, accessToken),

  processDataLocallyBit: (mergedData: any[], accessToken: string) =>
    ipcRenderer.invoke("process-data-locally-bit", mergedData, accessToken),

  onGeocodingProgress: (
    callback: (data: { current: number; total: number }) => void
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: { current: number; total: number }
    ) => {
      callback(data);
    };

    ipcRenderer.on("geocoding-progress", listener);

    // Return a function to remove this listener, if needed.
    return () => {
      ipcRenderer.removeListener("geocoding-progress", listener);
    };
  },
});
