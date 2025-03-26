import { useEffect } from "react";
import dayjs from "dayjs";
import StatisticsDrawer from "../components/medi_map/StatisticsDrawer";
import NaverMap from "../components/medi_map/NaverMap";
import mapStore from "../store/mapStore";
import useRangeDurationDatePicker, {
  DateRange
} from "../hooks/useRangeDurationDatePicker";

function MediMapPage() {
  const { drawerDate, setDrawerDate, handleIsDrawerOpen } = mapStore();
  const { dateRange, handleDateRangeChange } = useRangeDurationDatePicker();
  useEffect(() => {
    setDrawerDate({
      startDate: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
      endDate: dayjs().format("YYYY-MM-DD")
    });
    return () => {
      handleIsDrawerOpen(false);
    };
  }, []);
  useEffect(() => {
    if (drawerDate) {
      handleDateRangeChange(drawerDate);
    }
  }, [drawerDate]);

  const handleDateChangeFromMap = (dates: DateRange) => {
    setDrawerDate(dates);
  };

  return (
    <>
      <NaverMap
        dateRange={dateRange}
        handleDateChange={handleDateChangeFromMap}
      />
      <StatisticsDrawer />
    </>
  );
}

export default MediMapPage;
