import { openDB } from "idb";
import { MergedData, FilteredData } from "./DataProcessor";

const DB_NAME = "MedicalDB";
const DB_VERSION = 3; // Increment version to ensure upgrade
const MERGED_STORE = "df_merged";
const FILTERED_STORE = "df_filtered";

// Initialize database without deleting existing data
export const initDatabase = async () => {
    try {
        console.log(`Opening database ${DB_NAME} with version ${DB_VERSION}...`);
        const db = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                console.log(`Upgrade triggered: ${oldVersion} -> ${newVersion}`);

                // Create stores if they don't exist
                if (!db.objectStoreNames.contains(MERGED_STORE)) {
                    console.log(`Creating ${MERGED_STORE} store...`);
                    db.createObjectStore(MERGED_STORE, { keyPath: "id", autoIncrement: true });
                }

                if (!db.objectStoreNames.contains(FILTERED_STORE)) {
                    console.log(`Creating ${FILTERED_STORE} store...`);
                    db.createObjectStore(FILTERED_STORE, { keyPath: "id", autoIncrement: true });
                }
            }
        });

        // Verify stores exist
        const storeNames = Array.from(db.objectStoreNames);
        console.log(`Database initialized. Available stores: ${storeNames.join(', ')}`);

        return db;
    } catch (error) {
        console.error("Error initializing database:", error);
        throw error;
    }
};

export const saveToIndexedDB = async (merged: MergedData[], filtered: FilteredData[]) => {
    try {
        // Initialize database first
        const db = await initDatabase();

        // Save merged data
        console.log(`Saving ${merged.length} merged items...`);
        const mergedTx = db.transaction(MERGED_STORE, "readwrite");
        const mergedStore = mergedTx.objectStore(MERGED_STORE);

        for (const item of merged) {
            await mergedStore.add({...item}); // Use add for new items
        }
        await mergedTx.done;

        // Save filtered data
        console.log(`Saving ${filtered.length} filtered items...`);
        const filteredTx = db.transaction(FILTERED_STORE, "readwrite");
        const filteredStore = filteredTx.objectStore(FILTERED_STORE);

        for (const item of filtered) {
            await filteredStore.add({...item}); // Use add for new items
        }
        await filteredTx.done;

        console.log("All data saved successfully to IndexedDB");
        return true;
    } catch (error) {
        console.error("Error saving to IndexedDB:", error);
        throw error;
    }
};

// Optional function to update existing data instead of adding new records
export const updateInIndexedDB = async (merged: MergedData[], filtered: FilteredData[]) => {
    try {
        const db = await initDatabase();

        // Update merged data
        console.log(`Updating ${merged.length} merged items...`);
        const mergedTx = db.transaction(MERGED_STORE, "readwrite");
        const mergedStore = mergedTx.objectStore(MERGED_STORE);

        for (const item of merged) {
            await mergedStore.put({...item}); // Use put to update existing records
        }
        await mergedTx.done;

        // Update filtered data
        console.log(`Updating ${filtered.length} filtered items...`);
        const filteredTx = db.transaction(FILTERED_STORE, "readwrite");
        const filteredStore = filteredTx.objectStore(FILTERED_STORE);

        for (const item of filtered) {
            await filteredStore.put({...item}); // Use put to update existing records
        }
        await filteredTx.done;

        console.log("All data updated successfully in IndexedDB");
        return true;
    } catch (error) {
        console.error("Error updating IndexedDB:", error);
        throw error;
    }
};

export const getDataFromIndexedDB = async () => {
    try {
        // Ensure database is properly initialized
        await initDatabase();

        // Then open it again to work with it
        const db = await openDB(DB_NAME, DB_VERSION);

        const df_merged = await db.getAll(MERGED_STORE);
        const df_filtered = await db.getAll(FILTERED_STORE);

        console.log(`Retrieved ${df_merged.length} merged items and ${df_filtered.length} filtered items`);
        return { df_merged, df_filtered };
    } catch (error) {
        console.error("Error retrieving from IndexedDB:", error);
        return { df_merged: [], df_filtered: [] };
    }
};

export const clearIndexedDB = async () => {
    try {
        // Ensure database is properly initialized
        await initDatabase();

        // Then open it again to work with it
        const db = await openDB(DB_NAME, DB_VERSION);

        await db.clear(MERGED_STORE);
        await db.clear(FILTERED_STORE);
        console.log("IndexedDB stores cleared successfully");
        return true;
    } catch (error) {
        console.error("Error clearing IndexedDB:", error);
        throw error;
    }
};
