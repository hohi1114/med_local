import { Calendar } from "antd";
import { Dayjs } from "dayjs";
import styled from "styled-components";

const UploadedCalendar = () => {
  const highlightedDates = [
    "2025-03-01",
    "2025-03-03",
    "2025-03-04",
    "2025-03-05",
    "2025-03-06",
  ];

  const isDisabledDate = (currentDate: Dayjs) => {
    const formattedDate = currentDate.format("YYYY-MM-DD");
    return highlightedDates.includes(formattedDate);
  };

  return (
    <UploadedCalendarContainer>
      <Calendar fullscreen={false} showWeek disabledDate={isDisabledDate} />
    </UploadedCalendarContainer>
  );
};

const UploadedCalendarContainer = styled.div`
  width: 50vh;
`;

export default UploadedCalendar;
