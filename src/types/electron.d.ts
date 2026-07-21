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
      parseDailyIncomeOrm: (fileBuffers: ArrayBuffer[]) => Promise<any>;
      parsePatientListOrm: (fileBuffers: ArrayBuffer[]) => Promise<any>;

      //File processing - Vegas
      parseDailyIncomeVegas: (fileBuffers: ArrayBuffer[]) => Promise<any>;
      parsePatientListVegas: (fileBuffers: ArrayBuffer[]) => Promise<any>;

      parseDailyIncomeVegas2: (fileBuffers: ArrayBuffer[]) => Promise<any>;
      parsePatientListVegas2: (fileBuffers: ArrayBuffer[]) => Promise<any>;

      parseDailyIncomeHanChart: (fileBuffers: ArrayBuffer[]) => Promise<any>;
      parsePatientListHanChart: (fileBuffers: ArrayBuffer[]) => Promise<any>;

      parseDailyIncomeHanChartNew: (fileBuffers: ArrayBuffer[]) => Promise<any>;

      parseDaysFilesDoctorP: (buffers: ArrayBuffer[]) => Promise<any>;
      parsePlaceFilesDoctorP: (buffers: ArrayBuffer[]) => Promise<any>;

      parseDaysFilesDoctorP2: (buffers: ArrayBuffer[]) => Promise<any>;
      parsePlaceFilesDoctorP2: (buffers: ArrayBuffer[]) => Promise<any>;

      parseDailyIncomecChart: (fileBuffers: ArrayBuffer[]) => Promise<any>;
      parsePatientListcChart: (fileBuffers: ArrayBuffer[]) => Promise<any>;

    parseDailyIncomeBit: (buffers: ArrayBuffer[]) => Promise<any>;
    parsePatientListBit: (buffers: ArrayBuffer[]) => Promise<any>; 


    parseDailyIncomeBit2: (buffers: ArrayBuffer[]) => Promise<any>;
    parsePatientListBit2: (buffers: ArrayBuffer[]) => Promise<any>; 


      parseDailyIncomeNeo: (fileBuffers: ArrayBuffer[]) => Promise<any>;
      parsePatientListNeo: (fileBuffers: ArrayBuffer[]) => Promise<any>;

      // File processing - SmartNC
      parseDailyIncomeSmartNC: (fileBuffers: ArrayBuffer[]) => Promise<any>;
      parsePatientAddressSmartNC: (fileBuffers: ArrayBuffer[]) => Promise<any>;
      parsePatientListSmartNC: (fileBuffers: ArrayBuffer[]) => Promise<any>;

      // File processing - SimEMR
      parseDailyVisitSimEmr: (fileBuffers: ArrayBuffer[]) => Promise<any>;
      parsePatientListSimEmr: (fileBuffers: ArrayBuffer[]) => Promise<any>;

      // Data merging
      mergeDataEuisarang: (visits: any[], patients: any[]) => Promise<any>;
      mergeDataDentWeb: (visits: any[], patients: any[]) => Promise<any>;
      mergeDataEgis: (dailyIncome: any[], patientList: any[]) => Promise<any>;
      mergeDataOrm: (visits: any[], patients: any[]) => Promise<any>;
      mergeDataBit: (visits: any[], patients: any[]) => Promise<any>;
      mergeDataVegas: (dailyIncome: any[], patientList: any[]) => Promise<any>;
      mergeDataHanChart: (
        dailyIncome: any[],
        patientList: any[]
      ) => Promise<any>;
      mergeDataDentWeb: (dailyIncome: any[], patients: any[]) => Promise<any>;
      mergeDataDoctorP: (
        dailyIncome: any[],
        patientList: any[]
      ) => Promise<any>;
      mergeDataDoctorP2: (
        dailyIncome: any[],
        patientList: any[]
      ) => Promise<any>;

      mergeDataNeo: (dailyIncome: any[], patientList: any[]) => Promise<any>;

      mergeDataSmartNC: (dailyIncome: any[], patientAddress: any[], patientList: any[]) => Promise<any>;

      mergeDataSimEmr: (dailyVisit: any[], patientList: any[]) => Promise<any>;

      mergeDatacChart: (dailyIncome: any[], patientList: any[]) => Promise<any>;
      // Final data processing
      processDataLocally: (
        mergedData: any[],
        accessToken: string
      ) => Promise<any>;

      processDataLocallyVegas: (
        mergedData: any[],
        accessToken: string
      ) => Promise<any>;

      processDataLocallyOrm: (
        mergedData: any[],
        accessToken: string
      ) => Promise<any>;

      processDataLocallyBit: (
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

      processDataLocallyDoctorP: (
        mergedData: any[],
        accessToken: string
      ) => Promise<any>;
      processDataLocallyDoctorP2: (
        mergedData: any[],
        accessToken: string
      ) => Promise<any>;

      processDataLocallycChart: (
        mergedData: any[],
        accessToken: string
      ) => Promise<any>;

       processDataLocallyNeo: (
        mergedData: any[],
        accessToken: string
      ) => Promise<any>;

      processDataLocallySmartNC: (
        mergedData: any[],
        accessToken: string
      ) => Promise<any>;

      processDataLocallySimEmr: (
        mergedData: any[],
        accessToken: string
      ) => Promise<any>;

      onGeocodingProgress: (
        callback: (data: { current: number; total: number }) => void
      ) => () => void;

      // 자동 업데이트
      onUpdateAvailable: (callback: () => void) => () => void;
      onUpdateProgress: (callback: (percent: number) => void) => () => void;
      onUpdateDownloaded: (callback: () => void) => () => void;
      installUpdate: () => Promise<void>;
    };
  }
}

interface SystemUUID {
  hardware: string;
}

export {};
