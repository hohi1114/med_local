// backend/src/services/geolocation.ts
import axios from "axios";

// Interface for geolocation result
export interface GeoLocation {
  latitude: number | null;
  longitude: number | null;
}

// Configuration (store these in environment variables in production)
const NAVER_CLIENT_ID = "h7hdp8e16r";
const NAVER_CLIENT_SECRET = "IoalkdNtYuT4zT4Mb2RdQPqoutPMCBe6Jxb69bgf";

// Function to get latitude and longitude using Naver Maps REST API
export const getLatLonNaver = async (
  address: string,
  index: number,
  total: number
): Promise<GeoLocation> => {
  try {
    const response = await axios.get(
      "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode",
      {
        params: {
          query: address,
        },
        headers: {
          "X-NCP-APIGW-API-KEY-ID": NAVER_CLIENT_ID,
          "X-NCP-APIGW-API-KEY": NAVER_CLIENT_SECRET,
        },
      }
    );

    const data = response.data;
    if (data.status === "OK" && data.addresses && data.addresses.length > 0) {
      const { y: latitude, x: longitude } = data.addresses[0];
      return {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };
    } else {
      return { latitude: null, longitude: null };
    }
  } catch (error) {
    return { latitude: null, longitude: null };
  }
};

// Batch processing function for multiple addresses
export const getLatLonForAddresses = async (
  addresses: { chartNumber: number; address: string }[],
  progressCallback?: (current: number, total: number) => void
): Promise<
  { chartNumber: number; latitude: number | null; longitude: number | null }[]
> => {
  console.log("addresses " + addresses);
  const results = [];
  const total = addresses.length;

  for (let i = 0; i < total; i++) {
    const { chartNumber, address } = addresses[i];
    const { latitude, longitude } = await getLatLonNaver(address, i, total);
    results.push({ chartNumber, latitude, longitude });

    // Report progress after each address is processed
    if (progressCallback) {
      progressCallback(i + 1, total);
    }
  }

  return results;
};
