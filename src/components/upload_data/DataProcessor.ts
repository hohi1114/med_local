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

  // Create the Map for deduplication
  const visitMap = new Map(
    visits.map((visit) => [
      `${visit.chartNumber}-${visit.visitDate}-${Number(visit.totalCost)}`,
      visit
    ])
  );

  // Convert to array of values for further processing
  const uniqueVisits = Array.from(visitMap.values());

  // ✅ Generate df_merged (All patients, including "N/D" addresses)
  let df_merged = uniqueVisits.map((visit) => {
    const patient = patientMap.get(visit.chartNumber);
    return {
      chartNumber: visit.chartNumber,
      visitDate: visit.visitDate,
      totalCost: visit.totalCost,
      age: patient?.age || "N/D",
      address: patient?.address || "N/D",
      visitType: ""
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

  // Function to determine if two dates are more than a month apart
  // Create a map to track the last visit date for each patient
  const lastVisitMap = new Map<number, string>();

  // First add existing records to the lastVisitMap if there are any
  if (existingMergedData.length > 0) {
    // Sort existing data by chart number and visit date for accurate "last visit" tracking
    const sortedExistingData = [...existingMergedData].sort((a, b) => {
      if (a.chartNumber === b.chartNumber) {
        return (
          new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
        );
      }
      return a.chartNumber - b.chartNumber;
    });

    // Process all existing records to build lastVisitMap with most recent visit dates
    for (const record of sortedExistingData) {
      lastVisitMap.set(record.chartNumber, record.visitDate);
    }
  }

  // Sort new records by date for processing in chronological order
  df_merged.sort(
    (a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
  );

  // Process each new record
  for (const record of df_merged) {
    // Check if we've seen this patient before (either in existing data or in previously processed new records)

    if (!lastVisitMap.has(record.chartNumber)) {
      // Case 1: First time seeing this chart number
      record.visitType = "신환";
    } else {
      const lastVisitDate = lastVisitMap.get(record.chartNumber)!;

      if (isMoreThanOneMonthApart(lastVisitDate, record.visitDate)) {
        // Case 3: Patient visited before but more than 1 month since last visit
        record.visitType = "초진";
      } else {
        // Case 2: Patient visited before and within 1 month
        record.visitType = "재진";
      }
    }

    // Update the last visit map with this record's date
    lastVisitMap.set(record.chartNumber, record.visitDate);
  }

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
  }

  let df_date: UpdatedDates[] = Array.from(
    new Set(
      df_merged.map((record) => dayjs(record.visitDate).format("YYYY-MM-DD"))
    )
  ).map((date) => ({ date }));

  return { df_merged, df_filtered, df_date };
};

const isMoreThanOneMonthApart = (date1: string, date2: string): boolean => {
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);

  // Get the difference in months
  const months =
    (secondDate.getFullYear() - firstDate.getFullYear()) * 12 +
    (secondDate.getMonth() - firstDate.getMonth());

  // If exactly one month difference, check days
  if (months === 1) {
    return secondDate.getDate() > firstDate.getDate();
  }

  // More than one month apart if months difference > 1
  return months > 1;
};
