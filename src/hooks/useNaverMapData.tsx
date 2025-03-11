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

  //Get Polygon color opacity based on totalCost
  const getPolyonColorOpacity = (totalCost: number) => {
    if (totalCost < 10000) {
      //1만 미만
      return 0.1;
    } else if (totalCost >= 10000 && totalCost < 100000) {
      //1민이상 - 10만 미안
      return 0.3;
    } else if (totalCost >= 100000 && totalCost < 1000000) {
      //10만 이상 - 100만 미만
      return 0.5;
    } else {
      // 100만 이상
      return 0.7;
    }
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

  return {
    getRegionName,
    expandBounds,
    getBoundAreas,
    getPolyonColorOpacity
  };
};

export default useNaverMapData;
