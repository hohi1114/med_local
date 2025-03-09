import { openDB } from "idb";

// Database constants
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
    coords: [number, number][][]; // [lng, lat] pairs
}


import {
    extractDistrictFromNeighborhood,
    isPointInPolygon,
    flattenToPairs,
} from '../../utils/geometry'

/**
 * Initialize the database for a specific region type
 */
export async function initRegionDB(regions: Area[], regionType: string) {
    const dbName = `${REGION_DB_NAME}_${regionType}`;

    const db = await openDB(dbName, REGION_DB_VERSION, {
        upgrade(db) {
            // Create a store for each region
            regions.forEach((region) => {
                const storeName = region.areaName;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { autoIncrement: true });
                }
            });

            // Create fallback store
            const fallbackName = `${fallbackStoreName}_${regionType}`;
            if (!db.objectStoreNames.contains(fallbackName)) {
                db.createObjectStore(fallbackName, { autoIncrement:true});
            }

            // Create sums store
            const sumsStoreName = `${REGION_SUMS_STORE}_${regionType}`;
            if (!db.objectStoreNames.contains(sumsStoreName)) {
                db.createObjectStore(sumsStoreName, { keyPath: "regionName" });
            }
        },
    });

    return db;
}


/**
 * Assign patients to regions (small areas or neighborhoods)
 */
export async function storePatientsByRegion(
    patients: FilteredData[],
    regions: Area[],
    regionType: string
) {
    // Initialize the database for this region type
    const dbName = `${REGION_DB_NAME}_${regionType}`;
    const db = await initRegionDB(regions, regionType);

    // Parse all polygons once
    // Use the already parsed coordinate arrays
    const parsedRegions = regions.map(region => ({
        area: region.areaName,
        polygon: flattenToPairs(region.coords)
    }));

    // Track which patients are assigned to which region
    const assignments: Record<string, number> = {};
    const fallbackName = `${fallbackStoreName}_${regionType}`;
    assignments[fallbackName] = 0;

    // Map to track which patients are assigned to which region
    const patientToRegionMap: Record<number, string> = {};

    for (const patient of patients) {
        const { latitude, longitude, chartNumber } = patient;

        // Skip invalid coordinates
        if (latitude == null || longitude == null) {
            await putInStore(db, fallbackName, patient);
            assignments[fallbackName]++;
            continue;
        }

        console.log(`Processing patient ${chartNumber} at [${latitude}, ${longitude}]`);


        let assigned = false;

        // Check each region
        for (const region of parsedRegions) {

            if (isPointInPolygon(latitude, longitude, region.polygon)) {
                console.log(`Patient ${chartNumber} is inside region ${region.area}`);
                await putInStore(db, region.area, patient);
                assignments[region.area] = (assignments[region.area] || 0) + 1;
                patientToRegionMap[chartNumber] = region.area;
                assigned = true;
                break;
            }
        }


        // Assign to fallback if no region matched
        if (!assigned) {
            console.warn(`Patient ${chartNumber} did not match any region, assigning to fallback`);
            await putInStore(db, fallbackName, patient);
            assignments[fallbackName]++;
        }
    }

    console.log(`✅ Patient assignment complete for ${regionType}`);
    console.log(`   Assigned to ${Object.keys(assignments).length - 1} regions`);
    console.log(`   ${assignments[fallbackName]} patients in fallback store`);

    // Calculate region sums
    await updateRegionSums(regionType);

    return { assignments, patientToRegionMap };
}

/**
 * Update summary statistics for a region type
 */
export async function updateRegionSums(regionType: string) {
    const dbName = `${REGION_DB_NAME}_${regionType}`;
    const db = await openDB(dbName, REGION_DB_VERSION);

    // Get all store names except the sums store
    const sumsStoreName = `${REGION_SUMS_STORE}_${regionType}`;
    const storeNames = Array.from(db.objectStoreNames).filter(
        name => name !== sumsStoreName
    );

    // Calculate sums for each region
    const regionSums: { regionName: string; totalCost: number; patientCount: number }[] = [];

    for (const storeName of storeNames) {
        try {
            const patients = await db.getAll(storeName);
            const totalCost = patients.reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);

            regionSums.push({
                regionName: storeName,
                totalCost,
                patientCount: patients.length
            });
        } catch (error) {
            console.warn(`Error calculating sum for ${storeName}:`, error);
        }
    }

    // Store the region sums
    const tx = db.transaction(sumsStoreName, "readwrite");
    const sumsStore = tx.objectStore(sumsStoreName);

    await sumsStore.clear();

    for (const sum of regionSums) {
        await sumsStore.put(sum);
    }

    await tx.done;

    console.log(`✅ Updated sums for ${regionSums.length} regions of type ${regionType}`);

    return regionSums;
}

