import dayjs from "dayjs";
import { useState } from "react";

export type DateRange = { startDate: string; endDate: string };
const useRangeDurationDatePicker = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD")
  });

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  return { dateRange, handleDateRangeChange };
};

export default useRangeDurationDatePicker;
