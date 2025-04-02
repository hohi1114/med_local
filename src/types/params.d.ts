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
  cardNo: string;
  expMonth: string;
  idNo: string;
  cardPw: string;
  expYear: string;
};

export type StartSubscriptionParams = {
  membershipType: string;
};
