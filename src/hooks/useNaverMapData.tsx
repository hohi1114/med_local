import { useEffect, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { getAllRegionsEtc, getPatientLocations } from "../utils/api/apis";
import { getDataFromRegionDB } from "../store/indexded_db/RegionDB";
import mapStore from "../store/mapStore";
import userStore from "../store/userStore";

import {
  Point,
  RegionData,
  RegionEtcData,
  RegionLevel
} from "../types/naver-maps";

type RegionEtcMap = {
  small: RegionEtcData[] | null;
  dong: RegionEtcData[] | null;
  gu: RegionEtcData[] | null;
};

const REGION_KEYS: Record<RegionLevel, string> = {
  small: "small_regions",
  dong: "dong_regions",
  gu: "gu_regions"
};

const useNaverMapData = (twoType: boolean) => {
  const { drawerDate, drawerDate1, drawerDate2 } = mapStore();
  const { isInActiveUser, user, hasGuided, startTutorial } = userStore();
  const [patientLocations, setPatientLocations] = useState<Point[]>([]);

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

  const [regionComparisionEtc, setRegionComparisonEtc] = useState<{
    first: RegionEtcMap;
    second: RegionEtcMap;
  }>({
    first: { small: null, dong: null, gu: null },
    second: { small: null, dong: null, gu: null }
  });

  const regionQueries = useQueries({
    queries: twoType
      ? [
          { type: "A", date: drawerDate1 },
          { type: "B", date: drawerDate2 }
        ].map((data) => ({
          queryKey: [`allRegionsEtc${data.type}`, data.date],
          queryFn: () => getAllRegionsEtc(data.date!),
          enabled:
            !!user.user_id &&
            !isInActiveUser &&
            hasGuided &&
            !startTutorial &&
            !!drawerDate1 &&
            !!drawerDate2
        }))
      : drawerDate
      ? [
          {
            queryKey: ["allRegionsEtc", drawerDate],
            queryFn: () => getAllRegionsEtc(drawerDate),
            enabled:
              !!user.user_id &&
              !isInActiveUser &&
              hasGuided &&
              !startTutorial &&
              !!drawerDate
          },
          {
            queryKey: ["allPatientLocations", drawerDate],
            queryFn: () => getPatientLocations(drawerDate),
            enabled:
              !!user.user_id &&
              !isInActiveUser &&
              hasGuided &&
              !startTutorial &&
              !!drawerDate
          }
        ]
      : []
  });

  //Loading 상태
  const isFetchingRegionData = regionQueries.some((q) => q.isFetching);

  // 기간 1개 일떄
  useEffect(() => {
    if (!twoType && regionQueries[0]?.data) {
      processRegionEtcData(regionQueries[0].data);
    }
    if (regionQueries[1]?.data) {
      setPatientLocations(regionQueries[1].data);
    }
  }, [twoType, regionQueries[0]?.data, regionQueries[1]?.data]);

  // 기간 2개 일때
  useEffect(() => {
    if (
      twoType &&
      regionQueries.length === 2 &&
      regionQueries[0]?.data &&
      regionQueries[1]?.data
    ) {
      processRegionComparisonEtcData(
        regionQueries[0]?.data,
        regionQueries[1]?.data
      );
    }
  }, [twoType, regionQueries[0]?.data, regionQueries[1]?.data]);

  // RegionEtc 데이터로 maxCost, regionEtc 상태 업데이트 ->  기간 1개 일떄
  const processRegionEtcData = (data: RegionEtcData[]) => {
    (Object.keys(REGION_KEYS) as RegionLevel[]).forEach((level) => {
      const key = REGION_KEYS[level];
      const etc = data[key];
      if (etc) {
        setMaxCost((prev) => ({ ...prev, [level]: etc.max_cost ?? 0 }));
        setRegionEtc((prev) => ({
          ...prev,
          [level]: etc[`${level}_region_costs`] ?? []
        }));
      }
    });
  };

  // polygon + etc 데이터 결합 ->기간 2개 일떄
  const processRegionComparisonEtcData = (
    data1: RegionEtcData[],
    data2: RegionEtcData[]
  ) => {
    (Object.keys(REGION_KEYS) as RegionLevel[]).forEach((level) => {
      const key = REGION_KEYS[level];
      const etc = data1[key];
      const etc2 = data2[key];

      if (etc) {
        setRegionComparisonEtc((prev) => ({
          ...prev,
          first: {
            ...prev.first,
            [level]: etc[`${level}_region_costs`] ?? []
          }
        }));
      }
      if (etc2) {
        setRegionComparisonEtc((prev) => ({
          ...prev,
          second: {
            ...prev.second,
            [level]: etc2[`${level}_region_costs`] ?? []
          }
        }));
      }
    });
  };

  // etc와 fetching 한 데이터 결합 ->  기간 1개 일떄
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
            let costRank = -1;
            const matchedEtc = etcData.find((item, index) => {
              costRank = index + 1;
              return item[`${level}_region_name`] === region.name;
            });

            return {
              ...region,
              costRank,
              polygon: JSON.parse(region.polygon)[0],
              total_cost: matchedEtc?.total_cost ?? 0,
              growth_metrics: matchedEtc?.growth_metrics
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

  // etc와 fetching 한 데이터 결합 ->  기간 2개 일떄
  useEffect(() => {
    const fetchAndSetRegions = async () => {
      const updated: Partial<Record<RegionLevel, RegionData[]>> = {};

      await Promise.all(
        (Object.keys(REGION_KEYS) as RegionLevel[]).map(async (level) => {
          const key = REGION_KEYS[level];
          const etcDataA = regionComparisionEtc.first[level];
          const etcDataB = regionComparisionEtc.second[level];

          if (!etcDataA || !etcDataB) return;

          const rawRegions = await getDataFromRegionDB(key);
          updated[level] = rawRegions.map((region) => {
            const matchedEtcA = etcDataA.find(
              (item) => item[`${level}_region_name`] === region.name
            );
            const matchedEtcB = etcDataB.find(
              (item) => item[`${level}_region_name`] === region.name
            );

            return {
              ...region,
              polygon: JSON.parse(region.polygon)[0],
              total_costA: matchedEtcA?.total_cost ?? 0,
              total_costB: matchedEtcB?.total_cost ?? 0
            };
          });
        })
      );

      setRegionData((prev) => ({ ...prev, ...updated }));
    };

    if (
      regionComparisionEtc.first.dong &&
      regionComparisionEtc.first.gu &&
      regionComparisionEtc.first.small &&
      regionComparisionEtc.second.dong &&
      regionComparisionEtc.second.gu &&
      regionComparisionEtc.second.small
    ) {
      fetchAndSetRegions();
    }
  }, [regionComparisionEtc]);

  const getRegionName = (zoom: number, boundAreas?: any) => {
    if (boundAreas && boundAreas.length === 0) {
      return {
        data: regionData.dong,
        name: "dong",
        fontSize: "1rem"
      };
    }

    if (zoom > 15) {
      return {
        data: regionData.small,
        name: "small",
        fontSize: "1rem"
      };
    } else if (zoom >= 14) {
      return {
        data: regionData.dong,
        name: "dong",
        fontSize: "1rem"
      };
    } else {
      return {
        data: regionData.gu,
        name: "gu",
        fontSize: "1.2rem"
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
    bounds: naver.maps.LatLngBounds,
    patientLocations?: { lat: number; lng: number }[]
  ) => {
    const boundAreas = areas.filter((area) => {
      const polygonLatLngs = area.polygon.map(
        ([lng, lat]) => new naver.maps.LatLng(lat, lng)
      );
      return polygonLatLngs.some((latlng) => bounds.hasLatLng(latlng));
    });
    let boundPatientLocations: Point[] = [];

    if (patientLocations) {
      boundPatientLocations = patientLocations.filter((loc) =>
        bounds.hasLatLng(new naver.maps.LatLng(loc.lat, loc.lng))
      );
    }

    return {
      boundAreas,
      boundPatientLocations
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
    getRegionName,
    expandBounds,
    getBoundAreas,
    getPolygonColorOpacity,
    groupPatientsByProximity,
    isFetching: isFetchingRegionData,
    patientLocations
  };
};

export default useNaverMapData;
