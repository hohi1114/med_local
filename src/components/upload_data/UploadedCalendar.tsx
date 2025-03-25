import { useEffect, useMemo } from "react";
import { Calendar } from "antd";
import dayjs, { Dayjs } from "dayjs";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { getUploadedDates } from "../../utils/api/apis";

interface UploadedCalendarProps {
  progress: number;
}

const UploadedCalendar = ({ progress }: UploadedCalendarProps) => {
  const { data: updateDates, refetch: uploadedDataRefetch } = useQuery<Dayjs[]>(
    {
      queryKey: ["getUpdatedDates"],
      queryFn: () => getUploadedDates(),
      retry: false,
      enabled: false
    }
  );

  useEffect(() => {
    if (progress === 0) {
      uploadedDataRefetch();
    }
  }, [progress]);

  /** Find updated dates for disabled */
  const isDisabledDate = useMemo(() => {
    if (!updateDates) return;
    return (currentDate: Dayjs) => {
      return updateDates.some((date) =>
        dayjs(date).isSame(dayjs(currentDate), "day")
      );
    };
  }, [updateDates]);

  return (
    <UploadedCalendarContainer>
      <Calendar fullscreen={false} showWeek disabledDate={isDisabledDate} />
      <span style={{ textAlign: "right", color: "#52555A", marginTop: "8px" }}>
        * 회색구역은 이미 업로드한 날짜를 나타냅니다.
      </span>
    </UploadedCalendarContainer>
  );
};

const UploadedCalendarContainer = styled.div`
  width: 50vh;
  display: flex;
  flex-direction: column;
`;

export default UploadedCalendar;
