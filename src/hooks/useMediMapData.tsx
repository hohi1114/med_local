import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

// Define the expected shape of the data
interface Area {
  areaName: string;
  coords: [number, number][]; // Array of [lng, lat] coordinates
}

const useMediMapData = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  console.log(fileName);

  useEffect(() => {
    if (!fileName) return;
    const fetchData = async () => {
      try {
        const response = await fetch(fileName);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        if (!workbook.SheetNames.length) {
          throw new Error("No sheets found in the workbook.");
        }

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

        const parsedAreas: Area[] = rows.map((row) => {
          const [areaName, coordsStringRaw] = row;
          let coords: [number, number][] = [];

          if (typeof coordsStringRaw !== "string") {
            console.error(`Invalid JSON string for: ${areaName}`);
            return { areaName, coords };
          }

          let coordsString = coordsStringRaw.trim();

          // Fix missing closing brackets
          while (
            (coordsString.match(/\[/g) || []).length >
            (coordsString.match(/\]/g) || []).length
          ) {
            coordsString += "]";
          }

          // Fix missing commas
          coordsString = coordsString.replace(/(\d)\s+(\d)/g, "$1,$2");
          try {
            let parsedCoords = JSON.parse(coordsString);

            // **Unwrap extra array if necessary**
            if (
              Array.isArray(parsedCoords) &&
              parsedCoords.length === 1 &&
              Array.isArray(parsedCoords[0])
            ) {
              parsedCoords = parsedCoords[0]; // ✅ Fix the structure
            }

            // **Fix coordinate format**
            coords = parsedCoords
              .map((point: any) => {
                if (Array.isArray(point) && point.length === 2) {
                  return [Number(point[0]), Number(point[1])]; // ✅ Convert to numbers
                } else if (
                  typeof point === "object" &&
                  "x" in point &&
                  "y" in point
                ) {
                  return [Number(point.x), Number(point.y)];
                } else {
                  console.warn("⚠️ Unexpected coordinate format:", point);
                  return null;
                }
              })
              .filter(Boolean);
          } catch (error) {
            console.error(`❌ JSON parse error for: ${areaName}`);
            console.error("❌ Raw string before fix:", coordsStringRaw);
            console.error("❌ Fixed string:", coordsString);
          }

          return { areaName, coords };
        });

        setAreas(parsedAreas);
      } catch (error) {
        console.error("Error loading Excel data:", error);
      }
    };

    fetchData();
  }, [fileName]);

  return { areas, setFileName };
};

export default useMediMapData;
