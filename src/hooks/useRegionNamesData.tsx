import { openDB } from "idb";
import { DB_CONFIG, REGION_TYPTES } from "../utils/dbConfig";
import regionNameStore from "../store/regionNameStore";

const useRegionNamesData = () => {
  const { setDong, setGu, setSmall } = regionNameStore();

  const getRegionNameFromIndexDB = async () => {
    const db = await openDB(DB_CONFIG.MEDICAL.NAME);
    //📌Fetch Region Data
    try {
      const result = await Promise.all(
        REGION_TYPTES.map(async (type) => {
          const storedName =
            DB_CONFIG.MEDICAL.STORES[
              `REGION_${type.name}` as keyof typeof DB_CONFIG.MEDICAL.STORES
            ];

          const data = await db.getAll(storedName);
          return { name: type.name, data };
        })
      );
      //📌Store in Local Store
      result.forEach(({ name, data }) => {
        if (name === "GU") setGu(data);
        else if (name === "DONG") setDong(data);
        else if (name === "SMALL") {
          setSmall(data);
        }
      });
    } catch (error) {
      console.log(console.error("Error retrieving from IndexedDB:", error));
    }
  };
  return { getRegionNameFromIndexDB };
};

export default useRegionNamesData;
