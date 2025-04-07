import styled from "styled-components";

import useRangeDurationDatePicker from "../hooks/useRangeDurationDatePicker";
import DurationDatePicker from "../components/common/datepicker/DurationDatePicker";
import NaverMap2 from "../components/common/NaverMap2";
import RevenueCompareDrawer from "../components/compare_revenue/RevenueCompareDrawer";
import { useEffect } from "react";
import mapStore from "../store/mapStore";
import dayjs from "dayjs";

function CompareAvenuePage() {
  const { setDrawerDate1, setDrawerDate2, handleIsDrawerOpen } = mapStore();

  //날짜선택 1
  const {
    dateRange: dateRange1,
    handleDateRangeChange: handleDateRangeChange1
  } = useRangeDurationDatePicker();

  //날짜선택 2
  const {
    dateRange: dateRange2,
    handleDateRangeChange: handleDateRangeChange2
  } = useRangeDurationDatePicker();

  useEffect(() => {
    const start1 = dayjs().subtract(2, "month").format("YYYY-MM-DD");
    const end1 = dayjs().subtract(1, "month").format("YYYY-MM-DD");

    const start2 = dayjs().subtract(1, "month").format("YYYY-MM-DD");
    const end2 = dayjs().format("YYYY-MM-DD");

    handleDateRangeChange1({ startDate: start1, endDate: end1 });
    handleDateRangeChange2({ startDate: start2, endDate: end2 });

    return () => {
      handleIsDrawerOpen(false);
    };
  }, []);

  useEffect(() => {
    if (dateRange1) setDrawerDate1(dateRange1);
  }, [dateRange1]);

  useEffect(() => {
    if (dateRange2) setDrawerDate2(dateRange2);
  }, [dateRange2]);

  return (
    <>
      <NaverMap2>
        <Wrapper>
          <DatePickerContainer>
            <DateTitle>기간 1</DateTitle>
            <DurationDatePicker
              style={{ width: "100%" }}
              value={dateRange1}
              onChange={handleDateRangeChange1}
            />
            <DateTitle>기간 2</DateTitle>
            <DurationDatePicker
              style={{ width: "100%" }}
              value={dateRange2}
              onChange={handleDateRangeChange2}
            />

            <SubText>* 두 기간의 대한 매출 데이터를 비교합니다.</SubText>
          </DatePickerContainer>
        </Wrapper>
      </NaverMap2>
      <RevenueCompareDrawer />
    </>
  );
}

export default CompareAvenuePage;

const Wrapper = styled.div`
  position: absolute;
  top: 1rem;
  left: 4rem;
  z-index: 90;
  background-color: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;

const DatePickerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

const DateTitle = styled.span`
  font-size: 1.1rem;
  font-weight: bold;
  color: ${(props) => props.theme.colors.black};
`;

const SubText = styled.span`
  font-size: 1rem;
  color: ${(props) => props.theme.colors.gray05};
`;
