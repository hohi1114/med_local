import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllRegionsEtc, getHospitalLocation } from "../utils/api/apis";
import { getDataFromRegionDB } from "../store/indexded_db/RegionDB";
import mapStore from "../store/mapStore";
import userStore from "../store/userStore";

import { Point, RegionData, RegionEtcData } from "../types/naver-maps";

type RegionLevel = "small" | "dong" | "gu";

const REGION_KEYS: Record<RegionLevel, string> = {
  small: "small_regions",
  dong: "dong_regions",
  gu: "gu_regions"
};

const useNaverMapData = () => {
  const { drawerDate } = mapStore();
  const { isInActiveUser, user } = userStore();

  const [maxCost, setMaxCost] = useState<Record<RegionLevel, number>>({
    small: 0,
    dong: 0,
    gu: 0
  });

  const [regionData, setRegionData] = useState<
    Record<RegionLevel, RegionData[]>
  >({
    small: [],
    dong: [],
    gu: []
  });

  const [regionEtc, setRegionEtc] = useState<
    Record<RegionLevel, RegionEtcData[] | null>
  >({
    small: null,
    dong: null,
    gu: null
  });

  const [hospitalLocation, setHospitalLocation] = useState<Point | null>(null);

  const {
    data: allRegionEtcData,
    refetch: allRegionEtcFetch,
    isFetching
  } = useQuery({
    queryKey: ["allRegionsEtc"],
    queryFn: () => getAllRegionsEtc(drawerDate),
    retry: false,
    enabled: false
  });

  const {
    data: hospitalLocationData,
    refetch: hospitalLocationFetch,
    isLoading: hospitalLocationLoading
  } = useQuery({
    queryKey: ["hospitalLocation"],
    queryFn: getHospitalLocation,
    retry: false
  });

  // 병원 위치 데이터 요청
  useEffect(() => {
    hospitalLocationFetch();
  }, []);

  useEffect(() => {
    if (drawerDate && user.user_id && !isInActiveUser) {
      allRegionEtcFetch();
    }
  }, [drawerDate, isInActiveUser, user]);

  useEffect(() => {
    if (hospitalLocationData?.location) {
      setHospitalLocation(hospitalLocationData.location);
    }
  }, [hospitalLocationData]);

  // RegionEtc 데이터로 maxCost, regionEtc 상태 업데이트
  useEffect(() => {
    if (!allRegionEtcData) return;

    (Object.keys(REGION_KEYS) as RegionLevel[]).forEach((level) => {
      const key = REGION_KEYS[level];
      const etc = allRegionEtcData[key];
      if (etc) {
        setMaxCost((prev) => ({ ...prev, [level]: etc.max_cost ?? 0 }));
        setRegionEtc((prev) => ({
          ...prev,
          [level]: etc[`${level}_region_costs`] ?? []
        }));
      }
    });
  }, [allRegionEtcData]);

  // polygon + etc 데이터 결합
  useEffect(() => {
    const fetchAndSetRegions = async () => {
      const updated: Partial<Record<RegionLevel, RegionData[]>> = {};

      await Promise.all(
        (Object.keys(REGION_KEYS) as RegionLevel[]).map(async (level) => {
          const key = REGION_KEYS[level];
          const etcData = regionEtc[level];
          if (!etcData) return;

          const rawRegions = await getDataFromRegionDB(key);
          updated[level] = rawRegions.map((region) => {
            const matchedEtc = etcData.find(
              (item) => item[`${level}_region_name`] === region.name
            );

            return {
              ...region,
              polygon: JSON.parse(region.polygon)[0],
              total_cost: matchedEtc?.total_cost ?? 0,
              patient_locations: matchedEtc?.patient_locations ?? []
            };
          });
        })
      );

      setRegionData((prev) => ({ ...prev, ...updated }));
    };

    if (regionEtc.small && regionEtc.dong && regionEtc.gu) {
      fetchAndSetRegions();
    }
  }, [regionEtc]);

  const getRegionName = (zoom: number) => {
    if (zoom >= 15) {
      return {
        data: regionData.small,
        name: "small",
        fontSize: "1rem",
        color: "#6666E0",
        hilightColor: "#0000b4"
      };
    } else if (zoom >= 14) {
      return {
        data: regionData.dong,
        name: "dong",
        fontSize: "1rem",
        color: "#6666E0",
        hilightColor: "#0000b4"
      };
    } else {
      return {
        data: regionData.gu,
        name: "gu",
        fontSize: "1.2rem",
        color: "#6666E0",
        hilightColor: "#0000b4"
      };
    }
  };

  const getPolygonColorOpacity = (
    totalCost: number,
    name: RegionLevel
  ): string => {
    const highestCost = maxCost[name];
    let normalized = 0;

    if (highestCost > 0 && totalCost > 0) {
      normalized = Math.pow(totalCost / highestCost, 1 / 3);
      normalized = Math.min(normalized, 1);
    }

    const start = { r: 240, g: 248, b: 255 };
    const end = { r: 0, g: 0, b: 180 };
    const r = Math.round(start.r + (end.r - start.r) * normalized);
    const g = Math.round(start.g + (end.g - start.g) * normalized);
    const b = Math.round(start.b + (end.b - start.b) * normalized);
    const opacity = totalCost === 0 ? 0.1 : 0.5;

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const expandBounds = (
    bounds: naver.maps.LatLngBounds,
    expansionFactor = 0.2
  ): naver.maps.LatLngBounds => {
    const sw = bounds.getSW();
    const ne = bounds.getNE();
    const latDiff = (ne.lat() - sw.lat()) * expansionFactor;
    const lngDiff = (ne.lng() - sw.lng()) * expansionFactor;

    return new naver.maps.LatLngBounds(
      new naver.maps.LatLng(sw.lat() - latDiff, sw.lng() - lngDiff),
      new naver.maps.LatLng(ne.lat() + latDiff, ne.lng() + lngDiff)
    );
  };

  const getBoundAreas = (
    areas: RegionData[],
    bounds: naver.maps.LatLngBounds
  ) => {
    return {
      boundAreas: areas.filter((area) => {
        const polygonLatLngs = area.polygon.map(
          ([lng, lat]) => new naver.maps.LatLng(lat, lng)
        );
        return polygonLatLngs.some((latlng) => bounds.hasLatLng(latlng));
      })
    };
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000;
  };

  const groupPatientsByProximity = (
    locations: Point[],
    range = 500
  ): Point[][] => {
    const clusters: Point[][] = [];
    const visited = new Array(locations.length).fill(false);

    for (let i = 0; i < locations.length; i++) {
      if (visited[i]) continue;
      const cluster: Point[] = [locations[i]];
      visited[i] = true;

      for (let j = i + 1; j < locations.length; j++) {
        if (!visited[j]) {
          const distance = calculateDistance(
            locations[i].lat,
            locations[i].lng,
            locations[j].lat,
            locations[j].lng
          );
          if (distance <= range) {
            cluster.push(locations[j]);
            visited[j] = true;
          }
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  };

  return {
    smallRegions: regionData.small,
    dongRegions: regionData.dong,
    guRegions: regionData.gu,
    smallRegionEtc: regionEtc.small,
    dongRegionEtc: regionEtc.dong,
    guRegionEtc: regionEtc.gu,
    hospitalLocationLoading,
    getRegionName,
    expandBounds,
    getBoundAreas,
    getPolygonColorOpacity,
    groupPatientsByProximity,
    hospitalLocation,
    isFetching
  };
};

export default useNaverMapData;
