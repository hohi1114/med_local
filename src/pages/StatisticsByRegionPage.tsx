import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";
import useRegionAnalysis from "../hooks/useRegionAnalysis";
import StatisticByRegionFilter from "../components/statics_by_region/StatisticByRegionFilter";
import Error from "../components/common/Error";
import StatisticsTable from "../components/statics_by_region/table/StatisticsTable";
import RequireSubscribe from "../components/common/RequireSubscribe";
import userStore from "../store/userStore";
import {
  CloseGuideButton,
  FullDimOverlay,
  GuideContainer,
  GuideDescription,
  HighlightWrapper
} from "../components/tutorial/style/tutorial.styles";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { StatisticsByRegionPageSteps } from "../components/tutorial/TutorialData";
import useTutorial from "../hooks/useTutorial";

export default function StatisticsByRegionPage() {
  const { startTutorial, setStartTutorial } = userStore();
  const tutorialRefs = {
    tutorialRef1: useRef(null),
    tutorialRef2: useRef(null)
  };
  const tutorialSteps = StatisticsByRegionPageSteps(tutorialRefs);

  const { tutorialStep, handleNextStep } = useTutorial({
    steps: tutorialSteps,
    showTutorialModal: startTutorial,
    onComplate: () => {
      setStartTutorial(false);
      navigate("/");
    }
  });

  const navigate = useNavigate();
  const {
    isPending,
    dateRange,
    isError,
    error,
    handleLocalSectionChange,
    handleDateRangeChange
  } = useRegionAnalysis();

  if (isError) return <Error message={error?.message} />;

  const renderGuideDescription = (step: number) => {
    if (startTutorial && tutorialStep === step) {
      return (
        <GuideContainer>
          <GuideDescription className="tutorial-highlight">
            {tutorialSteps[tutorialStep].description}
          </GuideDescription>
        </GuideContainer>
      );
    }
    return null;
  };
  return (
    <>
      {startTutorial && <FullDimOverlay />}
      <RequireSubscribe />
      <ContentHeader title="지역 별 통계" />
      <DashBoardContainer>
        {startTutorial && (
          <CloseGuideButton type="button" onClick={handleNextStep}>
            {tutorialStep === tutorialSteps.length - 1
              ? "가이드 마치기"
              : "다음"}
          </CloseGuideButton>
        )}
        {renderGuideDescription(0)}
        <HighlightWrapper ref={tutorialRefs.tutorialRef1}>
          <StatisticByRegionFilter
            isTutorial={startTutorial}
            rangeDate={dateRange}
            handleDateChange={handleDateRangeChange}
            handleLocalSectionChange={handleLocalSectionChange}
          />
        </HighlightWrapper>

        <DashBoardTableContainer isTutorial={startTutorial}>
          {renderGuideDescription(1)}

          <StatisticsTable
            isLoading={isPending}
            isTutorial={tutorialStep === 1 && startTutorial}
          />
        </DashBoardTableContainer>
      </DashBoardContainer>
    </>
  );
}

const DashBoardContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const DashBoardTableContainer = styled.div<{ isTutorial: boolean }>`
  padding: ${(props) => (props.isTutorial ? "0rem" : "1rem")};
`;
