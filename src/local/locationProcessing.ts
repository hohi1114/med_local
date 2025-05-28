import { getLatLonForAddresses } from "./geolocation"; // Your geocoding function
import { findMatchingRegion, parsePolygon } from "./geometry"; // Your region helpers
import axios from "axios";
import {
  MergedData,
  MergedDataDentWeb,
  MergedDataHanChart,
  MergedDataVegas,
} from "./dataMerge";

interface RawRegion {
  id: number;
  name: string;
  polygon: string;
}

export interface ProcessedPatientData {
  chart_number: number;
  age: number | null;
  total_cost: number;
  visit_date: string | Date;
  location_true: boolean;
  small_region_id: number | null;
  dong_region_id: number | null;
  gu_region_id: number | null;
}

interface ProcessedPatientDataVegas extends ProcessedPatientData {
  visitType: string;
  area: string;
  procedure: string;
  doctor: string;
  staff: string;
  route: string;
  nationality: string;
}

interface ProcessedPatientDataHanChart extends ProcessedPatientData {
  visitType: string;
  doctor: string;
  route: string;
}

interface ProcessedPatientDataDentWeb extends ProcessedPatientData {
  area: string;
  route: string;
  doctor: string;
  visitType: string;
}

interface LocationPoint {
  lat: number;
  lng: number;
  total_cost: number;
  visit_type: string;
  route: string;
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
    const baseURL = "http://3.39.10.210:3001/api";

