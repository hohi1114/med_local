import { useEffect, useRef } from "react";
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
import { useNavigate } from "react-router-dom";
import useTutorial from "../hooks/useTutorial";
import Tutorial from "../components/tutorial/Tutorial";
import { MapByRegionTutorialSteps } from "../components/tutorial/TutorialData";
import {
  tutorialHighlightWithBlink,
  TutorialImageContainer
} from "../components/tutorial/style/tutorial.styles";

function MapByRegionPage() {
  const tutorialRefs = {
    tutorialRef1: useRef(null)
  };
  const navigate = useNavigate();
  const tutorialSteps = MapByRegionTutorialSteps(tutorialRefs);
  const { setIsChangedDateRange } = mapStore();
  const { mapElement, isFetching } = useNaverMapCore();
  const { lastedUpdatedDate, startTutorial } = userStore();
  const {
    isChangedDateRange,
    selectedDateRange,
    setSelectedDateRange,
    loading,
    setDrawerDate,
    handleIsDrawerOpen
  } = mapStore();
  const { dateRange, handleDateRangeChange, latestDateRangeRef } =
    useRangeDurationDatePicker({ startDate: "", endDate: "" });

  const { tutorialStep, handleNextStep, handlePrevStep } = useTutorial({
    steps: tutorialSteps,
    showTutorialModal: startTutorial,
    onComplate: () => {
      navigate("/statistics-by-region");
    }
  });

  useEffect(() => {
    return () => {
      handleIsDrawerOpen(false);
      setSelectedDateRange(latestDateRangeRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedDateRange) {
      handleDateRangeChange(selectedDateRange);
    } else {
      if (lastedUpdatedDate && lastedUpdatedDate.length > 0) {
        const start = lastedUpdatedDate
          ? dayjs(lastedUpdatedDate).subtract(1, "month").format("YYYY-MM-DD")
          : dayjs().subtract(1, "month").format("YYYY-MM-DD");
        const end = lastedUpdatedDate
          ? dayjs(lastedUpdatedDate).format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD");

        handleDateRangeChange({ startDate: start, endDate: end });
      }
    }
  }, [lastedUpdatedDate]);

  const dateChangeCountRef = useRef(0);

  useEffect(() => {
    if (dateRange) {
      //처음에만 Notify를 띄우기 위한 날짜 변환 감지
      dateChangeCountRef.current += 1;
      setDrawerDate(dateRange);
      if (dateChangeCountRef.current === 3 && !isChangedDateRange) {
        setIsChangedDateRange(true);
      }
    }
  }, [dateRange]);

  useEffect(() => {
    if (tutorialStep === 7) {
      handleIsDrawerOpen(true);
    }
  }, [tutorialStep]);

  const getImageBasedonTutorialStep = () => {
    switch (tutorialStep) {
      case 1:
        return "/images/MapByRegionTutorialMap.png";
      case 2:
        return "/images/MapByRegionTutorialMap.png";
      case 3:
        return "/images/MapByRegionTutorial_small.png";
      case 4:
        return "/images/MapByRegionTutorial_dong.png";
      case 5:
        return "/images/MapByRegionTutorial_gu.png";
      default:
        return "/images/MapByRegionTutorialMap.png";
    }
  };

  return (
    <>
      <RequireSubscribe />
      {(isFetching || loading) && <Loading />}
      <MapContainer ref={mapElement}>
        <Wrapper>
          <ContentBox>
            <DatePickerContainer ref={tutorialRefs.tutorialRef1}>
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
      <StatisticsDrawer showTutorial={startTutorial} />
      {tutorialSteps[tutorialStep].specialBackground && (
        <TutorialImageContainer>
          <img
            onClick={() => {
              handleIsDrawerOpen(true);
            }}
            src={getImageBasedonTutorialStep()}
            alt="MapByRegionTutorialMap"
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
  z-index: 100;
`;

const DatePickerContainer = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;

  &.tutorial-highlight {
    ${tutorialHighlightWithBlink}
  }
`;

const SubText = styled.span`
  font-size: 1rem;
  color: ${(props) => props.theme.colors.gray05};
`;
