import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";

export type RangeDate = { startDate: Dayjs; endDate: Dayjs };
const useRangeDurationDatePicker = () => {
  const [rangeDate, setRangeDate] = useState({
    startDate: dayjs().subtract(1, "month"),
    endDate: dayjs()
  });

  const handleDateChange = (data: { startDate: Dayjs; endDate: Dayjs }) => {
    setRangeDate({
      startDate: data.startDate,
      endDate: data.endDate
    });
  };

  return { rangeDate, handleDateChange };
};

export default useRangeDurationDatePicker;
