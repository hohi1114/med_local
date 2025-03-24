import { FC, useEffect, useRef, useState } from "react";
import mapStore from "../../store/mapStore";
import useNaverMapData from "../../hooks/useNaverMapData";
import { debounce } from "lodash";
import { makeMarkerClustering } from "../../utils/marker-cluster.js";
import { PatientData } from "../../utils/ExcelParser.js";
import { Point, RegionData } from "../../types/naver-maps.js";
import DurationDatePicker from "../common/datepicker/DurationDatePicker.js";
import BaseButton from "../common/button/BaseButton.js";
import { Dayjs } from "dayjs";
import Loading from "../common/Loading.js";

interface NaverMapProps {
  rangeDate: { startDate: Dayjs; endDate: Dayjs };
  handleDateChange: (dates: Dayjs[]) => void;
  handleTodayButton: () => void;
}

const NaverMap: FC<NaverMapProps> = ({
  rangeDate,
  handleDateChange,
  handleTodayButton
}) => {
  const {
    drawerDate,
    isOpenDrawer,
    handleIsDrawerOpen,
    setAreaName,
    setPatients,
    setRegion,
    setSelctedRegionData,
    setSmallPolygons,
    setBoundArea
  } = mapStore();

  const MarkerClustering = makeMarkerClustering(window.naver) as any;
  const mapElement = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  //**Refs
  const polygonsRef = useRef<Map<string, naver.maps.Polygon>>(new Map());
  const regionMarkerClusterRef = useRef<any | null>(null);
  const patientGroupsMarkerClusterRef = useRef<any | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(15);

  //** Map Logic
  const {
    getRegionName,
    expandBounds,
    getBoundAreas,
    getPolygonColorOpacity,
    groupPatientsByProximity,
    smallRegionEtc,
    dongRegionEtc,
    guRegionEtc,
    smallRegions,
    dongRegions,
    guRegions,
    isFetching
  } = useNaverMapData();

  const clickedAreaRef = useRef<string>(null);
  let [clickedArea, setClickedArea] = useState<string>("");
  const { data, name, fontSize, color, hilightColor } =
    getRegionName(currentZoom);

  // ✅ Initialize map only once
  useEffect(() => {
    if (!mapElement.current || map) return;

    const newMap = new window.naver.maps.Map(mapElement.current, {
      center: new window.naver.maps.LatLng(37.51, 126.88),
      zoom: 15,
      zoomControl: true
    });

    setMap(newMap);
  }, [map, isFetching]);

  // ✅ Change PolyStyle and patinetMarkers when drawer is open
  useEffect(() => {
    if (!isOpenDrawer) {
      const polygon = polygonsRef.current.get(clickedArea);
      if (polygon) {
        const paths = polygon.getPaths();
        polygon.setOptions({
          paths: paths,
          strokeColor: color,
          strokeWeight: 1.5
        });
      }
    }
  }, [isOpenDrawer, clickedArea]);

  const handleZoomChange = debounce(async (dateChanged) => {
    //📌Init Map
    if (!map) return;
    setCurrentZoom(map.getZoom());
    const patientTemp: { areaName: string; patients: PatientData[] }[] = [];
    const regionMarkers: naver.maps.Marker[] = [];
    const patientGroupsMarkers: naver.maps.Marker[] = [];

    //1. Get Regioin Info
    //the area of the map currently displayed is changed by zooming or moving the map.

    setRegion(name);
    const mapBounds = expandBounds(
      map.getBounds() as naver.maps.LatLngBounds,
      0.3
    );

    const polygonsToRender = data;

    //2. Get Bound Areas
    const { boundAreas } = getBoundAreas(polygonsToRender, mapBounds);
    setBoundArea(boundAreas);
    if (boundAreas.length === 0) {
      polygonsRef.current.forEach((polygon) => polygon.setMap(null));
      polygonsRef.current.clear();
      return;
    }

    //3. Remove polygons and markerClusters
    if (dateChanged) {
      polygonsRef.current.forEach((polygon) => {
        polygon.setMap(null);
      });
      polygonsRef.current.clear();
    } else {
      polygonsRef.current.forEach((polygon, areaName) => {
        if (!boundAreas.find((area) => area.name === areaName)) {
          polygon.setMap(null);
          polygonsRef.current.delete(areaName);
        }
      });
    }

    crearClusters(regionMarkerClusterRef);
    crearClusters(patientGroupsMarkerClusterRef);

    const areaPromises = boundAreas.map(async (area) => {
      const latLngs = area.polygon.map(
        ([lng, lat]) => new window.naver.maps.LatLng(lat, lng)
      );
      let polygon = polygonsRef.current.get(area.name);
      if (!polygon) {
        polygon = new window.naver.maps.Polygon({
          paths: latLngs,
          strokeColor: color,
          strokeWeight: 1.5,
          clickable: true,
          fillColor: `${getPolygonColorOpacity(area.total_cost, name)}`
        });
      }

      if (polygon) {
        polygonsRef.current.set(area.name, polygon);
        polygon.setMap(map);
        //Set click event listener
        setPolygonClickListener(polygon, area);
        //Set region name marker
        const bounds = polygon.getBounds();
        if (bounds) {
          const center = bounds.getCenter();
          const marker = createRegionMarker(center, fontSize, area.name, name);
          regionMarkers.push(marker);
        }

        if (currentZoom >= 17) {
          const groupPatients = groupPatientsByProximity(
            area.patient_locations,
            300
          );
          createPatientGroupMarkers(groupPatients, patientGroupsMarkers);
        }
      }
    });

    // 📌 Draw polygons and markers
    await Promise.all(areaPromises);

    // Marker clustering
    createMarkerCluster(regionMarkers, regionMarkerClusterRef);
    createMarkerCluster(patientGroupsMarkers, patientGroupsMarkerClusterRef);
    setPatients(patientTemp);
  }, 500);

  useEffect(() => {
    if (map) {
      window.naver.maps.Event.clearListeners(map, "zoom_changed");
      window.naver.maps.Event.clearListeners(map, "idle");
    }
    handleZoomChange(true);
  }, [drawerDate, map, currentZoom]);

  useEffect(() => {
    if (!map) return;

    handleZoomChange(true);

    window.naver.maps.Event.addListener(map, "zoom_changed", () => {
      handleZoomChange(false);
    });

    window.naver.maps.Event.addListener(map, "idle", () => {
      handleZoomChange(false);
    });

    return () => {
      if (map) {
        window.naver.maps.Event.clearListeners(map, "zoom_changed");
        window.naver.maps.Event.clearListeners(map, "idle");
      }
    };
  }, [
    map,
    smallRegions,
    dongRegions,
    guRegions,
    smallRegionEtc,
    dongRegionEtc,
    guRegionEtc,
    currentZoom
  ]);

  const setPolygonClickListener = (
    polygon: naver.maps.Polygon,
    area: RegionData
  ) => {
    if (!polygon.hasListener("click")) {
      polygon.addListener("click", () => {
        if (!isOpenDrawer) handleIsDrawerOpen(true);
        //remove previous highlight polygon
        if (clickedAreaRef.current) {
          const clickedPolygon = polygonsRef.current.get(
            clickedAreaRef.current
          );
          if (clickedPolygon) {
            clickedPolygon.setOptions({
              paths: clickedPolygon.getPaths(),
              strokeColor: color,
              strokeWeight: 1.5
            });
          }
        }

        if (polygon) {
          //highlight polygon
          clickedAreaRef.current = area.name;
          setAreaName(area.name);
          polygon.setOptions({
            paths: polygon.getPaths(),
            strokeColor: hilightColor,
            strokeWeight: 3,
            zIndex: 100
          });
          setClickedArea(area.name);
          setSelctedRegionData(area);
          setSmallPolygons(area.polygon);
        }
      });
    }
  };

  const createPatientGroupMarkers = (
    groupedPatients: Point[][],
    markers: naver.maps.Marker[]
  ) => {
    groupedPatients.forEach((patients) => {
      if (patients.length > 0) {
        const patientMarker = new naver.maps.Marker({
          position: new naver.maps.LatLng(patients[0].lat, patients[0].lng),
          icon: {
            content: `<div style="display: flex; align-items: center; justify-content: center;">
                      <span style="font-size:11px; color:#fff; text-align: center;
                      background-color: rgba(44, 44, 44, 1); padding: 3px 10px; border-radius: 50px;">
                        ${patients.length}
                      </span>
                    </div>`
          }
        });
        markers.push(patientMarker);
      }
    });
  };

  const createMarkerCluster = (
    markers: naver.maps.Marker[],
    ref: React.RefObject<any>
  ) => {
    const cluster = new MarkerClustering({
      minClusterSize: 2,
      maxZoom: 13,
      map,
      markers,
      icons: [
        {
          content: `<div></div>`,
          size: new window.naver.maps.Size(40, 40),
          anchor: new window.naver.maps.Point(20, 20)
        }
      ]
    });

    ref.current = cluster;
  };

  const createRegionMarker = (
    center: naver.maps.Coord,
    fontSize: string,
    areaName: string,
    region: string
  ) => {
    return new naver.maps.Marker({
      position: center,
      icon: {
        content: `
        <div style="display: flex; align-items: center; justify-content: center;">
        <span style="font-size: ${fontSize}; 
                     color: #4A4A4A;
                     white-space: nowrap;
                     background-color: rgba(255, 255, 255, 0.8);
                     border-radius: 16px;
                     padding: 4px 10px;
                     box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
                     text-align: center; z-index:100">
          ${region === "dong" ? areaName.split(" ")[2] : areaName}
        </span>
      </div>
          `,
        origin: new naver.maps.Point(0, 67),
        anchor: new naver.maps.Point(20, 67)
      }
    });
  };

  const crearClusters = (ref: React.RefObject<any>) => {
    if (ref.current) {
      ref.current.getMarkers().forEach((marker: naver.maps.Marker) => {
        marker.setMap(null);
      });
      ref.current.setMap(null);
    }
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
      {isFetching || (loading && <Loading />)}
      <div
        style={{
          position: "absolute",
          top: "1rem",
          left: "4rem",
          zIndex: 1000,
          backgroundColor: "white",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0px 4px 6px rgba(0,0,0,0.1)"
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <DurationDatePicker
            rangeDate={rangeDate}
            handleDateChange={handleDateChange}
          />

          <div style={{ width: "80px" }}>
            <BaseButton
              type="button"
              onClick={handleTodayButton}
              textcolor="#Ffffff"
            >
              오늘
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NaverMap;
