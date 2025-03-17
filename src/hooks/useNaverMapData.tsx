import mapStore from "../store/mapStore";
import { PatientData } from "../utils/ExcelParser";
import useMediMapData, { Area } from "./useMediMapData";

const useNaverMapData = () => {
  const { highestCost } = mapStore();
  //**Data
  const { areas: dongPolygons } = useMediMapData("fixed_polygon.json");
  const { areas: smallPolygons } = useMediMapData("normalized_small_db.json");
  const { areas: guPolygons } = useMediMapData("district_boundaries.json");

  const isDataLoaded =
    dongPolygons.length > 0 &&
    smallPolygons.length > 0 &&
    guPolygons.length > 0;

  const getRegionName = (currentZoom: number) => {
    if (currentZoom >= 15) {
      return {
        data: smallPolygons,
        name: "small",
        fontSize: "1.2rem"
      };
    } else if (currentZoom < 15 && currentZoom >= 14) {
      return {
        data: dongPolygons,
        name: "dong",
        fontSize: "1.2rem"
      };
    } else {
      return {
        data: guPolygons,
        name: "gu",
        fontSize: "1.5rem"
      };
    }
  };

  //** Calculate Polygon Opacity */
  const getPolygonColorOpacity = (totalCost: number, name: string): string => {
    const minCost = 0;
    const hightestCost = highestCost[name] || 0;
    const normalizedCost =
      hightestCost === 0
        ? 1
        : Math.min(Math.max(totalCost, minCost), hightestCost) / hightestCost;
    const startColor = { r: 208, g: 232, b: 255 };
    const endColor = { r: 76, g: 140, b: 255 };

    const r = Math.round(
      startColor.r + (endColor.r - startColor.r) * normalizedCost
    );
    const g = Math.round(
      startColor.g + (endColor.g - startColor.g) * normalizedCost
    );
    const b = Math.round(
      startColor.b + (endColor.b - startColor.b) * normalizedCost
    );

    const opacity = 0.5;
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
    areas: Area[],
    mapBounds: naver.maps.LatLngBounds
  ): { boundAreas: Area[] } => {
    let boundAreas = [] as Area[];

    areas.forEach((area) => {
      if (!area.coords || area.coords.length === 0) return;

      const polygonLatLngs = area.coords.map(
        ([lat, lng]) => new naver.maps.LatLng(lat, lng)
      );

      let isAreaAlreadyAdded = boundAreas.some(
        (existingArea) => existingArea.areaName === area.areaName
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
    patients: PatientData[],
    range = 500
  ): PatientData[][] => {
    let groups: PatientData[] = [];

    // 각 환자에 대해 그룹을 찾아 그룹화
    patients.forEach((patient, index) => {
      // 이미 그룹에 포함된 환자는 건너뛰기
      let foundGroup = false;

      for (let group of groups) {
        // 그룹의 첫 번째 환자와 현재 환자 간의 거리를 계산
        const distance = calculateDistance(
          patient.latitude,
          patient.longitude,
          group[0].latitude,
          group[0].longitude
        );

        // 500미터 이내라면 같은 그룹에 포함
        if (distance <= range) {
          group.push(patient);
          foundGroup = true;
          break;
        }
      }

      // 만약 해당 환자가 어떤 그룹에도 속하지 않으면 새로운 그룹을 생성
      if (!foundGroup) {
        groups.push([patient]);
      }
    });

    return groups;
  };

  return {
    isDataLoaded,
    getRegionName,
    expandBounds,
    getBoundAreas,
    getPolygonColorOpacity,
    groupPatientsByProximity
  };
};

export default useNaverMapData;
