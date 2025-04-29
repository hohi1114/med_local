import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import mapStore from "../store/mapStore";
import userStore from "../store/userStore";
import useRangeDurationDatePicker from "../hooks/useRangeDurationDatePicker";
import { useNaverMapCore } from "../hooks/useNaverMapCore";
import useTutorial from "../hooks/useTutorial";

import StatisticsDrawer from "../components/medi_map/StatisticsDrawer";
import RequireSubscribe from "../components/common/RequireSubscribe";
import Loading from "../components/common/Loading";
import DurationDatePicker from "../components/common/datepicker/DurationDatePicker";
import Tutorial from "../components/tutorial/Tutorial";
import { MapByRegionTutorialSteps } from "../components/tutorial/TutorialData";
import {
  TutorialImageContainer,
  tutorialHighlightWithBlink
} from "../components/tutorial/style/tutorial.styles";
import BaseButton from "../components/common/button/BaseButton";

function MapByRegionPage() {
  const navigate = useNavigate();
  const tutorialRefs = { tutorialRef1: useRef(null) };
  const { mapElement, isFetching } = useNaverMapCore();
  const { lastedUpdatedDate, startTutorial } = userStore();
  const dateChangeCountRef = useRef(0);

  const {
    selectedDateRange,
    isAnalyzeMultiRegion,
    selectedMultiRegion,
    isChangedDateRange,
    isRequested,
    setIsChangedDateRange,
    handleIsAnalyzeMultiRegion,
    initSelectedMultiRegion,
    setSelectedDateRange,
    setDrawerDate,
    handleIsDrawerOpen,
    setIsAnalyzeMultiRegion,
    setIsRequested
  } = mapStore();

  const { dateRange, handleDateRangeChange, latestDateRangeRef } =
    useRangeDurationDatePicker({ startDate: "", endDate: "" });

  const { tutorialStep, handleNextStep, handlePrevStep } = useTutorial({
    steps: MapByRegionTutorialSteps(tutorialRefs),
    showTutorialModal: startTutorial,
    onComplate: () => navigate("/statistics-by-region")
  });

  useEffect(() => {
    return () => {
      handleIsDrawerOpen(false);
      setSelectedDateRange(latestDateRangeRef.current);
      //만약 다른 페이지로 갈시 multiRegion 초기화 + Ref도 초기화 시켜줘야함
      initSelectedMultiRegion();
      setIsAnalyzeMultiRegion(false);
    };
  }, []);

  useEffect(() => {
    if (selectedDateRange) {
      handleDateRangeChange(selectedDateRange);
    } else {
      const start =
        lastedUpdatedDate && lastedUpdatedDate.length > 0
          ? dayjs(lastedUpdatedDate).subtract(1, "month").format("YYYY-MM-DD")
          : dayjs().subtract(1, "month").format("YYYY-MM-DD");
      const end =
        lastedUpdatedDate && lastedUpdatedDate.length > 0
          ? dayjs(lastedUpdatedDate).format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD");
      handleDateRangeChange({ startDate: start, endDate: end });
    }
  }, [lastedUpdatedDate]);

  useEffect(() => {
    if (dateRange) {
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

  const handleAnalyzeMultiRegion = () => {
    if (isRequested) {
      initSelectedMultiRegion();
      handleIsDrawerOpen(false);
    } else {
      handleIsDrawerOpen(true);
    }
  };

  const handleGobackToOriginal = () => {
    handleIsDrawerOpen(false);
    handleIsAnalyzeMultiRegion();
    initSelectedMultiRegion();
    setIsRequested(false);
  };

  const getTutorialImage = () => {
    const images = {
      1: "/images/MapByRegionTutorialMap.png",
      2: "/images/MapByRegionTutorialMap.png",
      3: "/images/MapByRegionTutorial_small.png",
      4: "/images/MapByRegionTutorial_dong.png",
      5: "/images/MapByRegionTutorial_gu.png"
    };
    return images[tutorialStep as keyof typeof images] || images[1];
  };

  return (
    <>
      <RequireSubscribe />
      {isFetching && <Loading />}

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

          <ActionSection>
            {!isAnalyzeMultiRegion ? (
              <BaseButton
                type="button"
                onClick={() => {
                  handleIsAnalyzeMultiRegion();
                  handleIsDrawerOpen(false);
                }}
              >
                지역 통계 종합 보기
              </BaseButton>
            ) : (
              <>
                <SelectedRegionBox>
                  {selectedMultiRegion.length > 0 ? (
                    <RegionList>
                      {selectedMultiRegion.map((region, index) => (
                        <li key={index}>{region}</li>
                      ))}
                    </RegionList>
                  ) : (
                    <EmptyRegionNotice>
                      분석할 지역을 선택해주세요.
                    </EmptyRegionNotice>
                  )}
                </SelectedRegionBox>

                <ButtonGroup>
                  <BaseButton
                    type="button"
                    textcolor={"#ffffff"}
                    color={"#2b2b2b"}
                    onClick={handleGobackToOriginal}
                  >
                    취소하기
                  </BaseButton>
                  {selectedMultiRegion.length > 0 && (
                    <BaseButton
                      type="button"
                      onClick={handleAnalyzeMultiRegion}
                    >
                      {isRequested ? "초기화" : "분석하기"}
                    </BaseButton>
                  )}
                </ButtonGroup>
              </>
            )}
          </ActionSection>
        </Wrapper>
      </MapContainer>

      <StatisticsDrawer showTutorial={startTutorial} />

      {MapByRegionTutorialSteps(tutorialRefs)[tutorialStep]
        .specialBackground && (
        <TutorialImageContainer>
          <img
            src={getTutorialImage()}
            alt="MapByRegionTutorial"
            onClick={() => handleIsDrawerOpen(true)}
          />
        </TutorialImageContainer>
      )}

      <Tutorial
        steps={MapByRegionTutorialSteps(tutorialRefs)}
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
  background: white;
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
  width: 100%;
  gap: 10px;

  &.tutorial-highlight {
    ${tutorialHighlightWithBlink}
  }
`;

const SubText = styled.span`
  font-size: 1rem;
  color: ${(props) => props.theme.colors.gray05};
`;

const ActionSection = styled.div`
  margin-top: 0.5rem;
`;

const SelectedRegionBox = styled.div`
  min-height: 3rem;
  max-height: 15rem;
  overflow-y: auto;
  font-size: 1.2rem;
  color: ${(props) => props.theme.colors.gray05};
  padding: 1rem;
  border-radius: 0.5rem;
`;

const RegionList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const EmptyRegionNotice = styled.div`
  margin-top: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-weight: bold;
  font-size: 1.2rem;
  color: ${(props) => props.theme.colors.primary};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;
