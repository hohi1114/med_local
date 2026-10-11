import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";

export type DateRange = { startDate: string; endDate: string };
const useRangeDurationDatePicker = (init?: DateRange) => {
  const [dateRange, setDateRange] = useState<DateRange>(
    init || {
      startDate: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
      endDate: dayjs().format("YYYY-MM-DD")
    }
  );
  const latestDateRangeRef = useRef(dateRange);

  useEffect(() => {
    latestDateRangeRef.current = dateRange;
  }, [dateRange]);

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  return { dateRange, handleDateRangeChange, latestDateRangeRef };
};

export default useRangeDurationDatePicker;
