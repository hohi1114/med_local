// hooks/useNaverMapCore.ts
import { useEffect, useRef, useState } from "react";
import { debounce } from "lodash";
import mapStore from "../store/mapStore";
import useNaverMapData from "./useNaverMapData";
import { makeMarkerClustering } from "../utils/marker-cluster";
import { PatientData } from "../utils/ExcelParser";
import { RegionData, RegionLevel } from "../types/naver-maps";
import userStore from "../store/userStore";

export interface UseNaverMapCoreOptions {
  isComparison?: boolean;
  onZoomChange?: (dateChanged: boolean) => void;
  getPolygonFillColor?: (area: RegionData) => string;
  getPolygonHighlightColor?: (area: RegionData) => string;
}

export function useNaverMapCore({
  isComparison = false,
  onZoomChange,
  getPolygonFillColor,
  getPolygonHighlightColor
}: UseNaverMapCoreOptions = {}) {
  const { user, startTutorial } = userStore();
  const {
    drawerDate,
    drawerDate1,
    isOpenDrawer,
    handleIsDrawerOpen,
    setAreaName,
    setPatients,
    setRegion,
    setSelectedRegionData,
    setDongNameForSmall,
    setBoundArea,
    setLoading,
    areaName,
    loading,
    clearMap
  } = mapStore();

  const MarkerClustering = makeMarkerClustering(window.naver) as any;
  const mapElement = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const [hospitalMarker, setHospitalMarker] =
    useState<naver.maps.Marker | null>(null);

  // Refs
  const polygonsRef = useRef<Map<string, naver.maps.Polygon>>(new Map());
  const regionMarkerClusterRef = useRef<any | null>(null);
  const patientGroupsMarkerClusterRef = useRef<any | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(16);
  const clickedAreaRef = useRef<string>(null);

  // Map Logic
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
  } = useNaverMapData(isComparison);

  // Default highlight colors
  const defaultHighlightColor = isComparison ? "#52555A" : "#0000b4";
  const defaultColor = isComparison ? "#ABADAF" : "#6666E0";

  // Initialize map only once
  useEffect(() => {
    if (!mapElement.current || map || !user.location) return;

    const newMap = new window.naver.maps.Map(mapElement.current, {
      center: new window.naver.maps.LatLng(
        startTutorial
          ? new window.naver.maps.LatLng(37.5040117, 127.029943)
          : new window.naver.maps.LatLng(
              user?.location.lat,
              user?.location.long
            )
      ),
      zoom: 16
    });

    setMap(newMap);

    if (!hospitalMarker) {
      const newMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(
          user?.location.lat,
          user?.location.long
        ),
        map: newMap,
        zoom: 16,
        icon: {
          content: `<img src="/images/marker.svg" style="width: auto; height: 43px; z-index:20;"/>`,
          anchor: new window.naver.maps.Point(15, 30)
        }
      });
      setHospitalMarker(newMarker);
    }
  }, [map, isFetching, user]);

  //Cleanup
  useEffect(() => {
    return () => {
      clearMap();
    };
  }, []);

  // Reset polygon style when drawer closes
  useEffect(() => {
    if (!isOpenDrawer) {
      const polygon = polygonsRef.current.get(areaName);
      if (polygon) {
        const paths = polygon.getPaths();
        polygon.setOptions({
          paths: paths,
          strokeColor: defaultColor,
          strokeWeight: isComparison ? 2 : 1.5
        });
      }
    }
  }, [isOpenDrawer, areaName]);

  const handleDefaultZoomChange = debounce(async (dateChanged: boolean) => {
    if (!map) return;

    setCurrentZoom(map.getZoom());

    let regionData = getRegionName(map.getZoom());

    const patientTemp: { areaName: string; patients: PatientData[] }[] = [];
    const regionMarkers: naver.maps.Marker[] = [];
    const patientGroupsMarkers: naver.maps.Marker[] = [];

    // Get Region Info
    setRegion(regionData.name);
    const mapBounds = expandBounds(
      map.getBounds() as naver.maps.LatLngBounds,
      0.3
    );
    const polygonsToRender = regionData.data;

    let { boundAreas } = getBoundAreas(polygonsToRender, mapBounds);
    if (boundAreas.length === 0) {
      regionData = getRegionName(map.getZoom(), boundAreas);
      ({ boundAreas } = getBoundAreas(regionData.data, mapBounds));
    }
    setRegion(regionData.name);
    setBoundArea(boundAreas);

    // Remove polygons and markerClusters
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

    clearClusters(regionMarkerClusterRef);
    clearClusters(patientGroupsMarkerClusterRef);

    const areaPromises = boundAreas.map(async (area) => {
      const latLngs = (area.polygon ?? []).map(
        ([lng, lat]) => new window.naver.maps.LatLng(lat, lng)
      );

      let polygon = polygonsRef.current.get(area.name);
      if (!polygon) {
        const fillColor = getPolygonFillColor
          ? getPolygonFillColor(area)
          : isComparison
          ? (area?.total_costA ?? 0) === (area?.total_costB ?? 0)
            ? "rgba(211, 212, 213, 0.3)"
            : (area?.total_costA ?? 0) < (area?.total_costB ?? 0)
            ? "rgba(120, 180, 230, 0.3)"
            : "rgba(240, 180, 180, 0.3)"
          : `${getPolygonColorOpacity(
              area.total_cost ?? 0,
              regionData.name as RegionLevel
            )}`;

        polygon = new window.naver.maps.Polygon({
          paths: latLngs,
          strokeColor: defaultColor,
          strokeWeight: isComparison ? 2 : 1.5,
          clickable: true,
          fillColor
        });
      }

      if (polygon) {
        polygonsRef.current.set(area.name, polygon);
        polygon.setMap(map);

        // Set click event listener
        setPolygonClickListener(polygon, area, regionData.name);

        // Set region name marker
        const bounds = polygon.getBounds();
        if (bounds) {
          const center = bounds.getCenter();
          const marker = createRegionMarker(
            center,
            regionData.fontSize,
            area.name,
            regionData.name
          );
          setMarkerClickListener(marker, area, polygon, regionData.name);
          regionMarkers.push(marker);
        }

        // Create patient markers for non-comparison mode at high zoom levels
        if (!isComparison && currentZoom >= 17) {
          const groupPatients = groupPatientsByProximity(
            area.patient_locations,
            200
          );
          createPatientGroupMarkers(groupPatients, patientGroupsMarkers);
        }
      }
    });

    // Draw polygons and markers
    await Promise.all(areaPromises);

    // Marker clustering
    createMarkerCluster(regionMarkers, regionMarkerClusterRef);
    createMarkerCluster(patientGroupsMarkers, patientGroupsMarkerClusterRef);
    setPatients(patientTemp);
    setLoading(false);
  }, 500);

  // Handle custom or default zoom change
  const handleZoomChange = (dateChanged: boolean) => {
    if (onZoomChange) {
      onZoomChange(dateChanged);
    } else {
      handleDefaultZoomChange(dateChanged);
    }
  };

  // Update on date change
  useEffect(() => {
    if (map) {
      window.naver.maps.Event.clearListeners(map, "zoom_changed");
      window.naver.maps.Event.clearListeners(map, "idle");
    }

    handleZoomChange(true);
  }, [isComparison ? drawerDate1 : drawerDate, map, currentZoom]);

  // Set up event listeners
  useEffect(() => {
    if (!map) return;

    handleZoomChange(true);

    window.naver.maps.Event.addListener(map, "zoom_changed", () => {
      setLoading(true);
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
    area: RegionData,
    region: string
  ) => {
    if (!polygon.hasListener("click")) {
      polygon.addListener("click", () => {
        handleIsDrawerOpen(true);

        // Remove previous highlight polygon
        if (clickedAreaRef.current) {
          const clickedPolygon = polygonsRef.current.get(
            clickedAreaRef.current
          );
          if (clickedPolygon) {
            clickedPolygon.setOptions({
              paths: clickedPolygon.getPaths(),
              strokeColor: defaultColor,
              strokeWeight: isComparison ? 2 : 1.5
            });
          }
        }

        if (polygon) {
          // Highlight polygon
          clickedAreaRef.current = area.name;
          setAreaName(area.name);

          const highlightColor = getPolygonHighlightColor
            ? getPolygonHighlightColor(area)
            : isComparison
            ? (area?.total_costA ?? 0) === (area?.total_costB ?? 0)
              ? "rgba(0, 0, 0, 0.4)"
              : (area?.total_costA ?? 0) < (area?.total_costB ?? 0)
              ? "rgb(80, 170, 255)"
              : "rgb(245, 100, 130)"
            : defaultHighlightColor;

          polygon.setOptions({
            paths: polygon.getPaths(),
            strokeColor: highlightColor,
            strokeWeight: 3,
            zIndex: 100
          });

          setSelectedRegionData(area);

          if (region === "small" && area.dong) {
            setDongNameForSmall(area?.dong);
          }
        }
      });
    }
  };

  const setMarkerClickListener = (
    marker: naver.maps.Marker,
    area: RegionData,
    polygon: naver.maps.Polygon,
    region: string
  ) => {
    if (!marker.hasListener("click")) {
      marker.addListener("click", () => {
        handleIsDrawerOpen(true);

        // Remove previous highlight polygon
        if (clickedAreaRef.current) {
          const clickedPolygon = polygonsRef.current.get(
            clickedAreaRef.current
          );
          if (clickedPolygon) {
            clickedPolygon.setOptions({
              paths: clickedPolygon.getPaths(),
              strokeColor: defaultColor,
              strokeWeight: isComparison ? 2 : 1.5
            });
          }
        }

        if (marker) {
          // Highlight polygon
          clickedAreaRef.current = area.name;
          setAreaName(area.name);

          const highlightColor = getPolygonHighlightColor
            ? getPolygonHighlightColor(area)
            : isComparison
            ? (area?.total_costA ?? 0) <= (area?.total_costB ?? 0)
              ? "rgb(80, 170, 255)"
              : "rgb(245, 100, 130)"
            : defaultHighlightColor;

          polygon.setOptions({
            paths: polygon.getPaths(),
            strokeColor: highlightColor,
            strokeWeight: 3,
            zIndex: 100
          });

          // Fix the typo by handling both function names
          if (isComparison && setSelectedRegionData) {
            setSelectedRegionData(area);
          } else if (setSelectedRegionData) {
            setSelectedRegionData(area);
          }

          if (region === "small" && area.dong) {
            setDongNameForSmall(area?.dong);
          }
        }
      });
    }
  };

  const createPatientGroupMarkers = (
    groupedPatients: any[][],
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
    const reNamedDong = areaName
      .split(" ")
      .slice(areaName.split(" ").length - 1);
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
                    text-align: center; z-index:10;">
            ${region === "dong" ? reNamedDong : areaName}
          </span>
        </div>`,
        origin: new naver.maps.Point(0, 67),
        anchor: new naver.maps.Point(20, 67)
      }
    });
  };

  const clearClusters = (ref: React.RefObject<any>) => {
    if (ref.current) {
      ref.current.getMarkers().forEach((marker: naver.maps.Marker) => {
        marker.setMap(null);
      });
      ref.current.setMap(null);
    }
  };

  return {
    map,
    mapElement,
    loading,
    isFetching,
    currentZoom,
    name,
    handleZoomChange,
    clearClusters,
    createMarkerCluster,
    createRegionMarker,
    createPatientGroupMarkers,
    setPolygonClickListener,
    setMarkerClickListener
  };
}
