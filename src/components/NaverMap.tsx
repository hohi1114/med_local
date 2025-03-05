import React, { useEffect, useRef, useState } from "react";
import useMediMapData from "../hooks/useMediMapData";

interface PatientData {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
  age: string;
  address: string;
  latitude: number;
  longitude: number;
}

/**
 특정 구역에 환자가 포함되는지
 */
function containsLocation(pointLat: number, pointLng: number, polygon: naver.maps.Polygon): boolean {
  // Instead of getPath(), use getPaths() + getAt(0)
  const ringArray = polygon.getPaths().getAt(0); // the first ring
  if (!ringArray) return false; // no ring

  let inside = false;
  const len = ringArray.getLength();

  for (let i = 0, j = len - 1; i < len; j = i++) {
    const latI = ringArray.getAt(i).lat();
    const lngI = ringArray.getAt(i).lng();
    const latJ = ringArray.getAt(j).lat();
    const lngJ = ringArray.getAt(j).lng();

    const intersect =
        (lngI > pointLng) !== (lngJ > pointLng) &&
        pointLat < ((latJ - latI) * (pointLng - lngI)) / (lngJ - lngI) + latI;

    if (intersect) inside = !inside;
  }
  return inside;
}

const NaverMap: React.FC<{ filtered_db: PatientData[] }> = ({ filtered_db }) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);

  // Use your custom hook for polygon data
  const { areas } = useMediMapData();

  const [polygonStats, setPolygonStats] = useState<
      Record<string, { totalCost: number; patientCount: number }>
  >({});

  // Create the map once
  useEffect(() => {
    if (!mapElement.current || map) return;

    const newMap = new window.naver.maps.Map(mapElement.current, {
      center: new window.naver.maps.LatLng(37.51, 126.88),
      zoom: 15,

    });
    setMap(newMap);
  }, [map]);

  // Draw polygons & markers whenever map, areas, or filtered_db changes
  useEffect(() => {
    if (!map) return;

    // Store stats for each area
    const stats: Record<string, { totalCost: number; patientCount: number }> = {};  //stats를 변형해서 띄운다

    // 1. Draw polygons
    areas.forEach((area) => {
      if (!area.coords || area.coords.length === 0) return;

      // Convert coords to naver LatLng
      const latLngs = area.coords.map(
          ([lng, lat]) => new window.naver.maps.LatLng(lat, lng)
      );

      const polygon = new window.naver.maps.Polygon({
        map,
        paths: latLngs,
        fillColor: "rgba(0, 255, 0, 0.1)",
        strokeColor: "#00ff00",
        strokeWeight: 0.3,
      });

      // Initialize stats
      stats[area.areaName] = { totalCost: 0, patientCount: 0 };

      // 2. Count patients inside this polygon (using our custom function)
      filtered_db.forEach((patient) => {
        const { latitude, longitude, totalCost } = patient;

        // Skip if lat/lng are missing
        if (latitude == null || longitude == null) {
          return; // do nothing for this patient
        }

        // Otherwise, call the "containsLocation" check
        if (containsLocation(latitude, longitude, polygon)) {
          stats[area.areaName].totalCost += totalCost;
          stats[area.areaName].patientCount += 1;
        }
      });


      // 그리는 곳
      // 3. Show polygon stats with a Marker in the center 띄워놓은 박스들
      const bounds = polygon.getBounds();
      if (bounds) {
        const center = bounds.getCenter();
        new window.naver.maps.Marker({
          map,
          position: center,
          icon: {
            content: `
              <div style="background:white; border:1px solid #ccc; padding:4px;">
                <b>${area.areaName}</b><br>
                총진료비: ${stats[area.areaName].totalCost.toLocaleString()}원<br>
                방문환자수: ${stats[area.areaName].patientCount}명
              </div>
            `,
          },
        });
      }
    });

    // 4. Set the stats in state
    setPolygonStats(stats);

    // 5. Place patient markers 점
    filtered_db.forEach((patient) => {
      new window.naver.maps.Marker({
        map,
        position: new window.naver.maps.LatLng(patient.latitude, patient.longitude),
        icon: {
          content:
              '<div style="background:red; width:8px; height:8px; border-radius:50%;"></div>',
        },
      });
    });
  }, [map, areas, filtered_db]);

  return (
      <div
          ref={mapElement}
          style={{ width: "100vw", height: "100vh", backgroundColor: "#e0e0e0" }}
      />
  );
};

export default NaverMap;