/**
 * Create and populate district (구) database from neighborhood (동) assignments
 */
export async function createDistrictDataFromNeighborhoods(neighborhoods: Area[]) {
    // Extract unique district names from neighborhoods
    const districtMap = new Map<string, string[]>();

    neighborhoods.forEach(neighborhood => {
        const districtName = extractDistrictFromNeighborhood(neighborhood.areaName);

        if (!districtMap.has(districtName)) {
            districtMap.set(districtName, []);
        }

        districtMap.get(districtName)?.push(neighborhood.areaName);
    });

    // Create an array of district areas
    const districts = Array.from(districtMap.keys()).map(districtName => ({
        areaName: districtName,
        coords: []  // No polygon data is needed for districts as they are derived from neighborhoods.
    }));

    // Initialize district database
    await initRegionDB(districts, "gu");

    // Return the mapping of districts to neighborhoods
    const districtToNeighborhoods: Record<string, string[]> = {};
    districtMap.forEach((neighborhoods, district) => {
        districtToNeighborhoods[district] = neighborhoods;
    });

    return districtToNeighborhoods;
}

/**
 * Populate district (구) database using data from neighborhood (동) assignments
 */
export async function populateDistrictsFromNeighborhoods() {
    // Open both databases
    const dongDb = await openDB(`${REGION_DB_NAME}_dong`, REGION_DB_VERSION);
    const guDb = await openDB(`${REGION_DB_NAME}_gu`, REGION_DB_VERSION);

    // Get all neighborhood stores (excluding sums store)
    const dongStores = Array.from(dongDb.objectStoreNames).filter(
        name => name !== `${REGION_SUMS_STORE}_dong` && !name.includes(fallbackStoreName)
    );

    // Create a map of district to patients
    const districtPatients: Record<string, Set<number>> = {};

    // Process each neighborhood
    for (const dongStore of dongStores) {
        const districtName = extractDistrictFromNeighborhood(dongStore);

        if (!districtPatients[districtName]) {
            districtPatients[districtName] = new Set();
        }

        // Get all patients in this neighborhood
        const patients = await dongDb.getAll(dongStore);

        // Process each patient
        for (const patient of patients) {
            try {
                await putInStore(guDb, districtName, patient);
                districtPatients[districtName].add(patient.chartNumber);
            } catch (error) {
                console.error(`Error adding patient ${patient.chartNumber} to district ${districtName}:`, error);
            }
        }
    }

    // Calculate district sums
    await updateRegionSums("gu");

    // Return statistics on how many patients were assigqed to each district
    const districtCounts: Record<string, number> = {};
    Object.entries(districtPatients).forEach(([district, patients]) => {
        districtCounts[district] = patients.size;
    });

    console.log(`✅ Populated district stores from neighborhoods`);
    console.log(`   ${Object.keys(districtCounts).length} districts created`);

    return districtCounts;
}

/**
 * Process all region types in the correct order:
 * 1. Process small areas directly
 * 2. Process neighborhoods directly
 * 3. Derive districts from neighborhoods
 */
export async function processAllRegionTypes(
    patients: FilteredData[],
    areasSmall: Area[],
    areasDong: Area[]
) {
    // Process small areas
    console.log("Processing small areas...");
    const smallResults = await storePatientsByRegion(patients, areasSmall, "small");

    // Process neighborhoods (동)
    console.log("Processing neighborhoods (동)...");
    const dongResults = await storePatientsByRegion(patients, areasDong, "dong");

    // Create district (구) structure from neighborhoods
    console.log("Creating district structure from neighborhoods...");
    const districtMap = await createDistrictDataFromNeighborhoods(areasDong);

    // Populate district data from neighborhood assignments
    console.log("Populating district data from neighborhoods...");
    const districtCounts = await populateDistrictsFromNeighborhoods();

    console.log("✅ All region types processed successfully");

    return {
        small: smallResults,
        dong: dongResults,
        gu: districtCounts,
        districtMap
    };
}

// Helper to put a patient in a store
async function putInStore(db: IDBPDatabase, storeName: string, patient: FilteredData) {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    await store.add(patient);
    await tx.done;
}

// Helper to get patients from a region
export async function getPatientsFromRegion(regionName: string, regionType: string) {
    const dbName = `${REGION_DB_NAME}_${regionType}`;
    const db = await openDB(dbName, REGION_DB_VERSION);
    return db.getAll(regionName);
}

// Helper to get all region sums for a region type
export async function getRegionSums(regionType: string) {
    const dbName = `${REGION_DB_NAME}_${regionType}`;
    const sumsStoreName = `${REGION_SUMS_STORE}_${regionType}`;

    const db = await openDB(dbName, REGION_DB_VERSION);
    return db.getAll(sumsStoreName);
}
