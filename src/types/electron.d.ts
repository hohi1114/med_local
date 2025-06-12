// electron.d.ts
declare global {
  interface Window {
    electron: {
      getSystemUUID: () => Promise<SystemUUID>;

      // File processing - Euisarang
      parseDaysFilesEuisarang: (fileBuffers: ArrayBuffer[]) => Promise<any>;
      parsePlaceFilesEuisarang: (fileBuffers: ArrayBuffer[]) => Promise<any>;

      // File processing - DentWeb
      parseDaysFilesDentweb: (fileBuffers: ArrayBuffer[]) => Promise<any>;
      parsePlaceFilesDentWeb: (fileBuffers: ArrayBuffer[]) => Promise<any>;

      // File processing - Egis
      parseDailyIncomeEgis: (fileBuffers: ArrayBuffer[]) => Promise<any>;
      parsePatientListEgis: (fileBuffers: ArrayBuffer[]) => Promise<any>;

      //File processing -Orum
      parseDaysFilesOrm: (fileBuffers: ArrayBuffer[]) => Promise<any>;
      parsePlaceFilesOrm: (fileBuffers: ArrayBuffer[]) => Promise<any>;

      //File processing - Vegas
      parseDailyIncomeVegas: (fileBuffers: ArrayBuffer[]) => Promise<any>;
      parsePatientListVegas: (fileBuffers: ArrayBuffer[]) => Promise<any>;

      parseDailyIncomeHanChart: (fileBuffers: ArrayBuffer[]) => Promise<any>;
      parsePatientListHanChart: (fileBuffers: ArrayBuffer[]) => Promise<any>;

      parseDailyIncomeHanChartNew: (fileBuffers: ArrayBuffer[]) => Promise<any>;

      // Data merging
      mergeDataEuisarang: (visits: any[], patients: any[]) => Promise<any>;
      mergeDataDentWeb: (visits: any[], patients: any[]) => Promise<any>;
      mergeDataEgis: (dailyIncome: any[], patientList: any[]) => Promise<any>;
      mergeDataOrm: (visits: any[], patients: any[]) => Promise<any>;
      mergeDataVegas: (dailyIncome: any[], patientList: any[]) => Promise<any>;
      mergeDataHanChart: (
        dailyIncome: any[],
        patientList: any[]
      ) => Promise<any>;
      mergeDataDentWeb: (dailyIncome: any[], patients: any[]) => Promise<any>;

      // Final data processing
      processDataLocally: (
        mergedData: any[],
        accessToken: string
      ) => Promise<any>;

      processDataLocallyVegas: (
        mergedData: any[],
        accessToken: string
      ) => Promise<any>;

      processDataLocallyHanChart: (
        mergedData: any[],
        accessToken: string
      ) => Promise<any>;

      processDataLocallyDentWeb: (
        mergedData: any[],
        accessToken: string
      ) => Promise<any>;

      processDataLocallyEgis: (
        mergedData: any[],
        accessToken: string
      ) => Promise<any>;

      onGeocodingProgress: (
        callback: (data: { current: number; total: number }) => void
      ) => () => void;
    };
  }
}

interface SystemUUID {
  hardware: string;
}

export {};
