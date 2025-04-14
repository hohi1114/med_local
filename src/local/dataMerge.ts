// Types
interface VisitData {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  visitType?: string;
}

interface PatientData {
  chartNumber: number;
  age: number | null;
  address: string;
}

interface PatientDataDentWeb {
  chartNumber: number;
  age: number | null;
  address: string;
}

interface DailyIncomeEgis {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
}

interface PatientListEgis {
  chartNumber: number;
  age: number | null;
  address: string;
}

interface MergedData {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  age: number | null;
  address: string;
}

// For Euisarang data
export function mergeDataEuisarang(
  visits: VisitData[],
  patients: PatientData[]
): MergedData[] {
  // Create merged data from visits
  const df_merged = visits.map((visit) => ({
    chartNumber: visit.chartNumber,
    visitDate: visit.visitDate,
    totalCost: visit.totalCost,
    age: null as number | null, // Will be filled in later
    address: "N/D", // Will be filled in later
  }));

  // Create patient map for quick lookup
  const patientMap = new Map<number, PatientData>(
    patients.map((p) => [p.chartNumber, p])
  );

  // Ensure visitDate is a Date object and standardize to ISO string
  df_merged.forEach((record) => {
    record.visitDate = new Date(record.visitDate); // ✅ Ensure it's a Date object
  });

  // Fill in patient data
  df_merged.forEach((record) => {
    const patient = patientMap.get(record.chartNumber);
    record.age = patient?.age || null;
    record.address = patient?.address || "N/D";
  });

  return df_merged;
}

// For DentWeb data
export function mergeDataDentWeb(
  visits: VisitData[],
  patients: PatientDataDentWeb[]
): MergedData[] {
  // Create merged data from visits
  const df_merged = visits.map((visit) => ({
    chartNumber: visit.chartNumber,
    visitDate: visit.visitDate,
    totalCost: visit.totalCost,
    age: null as number | null, // Will be filled in later
    address: "N/D", // Will be filled in later
  }));

  // Create patient map for quick lookup
  const patientMap = new Map<number, PatientDataDentWeb>(
    patients.map((p) => [p.chartNumber, p])
  );

  df_merged.forEach((record) => {
    record.visitDate = new Date(record.visitDate); // ✅ Ensure it's a Date object
  });

  // Fill in patient data
  df_merged.forEach((record) => {
    const patient = patientMap.get(record.chartNumber);
    record.age = patient?.age || null;
    record.address = patient?.address || "N/D";
  });

  return df_merged;
}

// For Egis data
export function mergeDataEgis(
  dailyIncome: DailyIncomeEgis[],
  patientList: PatientListEgis[]
): MergedData[] {
  // Build "visits" array from dailyIncome
  const visits: VisitData[] = dailyIncome.map((inc) => ({
    chartNumber: inc.chartNumber,
    visitDate: inc.visitDate,
    totalCost: inc.totalCost,
  }));

  // Create merged data from visits
  const df_merged = visits.map((visit) => ({
    chartNumber: visit.chartNumber,
    visitDate: visit.visitDate,
    totalCost: visit.totalCost,
    age: null as number | null, // Will be filled in later
    address: "N/D", // Will be filled in later
  }));

  // Build a Map<chartNumber, PatientData> from patientList
  const patientMap = new Map<number, { age: number | null; address: string }>();

  // Fill age and address from patientList
  for (const pat of patientList) {
    patientMap.set(pat.chartNumber, {
      age: pat?.age || null,
      address: pat.address,
    });
  }

  df_merged.forEach((record) => {
    record.visitDate = new Date(record.visitDate); // ✅ Ensure it's a Date object
  });

  // Fill patient data into df_merged
  df_merged.forEach((record) => {
    const pat = patientMap.get(record.chartNumber);
    record.age = pat?.age || 0;
    record.address = pat?.address || "N/D";
  });

  return df_merged;
}
