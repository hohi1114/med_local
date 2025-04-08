import { useEffect } from "react";
import dayjs from "dayjs";
import StatisticsDrawer from "../components/medi_map/StatisticsDrawer";
import mapStore from "../store/mapStore";
import useRangeDurationDatePicker from "../hooks/useRangeDurationDatePicker";
import RequireSubscribe from "../components/common/RequireSubscribe";
import userStore from "../store/userStore";
import { useNaverMapCore } from "../hooks/useNaverMapCore";
import styled from "styled-components";
import Loading from "../components/common/Loading";
import DurationDatePicker from "../components/common/datepicker/DurationDatePicker";

function MapByRegionPage() {
  const { mapElement, isFetching } = useNaverMapCore();
  const { isInActiveUser } = userStore();
  const { loading, setDrawerDate, handleIsDrawerOpen } = mapStore();
  const { dateRange, handleDateRangeChange } = useRangeDurationDatePicker();

  useEffect(() => {
    const start = dayjs().subtract(1, "month").format("YYYY-MM-DD");
    const end = dayjs().format("YYYY-MM-DD");

    handleDateRangeChange({ startDate: start, endDate: end });
    return () => {
      handleIsDrawerOpen(false);
    };
  }, []);
  useEffect(() => {
    if (dateRange) {
      setDrawerDate(dateRange);
    }
  }, [dateRange]);

  return (
    <>
      {isInActiveUser && <RequireSubscribe />}
      {(isFetching || loading) && <Loading />}
      <MapContainer ref={mapElement}>
        <Wrapper>
          <ContentBox>
            <DatePickerContainer>
              <DurationDatePicker
                style={{ width: "100%" }}
                value={dateRange}
                onChange={handleDateRangeChange}
              />
            </DatePickerContainer>
            <SubText>
              * Zoom In을 하면, 환자들이 온 지역의 수치를 확인할 수 있습니다.
            </SubText>
          </ContentBox>
        </Wrapper>
      </MapContainer>
      <StatisticsDrawer />
    </>
  );
}

export default MapByRegionPage;

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

const ContentBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DatePickerContainer = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
`;

const SubText = styled.span`
  font-size: 1rem;
  color: ${(props) => props.theme.colors.gray05};
`;
