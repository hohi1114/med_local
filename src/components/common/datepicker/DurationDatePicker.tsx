import { DatePicker } from "antd";
import { RangePickerProps } from "antd/es/date-picker";
import { DateRange } from "../../../hooks/useRangeDurationDatePicker";
import dayjs from "dayjs";
import userStore from "../../../store/userStore";

const { RangePicker } = DatePicker;

interface DurationDatePickerProps {
  value: DateRange;
  onChange?: (dateRange: DateRange) => void;
  style?: React.CSSProperties;
  disabled?: (currentDate: dayjs.Dayjs) => boolean;
}

/**
 * Start && End Date Picker
 */
const DurationDatePicker: React.FC<DurationDatePickerProps> = ({
  value,
  onChange,
  disabled,
  ...props
}: DurationDatePickerProps) => {
  const { isFreetrialUser } = userStore();
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

  const disabledDateForFreetrial: RangePickerProps["disabledDate"] = (
    current
  ) => {
    const today = dayjs().startOf("day");
    const oneMonthAgo = today.subtract(1, "month");

    return current.isBefore(oneMonthAgo, "day");
  };

  return (
    <RangePicker
      style={{ zIndex: 100 }}
      {...props}
      disabledDate={isFreetrialUser ? disabledDateForFreetrial : undefined}
      format={"YYYY-MM-DD"}
      value={[dayjs(value.startDate), dayjs(value.endDate)]}
      onChange={handleDateChange}
    />
  );
};

export default DurationDatePicker;
