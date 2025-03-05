import { VisitData, PatientData } from "../../utils/ExcelParser";

export interface MergedData {
    chartNumber: number;
    visitDate: string;
    totalCost: number;
    age: string;
    address: string;
}

export interface SummaryData {
    chartNumber: number;
    totalCost: number;
    address: string;
}

export const processData = (visits: VisitData[], patients: PatientData[]) => {
    const patientMap = new Map(patients.map((p) => [p.chartNumber, p]));

    // ✅ Generate df_merged
    const df_merged = visits.map((visit, index) => {
        const patient = patientMap.get(visit.chartNumber);
        const record = {
            chartNumber: visit.chartNumber,
            visitDate: visit.visitDate,
            totalCost: visit.totalCost,
            age: patient?.age || "N/D",
            address: patient?.address || "N/D",
        };

        console.log(`🔹 df_merged[${index}]`, record); // Log each inserted record
        return record;
    });

    // ✅ Generate df_summary
    const summaryMap = new Map<number, { totalCost: number; address: string }>();

    df_merged.forEach(({ chartNumber, totalCost, address }) => {
        if (address !== "N/D") {
            if (summaryMap.has(chartNumber)) {
                summaryMap.get(chartNumber)!.totalCost += totalCost;
            } else {
                summaryMap.set(chartNumber, { totalCost, address });
            }
        }
    });

    // Convert map to array
    const df_summary: SummaryData[] = Array.from(summaryMap, ([chartNumber, data]) => ({
        chartNumber,
        totalCost: data.totalCost,
        address: data.address,
    }));

    console.log("📊 Final df_summary:", df_summary);
    return { df_merged, df_summary };
};
