import { useEffect, useMemo } from "react";
import { Calendar } from "antd";
import dayjs, { Dayjs } from "dayjs";
import styled from "styled-components";

import useUpdateUserInfo from "../../hooks/useUpdateUserInfo";
import userStore from "../../store/userStore";

interface UploadedCalendarProps {
  progress: number;
}

const UploadedCalendar = ({ progress }: UploadedCalendarProps) => {
  const { fetchUploadedDates } = useUpdateUserInfo();
  const { updatedDates } = userStore();

  useEffect(() => {
    if (progress === 0) {
      fetchUploadedDates();
    }
  }, [progress]);

  /** Find updated dates for disabled */
  const isDisabledDate = useMemo(() => {
    if (!updatedDates) return () => false;

    const updatedDateStrings = updatedDates
      .slice(0, -1)
      .map((date) => dayjs(date).format("YYYY-MM-DD"));

    return (currentDate: Dayjs) => {
      const currStr = currentDate.format("YYYY-MM-DD");
      return updatedDateStrings.includes(currStr);
    };
  }, [updatedDates]);
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
