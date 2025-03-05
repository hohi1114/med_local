import { VisitData, PatientData } from "../../utils/ExcelParser";
import { getLatLonNaver } from "../../utils/NaverGeocode";

export interface MergedData {
    chartNumber: number;
    visitDate: string;
    totalCost: number;
    age: string;
    address: string;
}

export interface FilteredData {
    chartNumber: number;
    visitDate: string;
    totalCost: number;
    age: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
}

export const processData = async (
    visits: VisitData[],
    patients: PatientData[],
    existingMergedData: MergedData[], // 🆕 Pass existing data from IndexedDB
    updateProgress: (progress: number) => void
) => {
    const patientMap = new Map(patients.map((p) => [p.chartNumber, p]));

    // ✅ Generate df_merged (All patients, including "N/D" addresses)
    let df_merged = visits.map((visit) => {
        const patient = patientMap.get(visit.chartNumber);
        return {
            chartNumber: visit.chartNumber,
            visitDate: visit.visitDate,
            totalCost: visit.totalCost,
            age: patient?.age || "N/D",
            address: patient?.address || "N/D",
        };
    });

    // ✅ Remove duplicates (Keep only new records)
    df_merged = df_merged.filter(
        (record) =>
            !existingMergedData.some(
                (existing) =>
                    existing.chartNumber === record.chartNumber &&
                    existing.visitDate === record.visitDate &&
                    existing.totalCost === record.totalCost
            )
    );

    console.log(`📌 Removed duplicates. Remaining records: ${df_merged.length}`);

    // ✅ Filter dataset to only include valid addresses (df_filtered)
    let df_filtered: FilteredData[] = df_merged
        .filter((record) => record.address !== "N/D")
        .map((record) => ({
            ...record,
            latitude: null, // Initialize before updating
            longitude: null,
        }));

    // ✅ Fetch latitude & longitude for each valid address
    for (let i = 0; i < df_filtered.length; i++) {
        const { latitude, longitude } = await getLatLonNaver(
            df_filtered[i].address,
            updateProgress,
            i,
            df_filtered.length
        );
        df_filtered[i].latitude = latitude;
        df_filtered[i].longitude = longitude;
        console.log(i + " step done");
    }

    console.log("📊 Final df_filtered:", df_filtered);
    return { df_merged, df_filtered };
};
