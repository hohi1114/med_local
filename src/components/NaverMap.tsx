import React, { useEffect, useRef, useState } from "react";
import useMediData from "../hooks/useMediData";
import useMediMapData from "../hooks/useMediMapData";

const NaverMap: React.FC = ({ patientLocations }: any) => {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const polygonRef = useRef<naver.maps.Polygon | null>(null); // Use ref instead of state
  const { locations } = useMediMapData();

  const [filteredData, setFilteredData] = useState();

  useEffect(() => {
    if (locations) {
      const filteredData = Object.entries(locations)
        .filter(([key, value]) => key.startsWith("B")) // 'B'로 시작하는 키만 선택
        .reduce((acc, [key, value]) => {
          try {
            acc[key] = JSON.parse(value["h"]);
          } catch (error) {
            console.error("Parsing error:", error);
            acc[key] = [];
          }
          return acc;
        }, {});
      setFilteredData(filteredData);
    }
  }, [locations]);

  useEffect(() => {
    // Wait for the Naver Maps API to load
    const checkNaverMaps = () => {
      if (window.naver) {
        setIsLoaded(true);
      } else {
        setTimeout(checkNaverMaps, 500);
      }
    };
    checkNaverMaps();
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapElement.current) return;

    // Initialize the map
    const map = new window.naver.maps.Map(mapElement.current, {
      center: new window.naver.maps.LatLng(37.51, 126.88), // Center near 신도림로 11라길
      zoom: 15,
    });

    // Function to get polygon shape based on zoom level
    const getPolygonShape = (zoomLevel: number) => {
      if (zoomLevel >= 16) {
        // High zoom: Detailed polygon
        return [
          new window.naver.maps.LatLng(126.851106, 37.522057),
          new window.naver.maps.LatLng(126.85249, 37.521061),
          new window.naver.maps.LatLng(126.854099, 37.517496),
          new window.naver.maps.LatLng(126.850548, 37.51656),
          new window.naver.maps.LatLng(126.849786, 37.51833),
          new window.naver.maps.LatLng(126.850634, 37.518747),
          new window.naver.maps.LatLng(126.850784, 37.519359),
          new window.naver.maps.LatLng(126.850494, 37.521521),
          new window.naver.maps.LatLng(126.851106, 37.522057),
        ];
      } else {
        // Low zoom: Simplified polygon
        return [
          new window.naver.maps.LatLng(37.5075, 126.8755),
          new window.naver.maps.LatLng(37.51, 126.879),
          new window.naver.maps.LatLng(37.513, 126.884),
          new window.naver.maps.LatLng(37.5075, 126.8755), // Closing the polygon
        ];
      }
    };

    // // Create initial polygon
    polygonRef.current = new window.naver.maps.Polygon({
      map,
      paths: getPolygonShape(map.getZoom()),
      fillColor: "rgba(255, 0, 0, 0.4)", // Semi-transparent red
      strokeColor: "#7adf3f",
      strokeWeight: 3,
    });

    // Event listener for zoom changes
    window.naver.maps.Event.addListener(map, "zoom_changed", () => {
      if (polygonRef.current) {
        const newShape = getPolygonShape(map.getZoom());
        polygonRef.current.setPaths(newShape); // Update polygon shape
        console.log("Zoom level changed:", map.getZoom());
      }
    });
    if (filteredData) {
      Object.entries(filteredData).forEach(([key, coords]) => {
        const pathArray = [];

        // Loop through each coordinate and push the corresponding LatLng object into pathArray
        coords.forEach((coord: any) => {
          pathArray.push(new window.naver.maps.LatLng(coord[0], coord[1]));
        });

        console.log(pathArray); // Log to check if pathArray is correct

        // Create the polygon with the pathArray
        new window.naver.maps.Polygon({
          map,
          paths: pathArray,
          fillColor: "rgba(0, 255, 0, 0.4)",
          strokeColor: "#00FF00",
          strokeWeight: 3,
        });
      });
      window.naver.maps.Event.addListener(map, "zoom_changed", () => {
        if (polygonRef.current) {
          const newShape = getPolygonShape(map.getZoom());
          polygonRef.current.setPaths(newShape);
          console.log("Zoom level changed:", map.getZoom());
        }
      });
    }
  }, [isLoaded, filteredData]);

  return <div ref={mapElement} style={{ width: "100vw", height: "100vh" }} />;
};

export default NaverMap;
