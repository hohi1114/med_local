import { openDB } from "idb";
import { useEffect, useState } from "react";

const DB_NAME = "MedicalDB";
const MERGED_STORE = "df_merged";
const SUMMARY_STORE = "df_filtered";

const useMediData = () => {
  const [mediData, setMediData] = useState<MediDataType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  /**GET DATA FROM INDEX DB */
  const getDataFromIndexDB = async () => {
    try {
      const db = await openDB(DB_NAME, 1);
      const df_merged = await db.getAll(MERGED_STORE);
      const df_filtered = await db.getAll(SUMMARY_STORE);
      return { df_merged, df_filtered };
    } catch (error) {
      console.error("IndexedDB에서 데이터를 가져오는 중 오류 발생:", error);
      return { df_merged: [], df_summary: [] };
    }
  };

  /**FETCH DATA */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { df_merged,df_filtered} = await getDataFromIndexDB();
      setMediData(df_merged);
      setLoading(false);
    };

    fetchData();
  }, []);

  return { getDataFromIndexDB, mediData, loading };
};

export default useMediData;
