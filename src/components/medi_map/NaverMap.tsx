import React, { use, useEffect, useRef, useState } from "react";
import useMediMapData from "../../hooks/useMediMapData";
import OnOffButton from "../common/button/OnOffButton";
import styled from "styled-components";
import mapStore from "../../store/mapStore";
import small_db_fixed from "../../../public/small_db_fixed.json";
import dong_db_1 from "../../../public/dong_db_1.json";
import { Polygon } from "../../types/naver-maps";

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
  region_db?: PatientData[][];
  handleDrawerOpen: () => void;
}> = ({ region_db, handleDrawerOpen }) => {
  const smallPolygons = small_db_fixed as Polygon[];
  const dongPolygons = dong_db_1 as Polygon[];

  const mapElement = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const zoomLevelRef = useRef<number | null>(null);
  const {
    setAreaName,
    setTotalCost,
    setTotalPatients,
    setFirstVisitPatients,
    setRevisitedPatients,
    setRevenueTrend,
    setAgeGroups,
    setDailyRevenue
  } = mapStore();
  const polygonsRef = useRef<Map<string, naver.maps.Polygon>>(new Map());
  const markersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const patientMarkersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const [peopleShowButton, setPeopleShowButton] = useState(false);
  // const { areas, setFileName } = useMediMapData(null);

  // ✅ Initialize map only once
  useEffect(() => {
    if (!mapElement.current || map) return;

    const newMap = new window.naver.maps.Map(mapElement.current, {
      center: new window.naver.maps.LatLng(37.51, 126.88),
      zoom: 15,
      zoomControl: true
    });
    setMap(newMap);
  }, [map]);

  const handleShowButton = () => {
    setPeopleShowButton(!peopleShowButton);
  };

  // ✅ Handle zoom change
  useEffect(() => {
    if (!map) return;

    const handleZoomChange = () => {
      const currentZoom = map.getZoom();
      const previousZoom = zoomLevelRef.current;

      if (
        previousZoom === null ||
        (previousZoom < 16 && currentZoom >= 16) ||
        (previousZoom >= 16 && currentZoom < 16)
      ) {
        zoomLevelRef.current = currentZoom;
        //Remove all polygons and
        polygonsRef.current.forEach((polygon) => polygon.setMap(null));
        polygonsRef.current.clear();
        markersRef.current.forEach((markers) => markers.setMap(null));
        markersRef.current.clear();

        // 📌 1.Draw polygons
        //Create new polygons
        const polygonsToRender =
          currentZoom >= 16 ? smallPolygons : dongPolygons;

        polygonsToRender.forEach((area) => {
          if (!area.polygon || area.polygon.length === 0) return;

          const latLngs = area.polygon[0].map(
            ([lng, lat]) => new window.naver.maps.LatLng(lat, lng)
          );

          let polygon = polygonsRef.current.get(area.area);
          if (!polygon) {
            polygon = new window.naver.maps.Polygon({
              paths: latLngs,
              fillColor:
                currentZoom >= 16
                  ? "rgba(247, 127, 0, 0.1)"
                  : "rgba(146, 191, 255, 0.1)",
              strokeColor: currentZoom >= 16 ? "#f77f00" : "#92BFFF",
              strokeWeight: 1.5,
              clickable: true
            });
          }

          if (polygon) {
            polygonsRef.current.set(area.area, polygon);
            polygon.setMap(map);
          }

          //📌 2. Show Markers

          //Create all Markers
          let marker = markersRef.current.get(area.area);

          if (!marker && polygon) {
            const bounds = polygon.getBounds();

            if (bounds) {
              const center = bounds.getCenter();
              marker = new window.naver.maps.Marker({
                map,
                position: center,
                icon: {
                  content: `
      <div style="background: ${
        currentZoom >= 16
          ? "rgba(247, 127, 0, 0.4)"
          : " rgba(146, 191, 255, 0.4)"
      }; padding: 2rem; border-radius: 100%; width: ${
                    currentZoom >= 16 ? "4.5rem" : "5rem"
                  }; height: ${
                    currentZoom >= 16 ? "4.5rem" : "5rem"
                  }; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 4px rgba(146, 191, 255, 0.5);">
        <span style="font-size:${
          currentZoom >= 16 ? "1.5rem" : "1rem"
        }; color: ${
                    currentZoom >= 16 ? "#ffffff" : "#ffffff"
                  }; text-align: center;">${area.area}</span>
      </div>
    `
                }
              });
            }
          }
          if (marker) {
            markersRef.current.set(area.area, marker);
            marker.setMap(map);
          }
        });
      }
    };

    window.naver.maps.Event.addListener(map, "zoom_changed", handleZoomChange);
    handleZoomChange();

    return () => {
      window.naver.maps.Event.removeListener(
        map,
        "zoom_changed",
        handleZoomChange
      );
    };
  }, [map, smallPolygons, dongPolygons]);

  // 연령을 숫자로 변환하는 함수
  const parseAge = (ageString: string): number => {
    const ageParts = ageString.split("세");
    if (ageParts.length < 2) return 0;

    const ageYears = parseInt(ageParts[0].trim(), 10);
    const ageMonths =
      ageParts[1] && ageParts[1].includes("개월")
        ? parseInt(ageParts[1].replace("개월", "").trim(), 10)
        : 0;

    // 1년을 12개월로 보고, 월 단위로 계산하여 나이 계산
    return ageYears + ageMonths / 12;
  };

  //Draw polygons & markers whenever map, areas, or filtered_db changes
  // useEffect(() => {
  //   if (!map || !smallPolygons) return;

  //   window.naver.maps.Event.addListener(map, "zoom_changed", () => {
  //     const zoomLevel = map.getZoom();
  //     setZoomLevel(zoomLevel);
  //   });

  //   // Store stats for each area
  //   const stats: Record<
  //     string,
  //     {
  //       totalCost: number;
  //       patientCount: number;
  //       firstTimeCount: number;
  //       revisitCount: number;
  //       revenuMap: { [key: string]: number };
  //       ageGroupsMap: { [key: string]: number };
  //       dailyRevenueMap: {
  //         [key: string]: { totalCost: number; patientCount: number };
  //       };
  //     }
  //   > = {};

  /** 지도 Polygon & marker 다시 지우기 */
  // markersRef.current.forEach((polygon) => polygon.setMap(null));
  // markersRef.current.clear();

  // polygonsRef.current.forEach((polygon) => polygon.setMap(null));
  // polygonsRef.current.clear();

  /**
   * 구역 나누기
   */
  // 📌 1.Draw polygons

  // smallPolygons.forEach((area) => {
  //   if (!area.area || !area.polygon || area.polygon.length === 0) return;

  //   // Convert coords to naver LatLng
  //   const latLngs = area.polygon.map(
  //     ([lng, lat]) => new window.naver.maps.LatLng(lat, lng)
  //   );

  //   let polygon = polygonsRef.current.get(area.area);

  //   if (!polygon) {
  //     polygon = new window.naver.maps.Polygon({
  //       map,
  //       paths: latLngs,
  //       fillColor:
  //         zoomLevel >= 16
  //           ? "rgba(247, 127, 0, 0.1)"
  //           : "rgba(146, 191, 255, 0.1)",
  //       strokeColor: zoomLevel >= 16 ? "#f77f00" : "#92BFFF",
  //       strokeWeight: 1.5,
  //       clickable: true
  //     });
  //   }

  // if (polygon) {
  //   polygonsRef.current.set(area.area, polygon);
  // if (
  //   !polygon.hasListener("click") &&
  //   Array.isArray(region_db[Number(area.areaName) - 1])
  // ) {
  // polygon.addListener("click", () => {
  //   handleDrawerOpen();
  // setAreaName(area.areaName);
  // setTotalCost(stats[area.areaName].totalCost);
  // setTotalPatients(stats[area.areaName].patientCount);
  // setFirstVisitPatients(stats[area.areaName].firstTimeCount);
  // setRevisitedPatients(stats[area.areaName].revisitCount);
  // setRevenueTrend(stats[area.areaName].revenuMap);
  // setAgeGroups(stats[area.areaName].ageGroupsMap);
  // setDailyRevenue(stats[area.areaName].dailyRevenueMap);
  // });
  // }
  // }
  //📌 2. Calculate stats for each area
  // stats[area.area] = {
  //   totalCost: 0,
  //   patientCount: 0,
  //   firstTimeCount: 0,
  //   revisitCount: 0,
  //   revenuMap: {},
  //   ageGroupsMap: {},
  //   dailyRevenueMap: {}
  // };
  //연령대 별 환자 분포
  // const ageGroups = {
  //   아동: 0,
  //   "10대": 0,
  //   "20대": 0,
  //   "30대": 0,
  //   "40대": 0,
  //   "50대": 0,
  //   "60대": 0
  // };

  // if (
  //   Array.isArray(region_db[Number(area.areaName) - 1]) &&
  //   region_db[Number(area.areaName) - 1].length > 0
  // ) {
  //   region_db[Number(area.areaName) - 1].forEach((patient) => {
  //     const {
  //       latitude,
  //       longitude,
  //       totalCost,
  //       chartNumber,
  //       visitDate,
  //       age
  //     } = patient;
  //     const visitedPatients = new Set();
  //     const revenueMap = stats[area.areaName].revenuMap;
  //     const dailyRevenueMap = stats[area.areaName].dailyRevenueMap;
  //     let firstTimeCount = 0;
  //     let revisitCount = 0;
  //     if (latitude == null || longitude == null || !polygon) {
  //       return;
  //     }
  //     if (containsLocation(latitude, longitude, polygon)) {
  //       //재방문 환자수 & 초진 환자수
  //       if (visitedPatients.has(chartNumber)) {
  //         revisitCount++;
  //       } else {
  //         firstTimeCount++;
  //         visitedPatients.add(chartNumber);
  //       }
  //       //매출액 변화 추이
  //       if (visitDate && revenueMap[visitDate]) {
  //         revenueMap[visitDate] += totalCost;
  //       } else {
  //         revenueMap[visitDate] = totalCost;
  //       }

  //       const ageInYears = parseAge(age);

  //       // 연령대에 맞는 카운트 증가
  //       if (ageInYears >= 0 && ageInYears <= 9) {
  //         ageGroups["아동"]++;
  //       } else if (ageInYears >= 10 && ageInYears <= 19) {
  //         ageGroups["10대"]++;
  //       } else if (ageInYears >= 20 && ageInYears <= 29) {
  //         ageGroups["20대"]++;
  //       } else if (ageInYears >= 30 && ageInYears <= 39) {
  //         ageGroups["30대"]++;
  //       } else if (ageInYears >= 40 && ageInYears <= 49) {
  //         ageGroups["40대"]++;
  //       } else if (ageInYears >= 50 && ageInYears <= 59) {
  //         ageGroups["50대"]++;
  //       } else {
  //         ageGroups["60대"]++;
  //       }

  //       //1인당 평균 매출액
  //       if (visitDate) {
  //         // visitDate가 없으면 초기화
  //         if (!dailyRevenueMap[visitDate]) {
  //           dailyRevenueMap[visitDate] = {
  //             totalCost: 0,
  //             patientCount: 0
  //           };
  //         }
  //       }
  //       if (visitDate && dailyRevenueMap[visitDate].totalCost) {
  //         dailyRevenueMap[visitDate].totalCost += totalCost;
  //         dailyRevenueMap[visitDate].patientCount += 1;
  //       } else {
  //         dailyRevenueMap[visitDate].totalCost = totalCost;
  //         dailyRevenueMap[visitDate].patientCount = 1;
  //       }

  //       stats[area.areaName].totalCost += totalCost;
  //       stats[area.areaName].patientCount += 1;
  //       stats[area.areaName].firstTimeCount += firstTimeCount;
  //       stats[area.areaName].revisitCount += revisitCount;
  //       stats[area.areaName].revenuMap = revenueMap;
  //       stats[area.areaName].ageGroupsMap = ageGroups;
  //       stats[area.areaName].dailyRevenueMap = dailyRevenueMap;
  //     }
  //   });
  // }

  //📌 3. Show Markers
  // let marker = markersRef.current.get(area.areaName);
  // if (!marker && polygon) {
  //   const bounds = polygon.getBounds();
  //   if (bounds) {
  //     const center = bounds.getCenter();
  //     marker = new window.naver.maps.Marker({
  //       map,
  //       position: center,
  //       icon: {
  //         content: `
  //     <div style="background: ${
  //       zoomLevel >= 16
  //         ? "rgba(247, 127, 0, 0.4)"
  //         : " rgba(146, 191, 255, 0.4)"
  //     }; padding: 2rem; border-radius: 100%; width: ${
  //           zoomLevel >= 16 ? "2.8rem" : "2.5rem"
  //         }; height: ${
  //           zoomLevel >= 16 ? "2.8rem" : "2.5rem"
  //         }; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 4px rgba(146, 191, 255, 0.5);">
  //       <span style="font-size:${
  //         zoomLevel >= 16 ? "1.5rem" : "1rem"
  //       }; color: ${
  //           zoomLevel >= 16 ? "#ffffff" : "#ffffff"
  //         }; text-align: center;">${area.areaName}</span>
  //     </div>
  //   `
  //       }
  //     });
  //   }
  // }
  // if (marker) {
  //   markersRef.current.set(area.areaName, marker);
  //   if (
  //     !marker.hasListener("click") &&
  //     Array.isArray(region_db[Number(area.areaName) - 1])
  //   ) {
  //     window.naver.maps.Event.addListener(marker, "click", () => {
  //       handleDrawerOpen();
  //       setAreaName(area.areaName);
  //       setTotalCost(stats[area.areaName].totalCost);
  //       setTotalPatients(stats[area.areaName].patientCount);
  //       setFirstVisitPatients(stats[area.areaName].firstTimeCount);
  //       setRevisitedPatients(stats[area.areaName].revisitCount);
  //       setRevenueTrend(stats[area.areaName].revenuMap);
  //       setAgeGroups(stats[area.areaName].ageGroupsMap);
  //       setDailyRevenue(stats[area.areaName].dailyRevenueMap);
  //     });
  //   }
  // }
  //📌 5. Place patient markers 점
  // let patientMarkers = patientMarkersRef.current.get(area.areaName);
  // if (
  //   !patientMarkers &&
  //   peopleShowButton &&
  //   Array.isArray(region_db[Number(area.areaName) - 1]) &&
  //   region_db[Number(area.areaName) - 1].length > 0
  // ) {
  //   const markers: any = [];
  //   region_db[Number(area.areaName) - 1].forEach((patient) => {
  //     const marker = new window.naver.maps.Marker({
  //       map,
  //       position: new window.naver.maps.LatLng(
  //         patient.latitude,
  //         patient.longitude
  //       ),
  //       icon: {
  //         content:
  //           '<div style="background:#96E2D6; width:8px; height:8px; border-radius:50%;"></div>'
  //       }
  //     });
  //     markers.push(marker);
  //   });

  //   if (markers.length > 0) {
  //     patientMarkersRef.current.set(area.areaName, markers);
  //   }
  // } else {
  //   //if turn off the patient button
  //   if (Array.isArray(patientMarkers)) {
  //     patientMarkers.forEach((marker) => {
  //       marker.setMap(null);
  //     });
  //   }
  //   patientMarkersRef.current.delete(area.areaName);
  // }
  //   });
  // }, [smallPolygons, map, handleDrawerOpen, peopleShowButton]);

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
