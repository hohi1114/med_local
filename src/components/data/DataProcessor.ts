import dayjs from "dayjs";
import { VisitData, PatientData } from "../../utils/ExcelParser";
import { getLatLonNaver } from "../../utils/NaverGeocode";
import { MergedData, FilteredData, UpdatedDates } from "../../types/medi-types";

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
      visitType: undefined
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

  // ✅ Calculate 초진 (first visit) or 재진 (follow-up) for each patient using chartNumber
  const groupedByChartNumber = df_merged.reduce((acc, record) => {
    if (!acc[record.chartNumber]) {
      acc[record.chartNumber] = [];
    }
    acc[record.chartNumber].push(record);
    return acc;
  }, {} as Record<string, typeof df_merged[number][]>);

  // For each group, sort by visitDate and assign visitType:
  // The earliest visit becomes "초진" and the rest "재진".
  for (const chartNumber in groupedByChartNumber) {
    groupedByChartNumber[chartNumber].sort(
        (a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
    );
    groupedByChartNumber[chartNumber].forEach((record, index) => {
      record.visitType = index === 0 ? "초진" : "재진";
    });
  }
  // Flatten the groups back into df_merged
  df_merged = Object.values(groupedByChartNumber).flat();


  // ✅ Filter dataset to only include valid addresses (df_filtered)
  let df_filtered: FilteredData[] = df_merged
    .filter((record) => record.address !== "N/D")
    .map((record) => ({
      ...record,
      latitude: null, // Initialize before updating
      longitude: null
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

  let df_date: UpdatedDates[] = df_filtered.map((record) => ({
    date: dayjs(record.visitDate).format("YYYY-MM-DD")
  }));

  console.log("📊 Final df_filtered:", df_filtered);
  return { df_merged, df_filtered, df_date };
};
