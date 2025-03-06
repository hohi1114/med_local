import { openDB } from "idb";

// We store each patient's record by `chartNumber` as the primary key
const REGION_DB_NAME = "RegionDB";
const REGION_DB_VERSION = 1;
const fallbackStoreName = "etc";
const REGION_SUMS_STORE = "regionSums";

export interface FilteredData {
    chartNumber: number;
    visitDate: string;
    totalCost: number;
    age: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
}

export interface Area {
    areaName: string;
    coords: [number, number][]; // [lng, lat] pairs
}

// 1) Initialize RegionDB with one store per region
export async function initRegionDB(regions: Area[]) {
    const db = await openDB(REGION_DB_NAME, REGION_DB_VERSION, {
        upgrade(db) {
            regions.forEach((region) => {
                const storeName = region.areaName;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: "chartNumber" });
                }
            });

            if(!db.objectStoreNames.contains(fallbackStoreName)){
                db.createObjectStore(fallbackStoreName, { keyPath: "chartNumber" });
            }

            // 3) Create a store to hold region sums
            if (!db.objectStoreNames.contains(REGION_SUMS_STORE)) {
                db.createObjectStore(REGION_SUMS_STORE, { keyPath: "regionName" });
            }
        },
    });
    return db;
}
/**
 * Checks if (lat, lng) is inside a single-ring polygon.
 * polygonCoords = an array of [lng, lat].
 */
function isPointInPolygon(
    lat: number,
    lng: number,
    polygonCoords: [number, number][]
): boolean {
    let inside = false;

    // Basic “ray-casting” approach
    for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
        const [lngI, latI] = polygonCoords[i];
        const [lngJ, latJ] = polygonCoords[j];

        const intersect =
            (lngI > lng) !== (lngJ > lng) &&
            lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI;

        if (intersect) {
            inside = !inside;
        }
    }

    return inside;
}
/**
 * Assign each patient from `filtered` to the correct region store
 * based on the polygons from `areas`.
 */
export async function storePatientsByRegion(
    filtered: FilteredData[],
    areas: Area[]
) {
    // Initialize DB with region stores + "NoRegion"
    const db = await initRegionDB(areas);

    for (const patient of filtered) {
        const { latitude, longitude } = patient;

        // Skip invalid coordinates
        if (latitude == null || longitude == null) {
            // Put directly in etc if data is incomplete
            await putInStore(db, "etc", patient);
            continue;
        }

        let assignedAreaName: string | null = null;

        // Check each region polygon
        for (const area of areas) {
            if (isPointInPolygon(latitude, longitude, area.coords)) {
                assignedAreaName = area.areaName;
                break;
            }
        }

        // If no region matched, store in "etc"
        if (!assignedAreaName) {
            await putInStore(db, "etc", patient);
        } else {
            await putInStore(db, assignedAreaName, patient);
        }
    }

    console.log("✅ All patients assigned to RegionDB (with NoRegion fallback).");
}


/**
 * Summarize totalCost in each region store and store the result in 'regionSums'.
 */
export async function updateRegionSums() {
    const db = await openDB(REGION_DB_NAME, REGION_DB_VERSION);

    // 1) Gather all store names
    const storeNames = Array.from(db.objectStoreNames); // e.g. ["Gangnam", "Seocho", "NoRegion", "regionSums"]

    // We'll skip "regionSums" itself from calculation
    const regionStores = storeNames.filter((name) => name !== "regionSums");

    // 2) For each region store, sum up totalCost
    const regionSums: { regionName: string; totalCost: number }[] = [];

    for (const storeName of regionStores) {
        let sum = 0;
        const patients = await db.getAll(storeName); // all FilteredData in that region store
        for (const p of patients) {
            sum += Number(p.totalCost) || 0;
        }
        regionSums.push({ regionName: storeName, totalCost: sum });
    }

    // 3) Clear the 'regionSums' store and insert the new summary records
    const tx = db.transaction("regionSums", "readwrite");
    const sumsStore = tx.objectStore("regionSums");

    // Clear old records
    await sumsStore.clear();

    // Insert updated sums
    for (const rs of regionSums) {
        await sumsStore.put(rs);
        // => { regionName: "Gangnam", totalCost: 12345 }
    }

    await tx.done;

    console.log("✅ Updated region sums in 'regionSums':", regionSums);
    return regionSums;
}


// Helper to put a patient in a store
async function putInStore(db: IDBDatabase, storeName: string, patient: FilteredData) {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    await store.put(patient); // or add, if you prefer
    await tx.done;
}


// Helper to get all patients from a region store, "etc"는 etc라고 호출할 것.
async function getPatientsFromRegion(areaName: string) {
    const db = await openDB("RegionDB", 1);
    return db.getAll(areaName);
}

// Helper to get all patients from the "regionSums" store
export async function getAllRegionSums() {
    const db = await openDB(REGION_DB_NAME, REGION_DB_VERSION);
    return db.getAll("regionSums");
}


