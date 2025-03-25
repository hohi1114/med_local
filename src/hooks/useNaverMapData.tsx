import { use, useEffect, useState } from "react";
import { getDataFromRegionDB } from "../store/indexded_db/RegionDB";
import { Point, RegionData, RegionEtcData } from "../types/naver-maps";
import { useQuery } from "@tanstack/react-query";
import { getAllRegionsEtc, getHospitalLocation } from "../utils/api/apis";
import mapStore from "../store/mapStore";

const useNaverMapData = () => {
  const { drawerDate } = mapStore();

  const [maxCost, setMaxCost] = useState({ small: 0, dong: 0, gu: 0 });
  const [smallRegions, setSmallRegions] = useState<RegionData[]>([]);
  const [dongRegions, setDongRegions] = useState<RegionData[]>([]);
  const [guRegions, setGuRegions] = useState<RegionData[]>([]);
  const [smallRegionEtc, setSmallRegionEtc] = useState<RegionEtcData[] | null>(
    null
  );
  const [dongRegionEtc, setDongRegionEtc] = useState<RegionEtcData[] | null>(
    null
  );
  const [guRegionEtc, setGuRegionEtc] = useState<RegionEtcData[] | null>(null);
  const [hospitalLocation, setHospitalLocation] = useState<Point | null>(null);

  const {
    data: allRegionEtcData,
    refetch: allRegionEtcFetch,
    isFetching
  } = useQuery({
    queryKey: ["allRegionsEtc"],
    queryFn: () => getAllRegionsEtc(drawerDate),
    retry: false,
    enabled: !!drawerDate
  });
  const { data: hospitalLocationData, refetch: hospitalLocationFetch } =
    useQuery({
      queryKey: ["hospitalLocation"],
      queryFn: () => getHospitalLocation(),
      retry: false
    });

  useEffect(() => {
    hospitalLocationFetch();
  }, []);

  useEffect(() => {
    if (drawerDate) {
      allRegionEtcFetch();
    }
  }, [drawerDate]);

  useEffect(() => {
    if (hospitalLocationData) {
      const { location } = hospitalLocationData;
      setHospitalLocation(location);
    }
  }, [hospitalLocationData]);

  useEffect(() => {
    if (allRegionEtcData) {
      const newMaxCost = { ...maxCost };
      Object.keys(allRegionEtcData).forEach((key) => {
        if (key === "small_regions") {
          setMaxCost((prev) => ({
            ...prev,
            small: allRegionEtcData[key]?.max_cost
          }));
          setSmallRegionEtc(allRegionEtcData[key]?.small_region_costs ?? []);
        } else if (key === "dong_regions") {
          setMaxCost((prev) => ({
            ...prev,
            dong: allRegionEtcData[key]?.max_cost
          }));
          setDongRegionEtc(allRegionEtcData[key]?.dong_region_costs ?? []);
        } else {
          setMaxCost((prev) => ({
            ...prev,
            gu: allRegionEtcData[key]?.max_cost
          }));
          setGuRegionEtc(allRegionEtcData[key]?.gu_region_costs ?? []);
        }
      });
    }
  }, [allRegionEtcData]);
  useEffect(() => {
    const fetchAndTransformRegions = async () => {
      const regionKeys = ["small_regions", "dong_regions", "gu_regions"];
      const etcKeys = ["small", "dong", "gu"];
      const regionData = await Promise.all(
        regionKeys.map(async (key, index) => {
          const regions = await getDataFromRegionDB(key);

          return regions.map((region) => {
            let etc_data: RegionEtcData[] = [];
            if (key === "small_regions") {
              etc_data = smallRegionEtc;
            } else if (key === "dong_regions") {
              etc_data = dongRegionEtc;
            } else {
              etc_data = guRegionEtc;
            }
            const matchedEtc = etc_data.find(
              (item) => item[etcKeys[index] + "_region_name"] === region.name
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

      setSmallRegions(regionData[0]);
      setDongRegions(regionData[1]);
      setGuRegions(regionData[2]);
    };
    if (smallRegionEtc && dongRegionEtc && guRegionEtc) {
      fetchAndTransformRegions();
    }
  }, [smallRegionEtc, dongRegionEtc, guRegionEtc]);

  const getRegionName = (currentZoom: number) => {
    if (currentZoom >= 15) {
      return {
        data: smallRegions,
        name: "small",
        fontSize: "1rem",
        color: "#6666E0",
        hilightColor: "#0000b4"
      };
    } else if (currentZoom < 15 && currentZoom >= 14) {
      return {
        data: dongRegions,
        name: "dong",
        fontSize: "1rem",
        color: "#6666E0",
        hilightColor: "#0000b4"
      };
    } else {
      return {
        data: guRegions,
        name: "gu",
        fontSize: "1.2rem",
        color: "#6666E0",
        hilightColor: "#0000b4F"
      };
    }
  };
  const getPolygonColorOpacity = (totalCost: number, name: string): string => {
    const highestCost = maxCost[name as keyof typeof maxCost];

    let normalizedCost = 0;
    if (highestCost > 0 && totalCost > 0) {
      // (totalCost / highestCost)의 1/3승
      normalizedCost = Math.pow(totalCost / highestCost, 1 / 3);
      // 1을 넘지 않도록 제한
      normalizedCost = Math.min(normalizedCost, 1);
    }

    // 색상 범위 설정 (더 넓은 범위)
    const startColor = { r: 240, g: 248, b: 255 }; // 거의 흰색에 가까운 파랑
    const endColor = { r: 0, g: 0, b: 180 }; // 매우 짙은 파랑

    const r = Math.round(
      startColor.r + (endColor.r - startColor.r) * normalizedCost
    );
    const g = Math.round(
      startColor.g + (endColor.g - startColor.g) * normalizedCost
    );
    const b = Math.round(
      startColor.b + (endColor.b - startColor.b) * normalizedCost
    );

    const opacity = totalCost === 0 ? 0.1 : 0.5;

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const expandBounds = (
    bounds: naver.maps.LatLngBounds,
    expansionFactor: number = 0.2
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

  /**Get Areas Based on Bounds */
  const getBoundAreas = (
    areas: RegionData[],
    mapBounds: naver.maps.LatLngBounds
  ): { boundAreas: RegionData[] } => {
    let boundAreas = [] as RegionData[];

    areas.forEach((area) => {
      const polygonLatLngs = area.polygon.map(
        ([lng, lat]) => new naver.maps.LatLng(lat, lng)
      );

      let isAreaAlreadyAdded = boundAreas.some(
        (existingArea) => existingArea.name === area.name
      );

      polygonLatLngs.forEach((latlng) => {
        if (mapBounds.hasLatLng(latlng) && !isAreaAlreadyAdded) {
          boundAreas.push(area);
          isAreaAlreadyAdded = true;
        }
      });
    });

    return { boundAreas };
  };

  // Haversine 공식을 사용하여 두 점 사이의 거리 계산 함수
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 지구 반경 (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000;

    return distance;
  };

  // 500미터 내 환자들만 필터링하는 함수
  const groupPatientsByProximity = (
    patientsLocations: Point[],
    range = 500
  ): Point[][] => {
    const clusters: Point[][] = [];
    const visited: boolean[] = new Array(patientsLocations.length).fill(false);

    for (let i = 0; i < patientsLocations.length; i++) {
      if (visited[i]) continue;

      const cluster: Point[] = [];
      cluster.push(patientsLocations[i]);
      visited[i] = true;

      // 현재 점을 기준으로 다른 점들과 비교
      for (let j = i + 1; j < patientsLocations.length; j++) {
        if (visited[j]) continue;

        const distance = calculateDistance(
          patientsLocations[i].lat,
          patientsLocations[i].lng,
          patientsLocations[j].lat,
          patientsLocations[j].lng
        );

        if (distance <= range) {
          cluster.push(patientsLocations[j]);
          visited[j] = true;
        }
      }

      // 클러스터에 추가
      clusters.push(cluster);
    }

    return clusters;
  };

  return {
    smallRegions,
    dongRegions,
    guRegions,
    smallRegionEtc,
    dongRegionEtc,
    guRegionEtc,
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
