import { DatePicker } from "antd";
import { RangePickerProps } from "antd/es/date-picker";
import { DateRange } from "../../../hooks/useRangeDurationDatePicker";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

interface DurationDatePickerProps {
  value: DateRange;
  onChange?: (dateRange: DateRange) => void;
  style?: React.CSSProperties;
}

/**
 * Start && End Date Picker
 */
const DurationDatePicker: React.FC<DurationDatePickerProps> = ({
  value,
  onChange,
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
      format={"YYYY-MM-DD"}
      value={[dayjs(value.startDate), dayjs(value.endDate)]}
      onChange={handleDateChange}
    />
  );
};

export default DurationDatePicker;
