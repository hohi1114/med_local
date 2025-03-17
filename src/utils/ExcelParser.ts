import * as XLSX from "xlsx";

/**
 * Converts an Excel serial date (e.g. 45329) to a "YYYY-MM-DD" string.
 * 엑셀 date 저장 오류 해결
 */

function excelSerialToDate(serial: number): string {
  // Input validation
  if (serial < 0) {
    throw new Error("Invalid Excel serial date: cannot be negative");
  }

  if (serial < 1) {
    throw new Error(
      "Invalid Excel serial date: cannot represent dates before 1900-01-01"
    );
  }

  // Adjust for Excel's leap year bug
  // Serial number 60 in Excel represents the non-existent Feb 29, 1900
  let adjustedSerial = serial;
  if (serial >= 60) {
    adjustedSerial = serial - 1;
  }

  // Calculate the date
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  // Excel dates start from December 30, 1899 (day 0 in Excel)
  const baseDate = new Date(Date.UTC(1899, 11, 30));
  const targetDate = new Date(
    baseDate.getTime() + adjustedSerial * millisecondsPerDay
  );

  // Format the date as YYYY-MM-DD using UTC to avoid timezone issues
  const year = targetDate.getUTCFullYear();
  const month = String(targetDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export const parseDaysFiles = async (files: FileList): Promise<VisitData[]> => {
  let data: VisitData[] = [];

  for (const file of Array.from(files)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    console.log("📌 Workbook Loaded:", workbook);

    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in the file:", file.name);
      continue; // Skip this file
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // First sheet
    console.log("✅ Worksheet Name:", workbook.SheetNames[0]);

    const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
      header: 1,
      range: 3,
    }); // Skip first 3 rows

    jsonData.forEach((row: any) => {
      if (row.length >= 4) {
        let visitDate = row[2];

        // ✅ Convert Excel serial date to string format
        if (typeof visitDate === "number") {
          visitDate = excelSerialToDate(visitDate);
        }

        data.push({
          chartNumber: Number(row[0]),
          visitDate: visitDate,
          totalCost: Number(row[3]),
        });
      }
    });
  }

  return data.filter(
    (item) => !isNaN(item.chartNumber) && item.visitDate !== "내원/수납일"
  );
};

export const parsePlaceFiles = async (
  files: FileList
): Promise<PatientData[]> => {
  let data: PatientData[] = [];

  for (const file of Array.from(files)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in the file:", file.name);
      continue; // Skip this file
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    console.log("✅ Worksheet Name:", workbook.SheetNames[0]);

    const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
      header: 1,
      range: 2,
    });

    jsonData.forEach((row: any) => {
      if (row.length >= 9) {
        data.push({
          chartNumber: Number(row[1]),
          age: row[4] || "N/D",
          address: row[8] || "N/D",
          latitude: null,
          longitude: null,
        });
      }
    });
  }
  return data.filter((item) => !isNaN(item.chartNumber));
};
