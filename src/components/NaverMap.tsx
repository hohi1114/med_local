import React, { useEffect, useRef, useState } from "react";

const NaverMap: React.FC = () => {
    const mapElement = useRef<HTMLDivElement | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const polygonRef = useRef<naver.maps.Polygon | null>(null); // Use ref instead of state

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
            center: new window.naver.maps.LatLng(37.5100, 126.8800), // Center near 신도림로 11라길
            zoom: 15,
        });

        // Function to get polygon shape based on zoom level
        const getPolygonShape = (zoomLevel: number) => {
            if (zoomLevel >= 16) {
                // High zoom: Detailed polygon
                return [
                    new window.naver.maps.LatLng(37.50712, 126.875308),
                    new window.naver.maps.LatLng(37.508516, 126.87578),
                    new window.naver.maps.LatLng(37.512944, 126.87975),
                    new window.naver.maps.LatLng(37.514851, 126.881745),
                    new window.naver.maps.LatLng(37.512382, 126.886336),
                    new window.naver.maps.LatLng(37.505656, 126.876789),
                    new window.naver.maps.LatLng(37.50712, 126.875308), // Closing the polygon
                ];
            } else {
                // Low zoom: Simplified polygon
                return [
                    new window.naver.maps.LatLng(37.5075, 126.8755),
                    new window.naver.maps.LatLng(37.5100, 126.8790),
                    new window.naver.maps.LatLng(37.5130, 126.8840),
                    new window.naver.maps.LatLng(37.5075, 126.8755), // Closing the polygon
                ];
            }
        };

        // Create initial polygon
        polygonRef.current = new window.naver.maps.Polygon({
            map,
            paths: getPolygonShape(map.getZoom()),
            fillColor: "rgba(255, 0, 0, 0.4)", // Semi-transparent red
            strokeColor: "#FF0000",
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

    }, [isLoaded]);

    return <div ref={mapElement} style={{ width: "100vw", height: "100vh" }} />;
};

export default NaverMap;
