import styled from "styled-components";
import { useEffect } from "react";
import dayjs from "dayjs";
import useRangeDurationDatePicker from "../hooks/useRangeDurationDatePicker";
import DurationDatePicker from "../components/common/datepicker/DurationDatePicker";
import RevenueCompareDrawer from "../components/compare_revenue/RevenueCompareDrawer";
import mapStore from "../store/mapStore";
import { useNaverMapCore } from "../hooks/useNaverMapCore";
import Loading from "../components/common/Loading";
import userStore from "../store/userStore";
import RequireSubscribe from "../components/common/RequireSubscribe";

function CompareAvenuePage() {
  const { isInActiveUser, lastedUpdatedDate } = userStore();
  const { loading, setDrawerDate1, setDrawerDate2, handleIsDrawerOpen } =
    mapStore();
  const { mapElement, isFetching } = useNaverMapCore({ isComparison: true });

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
    return () => {
      handleIsDrawerOpen(false);
    };
  }, []);

  useEffect(() => {
    if (lastedUpdatedDate && lastedUpdatedDate.length > 0) {
      const start1 = lastedUpdatedDate
        ? dayjs(lastedUpdatedDate).subtract(30, "day").format("YYYY-MM-DD")
        : dayjs().subtract(30, "day").format("YYYY-MM-DD");
      const end1 = lastedUpdatedDate
        ? dayjs(lastedUpdatedDate).subtract(15, "day").format("YYYY-MM-DD")
        : dayjs().subtract(15, "day").format("YYYY-MM-DD");

      const start2 = lastedUpdatedDate
        ? dayjs(lastedUpdatedDate).subtract(14, "day").format("YYYY-MM-DD")
        : dayjs().subtract(14, "day").format("YYYY-MM-DD");
      const end2 = lastedUpdatedDate
        ? dayjs(lastedUpdatedDate).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD");

      handleDateRangeChange1({ startDate: start1, endDate: end1 });
      handleDateRangeChange2({ startDate: start2, endDate: end2 });
    }
  }, [lastedUpdatedDate]);

  useEffect(() => {
    if (dateRange1) setDrawerDate1(dateRange1);
  }, [dateRange1]);

  useEffect(() => {
    if (dateRange2) setDrawerDate2(dateRange2);
  }, [dateRange2]);

  return (
    <>
      {isInActiveUser && <RequireSubscribe />}
      {(isFetching || loading) && <Loading />}
      <MapContainer ref={mapElement}>
        <Wrapper>
          <DatePickerContainer>
            <DateTitle>기준 기간</DateTitle>
            <DurationDatePicker
              value={dateRange1}
              onChange={handleDateRangeChange1}
            />

            <DateTitle>비교 기간</DateTitle>
            <DurationDatePicker
              value={dateRange2}
              onChange={handleDateRangeChange2}
            />

            <SubText>* 두 기간의 대한 매출 데이터를 비교합니다.</SubText>
          </DatePickerContainer>
        </Wrapper>
      </MapContainer>
      <RevenueCompareDrawer />
    </>
  );
}

export default CompareAvenuePage;

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

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
  gap: 1rem;
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