    const response = await axios.get<RegionResponse>(
      `${baseURL}/fetch/region_data`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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
    const baseURL = "http://3.39.10.210:3001/api";

    const response = await axios.post<MappingResponse>(
      `${baseURL}/data/get_mapping`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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
          Number(chartNumberMapping[record.chartNumber]) ?? record.chartNumber,
      };
    });

    // Step 1: Add location_true field to all records (false by default)
    const recordsWithLocationFlag = mappedData.map((record) => ({
      ...record,
      location_true: record.address !== "N/D",
    }));

    // Step 2: Extract records with valid addresses for geocoding
    const addressesToGeocode = recordsWithLocationFlag
      .filter((record) => record.location_true)
      .map((record) => ({
        chartNumber: record.chartNumber,
        address: String(record.address),
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
          geocoded: g.latitude !== null && g.longitude !== null,
        },
      ])
    );

    // Step 4: Update location_true based on geocoding results
    const recordsWithGeodata = recordsWithLocationFlag.map((record) => {
      const geoData = geoMap.get(record.chartNumber);

      return {
        ...record,
        latitude: geoData?.latitude ?? null,
        longitude: geoData?.longitude ?? null,
        location_true: geoData?.geocoded ?? false,
      };
    });

    const regionData = await fetchRegionData(accessToken);

    // Parse the polygon data
    const smallRegions = regionData.smallRegions.map((region) => ({
      id: region.id, // Use name as id if id is not available
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const dongRegions = regionData.dongRegions.map((region) => ({
      id: region.id, // Use name as id if id is not available
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const guRegions = regionData.guRegions.map((region) => ({
      id: region.id, // Use name as id if id is not available
      name: region.name,
      coords: parsePolygon(region.polygon),
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
          gu_region_id,
        };
      }
    );

    // Step 7: Create date-grouped location data
    const dateLocationMap = new Map<string, LocationPoint[]>();

    recordsWithGeodata.forEach((record) => {
      const { visitDate, latitude, longitude, location_true, totalCost } =
        record;

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
        lng: longitude,
        total_cost: totalCost,
        visit_type: "",
        route: "",
      });
    });

    // Convert the map to the desired format
    const dateLocationGroups: DateLocationGroup[] = Array.from(
      dateLocationMap.entries()
    ).map(([date, locations]) => ({
      date,
      patient_locations: locations,
    }));

    // Return both data structures
    return {
      patient_records: processedRecords,
      date_location_groups: dateLocationGroups,
    };
  } catch (error) {
    console.error("Error processing data locally:", error);
    throw error;
  }
}

export async function processDataLocallyVegas(
  mergedData: MergedDataVegas[],
  accessToken: string,
  progressCallback?: (current: number, total: number) => void
) {
  try {
    // Step 0: Load chart number mapping and update chartNumber- 중요한 익명화 작업
    const chartNumberMapping = await getMappingData(accessToken);

    // Step 1: Update chartNumber using the fetched mapping
    const mappedData: MergedDataVegas[] = mergedData.map((record, index) => {
      // Call progress callback if provided
      if (progressCallback) {
        progressCallback(index + 1, mergedData.length);
      }

      return {
        ...record,
        chartNumber:
          Number(chartNumberMapping[record.chartNumber]) ?? record.chartNumber,
      };
    });

    // Step 1: Add location_true field to all records (false by default)
    const recordsWithLocationFlag = mappedData.map((record) => ({
      ...record,
      location_true: record.address !== "N/D",
    }));

    // Step 2: Extract records with valid addresses for geocoding
    const addressesToGeocode = recordsWithLocationFlag
      .filter((record) => record.location_true)
      .map((record) => ({
        chartNumber: record.chartNumber,
        address: String(record.address),
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
          geocoded: g.latitude !== null && g.longitude !== null,
        },
      ])
    );

    // Step 4: Update location_true based on geocoding results
    const recordsWithGeodata = recordsWithLocationFlag.map((record) => {
      const geoData = geoMap.get(record.chartNumber);

      return {
        ...record,
        latitude: geoData?.latitude ?? null,
        longitude: geoData?.longitude ?? null,
        location_true: geoData?.geocoded ?? false,
      };
    });

    const regionData = await fetchRegionData(accessToken);

    // Parse the polygon data
    const smallRegions = regionData.smallRegions.map((region) => ({
      id: region.id, // Use name as id if id is not available
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const dongRegions = regionData.dongRegions.map((region) => ({
      id: region.id, // Use name as id if id is not available
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const guRegions = regionData.guRegions.map((region) => ({
      id: region.id, // Use name as id if id is not available
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const processedRecords: ProcessedPatientDataVegas[] =
      recordsWithGeodata.map((record) => {
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
          area: record.area,
          procedure: record.procedure,
          doctor: record.doctor,
          staff: record.staff,
          route: record.route,
          nationality: record.nationality,
          visitType: record.visitType,
          location_true: record.location_true,
          small_region_id,
          dong_region_id,
          gu_region_id,
        };
      });

    // Step 7: Create date-grouped location data
    const dateLocationMap = new Map<string, LocationPoint[]>();

    recordsWithGeodata.forEach((record) => {
      const {
        visitDate,
        latitude,
        longitude,
        location_true,
        totalCost,
        visitType,
        route,
      } = record;

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
        lng: longitude,
        total_cost: totalCost,
        visit_type: visitType,
        route: route,
      });
    });

    // Convert the map to the desired format
    const dateLocationGroups: DateLocationGroup[] = Array.from(
      dateLocationMap.entries()
    ).map(([date, locations]) => ({
      date,
      patient_locations: locations,
    }));

    // Return both data structures
    return {
      patient_records: processedRecords,
      date_location_groups: dateLocationGroups,
    };
  } catch (error) {
    console.error("Error processing data locally:", error);
    throw error;
  }
}

export async function processDataLocallyDentWeb(
  mergedData: MergedDataDentWeb[],
  accessToken: string,
  progressCallback?: (current: number, total: number) => void
) {
  try {
    // Step 0: Load chart number mapping and update chartNumber- 중요한 익명화 작업
    const chartNumberMapping = await getMappingData(accessToken);

    // Step 1: Update chartNumber using the fetched mapping
    const mappedData: MergedDataDentWeb[] = mergedData.map((record, index) => {
      // Call progress callback if provided
      if (progressCallback) {
        progressCallback(index + 1, mergedData.length);
      }

      return {
        ...record,
        chartNumber:
          chartNumberMapping[record.chartNumber] != null
            ? Number(chartNumberMapping[record.chartNumber])
            : record.chartNumber,
      };
    });

    // Step 1: Add location_true field to all records (false by default)
    const recordsWithLocationFlag = mappedData.map((record) => ({
      ...record,
      location_true: record.address !== "N/D",
    }));

    // Step 2: Extract records with valid addresses for geocoding
    const addressesToGeocode = recordsWithLocationFlag
      .filter((record) => record.location_true)
      .map((record) => ({
        chartNumber: record.chartNumber,
        address: String(record.address),
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
          geocoded: g.latitude !== null && g.longitude !== null,
        },
      ])
    );

    // Step 4: Update location_true based on geocoding results
    const recordsWithGeodata = recordsWithLocationFlag.map((record) => {
      const geoData = geoMap.get(record.chartNumber);

      return {
        ...record,
        latitude: geoData?.latitude ?? null,
        longitude: geoData?.longitude ?? null,
        location_true: geoData?.geocoded ?? false,
      };
    });

    const regionData = await fetchRegionData(accessToken);

    // Parse the polygon data
    const smallRegions = regionData.smallRegions.map((region) => ({
      id: region.id, // Use name as id if id is not available
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const dongRegions = regionData.dongRegions.map((region) => ({
      id: region.id, // Use name as id if id is not available
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const guRegions = regionData.guRegions.map((region) => ({
      id: region.id, // Use name as id if id is not available
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const processedRecords: ProcessedPatientDataDentWeb[] =
      recordsWithGeodata.map((record) => {
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
          doctor: record.doctor,
          route: record.route,
          visitType: record.visitType,
          area: record.area,
          location_true: record.location_true,
          small_region_id,
          dong_region_id,
          gu_region_id,
        };
      });

    // Step 7: Create date-grouped location data
    const dateLocationMap = new Map<string, LocationPoint[]>();

    recordsWithGeodata.forEach((record) => {
      const {
        visitDate,
        latitude,
        longitude,
        location_true,
        totalCost,
        route,
      } = record;

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
        lng: longitude,
        total_cost: totalCost,
        visit_type: "",
        route: route,
      });
    });

    // Convert the map to the desired format
    const dateLocationGroups: DateLocationGroup[] = Array.from(
      dateLocationMap.entries()
    ).map(([date, locations]) => ({
      date,
      patient_locations: locations,
    }));

    // Return both data structures
    return {
      patient_records: processedRecords,
      date_location_groups: dateLocationGroups,
    };
  } catch (error) {
    console.error("Error processing data locally:", error);
    throw error;
  }
}

export async function processDataLocallyHanChart(
  mergedData: MergedDataHanChart[],
  accessToken: string,
  progressCallback?: (current: number, total: number) => void
) {
  try {
    // Step 0: Load chart number mapping and update chartNumber- 중요한 익명화 작업
    const chartNumberMapping = await getMappingData(accessToken);

    // Step 1: Update chartNumber using the fetched mapping
    const mappedData: MergedDataHanChart[] = mergedData.map((record, index) => {
      // Call progress callback if provided
      if (progressCallback) {
        progressCallback(index + 1, mergedData.length);
      }

      return {
        ...record,
        chartNumber:
          Number(chartNumberMapping[record.chartNumber]) ?? record.chartNumber,
      };
    });

    // Step 1: Add location_true field to all records (false by default)
    const recordsWithLocationFlag = mappedData.map((record) => ({
      ...record,
      location_true: record.address !== "N/D",
    }));

    // Step 2: Extract records with valid addresses for geocoding
    const addressesToGeocode = recordsWithLocationFlag
      .filter((record) => record.location_true)
      .map((record) => ({
        chartNumber: record.chartNumber,
        address: String(record.address),
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
          geocoded: g.latitude !== null && g.longitude !== null,
        },
      ])
    );

    // Step 4: Update location_true based on geocoding results
    const recordsWithGeodata = recordsWithLocationFlag.map((record) => {
      const geoData = geoMap.get(record.chartNumber);

      return {
        ...record,
        latitude: geoData?.latitude ?? null,
        longitude: geoData?.longitude ?? null,
        location_true: geoData?.geocoded ?? false,
      };
    });

    const regionData = await fetchRegionData(accessToken);

    // Parse the polygon data
    const smallRegions = regionData.smallRegions.map((region) => ({
      id: region.id, // Use name as id if id is not available
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const dongRegions = regionData.dongRegions.map((region) => ({
      id: region.id, // Use name as id if id is not available
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const guRegions = regionData.guRegions.map((region) => ({
      id: region.id, // Use name as id if id is not available
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const processedRecords: ProcessedPatientDataHanChart[] =
      recordsWithGeodata.map((record) => {
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
          doctor: record.doctor,
          route: record.route,
          visitType: record.visitType,
          location_true: record.location_true,
          small_region_id,
          dong_region_id,
          gu_region_id,
        };
      });

    // Step 7: Create date-grouped location data
    const dateLocationMap = new Map<string, LocationPoint[]>();

    recordsWithGeodata.forEach((record) => {
      const {
        visitDate,
        latitude,
        longitude,
        location_true,
        totalCost,
        visitType,
        route,
      } = record;

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
        lng: longitude,
        total_cost: totalCost,
        visit_type: visitType,
        route: route,
      });
    });

    // Convert the map to the desired format
    const dateLocationGroups: DateLocationGroup[] = Array.from(
      dateLocationMap.entries()
    ).map(([date, locations]) => ({
      date,
      patient_locations: locations,
    }));

    // Return both data structures
    return {
      patient_records: processedRecords,
      date_location_groups: dateLocationGroups,
    };
  } catch (error) {
    console.error("Error processing data locally:", error);
    throw error;
  }
}
