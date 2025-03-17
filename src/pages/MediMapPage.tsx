import React, { useEffect } from "react";
import StatisticsDrawer from "../components/medi_map/StatisticsDrawer";
import NaverMap from "../components/medi_map/NaverMap";
import mapStore from "../store/mapStore";
import { getRegionSums } from "../store/indexded_db/RegionDB";
import useRangeDurationDatePicker from "../hooks/useRangeDurationDatePicker";
import dayjs from "dayjs";

function MediMapPage() {
  const { setHighestCost, drawerDate, setDrawerDate } = mapStore();
  const { rangeDate, handleDateChange } = useRangeDurationDatePicker();
  useEffect(() => {
    setDrawerDate({
      startDate: dayjs().subtract(1, "year"),
      endDate: dayjs()
    });
  }, []);
  useEffect(() => {
    if (drawerDate) {
      handleDateChange(drawerDate);
    }
  }, [drawerDate]);

  return (
    <>
      <NaverMap />
      <StatisticsDrawer />
    </>
  );
}

export default MediMapPage;
