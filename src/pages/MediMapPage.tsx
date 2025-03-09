import { useEffect, useState } from "react";
import StatisticsDrawer from "../components/medi_map/StatisticsDrawer";
import NaverMap from "../components/medi_map/NaverMap";
import {
  getPatientsFromRegion,
  getRegionDBCount
} from "../store/indexded_db/RegionDB";

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
  const [regionDB, setRegionDB] = useState<PatientData[][]>([]);
  const [isOpenDrawer, setIsOpenDrawer] = useState<boolean>(false);

  const handleDrawerOpen = () => {
    setIsOpenDrawer(!isOpenDrawer);
  };

  useEffect(() => {
    // ✅ Fetch data from IndexedDB
    // const fetchPatientData = async () => {
    //   try {
    //     const db_count = await getRegionDBCount();
    //     const allData = [];
    //     for (let i = 1; i <= db_count; i++) {
    //       const region_db = await getPatientsFromRegion(i.toString());
    //       allData.push(region_db);
    //     }
    //     a;
    //     setRegionDB(allData);
    //   } catch (error) {
    //     console.error("Error fetching patient data from IndexedDB:", error);
    //   }
    // };
    // fetchPatientData();
  }, []);

  return (
    <>
      {/* <NaverMap region_db={regionDB} handleDrawerOpen={handleDrawerOpen} /> */}
      <StatisticsDrawer
        open={isOpenDrawer}
        handleDrawerOpen={handleDrawerOpen}
      />
    </>
  );
}

export default MediMapPage;
