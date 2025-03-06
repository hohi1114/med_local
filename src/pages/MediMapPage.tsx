import { useEffect, useState } from "react";
import StatisticsDrawer from "../components/medi_map/StatisticsDrawer";
import NaverMap from "../components/NaverMap";
import { getDataFromIndexedDB } from "../components/data/IndexedDB"; // ✅ Import IndexedDB function

interface PatientData {
  chartNumber: number;
  visitDate: string;
  totalCost: number;
  age: string;
  address: string;
  latitude: number;
  longitude: number;
}

function MediMapPage() {
  const [filtered_db, setFilteredDB] = useState<PatientData[]>([]);
  const [isOpenDrawer, setIsOpenDrawer] = useState<boolean>(false);

  const handleDrawerOpen = () => {
    setIsOpenDrawer(!isOpenDrawer);
  };

  useEffect(() => {
    // ✅ Fetch data from IndexedDB
    const fetchPatientData = async () => {
      try {
        const { df_filtered } = await getDataFromIndexedDB(); // ✅ Get filtered data

        // Ensure the data is in the correct format
        const formattedData = df_filtered.map((item: any) => ({
          chartNumber: item.chartNumber || 0,
          visitDate: item.visitDate || "",
          totalCost: item.totalCost || 0,
          age: item.age || "",
          address: item.address || "",
          latitude: item.latitude ? Number(item.latitude) : 0,
          longitude: item.longitude ? Number(item.longitude) : 0,
        }));

        setFilteredDB(formattedData); // ✅ Save to state
      } catch (error) {
        console.error("Error fetching patient data from IndexedDB:", error);
      }
    };

    fetchPatientData();
  }, []);

  return (
    <>
      <NaverMap filtered_db={filtered_db} handleDrawerOpen={handleDrawerOpen} />
      {/* ✅ Pass IndexedDB data to NaverMap */}
      <StatisticsDrawer
        open={isOpenDrawer}
        handleDrawerOpen={handleDrawerOpen}
      />
    </>
  );
}

export default MediMapPage;
