import { DatePicker } from "antd";
import { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

interface DurationDatePickerProps {
  rangeDate: { startDate: Date; endDate: Date };
  handleDateChange?: RangePickerProps["onChange"];
}
/**
 * Start && End Date Picker
 */
const DurationDatePicker = ({
  rangeDate,
  handleDateChange,
}: DurationDatePickerProps) => {
  return (
    <RangePicker
      format={"YYYY-MM-DD"}
      defaultValue={[dayjs(rangeDate.startDate), dayjs(rangeDate.endDate)]}
      onChange={handleDateChange}
    />
  );
};

export default DurationDatePicker;
