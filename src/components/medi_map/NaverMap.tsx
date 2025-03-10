import React, { useEffect, useRef, useState } from "react";
import OnOffButton from "../common/button/OnOffButton";
import styled from "styled-components";
import mapStore from "../../store/mapStore";
import { getPatientsFromRegion } from "../../store/indexded_db/RegionDB";
import useNaverMapData from "../../hooks/useNaverMapData";
import useMediMapData, { Area } from "../../hooks/useMediMapData";
import { debounce } from "lodash";
import { makeMarkerClustering } from "../../utils/marker-cluster.js";

const NaverMap: React.FC<{
  handleDrawerOpen: () => void;
}> = ({ handleDrawerOpen }) => {
  //**Data
  const { areas: dongPolygons } = useMediMapData("fixed_polygon.json");
  const { areas: smallPolygons } = useMediMapData("normalized_small_db.json");
  const { areas: guPolygons } = useMediMapData("district_boundaries.json");

  //**Refs
  const polygonsRef = useRef<Map<string, naver.maps.Polygon>>(new Map());
  const markersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const patientMarkersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const markerClustererRef = useRef<any>(null);
  //**Refs
  const mapElement = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  //**Drawer states
  const [peopleShowButton, setPeopleShowButton] = useState(false);

  //** Map Logic
  const {
    getRegionName,
    expandBounds,
    parseAge,
    containsLocation,
    getBoundAreas,
    getPolyonColorOpacity
  } = useNaverMapData();
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

  // ✅ Drawer handler
  const handleShowButton = () => {
    setPeopleShowButton(!peopleShowButton);
  };

  // ✅ Handle zoom change
  useEffect(() => {
    if (!map || !smallPolygons) return;

    const handleZoomChange = debounce(() => {
      //1. Init Map
      const currentZoom = map.getZoom();

      const { name, polygonLineColor, color_r, color_g, color_b, fontSize } =
        getRegionName(currentZoom);
      const mapBounds = expandBounds(
        map.getBounds() as naver.maps.LatLngBounds,
        0.3
      );

      console.log(currentZoom);

      //2. Remove all polygons and
      polygonsRef.current.forEach((polygon) => polygon.setMap(null));
      polygonsRef.current.clear();
      markersRef.current.forEach((markers) => markers.setMap(null));
      markersRef.current.clear();

      // 3. Store stats for each area
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

      //4. Get Bound Areas
      const polygonsToRender =
        currentZoom >= 15
          ? smallPolygons
          : currentZoom < 15 && currentZoom >= 14
          ? dongPolygons
          : guPolygons;

      const { boundAreas } = getBoundAreas(polygonsToRender, mapBounds);

      if (boundAreas.length === 0) return;

      boundAreas.forEach(async (area) => {
        // 📌 1.Draw polygons
        //Create new polygons
        if (!area.coords || area.coords.length === 0) return;

        // console.log(patients);
        //이거 gu는
        const latLngs = area.coords.map(
          ([lng, lat]) => new window.naver.maps.LatLng(lng, lat)
        );

        let polygon = polygonsRef.current.get(area.areaName);
        if (!polygon) {
          polygon = new window.naver.maps.Polygon({
            paths: latLngs,
            // fillColor: polygonBackground,
            strokeColor: polygonLineColor,
            strokeWeight: 1.5,
            clickable: true
          });
        }
        if (polygon) {
          polygonsRef.current.set(area.areaName, polygon);
          polygon.setMap(map);
          if (!polygon.hasListener("click")) {
            polygon.addListener("click", () => {
              handleDrawerOpen();
              setAreaName(area.areaName);
              setTotalCost(stats[area.areaName].totalCost);
              setTotalPatients(stats[area.areaName].patientCount);
              setFirstVisitPatients(stats[area.areaName].firstTimeCount);
              setRevisitedPatients(stats[area.areaName].revisitCount);
              setRevenueTrend(stats[area.areaName].revenuMap);
              setAgeGroups(stats[area.areaName].ageGroupsMap);
              setDailyRevenue(stats[area.areaName].dailyRevenueMap);
            });
          }
        }

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
          <div style="display: flex; align-items: center; justify-content: center;">
            <span style="font-size:${fontSize}; color:#616161; text-align: center; font-weight:bold ">${
                  name === "dong" ? area.areaName.split(" ")[2] : area.areaName
                }</span>
          </div>
        `
              }
            });
          }
        }

        if (marker) {
          markersRef.current.set(area.areaName, marker);

          polygonsRef.current.forEach((polygon, key) => {
            const polygonBounds = polygon.getBounds();
            const marker = markersRef.current.get(key); // 중복 호출 제거

            if (!mapBounds.hasBounds(polygonBounds)) {
              polygon.setMap(null);
              if (marker) marker.setMap(null);
              return; // 불필요한 연산 방지
            }

            polygon.setMap(map);
            if (marker) {
              if (mapBounds.hasLatLng(marker.getPosition())) {
                marker.setMap(map);
              } else {
                marker.setMap(null);
              }
            }
          });
          if (!marker.hasListener("click")) {
            window.naver.maps.Event.addListener(marker, "click", () => {
              handleDrawerOpen();
              setAreaName(area.areaName);
              setTotalCost(stats[area.areaName].totalCost);
              setTotalPatients(stats[area.areaName].patientCount);
              setFirstVisitPatients(stats[area.areaName].firstTimeCount);
              setRevisitedPatients(stats[area.areaName].revisitCount);
              setRevenueTrend(stats[area.areaName].revenuMap);
              setAgeGroups(stats[area.areaName].ageGroupsMap);
              setDailyRevenue(stats[area.areaName].dailyRevenueMap);
            });
          }
        }

        const patients = await getPatientsFromRegion(area.areaName, name);

        //📌 2. Calculate stats for each area
        stats[area.areaName] = {
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
            const revenueMap = stats[area.areaName].revenuMap;
            const dailyRevenueMap = stats[area.areaName].dailyRevenueMap;
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
              stats[area.areaName].totalCost += totalCost;
              stats[area.areaName].patientCount += 1;
              stats[area.areaName].firstTimeCount += firstTimeCount;
              stats[area.areaName].revisitCount += revisitCount;
              stats[area.areaName].revenuMap = revenueMap;
              stats[area.areaName].ageGroupsMap = ageGroups;
              stats[area.areaName].dailyRevenueMap = dailyRevenueMap;
            }
          });
        }

        polygon?.setOptions({
          paths: latLngs,
          fillColor: `rgba(${color_r}, ${color_g}, ${color_b}, ${getPolyonColorOpacity(
            stats[area.areaName].totalCost
          )})`
        });
        //📌 2. Show Markers
        //Create all Markers

        //📌 5. Place patient markers 점
        // let patientMarkers = patientMarkersRef.current.get(area.area);

        // if (!patientMarkers && !peopleShowButton && patients.length > 0) {
        //   const markers: any = [];
        //   patients.forEach((patient) => {
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
        //     patientMarkersRef.current.set(area.area, markers);
        //   }
        // } else {
        //   console.log(patientMarkers);
        //   if (Array.isArray(patientMarkers)) {
        //     patientMarkers.forEach((marker) => {
        //       marker.setMap(null);
        //     });
        //   }
        //   patientMarkersRef.current.delete(area.area);
        // }
      });
    }, 300);

    window.naver.maps.Event.addListener(map, "zoom_changed", handleZoomChange);
    window.naver.maps.Event.addListener(map, "idle", handleZoomChange);
    handleZoomChange();
  }, [map, smallPolygons, dongPolygons]);

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
