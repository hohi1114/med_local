import * as XLSX from "xlsx";

export interface VisitData {
    chartNumber: number;
    visitDate: string;
    totalCost: number;
}

export interface PatientData {
    chartNumber: number;
    age: string;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
}

/**
 * Converts an Excel serial date (e.g. 45329) to a "YYYY-MM-DD" string.
 * 엑셀 date 저장 오류 해결
 */
function excelSerialToDate(serial: number): string {
    const baseDate = new Date(1900, 0, 1); // Excel starts from Jan 1, 1900
    baseDate.setDate(baseDate.getDate() + serial - 2); // Adjust for Excel's leap year bug
    return baseDate.toISOString().split("T")[0]; // Format as "YYYY-MM-DD"
}

/**
 * Parses visit data from uploaded Excel files.
 */
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

        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, range: 3 }); // Skip first 3 rows

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


export const parsePlaceFiles = async (files: FileList): Promise<PatientData[]> => {
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

        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, range: 3 });

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
