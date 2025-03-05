import { openDB } from "idb";
import { MergedData, SummaryData } from "./DataProcessor";

const DB_NAME = "MedicalDB";
const MERGED_STORE = "df_merged";
const SUMMARY_STORE = "df_summary";

export const saveToIndexedDB = async (
  merged: MergedData[],
  summary: SummaryData[]
) => {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(MERGED_STORE, {
        keyPath: "id",
        autoIncrement: true,
      }); // 🔹 Auto-increment

      db.createObjectStore(SUMMARY_STORE, { keyPath: "chartNumber" }); // 🔹 Summary should stay unique
    },
  });

  const mergedTx = db.transaction(MERGED_STORE, "readwrite");
  const mergedStore = mergedTx.objectStore(MERGED_STORE);
  merged.forEach((item) => mergedStore.put(item)); // 🔹 Use `add()` instead of `put()`
  await mergedTx.done;

  const summaryTx = db.transaction(SUMMARY_STORE, "readwrite");
  const summaryStore = summaryTx.objectStore(SUMMARY_STORE);
  summary.forEach((item) => summaryStore.put(item));
  await summaryTx.done;
};

export const getDataFromIndexedDB = async () => {
  const db = await openDB(DB_NAME, 1);
  const df_merged = await db.getAll(MERGED_STORE);
  const df_summary = await db.getAll(SUMMARY_STORE);
  return { df_merged, df_summary };
};

export const clearIndexedDB = async () => {
  try {
    const db = await openDB(DB_NAME, 1);
    await db.clear(MERGED_STORE); // Clear specific object store
    await db.clear(SUMMARY_STORE); // Clear specific object store
    console.log("IndexedDB cleared successfully!");
  } catch (error) {
    console.error("Error clearing IndexedDB:", error);
  }
};
