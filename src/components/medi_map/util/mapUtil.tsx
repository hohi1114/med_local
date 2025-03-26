import * as turf from "@turf/turf";
import { getDataFromRegionDB } from "../../../store/indexded_db/RegionDB";
import { Polygon, RegionData } from "../../../types/naver-maps";

export const fixPolygonCoordinates = (
  polygon: [number, number][]
): [number, number][] => {
  if (
    polygon[0][0] !== polygon[polygon.length - 1][0] ||
    polygon[0][1] !== polygon[polygon.length - 1][1]
  ) {
    polygon.push(polygon[0]);
  }

  while (polygon.length < 4) {
    polygon.push(polygon[0]);
  }

  return polygon;
};

// ✅ `smallPolygon`을 포함하는 `dong` 찾기
export const findContainingDong = async (
  smallPoint: Polygon
): Promise<RegionData> => {
  const dongData = await getDataFromRegionDB("dong_regions");

  return dongData.find((dong) => {
    if (!dong.polygon) return false;
    const dongPolygonArray = JSON.parse(dong.polygon);
    const fixedPolygon = fixPolygonCoordinates(dongPolygonArray?.[0]);

    return (
      fixedPolygon.length >= 4 &&
      turf.booleanContains(turf.polygon([fixedPolygon]), turf.point(smallPoint))
    );
  });
};
