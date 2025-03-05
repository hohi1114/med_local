import { openDB } from "idb";
import { MergedData, FilteredData } from "./DataProcessor";

const DB_NAME = "MedicalDB";
const DB_VERSION = 2;
const MERGED_STORE = "df_merged";
const FILTERED_STORE = "df_filtered";


export const saveToIndexedDB = async (merged: MergedData[], filtered: FilteredData[]) => {
    try {
        const db = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Check if stores already exist before creating them
                if (!db.objectStoreNames.contains(MERGED_STORE)) {
                    db.createObjectStore(MERGED_STORE, { keyPath: "id", autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(FILTERED_STORE)) {
                    db.createObjectStore(FILTERED_STORE, { keyPath: "id", autoIncrement: true });
                }
            },
        });

        // Use separate transactions for each store
        const mergedTx = db.transaction(MERGED_STORE, "readwrite");
        const mergedStore = mergedTx.objectStore(MERGED_STORE);

        for (const item of merged) {
            await mergedStore.add(item);
        }
        await mergedTx.done;

        const filteredTx = db.transaction(FILTERED_STORE, "readwrite");
        const filteredStore = filteredTx.objectStore(FILTERED_STORE);

        for (const item of filtered) {
            await filteredStore.add(item);
        }
        await filteredTx.done;

        console.log("Data saved successfully to IndexedDB");
        return true;
    } catch (error) {
        console.error("Error saving to IndexedDB:", error);
        throw error;
    }
};
export const getDataFromIndexedDB = async () => {
    const db = await openDB(DB_NAME, 2);
    const df_merged = await db.getAll(MERGED_STORE);
    const df_filtered = await db.getAll(FILTERED_STORE);
    console.log("getDataFromIndexedDB", df_filtered);
    return { df_merged, df_filtered };
};

export const clearIndexedDB = async () => {
    try {
        const db = await openDB(DB_NAME, 2);
        await db.clear(MERGED_STORE); // Clear merged data
        await db.clear(FILTERED_STORE); // Clear filtered data
        console.log("IndexedDB cleared successfully!");
    } catch (error) {
        console.error("Error clearing IndexedDB:", error);
    }
};
