import { DatePicker } from "antd";
import { RangePickerProps } from "antd/es/date-picker";
import { DateRange } from "../../../hooks/useRangeDurationDatePicker";
import dayjs from "dayjs";
import { DatePickerProps } from "antd/lib";

const { RangePicker } = DatePicker;

interface DurationDatePickerProps {
  value: DateRange;
  onChange?: (dateRange: DateRange) => void;
  disabledDate?: DatePickerProps["disabledDate"];
  style?: React.CSSProperties;
}

/**
 * Start && End Date Picker
 */
const DurationDatePicker: React.FC<DurationDatePickerProps> = ({
  value,
  onChange,
  disabledDate,
  ...props
}: DurationDatePickerProps) => {
  const handleDateChange: RangePickerProps["onChange"] = (dates) => {
    if (dates && dates.length === 2) {
      const [startDate, endDate] = dates;

      const formattedRange = {
        startDate: startDate?.format("YYYY-MM-DD") || "",
        endDate: endDate?.format("YYYY-MM-DD") || ""
      };

      onChange?.(formattedRange);
    }
  };

  return (
    <RangePicker
      {...props}
      disabledDate={disabledDate}
      format={"YYYY-MM-DD"}
      value={[dayjs(value.startDate), dayjs(value.endDate)]}
      onChange={handleDateChange}
    />
  );
};

export default DurationDatePicker;
