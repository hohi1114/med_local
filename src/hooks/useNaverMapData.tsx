import { PatientData } from "../utils/ExcelParser";
import { Area } from "./useMediMapData";

const useNaverMapData = () => {
  const getRegionName = (currentZoom: number) => {
    if (currentZoom >= 15) {
      return {
        name: "small",
        polygonLineColor: "#92BFFF",
        color_r: 146,
        color_g: 191,
        color_b: 255,
        fontSize: "1.2rem"
      };
    } else if (currentZoom < 15 && currentZoom >= 14) {
      return {
        name: "dong",
        polygonLineColor: "#92BFFF",
        color_r: 146,
        color_g: 191,
        color_b: 255,
        fontSize: "1.2rem"
      };
    } else {
      return {
        name: "gu",
        polygonLineColor: "#92BFFF",
        color_r: 146,
        color_g: 191,
        color_b: 255,
        fontSize: "1.5rem"
      };
    }
  };

  //** Calculate Polygon Opacity */
  function getPolygonColorOpacity(totalCost: number) {
    const minOpacity = 0.1;
    const maxOpacity = 0.7;
    const minCost = 0;
    const maxCost = 10000000;

    if (totalCost <= minCost) return minOpacity;
    if (totalCost >= maxCost) return maxOpacity;

    const normalized = (totalCost - minCost) / (maxCost - minCost);
    return minOpacity + normalized * (maxOpacity - minOpacity);
  }

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
  const groupPatientsByProximity = (patients: PatientData, range = 500) => {
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
    getRegionName,
    expandBounds,
    getBoundAreas,
    getPolygonColorOpacity,
    groupPatientsByProximity
  };
};

export default useNaverMapData;
