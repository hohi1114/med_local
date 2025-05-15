import { openDB, IDBPDatabase } from "idb";
import { MergedData, FilteredData, UpdatedDates } from "../../types/medi-types";

export interface Area {
  areaName: string;
  coords: [number, number][][]; // [lng, lat] pairs
}

const DB_NAME = "MedicalDB";
const DB_VERSION = 4; // Increment version to ensure upgrade
const MERGED_STORE = "df_merged";
const FILTERED_STORE = "df_filtered";
const DATE_STORE = "df_date";
const SMALL_AREA_STORE = "df_areas_small"; // ✅ Separate store for areas_small
const DONG_AREA_STORE = "df_areas_dong"; // ✅ Separate store for areas_dong
const GU_AREA_STORE = "df_areas_gu"; // ✅ Separate store for areas_gu

// Initialize database without deleting existing data
export const initIndexedDB = async () => {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        [
          MERGED_STORE,
          FILTERED_STORE,
          DATE_STORE,
          SMALL_AREA_STORE,
          DONG_AREA_STORE,
          GU_AREA_STORE,
        ].forEach((store) => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: "id", autoIncrement: true }); // "name" is the unique key for each area
          }
        });
      },
    });
    // Verify stores exist
    const storeNames = Array.from(db.objectStoreNames);

    return db;
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

const saveDataToStore = async (
  db: IDBPDatabase,
  storeName: string,
  data: any[]
) => {
  try {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    for (const item of data) {
      await store.put({ ...item });
    }

    // 트랜잭션 완료 대기
    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = (event) => {
        console.error(
          `Transaction failed for store: ${storeName}`,
          (event.target as IDBRequest).error
        );
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error(`Error saving data to store: ${storeName}`, error);
    throw error;
  }
};

export const saveToIndexedDB = async (
  merged: MergedData[],
  filtered: FilteredData[],
  df_date: UpdatedDates[],
  areas_small: Area[],
  areas_dong: Area[],
  areas_gu: Area[]
) => {
  try {
    // ✅ Initialize database
    const db = await openDB(DB_NAME, DB_VERSION);
    // ✅ Save merged, filtered, and date data
    await saveDataToStore(db, MERGED_STORE, merged);
    await saveDataToStore(db, FILTERED_STORE, filtered);
    await saveDataToStore(db, DATE_STORE, df_date);

    // ✅ Save areas separately
    await saveDataToStore(
      db,
      SMALL_AREA_STORE,
      areas_small.map((area) => ({ name: area.areaName }))
    );
    await saveDataToStore(
      db,
      DONG_AREA_STORE,
      areas_dong.map((area) => ({ name: area.areaName }))
    );
    await saveDataToStore(
      db,
      GU_AREA_STORE,
      areas_gu.map((area) => ({ name: area.areaName }))
    );

    return true;
  } catch (error) {
    console.error("❌ Error saving to IndexedDB:", error);
    throw error;
  }
};

export const getDataFromIndexedDB = async () => {
  try {
    await initIndexedDB();
    const db = await openDB(DB_NAME, DB_VERSION);

    const df_merged = await db.getAll(MERGED_STORE);
    const df_filtered = await db.getAll(FILTERED_STORE);
    const df_date = await db.getAll(DATE_STORE);

    return { df_merged, df_filtered, df_date };
  } catch (error) {
    console.error("Error retrieving from IndexedDB:", error);
    return { df_merged: [], df_filtered: [], df_data: [] };
  }
};

export const getDongAreas = async () => {
  const db = await openDB(DB_NAME, DB_VERSION);
  return db.getAll(DONG_AREA_STORE);
};

export const getGuAreas = async () => {
  const db = await openDB(DB_NAME, DB_VERSION);
  return db.getAll(GU_AREA_STORE);
};

export const getAllMergedData = async () => {
  const db = await openDB(DB_NAME, DB_VERSION);
  return await db.getAll(MERGED_STORE);
};
