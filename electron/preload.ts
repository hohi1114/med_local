import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  ping: () => "pong",
  getSystemUUID: () => ipcRenderer.invoke("get-system-uuid"),

  // File processing - Euisarang
  parseDaysFilesEuisarang: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-days-files-euisarang", fileBuffers),
  parsePlaceFilesEuisarang: (fileBuffers: ArrayBuffer[]) =>
    ipcRenderer.invoke("parse-place-files-euisarang", fileBuffers),

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

  // Data merging
  mergeDataEuisarang: (visits: any[], patients: any[]) =>
    ipcRenderer.invoke("merge-data-euisarang", visits, patients),
  mergeDataDentWeb: (visits: any[], patients: any[]) =>
    ipcRenderer.invoke("merge-data-dentweb", visits, patients),
  mergeDataEgis: (dailyIncome: any[], patientList: any[]) =>
    ipcRenderer.invoke("merge-data-egis", dailyIncome, patientList),

  // Final data processing
  processDataLocally: (mergedData: any[], accessToken: string) =>
    ipcRenderer.invoke("process-data-locally", mergedData, accessToken),

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
