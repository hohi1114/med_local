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
  const {
    setAreaName,
    setTotalCost,
    setTotalPatients,
    setFirstVisitPatients,
    setRevisitedPatients
  } = mapStore();
  const polygonsRef = useRef<Map<string, naver.maps.Polygon>>(new Map());
  const markersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const patientMarkersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const [peopleShowButton, setPeopleShowButton] = useState(false);
  const { areas } = useMediMapData();

  // Create the map once
  useEffect(() => {
    if (!mapElement.current || map) return;

    const newMap = new window.naver.maps.Map(mapElement.current, {
      center: new window.naver.maps.LatLng(37.51, 126.88),
      zoom: 15
    });
    setMap(newMap);
  }, [map]);

  const handleShowButton = () => {
    setPeopleShowButton(!peopleShowButton);
  };

  // Draw polygons & markers whenever map, areas, or filtered_db changes
  useEffect(() => {
    if (!map && region_db.length == 0) return;

    // Store stats for each area
    const stats: Record<
      string,
      {
        totalCost: number;
        patientCount: number;
        firstTimeCount: number;
        revisitCount: number;
      }
    > = {};

    /**
     * 구역 나누기
     */
    // 📌 1.Draw polygons
    areas.forEach((area) => {
      if (!area.coords || area.coords.length === 0) return;

      // Convert coords to naver LatLng
      const latLngs = area.coords.map(
        ([lng, lat]) => new window.naver.maps.LatLng(lat, lng)
      );

      //check polygon exist
      let polygon = polygonsRef.current.get(area.areaName);

      if (!polygon) {
        polygon = new window.naver.maps.Polygon({
          map,
          paths: latLngs,
          fillColor: "rgba(146, 191, 255, 0.1)",
          strokeColor: "#92BFFF",
          strokeWeight: 1.5,
          clickable: true
        });
      }

      if (polygon) {
        polygonsRef.current.set(area.areaName, polygon);
        if (
          !polygon.hasListener("click") &&
          Array.isArray(region_db[Number(area.areaName) - 1])
        ) {
          polygon.addListener("click", () => {
            handleDrawerOpen();
            setAreaName(area.areaName);
            setTotalCost(stats[area.areaName].totalCost);
            setTotalPatients(stats[area.areaName].patientCount);
            setFirstVisitPatients(stats[area.areaName].firstTimeCount);
            setRevisitedPatients(stats[area.areaName].revisitCount);
          });
        }
      }
      //📌 2. Calculate stats for each area
      stats[area.areaName] = {
        totalCost: 0,
        patientCount: 0,
        firstTimeCount: 0,
        revisitCount: 0
      };

      if (
        Array.isArray(region_db[Number(area.areaName) - 1]) &&
        region_db[Number(area.areaName) - 1].length > 0
      ) {
        region_db[Number(area.areaName) - 1].forEach((patient) => {
          const { latitude, longitude, totalCost, chartNumber } = patient;
          const visitedPatients = new Set();
          let firstTimeCount = 0;
          let revisitCount = 0;
          if (latitude == null || longitude == null || !polygon) {
            return;
          }
          if (containsLocation(latitude, longitude, polygon)) {
            if (visitedPatients.has(chartNumber)) {
              revisitCount++;
            } else {
              firstTimeCount++;
              visitedPatients.add(chartNumber);
            }

            stats[area.areaName].totalCost += totalCost;
            stats[area.areaName].patientCount += 1;
            stats[area.areaName].firstTimeCount += firstTimeCount;
            stats[area.areaName].revisitCount += revisitCount;
          }
        });
      }

      //📌 3. Show Markers
      let marker = markersRef.current.get(area.areaName);
      if (!marker && polygon) {
        const bounds = polygon.getBounds();
        if (bounds) {
          const center = bounds.getCenter();
          marker = new window.naver.maps.Marker({
            map,
            position: center,
            icon: {
              content: `
          <div style="background: rgba(146, 191, 255, 0.4); padding: 2rem; border-radius: 100%; width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 4px rgba(146, 191, 255, 0.5);">
            <span style="font-size: 1.5rem; color: #ffffff; text-align: center;">${area.areaName}</span>
          </div>
        `
            }
          });
        }
      }
      if (marker) {
        markersRef.current.set(area.areaName, marker);
        if (
          !marker.hasListener("click") &&
          Array.isArray(region_db[Number(area.areaName) - 1])
        ) {
          window.naver.maps.Event.addListener(marker, "click", () => {
            handleDrawerOpen();
            setAreaName(area.areaName);
            setTotalCost(stats[area.areaName].totalCost);
            setTotalPatients(stats[area.areaName].patientCount);
            setFirstVisitPatients(stats[area.areaName].firstTimeCount);
            setRevisitedPatients(stats[area.areaName].revisitCount);
          });
        }
      }
      //📌 5. Place patient markers 점
      let patientMarkers = patientMarkersRef.current.get(area.areaName);
      if (
        !patientMarkers &&
        peopleShowButton &&
        Array.isArray(region_db[Number(area.areaName) - 1]) &&
        region_db[Number(area.areaName) - 1].length > 0
      ) {
        const markers: any = [];
        region_db[Number(area.areaName) - 1].forEach((patient) => {
          const marker = new window.naver.maps.Marker({
            map,
            position: new window.naver.maps.LatLng(
              patient.latitude,
              patient.longitude
            ),
            icon: {
              content:
                '<div style="background:#96E2D6; width:8px; height:8px; border-radius:50%;"></div>'
            }
          });
          markers.push(marker);
        });

        if (markers.length > 0) {
          patientMarkersRef.current.set(area.areaName, markers);
        }
      } else {
        //if turn off the patient button
        if (Array.isArray(patientMarkers)) {
          patientMarkers.forEach((marker) => {
            marker.setMap(null);
          });
        }
        patientMarkersRef.current.delete(area.areaName);
      }
    });
  }, [areas, region_db, map, handleDrawerOpen, peopleShowButton]);

  useEffect(() => {
    if (peopleShowButton) {
    } else {
    }
  }, [peopleShowButton]);

  return (
    <div
      ref={mapElement}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#e0e0e0"
      }}
    >
      <ButtonsContainer>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* <OnOffButton imagePath={"/images/unactive_current.svg"} /> */}
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
