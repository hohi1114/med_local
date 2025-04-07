import styled from "styled-components";

import { FC, useEffect, useRef, useState } from "react";
import useNaverMapData from "../../hooks/useNaverMapData";
import { debounce } from "lodash";
import mapStore from "../../store/mapStore";
import { RegionData } from "../../types/naver-maps";
import { makeMarkerClustering } from "../../utils/marker-cluster";
import { PatientData } from "../../utils/ExcelParser";
import Loading from "./Loading";

interface NaverMap2Props {
  children: React.ReactNode;
}

const NaverMap2: FC<NaverMap2Props> = ({ children }) => {
  const {
    drawerDate1,
    isOpenDrawer,
    loading,
    handleIsDrawerOpen,
    setAreaName,
    setPatients,
    setRegion,
    setSelctedRegionData,
    setDongNameForSmall,
    setBoundArea,
    setLoading,
    areaName,
    clearMap
  } = mapStore();

  const MarkerClustering = makeMarkerClustering(window.naver) as any;
  const mapElement = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const [hospitalMarker, setHospitalMarker] =
    useState<naver.maps.Marker | null>(null);

  //**Refs
  const polygonsRef = useRef<Map<string, naver.maps.Polygon>>(new Map());
  const regionMarkerClusterRef = useRef<any | null>(null);
  const patientGroupsMarkerClusterRef = useRef<any | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(16);

  //** Map Logic
  const {
    getRegionName,
    expandBounds,
    getBoundAreas,

    smallRegionEtc,
    dongRegionEtc,
    guRegionEtc,
    smallRegions,
    dongRegions,
    guRegions,
    isFetching,
    hospitalLocation
  } = useNaverMapData(true);

  const clickedAreaRef = useRef<string>(null);
  const { data, name, fontSize, basicColor, basicHgihlightColor } =
    getRegionName(currentZoom);

  // ✅ Initialize map only once
  useEffect(() => {
    if (!mapElement.current || map || !hospitalLocation) return;

    const newMap = new window.naver.maps.Map(mapElement.current, {
      center: new window.naver.maps.LatLng(
        new window.naver.maps.LatLng(
          hospitalLocation.lat,
          hospitalLocation.long
        )
      ),
      zoom: 16,
      zoomControl: true
    });

    setMap(newMap);

    if (!hospitalMarker) {
      const newMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(
          hospitalLocation.lat,
          hospitalLocation.long
        ),
        map: newMap
      });
      setHospitalMarker(newMarker);
    }
  }, [map, isFetching, hospitalLocation]);

  useEffect(() => {
    return () => {
      clearMap();
    };
  }, []);

  useEffect(() => {
    if (!isOpenDrawer) {
      const polygon = polygonsRef.current.get(areaName);
      if (polygon) {
        const paths = polygon.getPaths();
        polygon.setOptions({
          paths: paths,
          strokeColor: basicColor,
          strokeWeight: 2
        });
      }
    }
  }, [isOpenDrawer, areaName]);

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
      console.log(area);
      const latLngs = area.polygon.map(
        ([lng, lat]) => new window.naver.maps.LatLng(lat, lng)
      );
      let polygon = polygonsRef.current.get(area.name);
      if (!polygon) {
        polygon = new window.naver.maps.Polygon({
          paths: latLngs,
          strokeColor: basicColor,
          strokeWeight: 2,
          clickable: true,

          fillColor:
            area?.total_costA <= area?.total_costB
              ? "rgba(255, 234, 232, 0.4)"
              : "rgba(200, 225, 250, 0.6)"
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
          setMarkerClickListener(marker, area, polygon);
          regionMarkers.push(marker);
        }
      }
    });

    // 📌 Draw polygons and markers
    await Promise.all(areaPromises);

    // Marker clustering
    createMarkerCluster(regionMarkers, regionMarkerClusterRef);
    createMarkerCluster(patientGroupsMarkers, patientGroupsMarkerClusterRef);
    setPatients(patientTemp);
    setLoading(false);
  }, 500);

  useEffect(() => {
    if (map) {
      window.naver.maps.Event.clearListeners(map, "zoom_changed");
      window.naver.maps.Event.clearListeners(map, "idle");
    }
    handleZoomChange(true);
  }, [drawerDate1, map, currentZoom]);

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
    currentZoom,
    isOpenDrawer
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
              strokeColor: basicColor,
              strokeWeight: 2
            });
          }
        }

        if (polygon) {
          //highlight polygon
          clickedAreaRef.current = area.name;
          setAreaName(area.name);
          polygon.setOptions({
            paths: polygon.getPaths(),
            strokeColor: basicHgihlightColor,
            strokeWeight: 3,
            zIndex: 100
          });
          setSelctedRegionData(area);
          if (name === "small" && area.dong) {
            setDongNameForSmall(area?.dong);
          }
        }
      });
    }
  };

  const setMarkerClickListener = (
    marker: naver.maps.Marker,
    area: RegionData,
    polygon: naver.maps.Polygon
  ) => {
    if (!marker.hasListener("click")) {
      marker.addListener("click", () => {
        if (!isOpenDrawer) handleIsDrawerOpen(true);
        //remove previous highlight polygon
        if (clickedAreaRef.current) {
          const clickedPolygon = polygonsRef.current.get(
            clickedAreaRef.current
          );
          if (clickedPolygon) {
            clickedPolygon.setOptions({
              paths: clickedPolygon.getPaths(),
              strokeColor: basicColor,
              strokeWeight: 2
            });
          }
        }

        if (marker) {
          //highlight polygon
          clickedAreaRef.current = area.name;
          setAreaName(area.name);
          polygon.setOptions({
            paths: polygon.getPaths(),
            strokeColor: basicHgihlightColor,
            strokeWeight: 3,
            zIndex: 100
          });
          setSelctedRegionData(area);
          if (name === "small" && area.dong) {
            setDongNameForSmall(area?.dong);
          }
        }
      });
    }
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
    <>
      {(loading || isFetching) && <Loading />}
      <MapContainer ref={mapElement}>{children}</MapContainer>
    </>
  );
};

export default NaverMap2;

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;
