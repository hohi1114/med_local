import { useEffect, useRef, useState } from "react";
import mapStore from "../../store/mapStore";
import useNaverMapData from "../../hooks/useNaverMapData";
import { debounce } from "lodash";
import { makeMarkerClustering } from "../../utils/marker-cluster.js";
import { PatientData } from "../../utils/ExcelParser.js";
import { dashboardMock } from "../../assets/DashboardMock.js";
import dayjs from "dayjs";

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

const NaverMap = () => {
  const {
    isOpenDrawer,
    handleIsDrawerOpen,
    setAreaName,
    setPatients,
    highestCost,
    drawerDate
  } = mapStore();
  const MarkerClustering = makeMarkerClustering(window.naver) as any;
  const mapElement = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const [patientsArr, setPatientsArr] = useState<PatientData[][]>([]);
  //**Refs
  const polygonsRef = useRef<Map<string, naver.maps.Polygon>>(new Map());
  const regionMarkerClusterRef = useRef<any | null>(null);
  const patientGroupsMarkerClusterRef = useRef<any | null>(null);

  //** Map Logic
  const {
    isDataLoaded,
    getRegionName,
    expandBounds,
    getBoundAreas,
    getPolygonColorOpacity,
    groupPatientsByProximity
  } = useNaverMapData();
  const clickedAreaRef = useRef<string>(null);
  let [clickedArea, setClickedArea] = useState<string>("");
  const [currentZoom, setCurrentZoom] = useState(0);

  // ✅ Initialize map only once
  useEffect(() => {
    if (!mapElement.current || map) return;

    const newMap = new window.naver.maps.Map(mapElement.current, {
      center: new window.naver.maps.LatLng(37.51, 126.88),
      zoom: 15,
      zoomControl: true
    });

    setMap(newMap);
    const fetchData = async () => {
      const data = await dashboardMock();
      setPatientsArr(data);
    };
    fetchData();
  }, [map]);

  // ✅ Change PolyStyle and patinetMarkers when drawer is open
  useEffect(() => {
    if (!isOpenDrawer) {
      const polygon = polygonsRef.current.get(clickedArea);
      if (polygon) {
        const paths = polygon.getPaths();
        polygon.setOptions({
          paths: paths,
          strokeColor: "#92BFFF",
          strokeWeight: 3
        });
      }
    }
  }, [isOpenDrawer, clickedArea]);

  // ✅ Handle zoom change
  useEffect(() => {
    if (!map || !isDataLoaded || patientsArr.length == 0) {
      return;
    }

    const handleZoomChange = debounce(async () => {
      //📌Init Map
      const currentZoom = map.getZoom();
      setCurrentZoom(currentZoom);

      const patientTemp: { areaName: string; patients: PatientData[] }[] = [];
      const regionMarkers: naver.maps.Marker[] = [];
      const patientGroupsMarkers: naver.maps.Marker[] = [];

      //1. Get Regioin Info
      //the area of the map currently displayed is changed by zooming or moving the map.
      const { data, name, fontSize } = getRegionName(currentZoom);
      const mapBounds = expandBounds(
        map.getBounds() as naver.maps.LatLngBounds,
        0.3
      );

      const polygonsToRender = data;

      //2. Get Bound Areas
      const { boundAreas } = getBoundAreas(polygonsToRender, mapBounds);
      if (boundAreas.length === 0) return;

      //3. Remove all polygons and markerClusters
      polygonsRef.current.forEach((polygon, areaName) => {
        if (!boundAreas.find((area) => area.areaName === areaName)) {
          polygon.setMap(null);
          polygonsRef.current.delete(areaName);
        }
      });
      crearClusters(regionMarkerClusterRef);
      crearClusters(patientGroupsMarkerClusterRef);

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
          //Set click event listener
          setPolygonClickListener(polygon, area.areaName);
          //Set region name marker
          const bounds = polygon.getBounds();
          if (bounds) {
            const center = bounds.getCenter();
            const marker = createRegionMarker(
              center,
              fontSize,
              area.areaName,
              name
            );
            regionMarkers.push(marker);
          }
        }

        return { area, polygon };
      });

      // 📌 Draw polygons and markers
      const resolvedAreas = await Promise.all(areaPromises);

      // 📌 Get patients data based on boundArea
      // const PatientDataPromises = boundAreas.map((area) => {
      //   return getPatientsFromRegion(area.areaName, name);
      // });
      // const patientsArr = await Promise.all(PatientDataPromises);

      // 📌 Set patient makers and background based on patient count
      resolvedAreas.forEach((item, index) => {
        if (!item) return;
        const { area, polygon } = item;

        if (!area || !polygon) return;

        const patients: any = [];
        // const filteredPatients = patientsArr.filter((patient) => {
        //   const visitDate = dayjs(patient.visitDate);
        //   return visitDate.isBetween(
        //     drawerDate.startDate.toDate(),
        //     drawerDate.endDate.toDate()
        //   );
        // });

        patientsArr.forEach((patient) => {
          if (containsLocation(patient.latitude, patient.longitude, polygon)) {
            patients.push(patient);
          }
        });
        let totalCost = patients.reduce((sum, p) => sum + p.totalCost, 0);
        patientTemp.push({ areaName: area.areaName, patients });
        polygon.setOptions({
          paths: polygon.getPaths(),
          fillColor: `${getPolygonColorOpacity(totalCost, name)}`
        });
        if (currentZoom >= 16) {
          const groupPatients = groupPatientsByProximity(patients, 300);
          createPatientGroupMarkers(groupPatients, patientGroupsMarkers);
        }
      });

      // Marker clustering
      createMarkerCluster(regionMarkers, regionMarkerClusterRef);
      createMarkerCluster(patientGroupsMarkers, patientGroupsMarkerClusterRef);
      setPatients(patientTemp);
    }, 500);

    window.naver.maps.Event.addListener(map, "zoom_changed", () => {
      handleZoomChange();
    });
    handleZoomChange();
  }, [map, isDataLoaded, highestCost, patientsArr]);

  const setPolygonClickListener = (
    polygon: naver.maps.Polygon,
    areaName: string
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
              strokeColor: "#92BFFF",
              strokeWeight: 4
            });
          }
        }

        if (polygon) {
          //highlight polygon
          clickedAreaRef.current = areaName;
          setAreaName(areaName);
          polygon.setOptions({
            paths: polygon.getPaths(),
            strokeColor: "#4692ff",
            strokeWeight: 3,
            zIndex: 100
          });
          setClickedArea(areaName);
        }
      });
    }
  };

  const createPatientGroupMarkers = (
    groupedPatients: PatientData[][],
    markers: naver.maps.Marker[]
  ) => {
    groupedPatients.forEach((patients) => {
      if (patients.length > 0) {
        const patientMarker = new naver.maps.Marker({
          position: new naver.maps.LatLng(
            patients[0].latitude,
            patients[0].longitude
          ),
          icon: {
            content: `<div style="display: flex; align-items: center; justify-content: center;">
                      <span style="font-size:11px; color:#fff; text-align: center;
                      background-color: #2c2c2c; padding: 3px 10px; border-radius: 50px;">
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
              <span style="font-size:${fontSize}; color:#2c2c2c; text-align: center;
                           text-shadow: -0.75px -0.75px 0 #fafaf8,
                                        0.75px 0.75px 0 #fafaf8,
                                        -0.75px -0.75px 0 #fafaf8,
                                        0.75px 0.75px 0 #fafaf8;">
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
    ></div>
  );
};

export default NaverMap;
