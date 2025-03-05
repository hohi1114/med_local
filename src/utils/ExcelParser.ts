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
}

export const parseDaysFiles = async (files: FileList): Promise<VisitData[]> => {
    let data: VisitData[] = [];

    for (const file of Array.from(files)) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any>(sheet, { header: 1, range: 3 });

        jsonData.forEach((row) => {
            if (row.length >= 4) {
                data.push({
                    chartNumber: Number(row[0]),
                    visitDate: row[2],
                    totalCost: Number(row[3]),
                });
            }
        });
    }
    return data.filter((item) => !isNaN(item.chartNumber) && item.visitDate !== "내원/수납일");
};

export const parsePlaceFiles = async (files: FileList): Promise<PatientData[]> => {
    let data: PatientData[] = [];

    for (const file of Array.from(files)) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any>(sheet, { header: 1, range: 3 });

        jsonData.forEach((row) => {
            if (row.length >= 9) {
                data.push({
                    chartNumber: Number(row[1]),
                    age: row[4] || "N/D",
                    address: row[8] || "N/D",
                });
            }
        });
    }
    return data.filter((item) => !isNaN(item.chartNumber));
};
