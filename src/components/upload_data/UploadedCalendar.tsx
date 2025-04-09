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
    if (!updatedDates) return;
    const updatedDateStrings = updatedDates
      .filter((date) => !dayjs(date).isSame(dayjs(), "day")) // 오늘 제외
      .map((date) => dayjs(date).format("YYYY-MM-DD"));

    return (currentDate: Dayjs) => {
      return updatedDateStrings.some((date) =>
        dayjs(date).isSame(dayjs(currentDate), "day")
      );
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
