import { VisitData, PatientData } from "../../utils/ExcelParser";

export interface MergedData {
    anonymousId: number;
    totalCost: number;
    address: string;
}

export const processData = (visits: VisitData[], patients: PatientData[]): MergedData[] => {
    const patientMap = new Map(patients.map((p) => [p.chartNumber, p]));

    // Merge Data
    const merged = visits.map((visit) => ({
        anonymousId: visit.chartNumber,
        totalCost: visit.totalCost,
        address: patientMap.get(visit.chartNumber)?.address || "N/D",
    }));

    // Aggregate Costs
    const summary = merged.reduce((acc, item) => {
        const found = acc.find((d) => d.anonymousId === item.anonymousId);
        if (found) {
            found.totalCost += item.totalCost;
        } else {
            acc.push({ ...item });
        }
        return acc;
    }, [] as MergedData[]);

    return summary;
};
