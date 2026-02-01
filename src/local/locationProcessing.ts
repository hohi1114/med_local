import { getLatLonForAddresses } from "./geolocation"; // Your geocoding function
import { findMatchingRegion, parsePolygon } from "./geometry"; // Your region helpers
import axios from "axios";
import {
  MergedData,
  MergedDataBit,
  MergedDataCchart,
  MergedDataDentWeb,
  MergedDataDoctorP,
  MergedDataEgis,
  MergedDataHanChart,
  MergedDataVegas,
  MergedDataOrm,
  MergedDataNeo
} from "./dataMerge";
import { StringNullableChain } from "lodash";

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

interface ProcessedPatientDataNeo extends ProcessedPatientData{
  visitType:string;
}

interface ProcessedPatientDataOrm extends ProcessedPatientData{
  visitType: string;
  doctor: string;
}

interface ProcessedPatientDataDoctorP extends ProcessedPatientData {
  route: string;
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

interface ProcessedPatientDataEgis extends ProcessedPatientData {
  visitType: string;
}

export interface ProcessedPatientDataBit extends ProcessedPatientData {
  visitType: string;
  doctor: string;
}



interface LocationPoint {
  lat: number;
  lng: number;
  total_cost: number;
  visit_type: string;
  route: string;
  age: string;
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
    const baseURL = "http://htracker.org:3001/api";

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
    const baseURL = "http://htrakcer.org:3001/api";

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
      const { visitDate, latitude, longitude, location_true, totalCost, age } =
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
        age: String(age),
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




export async function processDataLocallyEgis(
  mergedData: MergedDataEgis[],
  accessToken: string,
  progressCallback?: (current: number, total: number) => void
) {
  try {
    // Step 0: Load chart number mapping and update chartNumber- 중요한 익명화 작업
    const chartNumberMapping = await getMappingData(accessToken);

    // Step 1: Update chartNumber using the fetched mapping
    const mappedData: MergedDataEgis[] = mergedData.map((record, index) => {
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

    const processedRecords: ProcessedPatientDataEgis[] = recordsWithGeodata.map(
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
          visitType: record.visitType,
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
      const {
        visitDate,
        latitude,
        longitude,
        location_true,
        totalCost,
        visitType,
        age,
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
        route: "",
        age: String(age),
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
//for Orm 

export async function processDataLocallyOrm(
  mergedData: MergedDataOrm[],
  accessToken: string,
  progressCallback?: (current: number, total: number) => void
) {
  try {
    // Step 0: 차트번호 익명화 매핑 로드
    const chartNumberMapping = await getMappingData(accessToken);

    // Step 1: 차트번호 익명화 적용 (progress 콜백 포함)
    const mappedData: MergedDataOrm[] = mergedData.map((record, index) => {
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

    // Step 1-1: 주소 존재 여부 플래그 추가
    const recordsWithLocationFlag = mappedData.map((record) => ({
      ...record,
      location_true: record.address !== "N/D" && record.address !== "N/A",
    }));

    // Step 2: 지오코딩 대상 주소만 추출
    const addressesToGeocode = recordsWithLocationFlag
      .filter((r) => r.location_true)
      .map((r) => ({
        chartNumber: r.chartNumber,
        address: String(r.address),
      }));

    // Step 3: 주소 지오코딩
    const geoLocations = await getLatLonForAddresses(
      addressesToGeocode,
      progressCallback
    );

    // 빠른 조회를 위한 맵 구성
    const geoMap = new Map<
      number,
      { latitude: number | null; longitude: number | null; geocoded: boolean }
    >(
      geoLocations.map((g) => [
        g.chartNumber,
        {
          latitude: g.latitude,
          longitude: g.longitude,
          geocoded: g.latitude !== null && g.longitude !== null,
        },
      ])
    );

    // Step 4: 지오데이터 결합 및 location_true 보정
    const recordsWithGeodata = recordsWithLocationFlag.map((record) => {
      const geoData = geoMap.get(record.chartNumber);
      return {
        ...record,
        latitude: geoData?.latitude ?? null,
        longitude: geoData?.longitude ?? null,
        location_true: geoData?.geocoded ?? false,
      };
    });

    // Step 5: 행정구역 폴리곤 로드 및 파싱
    const regionData = await fetchRegionData(accessToken);

    const smallRegions= regionData.smallRegions.map((region) => ({
      id: region.id,
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const dongRegions = regionData.dongRegions.map((region) => ({
      id: region.id,
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const guRegions = regionData.guRegions.map((region) => ({
      id: region.id,
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    // Step 6: 최종 가공 레코드 생성 (lat/lng는 제외)
    const processedRecords: ProcessedPatientDataOrm[] = recordsWithGeodata.map(
      (record) => {
        const { latitude, longitude } = record;

        let small_region_id = null;
        let dong_region_id = null;
        let gu_region_id  = null;

        if (record.location_true && latitude !== null && longitude !== null) {
          small_region_id = findMatchingRegion(latitude, longitude, smallRegions);
          dong_region_id = findMatchingRegion(latitude, longitude, dongRegions);
          gu_region_id = findMatchingRegion(latitude, longitude, guRegions);
        }

        return {
          chart_number: record.chartNumber,
          age: record.age ?? null,
          total_cost: record.totalCost,
          visit_date: record.visitDate, // 원본 타입(Date|string) 유지
          doctor: record.doctor,
          visitType: record.visitType,
          location_true: record.location_true,
          small_region_id,
          dong_region_id,
          gu_region_id,
        };
      }
    );

    // Step 7: 날짜별 위치 그룹 구성 (지도/애니메이션용)
    const dateLocationMap = new Map<string, LocationPoint[]>();

    recordsWithGeodata.forEach((record) => {
      const { visitDate, latitude, longitude, location_true, totalCost, visitType, age } =
        record;

      if (!location_true || latitude === null || longitude === null) return;

      const dateStr =
        typeof visitDate === "string"
          ? visitDate
          : new Date(visitDate).toISOString().split("T")[0];

      if (!dateLocationMap.has(dateStr)) {
        dateLocationMap.set(dateStr, []);
      }

      dateLocationMap.get(dateStr)!.push({
        lat: latitude,
        lng: longitude,
        total_cost: totalCost,
        visit_type: visitType,
        age: String(age),
        route:"",
      });
    });

    const dateLocationGroups: DateLocationGroup[] = Array.from(
      dateLocationMap.entries()
    ).map(([date, patient_locations]) => ({
      date,
      patient_locations,
    }));

    return {
      patient_records: processedRecords,
      date_location_groups: dateLocationGroups,
    };
  } catch (error) {
    console.error("Error processing ORM data locally:", error);
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
        age,
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
        age: String(age),
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


function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


export async function processDataLocallyDoctorP(
  mergedData: MergedDataDoctorP[],
  accessToken: string,
  progressCallback?: (current: number, total: number) => void
) {
  try {
    // Step 0: Load chart number mapping and update chartNumber - 중요한 익명화 작업
    const chartNumberMapping = await getMappingData(accessToken);

    // Step 1: Update chartNumber using the fetched mapping
    const mappedData: MergedDataDoctorP[] = mergedData.map((record, index) => {
      // Call progress callback if provided
      if (progressCallback) {
        progressCallback(index + 1, mergedData.length);
      }
      const mappedValue = Number(chartNumberMapping[record.chartNumber]);

      return {
        ...record,
        chartNumber: !isNaN(mappedValue) ? mappedValue : record.chartNumber,
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
      id: region.id,
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const dongRegions = regionData.dongRegions.map((region) => ({
      id: region.id,
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const guRegions = regionData.guRegions.map((region) => ({
      id: region.id,
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const processedRecords: ProcessedPatientDataDoctorP[] =
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
          route: record.route,
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
        age,
      } = record;

      // Skip records without valid locations
      if (!location_true || latitude === null || longitude === null) return;

      // Format date as a consistent string
      const dateStr =
      typeof visitDate === "string"
        ? visitDate
        : toLocalDateString(new Date(visitDate));

      // Initialize the array for this date if it doesn't exist
      if (!dateLocationMap.has(dateStr)) {
        dateLocationMap.set(dateStr, []);
      }

      // Add the location to the array for this date
      dateLocationMap.get(dateStr)!.push({
        lat: latitude,
        lng: longitude,
        total_cost: totalCost,
        visit_type:"",
        route: route,
        age: String(age),
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
        visitType,
        totalCost,
        route,
        age,
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
        age: String(age),
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
          area: record.area,
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
        age,
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
        age: String(age),
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


export async function processDataLocallyNeo(
  mergedData: MergedDataNeo[],
  accessToken: string,
  progressCallback?: (current: number, total: number) => void
) {
  try {
    // Step 0: Load chart number mapping and update chartNumber - 중요한 익명화 작업
    const chartNumberMapping = await getMappingData(accessToken);

    // Step 1: Update chartNumber using the fetched mapping
    const mappedData: MergedDataNeo[] = mergedData.map((record, index) => {
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

    // Step 2: Add location_true field to all records (false by default)
    const recordsWithLocationFlag = mappedData.map((record) => ({
      ...record,
      location_true: record.address !== "N/D",
    }));

    // Step 3: Extract records with valid addresses for geocoding
    const addressesToGeocode = recordsWithLocationFlag
      .filter((record) => record.location_true)
      .map((record) => ({
        chartNumber: record.chartNumber,
        address: String(record.address),
      }));

    // Step 4: Geocode addresses
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

    // Step 5: Update location_true based on geocoding results
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
      id: region.id,
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const dongRegions = regionData.dongRegions.map((region) => ({
      id: region.id,
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const guRegions = regionData.guRegions.map((region) => ({
      id: region.id,
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const processedRecords: ProcessedPatientDataNeo[] = recordsWithGeodata.map(
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
          visitType: record.visitType,
          location_true: record.location_true,
          small_region_id,
          dong_region_id,
          gu_region_id,
        };
      }
    );

    // Step 6: Create date-grouped location data
    const dateLocationMap = new Map<string, LocationPoint[]>();

    recordsWithGeodata.forEach((record) => {
      const {
        visitDate,
        latitude,
        longitude,
        location_true,
        totalCost,
        visitType,
        age,
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
        route: "",
        age: String(age),
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

export async function processDataLocallycChart(
  mergedData: MergedDataCchart[],
  accessToken: string,
  progressCallback?: (current: number, total: number) => void
) {
  try {
    // Step 0: Load chart number mapping and update chartNumber- 중요한 익명화 작업
    const chartNumberMapping = await getMappingData(accessToken);

    // Step 1: Update chartNumber using the fetched mapping
    const mappedData: MergedDataCchart[] = mergedData.map((record, index) => {
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
          route: record. route,
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
      const { visitDate, latitude, longitude, location_true, totalCost, age, route } =
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
        route: route,
        age: String(age),
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

export async function processDataLocallyBit(
  mergedData: MergedDataBit[],
  accessToken: string,
  progressCallback?: (current: number, total: number) => void
) {
  try {
    // Step 0: Load chart number mapping and update chartNumber - 중요한 익명화 작업
    const chartNumberMapping = await getMappingData(accessToken);

    // Step 1: Update chartNumber using the fetched mapping
    const mappedData: MergedDataBit[] = mergedData.map((record, index) => {
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

    // Step 2: Add location_true field to all records (false by default)
    const recordsWithLocationFlag = mappedData.map((record) => ({
      ...record,
      location_true: record.address !== "N/D",
    }));

    // Step 3: Extract records with valid addresses for geocoding
    const addressesToGeocode = recordsWithLocationFlag
      .filter((record) => record.location_true)
      .map((record) => ({
        chartNumber: record.chartNumber,
        address: String(record.address),
      }));

    // Step 4: Geocode addresses
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

    // Step 5: Update location_true based on geocoding results
    const recordsWithGeodata = recordsWithLocationFlag.map((record) => {
      const geoData = geoMap.get(record.chartNumber);

      return {
        ...record,
        latitude: geoData?.latitude ?? null,
        longitude: geoData?.longitude ?? null,
        location_true: geoData?.geocoded ?? false,
      };
    });

    // Step 6: Fetch and parse region data
    const regionData = await fetchRegionData(accessToken);

    // Parse the polygon data
    const smallRegions = regionData.smallRegions.map((region) => ({
      id: region.id,
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const dongRegions = regionData.dongRegions.map((region) => ({
      id: region.id,
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    const guRegions = regionData.guRegions.map((region) => ({
      id: region.id,
      name: region.name,
      coords: parsePolygon(region.polygon),
    }));

    // Step 7: Process records with region matching
    const processedRecords: ProcessedPatientDataBit[] = recordsWithGeodata.map(
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
          visitType: record.visitType,
          doctor: record.doctor,
          location_true: record.location_true,
          small_region_id,
          dong_region_id,
          gu_region_id,
        };
      }
    );

    // Step 8: Create date-grouped location data
    const dateLocationMap = new Map<string, LocationPoint[]>();

    recordsWithGeodata.forEach((record) => {
      const {
        visitDate,
        latitude,
        longitude,
        location_true,
        totalCost,
        visitType,
        age,
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
        route: "",
        age: String(age),
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
    console.error("Error processing Bit data locally:", error);
    throw error;
  }
}
