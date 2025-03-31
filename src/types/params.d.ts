import { DateRange } from "../hooks/useRangeDurationDatePicker";

type RegionPrivateParams = {
  startDate: string;
  endDate: string;
  regionType: string;
  name: string;
};

type regionAnalysisParams = {
  region: string;
  rangeDate: DateRange;
};

export type postActiveLicenseParams = {
  licenseCode: string;
  hardwareFingerprint: string;
};

export type RegisterCardParams = {
  membershipType: string;
  cardNo: string;
  idNo: string;
  cardPw: string;
};
