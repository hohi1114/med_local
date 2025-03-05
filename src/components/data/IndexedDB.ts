import { openDB } from "idb";
import { MergedData } from "../components/DataProcessor";

const DB_NAME = "MedicalDB";
const STORE_NAME = "SummaryData";

export const saveToIndexedDB = async (data: MergedData[]) => {
    const db = await openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "anonymousId" });
            }
        },
    });

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    data.forEach((item) => store.put(item));
    await tx.done;
};

export const getDataFromIndexedDB = async (): Promise<MergedData[]> => {
    const db = await openDB(DB_NAME, 1);
    return db.getAll(STORE_NAME);
};
