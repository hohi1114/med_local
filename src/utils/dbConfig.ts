/** DB NAME 객체 */
export const DB_CONFIG = {
  MEDICAL: {
    NAME: "MedicalDB",
    STORES: {
      REGION_DONG: "df_areas_dong",
      REGION_SMALL: "df_areas_small",
      REGION_GU: "df_areas_gu",
      DATE: "df_date",
      FILTERED: "df_filtered",
      DF_MERGED: "df_merged"
    }
  },
  REGION_DONG: {
    NAME: "RegionDB_dong"
  },
  REGION_SMALL: {
    NAME: "RegionDB_small"
  },
  REGION_GU: {
    NAME: "RegionDB_gu"
  }
};

export const REGION_TYPTES = [
  { id: "gu", name: "GU" },
  { id: "gu", name: "DONG" },
  { id: "gu", name: "SMALL" }
];
