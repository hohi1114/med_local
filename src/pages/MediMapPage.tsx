import { useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import StatisticsDrawer from "../components/medi_map/StatisticsDrawer";
import NaverMap from "../components/medi_map/NaverMap";
import mapStore from "../store/mapStore";
import useRangeDurationDatePicker from "../hooks/useRangeDurationDatePicker";

function MediMapPage() {
  const { drawerDate, setDrawerDate, handleIsDrawerOpen } = mapStore();
  const { rangeDate, handleDateChange } = useRangeDurationDatePicker();
  useEffect(() => {
    setDrawerDate({
      startDate: dayjs().subtract(1, "year"),
      endDate: dayjs()
    });
    return () => {
      handleIsDrawerOpen(false);
    };
  }, []);
  useEffect(() => {
    if (drawerDate) {
      handleDateChange(drawerDate);
    }
  }, [drawerDate]);

  const handleDateChangeFromMap = (dates: Dayjs[]) => {
    if (dates && dates.length === 2) {
      setDrawerDate({
        startDate: dayjs(dates[0]),
        endDate: dayjs(dates[1])
      });
    }
  };

  const handleTodayButton = () => {
    setDrawerDate({ startDate: dayjs(), endDate: dayjs() });
  };

  return (
    <>
      <NaverMap
        rangeDate={rangeDate}
        handleDateChange={handleDateChangeFromMap}
        handleTodayButton={handleTodayButton}
      />
      <StatisticsDrawer />
    </>
  );
}

export default MediMapPage;
