import { RangePickerProps } from "antd/es/date-picker";
import { useEffect, useState } from "react";
import useMediMapData from "./useMediMapData";
import { getRegionSums } from "../store/indexded_db/RegionDB";

const useRangeDurationDatePicker = () => {
  const [regionData, setRegionData] = useState();
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
