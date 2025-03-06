import React, { useEffect, useRef, useState } from "react";
import useMediMapData from "../hooks/useMediMapData";
import OnOffButton from "./common/button/OnOffButton";
import styled from "styled-components";
import mapStore from "../store/mapStore";

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
function containsLocation(
  pointLat: number,
  pointLng: number,
  polygon: naver.maps.Polygon
): boolean {
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
      lngI > pointLng !== lngJ > pointLng &&
      pointLat < ((latJ - latI) * (pointLng - lngI)) / (lngJ - lngI) + latI;

    if (intersect) inside = !inside;
  }
  return inside;
}

const NaverMap: React.FC<{
  region_db: PatientData[][];
  handleDrawerOpen: () => void;
}> = ({ region_db, handleDrawerOpen }) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const { setAreaName, setTotalCost, setTotalPatients } = mapStore();
  // Use useRef to store polygons and markers
  const polygonsRef = useRef<Map<string, naver.maps.Polygon>>(new Map());
  const markersRef = useRef<Map<string, naver.maps.Marker>>(new Map());

  // Use your custom hook for polygon data
  const { areas } = useMediMapData();

  const [polygonStats, setPolygonStats] = useState<
    Record<string, { totalCost: number; patientCount: number }>
  >({});

  console.log(region_db);
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
    if (!map && region_db.length == 0) return;

    // Store stats for each area
    const stats: Record<string, { totalCost: number; patientCount: number }> =
      {}; //stats를 변형해서 띄운다

    /**
     * 구역 나누기
     */
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
        fillColor: "rgba(146, 191, 255, 0.1)",
        strokeColor: "#92BFFF",
        strokeWeight: 1.5,
        clickable: true,
      });

      // Store the polygon in the ref to prevent redrawing
      polygonsRef.current.set(area.areaName, polygon);

      // Initialize stats
      stats[area.areaName] = { totalCost: 0, patientCount: 0 };

      polygon.addListener("click", () => {
        handleDrawerOpen();
        setAreaName(area.areaName);
        setTotalCost(stats[area.areaName].totalCost);
        setTotalPatients(stats[area.areaName].patientCount);
      });
      if (
        Array.isArray(region_db[Number(area.areaName) - 1]) &&
        region_db[Number(area.areaName) - 1].length > 0
      ) {
        region_db[Number(area.areaName) - 1].forEach((patient) => {
          const { latitude, longitude, totalCost } = patient;

          if (latitude == null || longitude == null) {
            return;
          }
          if (containsLocation(latitude, longitude, polygon)) {
            stats[area.areaName].totalCost += totalCost;
            stats[area.areaName].patientCount += 1;
          }
        });
      }
      // 3. Show polygon stats with a Marker in the center 띄워놓은 박스들
      const bounds = polygon.getBounds();
      if (bounds) {
        const center = bounds.getCenter();
        const marker = new window.naver.maps.Marker({
          map,
          position: center,
          icon: {
            content: `
        <div style="background: rgba(146, 191, 255, 0.4); padding: 2rem; border-radius: 100%; width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 4px rgba(146, 191, 255, 0.5);">
          <span style="font-size: 1.5rem; color: #ffffff; text-align: center;">${area.areaName}</span>
        </div>
      `,
          },
        });
        markersRef.current.set(area.areaName, marker);
        window.naver.maps.Event.addListener(marker, "click", () => {
          handleDrawerOpen();
          setAreaName(area.areaName);
          setTotalCost(stats[area.areaName].totalCost);
          setTotalPatients(stats[area.areaName].patientCount);
        });
      }
    });

    // 4. Set the stats in state
    setPolygonStats(stats);

    // 5. Place patient markers 점
    // filtered_db.forEach((patient) => {
    //   new window.naver.maps.Marker({
    //     map,
    //     position: new window.naver.maps.LatLng(
    //       patient.latitude,
    //       patient.longitude
    //     ),
    //     icon: {
    //       content:
    //         '<div style="background:red; width:8px; height:8px; border-radius:50%;"></div>',
    //     },
    //   });
    // });
  }, [areas, region_db, map, handleDrawerOpen]);

  const [peopleShowButton, setPeopleShowButton] = useState(true);

  const handleShowButton = () => {
    setPeopleShowButton(!peopleShowButton);
  };

  return (
    <div
      ref={mapElement}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#e0e0e0",
      }}
    >
      <ButtonsContainer>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* <OnOffButton imagePath={"/images/unactive_current.svg"} /> */}ㄷ
          <OnOffButton
            imagePath={
              peopleShowButton
                ? "/images/people.svg"
                : "/images/unactive_people.svg"
            }
            handleClickButton={handleShowButton}
          />
        </div>
      </ButtonsContainer>
    </div>
  );
};

export default NaverMap;

const ButtonsContainer = styled.div`
  position: absolute;
  bottom: 8%;
  right: 5%;
  z-index: 100;
`;
