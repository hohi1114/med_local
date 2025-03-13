import React, { useEffect, useRef, useState } from "react";
import OnOffButton from "../common/button/OnOffButton";
import styled from "styled-components";
import mapStore from "../../store/mapStore";
import { getPatientsFromRegion } from "../../store/indexded_db/RegionDB";
import useNaverMapData from "../../hooks/useNaverMapData";
import useMediMapData, { Area } from "../../hooks/useMediMapData";
import { debounce } from "lodash";
import { makeMarkerClustering } from "../../utils/marker-cluster.js";
import { PatientData } from "../../utils/ExcelParser.js";

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
  const regionMarkerClusterRef = useRef(null);
  const patientMarkersRef = useRef(null);
  //**Refs
  const mapElement = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  //**Drawer states
  const [peopleShowButton, setPeopleShowButton] = useState(false);
  const MarkerClustering = makeMarkerClustering(window.naver) as any;
  //** Map Logic
  const { getRegionName, expandBounds, getBoundAreas, getPolyonColorOpacity } =
    useNaverMapData();
  const { setAreaName, setPatients } = mapStore();

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
    if (!map || !smallPolygons || !dongPolygons || !guPolygons) return;
    const handleZoomChange = debounce(async () => {
      //1. Init Map
      const currentZoom = map.getZoom();
      const patientTemp: { areaName: string; patients: PatientData[] }[] = [];
      const markers: naver.maps.Marker[] = [];
      const patientMarkers: naver.maps.Marker[] = [];

      //2. Get Regioin Info
      const { name, polygonLineColor, color_r, color_g, color_b, fontSize } =
        getRegionName(currentZoom);
      const mapBounds = expandBounds(
        map.getBounds() as naver.maps.LatLngBounds,
        0.3
      );

      //3. Remove all polygons and
      polygonsRef.current.forEach((polygon) => polygon.setMap(null));
      polygonsRef.current.clear();
      markersRef.current.forEach((markers) => markers.setMap(null));
      markersRef.current.clear();
      if (regionMarkerClusterRef.current) {
        regionMarkerClusterRef.current.setMap(null);
      }
      if (patientMarkersRef.current) {
        patientMarkersRef.current.setMap(null);
      }

      //4. Get Bound Areas
      const polygonsToRender =
        currentZoom >= 15
          ? smallPolygons
          : currentZoom < 15 && currentZoom >= 14
          ? dongPolygons
          : guPolygons;

      const { boundAreas } = getBoundAreas(polygonsToRender, mapBounds);

      if (boundAreas.length === 0) return;

      // 📌 1.Draw polygons
      //Create new polygons
      const areaPromises = boundAreas.map(async (area) => {
        if (!area.coords || area.coords.length === 0) return;
        const latLngs = area.coords.map(
          ([lng, lat]) => new window.naver.maps.LatLng(lng, lat)
        );
        let polygon = polygonsRef.current.get(area.areaName);
        if (!polygon) {
          polygon = new window.naver.maps.Polygon({
            paths: latLngs,
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
            });
          }
        }

        if (polygon) {
          const bounds = polygon.getBounds();
          if (bounds) {
            const center = bounds.getCenter();

            const marker = new naver.maps.Marker({
              position: center,
              icon: {
                content: `
                        <div style="display: flex; align-items: center; justify-content: center;">
                <span style="font-size:${fontSize}; color:#2c2c2c; text-align: center;
                             text-shadow: -0.75px -0.75px 0 #fafaf8,
                                          0.75px 0.75px 0 #fafaf8,
                                          -0.75px -0.75px 0 #fafaf8,
                                          0.75px 0.75px 0 #fafaf8;">
                  ${
                    name === "dong"
                      ? area.areaName.split(" ")[2]
                      : area.areaName
                  }
                </span>
              </div>
                       `,
                origin: new naver.maps.Point(0, 67),
                anchor: new naver.maps.Point(20, 67)
              }
            });
            markers.push(marker);
          }
        }
        return { area, polygon, latLngs };
      });

      const resolvedAreas = await Promise.all(areaPromises);

      const PatientDataPromises = boundAreas.map((area) => {
        return getPatientsFromRegion(area.areaName, name);
      });
      const patientsArr = await Promise.all(PatientDataPromises);

      resolvedAreas.forEach(({ area, polygon, latLngs }, index) => {
        if (!area || !polygon) return;

        const patients = patientsArr[index];
        let totalCost = patients.reduce((sum, p) => sum + p.totalCost, 0);
        patientTemp.push({ areaName: area.areaName, patients });

        // if (currentZoom >= 17) {
        //   const patientMarkersForArea = patients.map(
        //     (patient) =>
        //       new naver.maps.Marker({
        //         position: new naver.maps.LatLng(
        //           patient.latitude,
        //           patient.longitude
        //         ),
        //         icon: {
        //           content:
        //             '<div style="background:red; width:8px; height:8px; border-radius:50%;"></div>',
        //           origin: new naver.maps.Point(0, 67),
        //           anchor: new naver.maps.Point(20, 67)
        //         }
        //       })
        //   );
        //   patientMarkers.push(...patientMarkersForArea);
        // }

        polygon.setOptions({
          fillColor: `rgba(${color_r}, ${color_g}, ${color_b}, ${getPolyonColorOpacity(
            totalCost
          )})`
        });
      });

      // 새 클러스터 생성
      const newCluster = new MarkerClustering({
        minClusterSize: 2,
        maxZoom: 13,
        map: map,
        markers: markers,
        disableClickZoom: false,
        icons: [
          {
            content: `<div></div>`,
            size: new window.naver.maps.Size(40, 40),
            anchor: new window.naver.maps.Point(20, 20)
          }
        ]
      });

      // if (currentZoom >= 17) {
      //   // 새 클러스터 생성
      //   const newPatientCluster = new MarkerClustering({
      //     minClusterSize: 2,
      //     maxZoom: 13,
      //     map: map,
      //     markers: patientMarkers,
      //     disableClickZoom: false,
      //     icons: [
      //       {
      //         content: `<div></div>`,
      //         size: new window.naver.maps.Size(40, 40),
      //         anchor: new window.naver.maps.Point(20, 20)
      //       }
      //     ]
      //   });
      //   patientMarkersRef.current = newPatientCluster;
      // }

      // 클러스터를 ref에 저장
      regionMarkerClusterRef.current = newCluster;

      setPatients(patientTemp);
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
