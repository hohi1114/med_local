import { useState } from "react";
import StatisticsDrawer from "../components/medi_map/StatisticsDrawer";
import NaverMap from "../components/medi_map/NaverMap";

function MediMapPage() {
  const [isOpenDrawer, setIsOpenDrawer] = useState<boolean>(false);

  const handleDrawerOpen = () => {
    setIsOpenDrawer(!isOpenDrawer);
  };

  return (
    <>
      <NaverMap handleDrawerOpen={handleDrawerOpen} />
      <StatisticsDrawer
        open={isOpenDrawer}
        handleDrawerOpen={handleDrawerOpen}
      />
    </>
  );
}

export default MediMapPage;
