import { useEffect, useState } from "react";
import { Polygon } from "../types/naver-maps";

// Define the expected shape of the data
export interface Area {
  areaName: string;
  coords: [number, number][][]; // Array of polygons, each containing multiple [lng, lat] coordinates
}

const useMediMapData = (jsonFilePath: string): { areas: Area[] } => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Track if the component is mounted to prevent setting state after unmount
    let isMounted = true;
    // Prevent duplicate fetches
    if (isLoading) return;

    const fetchData = async () => {
      if (!jsonFilePath) {
        console.error("No file path provided");
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(jsonFilePath);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const jsonData = await response.json();

        if (!isMounted) return;

        const parsedAreas: Area[] = jsonData.map((entry: any) => {
          const { area, polygon } = entry;
          let coords: [number, number][][] = [];

          if (typeof polygon !== "string") {
            console.error(`Invalid polygon format for: ${area}`);
            return { areaName: area, coords };
          }

          let fixedPolygon = polygon.trim();

          // Fix missing closing brackets
          while (
            (fixedPolygon.match(/\[/g) || []).length >
            (fixedPolygon.match(/\]/g) || []).length
          ) {
            fixedPolygon += "]";
          }

          // Fix missing commas between numbers
          fixedPolygon = fixedPolygon.replace(/(\d)\s+(\d)/g, "$1,$2");

          try {
            let parsedCoords = JSON.parse(fixedPolygon);

            // Ensure proper structure (array of polygons)
            if (Array.isArray(parsedCoords) && parsedCoords.length > 0) {
              coords = parsedCoords.flatMap(
                (polygon: any, polygonIndex: number) => {
                  if (!Array.isArray(polygon)) {
                    return [];
                  }

                  return polygon.map((ring: any, ringIndex: number) => {
                    if (!Array.isArray(ring[0])) {
                      // If ring contains numbers instead of arrays, fix structure
                      const fixedRing = [];
                      for (let i = 0; i < ring.length; i += 2) {
                        if (ring[i + 1] !== undefined) {
                          fixedRing.push([
                            Number(ring[i]),
                            Number(ring[i + 1])
                          ]);
                        }
                      }
                      return fixedRing;
                    }

                    return ring
                      .map((point: any, pointIndex: number) => {
                        if (Array.isArray(point) && point.length === 2) {
                          return [Number(point[0]), Number(point[1])];
                        } else {
                          return null;
                        }
                      })
                      .filter(Boolean);
                  });
                }
              );
            }
          } catch (error) {
            console.error(`JSON parse error for: ${area}`);
            console.error("Raw string before fix:", polygon);
            console.error("Fixed string:", fixedPolygon);
          }

          return { areaName: area, coords };
        });

        // Only set state once after all processing is complete
        if (isMounted) {
          setAreas(parsedAreas);
          // Add a single console log here if needed for debugging
          console.log(`Loaded ${parsedAreas.length} areas`);
        }
      } catch (error) {
        console.error("Error loading JSON data:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function to prevent setting state after unmount
    return () => {
      isMounted = false;
    };
  }, [jsonFilePath]); // Only depend on jsonFilePath

  // Move console.log outside useEffect to avoid triggering re-renders
  // Only log when needed, and consider using React DevTools instead

  return { areas };
};

export default useMediMapData;
