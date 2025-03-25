type RegionPrivateParams = {
  startDate: Dayjs;
  endDate: Dayjs;
  regionType: string;
  name: string;
};

type regionAnalysisParams = {
  region: string;
  rangeDate: {
    startDate: Dayjs;
    endDate: Dayjs;
  };
};

export type postActiveLicenseParams = {
  licenseCode: string;
  hardwareFingerprint: string;
};
