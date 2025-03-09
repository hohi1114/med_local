import { Calendar } from "antd";
import { Dayjs } from "dayjs";
import styled from "styled-components";
import { getDataFromIndexedDB } from "../../store/indexded_db/IndexedDB";
import { useEffect, useMemo, useState } from "react";
import { UpdatedDates } from "../../types/medi-types";

interface UploadedCalendarProps {
  updated: boolean;
}
const UploadedCalendar = ({ updated }: UploadedCalendarProps) => {
  const [dfDate, setDfDate] = useState<UpdatedDates[]>([]);

  const fetchData = async () => {
    const { df_date } = await getDataFromIndexedDB();
    if (df_date) setDfDate(df_date);
  };
  /**Fetch Data */
  useEffect(() => {
    fetchData();
  }, []);
  /**Fetch data after uploading */
  useEffect(() => {
    if (updated) {
      fetchData();
    }
  }, [updated]);

  /** Find updated dates for disabled */
  const isDisabledDate = useMemo(() => {
    return (currentDate: Dayjs) => {
      const formattedDate = currentDate.format("YYYY-MM-DD");
      return dfDate.some((item) => item.date === formattedDate);
    };
  }, [dfDate]);

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
