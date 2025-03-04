import { DatePicker } from "antd";

interface DurationDatePickerProps {
  startDate: string | null;
  endDate: string | null;
  handleDateChange?: () => void;
}

/**
 * Start && End Date Picker
 */
const DurationDatePicker = ({
  startDate,
  endDate,
  handleDateChange,
}: DurationDatePickerProps) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "3px",
      }}
    >
      <DatePicker defaultValue={startDate} onChange={handleDateChange} />
      -
      <DatePicker defaultValue={endDate} onChange={handleDateChange} />
    </div>
  );
};

export default DurationDatePicker;
