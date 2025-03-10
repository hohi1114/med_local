import React, { useEffect, useRef, useState } from "react";
import OnOffButton from "../common/button/OnOffButton";
import styled from "styled-components";
import mapStore from "../../store/mapStore";
import small_db_fixed from "../../../public/small_db_fixed.json";
import dong_db_1 from "../../../public/dong_db_1.json";
import { Polygon } from "../../types/naver-maps";
import { getPatientsFromRegion } from "../../store/indexded_db/RegionDB";

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
  handleDrawerOpen: () => void;
}> = ({ handleDrawerOpen }) => {
  //**Data
  const smallPolygons = small_db_fixed as Polygon[];
  const dongPolygons = dong_db_1 as Polygon[];
  //**Refs
  const polygonsRef = useRef<Map<string, naver.maps.Polygon>>(new Map());
  const markersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const zoomLevelRef = useRef<number | null>(null);
  const patientMarkersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  //**Refs
  const mapElement = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  //**Drawer states
  const [peopleShowButton, setPeopleShowButton] = useState(false);
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

  const getRegionName = (currentZoom: number) => {
    if (currentZoom >= 16) {
      return "small";
    } else {
      return "dong";
    }
  };

  const expandBounds = (bounds, expansionFactor = 0.2) => {
    const sw = bounds.getSW();
    const ne = bounds.getNE();

    const latDiff = (ne.lat() - sw.lat()) * expansionFactor;
    const lngDiff = (ne.lng() - sw.lng()) * expansionFactor;

    return new window.naver.maps.LatLngBounds(
      new window.naver.maps.LatLng(sw.lat() - latDiff, sw.lng() - lngDiff),
      new window.naver.maps.LatLng(ne.lat() + latDiff, ne.lng() + lngDiff)
    );
  };

  // ✅ Handle zoom change
  useEffect(() => {
    if (!map) return;

    const handleZoomChange = () => {
      const currentZoom = map.getZoom();
      const previousZoom = zoomLevelRef.current;
      const mapBounds = expandBounds(map.getBounds(), 0.3);

      zoomLevelRef.current = currentZoom;
      //Remove all polygons and
      polygonsRef.current.forEach((polygon) => polygon.setMap(null));
      polygonsRef.current.clear();
      markersRef.current.forEach((markers) => markers.setMap(null));
      markersRef.current.clear();

      // Store stats for each area
      const stats: Record<
        string,
        {
          totalCost: number;
          patientCount: number;
          firstTimeCount: number;
          revisitCount: number;
          revenuMap: { [key: string]: number };
          ageGroupsMap: { [key: string]: number };
          dailyRevenueMap: {
            [key: string]: { totalCost: number; patientCount: number };
          };
        }
      > = {};

      // 📌 1.Draw polygons
      //Create new polygons
      const polygonsToRender = currentZoom >= 16 ? smallPolygons : dongPolygons;

      let boundedAreas = [] as Polygon[];

      polygonsToRender.forEach((area) => {
        if (!area.polygon || !area.polygon[0] || area.polygon[0].length < 2)
          return;
        const polygonLatLngs = area.polygon[0].map(
          (coord) => new naver.maps.LatLng(coord[1], coord[0])
        );
        let isAreaAlreadyAdded = boundedAreas.some(
          (existingArea) => existingArea.area === area.area
        );

        polygonLatLngs.forEach((latlng) => {
          if (mapBounds.hasLatLng(latlng) && !isAreaAlreadyAdded) {
            boundedAreas.push(area);
            isAreaAlreadyAdded = true;
          }
        });
      });

      const regionName = getRegionName(currentZoom);

      boundedAreas.forEach(async (area) => {
        if (!area.polygon || area.polygon.length === 0) return;
        const patients = await getPatientsFromRegion(area.area, regionName);
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
          // polygon.setMap(map);
          if (!polygon.hasListener("click") && Array.isArray(patients)) {
            polygon.addListener("click", () => {
              handleDrawerOpen();
              setAreaName(area.area);
              setTotalCost(stats[area.area].totalCost);
              setTotalPatients(stats[area.area].patientCount);
              setFirstVisitPatients(stats[area.area].firstTimeCount);
              setRevisitedPatients(stats[area.area].revisitCount);
              setRevenueTrend(stats[area.area].revenuMap);
              setAgeGroups(stats[area.area].ageGroupsMap);
              setDailyRevenue(stats[area.area].dailyRevenueMap);
            });
          }
        }
        //📌 2. Calculate stats for each area
        stats[area.area] = {
          totalCost: 0,
          patientCount: 0,
          firstTimeCount: 0,
          revisitCount: 0,
          revenuMap: {},
          ageGroupsMap: {},
          dailyRevenueMap: {}
        };
        // 연령대 별 환자 분포
        const ageGroups = {
          아동: 0,
          "10대": 0,
          "20대": 0,
          "30대": 0,
          "40대": 0,
          "50대": 0,
          "60대": 0
        };
        if (Array.isArray(patients) && patients.length > 0) {
          patients.forEach((patient) => {
            const {
              latitude,
              longitude,
              totalCost,
              chartNumber,
              visitDate,
              age
            } = patient;
            const visitedPatients = new Set();
            const revenueMap = stats[area.area].revenuMap;
            const dailyRevenueMap = stats[area.area].dailyRevenueMap;
            let firstTimeCount = 0;
            let revisitCount = 0;
            if (latitude == null || longitude == null || !polygon) {
              return;
            }
            if (containsLocation(latitude, longitude, polygon)) {
              //재방문 환자수 & 초진 환자수
              if (visitedPatients.has(chartNumber)) {
                revisitCount++;
              } else {
                firstTimeCount++;
                visitedPatients.add(chartNumber);
              }
              //매출액 변화 추이
              if (visitDate && revenueMap[visitDate]) {
                revenueMap[visitDate] += totalCost;
              } else {
                revenueMap[visitDate] = totalCost;
              }
              const ageInYears = parseAge(age);
              // 연령대에 맞는 카운트 증가
              if (ageInYears >= 0 && ageInYears <= 9) {
                ageGroups["아동"]++;
              } else if (ageInYears >= 10 && ageInYears <= 19) {
                ageGroups["10대"]++;
              } else if (ageInYears >= 20 && ageInYears <= 29) {
                ageGroups["20대"]++;
              } else if (ageInYears >= 30 && ageInYears <= 39) {
                ageGroups["30대"]++;
              } else if (ageInYears >= 40 && ageInYears <= 49) {
                ageGroups["40대"]++;
              } else if (ageInYears >= 50 && ageInYears <= 59) {
                ageGroups["50대"]++;
              } else {
                ageGroups["60대"]++;
              }
              //1인당 평균 매출액
              if (visitDate) {
                // visitDate가 없으면 초기화
                if (!dailyRevenueMap[visitDate]) {
                  dailyRevenueMap[visitDate] = {
                    totalCost: 0,
                    patientCount: 0
                  };
                }
              }
              if (visitDate && dailyRevenueMap[visitDate].totalCost) {
                dailyRevenueMap[visitDate].totalCost += totalCost;
                dailyRevenueMap[visitDate].patientCount += 1;
              } else {
                dailyRevenueMap[visitDate].totalCost = totalCost;
                dailyRevenueMap[visitDate].patientCount = 1;
              }
              stats[area.area].totalCost += totalCost;
              stats[area.area].patientCount += 1;
              stats[area.area].firstTimeCount += firstTimeCount;
              stats[area.area].revisitCount += revisitCount;
              stats[area.area].revenuMap = revenueMap;
              stats[area.area].ageGroupsMap = ageGroups;
              stats[area.area].dailyRevenueMap = dailyRevenueMap;
            }
          });
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
          // marker.setMap(map);
          polygonsRef.current.forEach((polygon, key) => {
            const polygonBounds = polygon.getBounds();
            const marker = markersRef.current.get(key);
            if (mapBounds.hasBounds(polygonBounds)) {
              polygon.setMap(map);
              if (marker && mapBounds.hasLatLng(marker.getPosition())) {
                marker.setMap(map);
              } else if (marker) {
                marker.setMap(null);
              }
            } else {
              polygon.setMap(null);
              if (marker) marker.setMap(null);
            }
          });
          if (!marker.hasListener("click") && Array.isArray(patients)) {
            window.naver.maps.Event.addListener(marker, "click", () => {
              handleDrawerOpen();
              setAreaName(area.area);
              setTotalCost(stats[area.area].totalCost);
              setTotalPatients(stats[area.area].patientCount);
              setFirstVisitPatients(stats[area.area].firstTimeCount);
              setRevisitedPatients(stats[area.area].revisitCount);
              setRevenueTrend(stats[area.area].revenuMap);
              setAgeGroups(stats[area.area].ageGroupsMap);
              setDailyRevenue(stats[area.area].dailyRevenueMap);
            });
          }
        }
      });
    };

    window.naver.maps.Event.addListener(map, "zoom_changed", handleZoomChange);
    window.naver.maps.Event.addListener(map, "idle", handleZoomChange);
    handleZoomChange();

    return () => {};
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
