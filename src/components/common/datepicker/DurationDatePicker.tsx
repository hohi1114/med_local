import { DatePicker } from "antd";
import { RangePickerProps } from "antd/es/date-picker";
import { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

interface DurationDatePickerProps {
  rangeDate: { startDate: Dayjs; endDate: Dayjs };
  handleDateChange?: RangePickerProps["onChange"];
}
/**
 * Start && End Date Picker
 */
const DurationDatePicker = ({
  rangeDate,
  handleDateChange
}: DurationDatePickerProps) => {
  return (
    <RangePicker
      format={"YYYY-MM-DD"}
      value={[rangeDate.startDate, rangeDate.endDate]}
      onChange={handleDateChange}
    />
  );
};

export default DurationDatePicker;
