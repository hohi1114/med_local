import StatisticsDrawer from "../components/medi_map/StatisticsDrawer";
import NaverMap from "../components/medi_map/NaverMap";
import { useEffect } from "react";
import { getAllMergedData } from "../store/indexded_db/IndexedDB";
import mapStore from "../store/mapStore";
import { getRegionSums } from "../store/indexded_db/RegionDB";

function MediMapPage() {
  const { setHighestCost } = mapStore();
  useEffect(() => {
    const fetchHighestCost = async () => {
      const newHightestCost: { [key: string]: number } = {};
      Promise.all(
        ["small", "dong", "gu"].map(async (region) => {
          const data = await getRegionSums(region);
          const sortedData = data.sort((a, b) => b.totalCost - a.totalCost);
          newHightestCost[region] = sortedData[0].totalCost;
        })
      );
      setHighestCost(newHightestCost);
    };
    fetchHighestCost();
  }, []);
  return (
    <>
      <NaverMap />
      <StatisticsDrawer />
    </>
  );
}

export default MediMapPage;
