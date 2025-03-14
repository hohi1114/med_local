import { useEffect, useRef, useState } from "react";
import OnOffButton from "../common/button/OnOffButton";
import styled from "styled-components";
import mapStore from "../../store/mapStore";
import { getPatientsFromRegion } from "../../store/indexded_db/RegionDB";
import useNaverMapData from "../../hooks/useNaverMapData";
import useMediMapData from "../../hooks/useMediMapData";
import { debounce } from "lodash";
import { makeMarkerClustering } from "../../utils/marker-cluster.js";
import { PatientData } from "../../utils/ExcelParser.js";

const NaverMap = () => {
  const {
    isOpenDrawer,
    handleIsDrawerOpen,
    patients,
    setAreaName,
    setPatients,
    highestCost
  } = mapStore();
  const MarkerClustering = makeMarkerClustering(window.naver) as any;

  //**Data
  const { areas: dongPolygons } = useMediMapData("fixed_polygon.json");
  const { areas: smallPolygons } = useMediMapData("normalized_small_db.json");
  const { areas: guPolygons } = useMediMapData("district_boundaries.json");

  //**Refs
  const polygonsRef = useRef<Map<string, naver.maps.Polygon>>(new Map());
  const regionMarkerClusterRef = useRef<naver.maps.Marker[] | null>(null);
  const patientGroupsMarkerClusterRef = useRef<naver.maps.Marker[] | null>(
    null
  );
  const previousZoomRef = useRef<number>(15);
  const clickedAreaRef = useRef<string>(null);
  const clickedAreaPatientsRef = useRef<PatientData[]>([]);
  //**Refs
  const mapElement = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  //**Drawer states
  const [peopleShowButton, setPeopleShowButton] = useState(false);
  //** Map Logic
  const {
    getRegionName,
    expandBounds,
    getBoundAreas,
    getPolygonColorOpacity,
    groupPatientsByProximity
  } = useNaverMapData();

  let [clickedArea, setClickedArea] = useState<string>("");
  const [currentZoom, setCurrentZoom] = useState(0);
  const [areaPatients, setAreaPatients] = useState<PatientData[]>([]);

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

  useEffect(() => {
    if (!isOpenDrawer) {
      const polygon = polygonsRef.current.get(clickedArea);
      if (polygon) {
        polygon.setOptions({
          strokeColor: "#92BFFF",
          strokeWeight: 3
        });
      }
      if (patientGroupsMarkerClusterRef.current) {
        patientGroupsMarkerClusterRef.current.setMap(null);
      }
    }
  }, [isOpenDrawer, currentZoom, clickedArea]);

  // ✅ Handle zoom change
  useEffect(() => {
    if (
      !map ||
      smallPolygons.length === 0 ||
      dongPolygons.length === 0 ||
      guPolygons.length === 0 ||
      highestCost === 0
    ) {
      return;
    }

    const handleZoomChange = debounce(async () => {
      //1. Init Map
      const currentZoom = map.getZoom();
      previousZoomRef.current = currentZoom;

      setCurrentZoom(currentZoom);
      const patientTemp: { areaName: string; patients: PatientData[] }[] = [];
      const markers: naver.maps.Marker[] = [];
      const patientGroupsMarker: naver.maps.Marker[] = [];

      //2. Get Regioin Info
      const { name, fontSize } = getRegionName(currentZoom);
      const mapBounds = expandBounds(
        map.getBounds() as naver.maps.LatLngBounds,
        0.3
      );

      //3. Get Bound Areas
      const polygonsToRender =
        currentZoom >= 15
          ? smallPolygons
          : currentZoom < 15 && currentZoom >= 14
          ? dongPolygons
          : guPolygons;

      const { boundAreas } = getBoundAreas(polygonsToRender, mapBounds);
      if (boundAreas.length === 0) return;

      //4. Remove all polygons and
      polygonsRef.current.forEach((polygon, areaName) => {
        if (!boundAreas.find((area) => area.areaName === areaName)) {
          polygon.setMap(null);
          polygonsRef.current.delete(areaName);
        }
      });
      if (regionMarkerClusterRef.current) {
        regionMarkerClusterRef.current.setMap(null);
      }
      if (patientGroupsMarkerClusterRef.current) {
        patientGroupsMarkerClusterRef.current.setMap(null);
      }

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
            strokeColor: "#92BFFF",
            strokeWeight: 3,
            clickable: true
          });
        }

        if (polygon) {
          polygonsRef.current.set(area.areaName, polygon);
          polygon.setMap(map);
          if (!polygon.hasListener("click")) {
            polygon.addListener("click", () => {
              //dreawer open
              if (!isOpenDrawer) {
                handleIsDrawerOpen(true);
              }
              //remove previous highlight polygon
              if (clickedAreaRef.current) {
                const polygon2 = polygonsRef.current.get(
                  clickedAreaRef.current
                );
                if (polygon2) {
                  if (polygon2) {
                    polygon2.setOptions({
                      strokeColor: "#92BFFF",
                      strokeWeight: 4
                    });
                  }
                }
              }
              clickedAreaRef.current = area.areaName;
              //highlight polygon
              setAreaName(area.areaName);
              polygon.setOptions({
                path: latLngs,
                strokeColor: "#4692ff",
                strokeWeight: 3,
                zIndex: 100
              });
              setClickedArea(area.areaName);
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
        if (currentZoom >= 16) {
          const groupPatients = groupPatientsByProximity(patients, 500);
          if (groupPatients.length > 0) {
            groupPatients.forEach((patients) => {
              const patientsMarkers = new naver.maps.Marker({
                position: new naver.maps.LatLng(
                  patients[0].latitude,
                  patients[0].longitude
                ),
                icon: {
                  content: `<div style="display: flex; align-items: center; justify-content: center;">
            <span style="font-size:10px; color:#fff; text-align: center;
                        background-color: #2c2c2c;);
                        padding: 3px 10px;
                        border-radius: 50px;">
              ${patients.length}
            </span>
          </div>`
                }
              });
              patientGroupsMarker.push(patientsMarkers);
            });
          }
        }

        let totalCost = patients.reduce((sum, p) => sum + p.totalCost, 0);
        patientTemp.push({ areaName: area.areaName, patients });
        polygon.setOptions({
          fillColor: `${getPolygonColorOpacity(totalCost, highestCost[name])}`
        });
      });

      // 새 클러스터 생성
      const regionNameCluster = new MarkerClustering({
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
      const patientGroupsCluster = new MarkerClustering({
        minClusterSize: 2,
        maxZoom: 13,
        map: map,
        markers: patientGroupsMarker,
        disableClickZoom: false,
        icons: [
          {
            content: `<div></div>`,
            size: new window.naver.maps.Size(40, 40),
            anchor: new window.naver.maps.Point(20, 20)
          }
        ]
      });

      // 클러스터를 ref에 저장
      regionMarkerClusterRef.current = regionNameCluster;
      patientGroupsMarkerClusterRef.current = patientGroupsCluster;

      setPatients(patientTemp);
    }, 500);

    window.naver.maps.Event.addListener(map, "zoom_changed", handleZoomChange);
    window.naver.maps.Event.addListener(map, "idle", handleZoomChange);
    handleZoomChange();
  }, [map, smallPolygons, dongPolygons, guPolygons, isOpenDrawer, highestCost]);

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
