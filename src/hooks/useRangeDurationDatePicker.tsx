import { RangePickerProps } from "antd/es/date-picker";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";

const useRangeDurationDatePicker = () => {
  const [rangeDate, setRangeDate] = useState({
    startDate: dayjs(),
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
