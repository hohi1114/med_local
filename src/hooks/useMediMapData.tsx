import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const useMediMapData = () => {
  const [locations, setLocations] = useState(null);

  const downloadExcelAsArrayBuffer = async (excelUrl: string) => {
    try {
      const response = await fetch(excelUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to download Excel file. Status: ${response.status}`
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      return arrayBuffer;
    } catch (error) {
      console.error("Error downloading Excel file:", error);
      throw error;
    }
  };

  const convertExcelToJson = async (excelUrl: string) => {
    try {
      const arrayBuffer = await downloadExcelAsArrayBuffer(excelUrl);
      const data = new Uint8Array(arrayBuffer);
      const jsonData = XLSX.read(data, { type: "array" });
      setLocations(jsonData.Sheets["Sheet1"]);
    } catch (error) {
      console.error("Error converting Excel to JSON:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await convertExcelToJson("365_right.xlsx");
      } catch (error) {
        console.error("Error in fetching data:", error);
      }
    };

    fetchData();
  }, []);
  return { locations, downloadExcelAsArrayBuffer };
};

export default useMediMapData;
