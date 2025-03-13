import { openDB, IDBPDatabase } from "idb";
import { MergedData, FilteredData, UpdatedDates } from "../../types/medi-types";

export interface Area {
  areaName: string;
  coords: [number, number][][]; // [lng, lat] pairs
}


const DB_NAME = "MedicalDB";
const DB_VERSION = 3; // Increment version to ensure upgrade
const MERGED_STORE = "df_merged";
const FILTERED_STORE = "df_filtered";
const DATE_STORE = "df_date";


// Initialize database without deleting existing data
export const initIndexedDB = async () => {
  try {
    console.log(`Opening database ${DB_NAME} with version ${DB_VERSION}...`);
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`Upgrade triggered: ${oldVersion} -> ${newVersion}`);

        [MERGED_STORE, FILTERED_STORE, DATE_STORE].forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            console.log(`Creating ${store} store...`);
            db.createObjectStore(store, { keyPath: "id",autoIncrement:true }); // "name" is the unique key for each area
          }
        });
      }
    });
    // Verify stores exist
    const storeNames = Array.from(db.objectStoreNames);
    console.log(
      `Database initialized. Available stores: ${storeNames.join(", ")}`
    );

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
  console.log(storeName, data);

  try {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    for (const item of data) {
      await store.put({ ...item });
    }

    // 트랜잭션 완료 대기
    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        console.log(`Transaction completed for store: ${storeName}`);
        resolve();
      };
      tx.onerror = (event) => {
        console.error(`Transaction failed for store: ${storeName}`, (event.target as IDBRequest).error);
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
    df_date: UpdatedDates[]
) => {
  try {
    // ✅ Initialize database
    const db = await openDB(DB_NAME, DB_VERSION);
    // ✅ Save merged, filtered, and date data
    await saveDataToStore(db, MERGED_STORE, merged);
    await saveDataToStore(db, FILTERED_STORE, filtered);
    await saveDataToStore(db, DATE_STORE, df_date);
 

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

    console.log(
      `Retrieved ${df_merged.length} merged items and ${df_filtered.length} filtered items`
    );
    return { df_merged, df_filtered, df_date };
  } catch (error) {
    console.error("Error retrieving from IndexedDB:", error);
    return { df_merged: [], df_filtered: [] , df_data: []};
  }
};


