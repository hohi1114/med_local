import { RangePickerProps } from "antd/es/date-picker";
import { useState } from "react";

const useRangeDurationDatePicker = () => {
  const [rangeDate, setRangeDate] = useState({
    startDate: new Date(),
    endDate: new Date()
  });

  const handleDateChange: RangePickerProps["onChange"] = (dates, _) => {
    if (dates && dates[0] && dates[1]) {
      setRangeDate({
        startDate: dates[0].toDate(),
        endDate: dates[1].toDate()
      });
    }
  };

  return { rangeDate, handleDateChange };
};

export default useRangeDurationDatePicker;
