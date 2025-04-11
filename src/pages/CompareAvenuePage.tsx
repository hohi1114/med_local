import styled from "styled-components";
import { useEffect, useRef } from "react";
import dayjs from "dayjs";
import useRangeDurationDatePicker from "../hooks/useRangeDurationDatePicker";
import DurationDatePicker from "../components/common/datepicker/DurationDatePicker";
import RevenueCompareDrawer from "../components/compare_revenue/RevenueCompareDrawer";
import mapStore from "../store/mapStore";
import { useNaverMapCore } from "../hooks/useNaverMapCore";
import Loading from "../components/common/Loading";
import userStore from "../store/userStore";
import RequireSubscribe from "../components/common/RequireSubscribe";
import { Space } from "antd";
import { compareAvenueTutorialSteps } from "../components/tutorial/TutorialData";
import { useNavigate } from "react-router-dom";
import Tutorial from "../components/tutorial/Tutorial";
import useTutorial from "../hooks/useTutorial";
import {
  tutorialHighlightWithBlink,
  TutorialImageContainer
} from "../components/tutorial/style/tutorial.styles";

function CompareAvenuePage() {
  const tutorialRefs = {
    tutorialRef1: useRef(null),
    tutorialRef2: useRef(null)
  };
  const navigate = useNavigate();

  const tutorialSteps = compareAvenueTutorialSteps(tutorialRefs);
  const { lastedUpdatedDate, startTutorial } = userStore();
  const { tutorialStep, handleNextStep, handlePrevStep } = useTutorial({
    steps: tutorialSteps,
    showTutorialModal: startTutorial,
    onComplate: () => {
      navigate("/map");
    }
  });
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

  useEffect(() => {
    if (tutorialStep === 3) {
      handleIsDrawerOpen(true);
    }
  }, [tutorialStep]);

  return (
    <>
      <RequireSubscribe />
      {(isFetching || loading) && <Loading />}
      <MapContainer ref={mapElement}>
        <Wrapper>
          <Space>
            <DatePickerContainer>
              <DatePickerContainer ref={tutorialRefs.tutorialRef1}>
                <DateTitle>기준 기간</DateTitle>
                <DurationDatePicker
                  value={dateRange1}
                  onChange={handleDateRangeChange1}
                />
              </DatePickerContainer>

              <DatePickerContainer ref={tutorialRefs.tutorialRef2}>
                <DateTitle>비교 기간</DateTitle>
                <DurationDatePicker
                  value={dateRange2}
                  onChange={handleDateRangeChange2}
                />
              </DatePickerContainer>

              <SubText>* 두 기간의 대한 매출 데이터를 비교합니다.</SubText>
            </DatePickerContainer>
          </Space>
        </Wrapper>
      </MapContainer>
      <RevenueCompareDrawer showTutorial={startTutorial} />
      {/**튜토리얼 */}
      {tutorialSteps[tutorialStep].specialBackground && (
        <TutorialImageContainer>
          <img
            onClick={() => {
              handleIsDrawerOpen(true);
            }}
            src={"/images/compareAvenueTutorialMap.png"}
            alt="매출 증감 지도 튜토리얼"
          />
        </TutorialImageContainer>
      )}

      <Tutorial
        steps={tutorialSteps}
        tutorialStep={tutorialStep}
        showTutorial={startTutorial}
        handleNextStep={handleNextStep}
        handlePrevStep={handlePrevStep}
      />
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
  z-index: ${(props) => props.theme.zIndex.rank2};
  background-color: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;

const DatePickerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;

  &.tutorial-highlight {
    ${tutorialHighlightWithBlink}
  }
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
