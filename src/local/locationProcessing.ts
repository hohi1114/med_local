// src/services/dataProcessing.ts

import { getLatLonForAddresses } from "./geolocation"; // Your geocoding function
import { findMatchingRegion, parsePolygon } from "./geometry"; // Your region helpers
import axios from "axios";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

// Types
interface MergedData {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
  age: number | string;
  address: string;
}

interface RawRegion {
  id: number;
  name: string;
  polygon: string;
}

export interface ProcessedPatientData {
  chart_number: number;
  age: number | string;
  total_cost: number;
  visit_date: string;
  location_true: boolean;
  small_region_id: number | null;
  dong_region_id: number | null;
  gu_region_id: number | null;
}

interface LocationPoint {
  lat: number;
  lng: number;
}

export interface DateLocationGroup {
  date: string;
  patient_locations: LocationPoint[];
}
// Match the API response format (using snake_case as in the actual response)
interface RegionResponse {
  smallRegions: RawRegion[]; // Changed from camelCase to snake_case
  dongRegions: RawRegion[]; // Optional if not always present
  guRegions: RawRegion[]; // Optional if not always present
}
interface MappingResponse {
  [key: string]: string;
}

export async function fetchRegionData(token: string): Promise<RegionResponse> {
  try {
    const baseURL = "http://localhost:3001/api";

    const response = await axios.get<RegionResponse>(
      `${baseURL}/fetch/region_data`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error fetching region data:", error);
    throw error;
  }
}

export async function getMappingData(token: string): Promise<MappingResponse> {
  try {
    const baseURL = "http://localhost:3001/api";

    const response = await axios.post<MappingResponse>(
      `${baseURL}/data/get_mapping`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error fetching region data:", error);
    throw error;
  }
}

export async function processDataLocally(
  mergedData: MergedData[],
  accessToken: string,
  progressCallback?: (current: number, total: number) => void
) {
  try {
    // Step 0: Load chart number mapping and update chartNumber- 중요한 익명화 작업
    const chartNumberMapping = await getMappingData(accessToken);

    // Step 1: Update chartNumber using the fetched mapping
    const mappedData = mergedData.map((record, index) => {
      // Call progress callback if provided
      if (progressCallback) {
        progressCallback(index + 1, mergedData.length);
      }

      return {
        ...record,
        chartNumber:
          Number(chartNumberMapping[record.chartNumber]) ?? record.chartNumber
      };
    });

    // Step 1: Add location_true field to all records (false by default)
    const recordsWithLocationFlag = mappedData.map((record) => ({
      ...record,
      location_true: record.address !== "N/D"
    }));

    // Step 2: Extract records with valid addresses for geocoding
    const addressesToGeocode = recordsWithLocationFlag
      .filter((record) => record.location_true)
      .map((record) => ({
        chartNumber: record.chartNumber,
        address: String(record.address)
      }));

    // Step 3: Geocode addresses
    const geoLocations = await getLatLonForAddresses(
      addressesToGeocode,
      progressCallback
    );

    // Create a map for quick lookup
    const geoMap = new Map(
      geoLocations.map((g) => [
        g.chartNumber,
        {
          latitude: g.latitude,
          longitude: g.longitude,
          geocoded: g.latitude !== null && g.longitude !== null
        }
      ])
    );

    // Step 4: Update location_true based on geocoding results
    const recordsWithGeodata = recordsWithLocationFlag.map((record) => {
      const geoData = geoMap.get(record.chartNumber);

      return {
        ...record,
        latitude: geoData?.latitude ?? null,
        longitude: geoData?.longitude ?? null,
        location_true: geoData?.geocoded ?? false
      };
    });

    console.log(recordsWithGeodata);

    const regionData = await fetchRegionData(accessToken);

    // Parse the polygon data
    const smallRegions = regionData.smallRegions.map((region) => ({
      id: region.id, // Use name as id if id is not available
      name: region.name,
      coords: parsePolygon(region.polygon)
    }));

    const dongRegions = regionData.dongRegions.map((region) => ({
      id: region.id, // Use name as id if id is not available
      name: region.name,
      coords: parsePolygon(region.polygon)
    }));

    const guRegions = regionData.guRegions.map((region) => ({
      id: region.id, // Use name as id if id is not available
      name: region.name,
      coords: parsePolygon(region.polygon)
    }));

    const processedRecords: ProcessedPatientData[] = recordsWithGeodata.map(
      (record) => {
        const latitude = record.latitude;
        const longitude = record.longitude;

        let small_region_id = null;
        let dong_region_id = null;
        let gu_region_id = null;

        if (record.location_true && latitude !== null && longitude !== null) {
          small_region_id = findMatchingRegion(
            latitude,
            longitude,
            smallRegions
          );
          dong_region_id = findMatchingRegion(latitude, longitude, dongRegions);
          gu_region_id = findMatchingRegion(latitude, longitude, guRegions);
        }

        // Return the processed record without lat/lng coordinates
        return {
          chart_number: record.chartNumber,
          age: record.age,
          total_cost: record.totalCost,
          visit_date: record.visitDate,
          location_true: record.location_true,
          small_region_id,
          dong_region_id,
          gu_region_id
        };
      }
    );

    // Step 7: Create date-grouped location data
    const dateLocationMap = new Map<string, LocationPoint[]>();

    recordsWithGeodata.forEach((record) => {
      const { visitDate, latitude, longitude, location_true } = record;

      // Skip records without valid locations
      if (!location_true || latitude === null || longitude === null) return;

      // Format date as a consistent string
      const dateStr =
        typeof visitDate === "string"
          ? visitDate
          : new Date(visitDate).toISOString().split("T")[0];

      // Initialize the array for this date if it doesn't exist
      if (!dateLocationMap.has(dateStr)) {
        dateLocationMap.set(dateStr, []);
      }

      // Add the location to the array for this date
      dateLocationMap.get(dateStr)!.push({
        lat: latitude,
        lng: longitude
      });
    });

    // Convert the map to the desired format
    const dateLocationGroups: DateLocationGroup[] = Array.from(
      dateLocationMap.entries()
    ).map(([date, locations]) => ({
      date,
      patient_locations: locations
    }));

    // Return both data structures
    return {
      patient_records: processedRecords,
      date_location_groups: dateLocationGroups
    };
  } catch (error) {
    console.error("Error processing data locally:", error);
    throw error;
  }
}
