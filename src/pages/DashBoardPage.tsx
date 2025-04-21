import { useEffect, useRef } from "react";
import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";
import BaseButton from "../components/common/button/BaseButton";
import DurationDatePicker from "../components/common/datepicker/DurationDatePicker";
import useDashBoard from "../hooks/useDashBoard";
import BarChart from "../components/medi_map/chart/BarChart";
import dayjs from "dayjs";
import BaseLineChart from "../components/medi_map/chart/BaseLineChart";
import DashboardStats from "../components/dashboard/DashboardStats";
import Loading from "../components/common/Loading";
import Error from "../components/common/Error";
import userStore from "../store/userStore";
import { FreeTrialModal } from "../components/membership/FreeTrialModal";
import RequireSubscribe from "../components/common/RequireSubscribe";
import { useNavigate } from "react-router-dom";
import { mockDashboard } from "../utils/tutorial-mock";
import {
  FullDimOverlay,
  GuideContainer,
  GuideDescription
} from "../components/tutorial/style/tutorial.styles";
import TutorialStartModal from "../components/tutorial/TutorialStartModal";
import useTutorial from "../hooks/useTutorial";
import { DashboardSteps } from "../components/tutorial/TutorialData";
import { RangeDateMapKey } from "../types/dashboard";
import DashboardGrowthStats from "../components/dashboard/DashboardGrowthStats";
import useDashboardStore from "../store/useDashboardStore";

const LOADING_CONTENT = "데이터를 불러오는 중입니다.";

export default function DashBoardPage() {
  const {
    dateRange,
    handleDateFilterButton,
    handleDateRangeChange,
    isError,
    isLoading,
    error,
    dashboardInfo,
    buttonType,
    AVAILABLE_DATE_RANGES,
    setDateChanged
  } = useDashBoard();

  const { selectedDateRange } = useDashboardStore();
  const {
    fetchingUserLoading,
    lastedUpdatedDate,
    startTutorial,
    hasGuided,
    needFreeTrial
  } = userStore();

  const navigate = useNavigate();

  const tutorialRefs = {
    tutorialRef1: useRef(null),
    tutorialRef2: useRef(null),
    tutorialRef3: useRef(null),
    tutorialRef4: useRef(null)
  };

  const tutorialSteps = DashboardSteps(tutorialRefs);

  const { tutorialStep, handleNextStep } = useTutorial({
    steps: tutorialSteps,
    showTutorialModal: startTutorial,
    onComplate: () => navigate("/compare-avenue")
  });

  const dashboardInfoData = startTutorial
    ? mockDashboard
    : dashboardInfo ?? mockDashboard;

  const formatBarData = () => {
    if (!dashboardInfoData) return [];
    return Object.entries(dashboardInfoData.patient_count_by_age_group).map(
      ([age, value]) => ({ age, value })
    );
  };

  const formatChartData = () => {
    if (!dashboardInfoData) return [];
    return Object.entries(dashboardInfoData?.cost_by_date).map(
      ([date, value]) => ({ date, 매출액: value })
    );
  };

  useEffect(() => {
    //만약 사용자가 처음 대시보드에 접근했을때
    if (!selectedDateRange) {
      //사용자가 업데이트한 날짜가 있다면
      if (lastedUpdatedDate && lastedUpdatedDate.length > 0) {
        const start = dayjs(lastedUpdatedDate)
          .subtract(1, "month")
          .format("YYYY-MM-DD");
        const end = dayjs(lastedUpdatedDate).format("YYYY-MM-DD");
        handleDateRangeChange({ startDate: start, endDate: end });
      }
    } else {
      handleDateRangeChange(selectedDateRange);
    }
  }, [lastedUpdatedDate]);

  if (isError) {
    return (
      <Error status={error?.status ?? "Unknown"} message={error?.message} />
    );
  }

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

  if (!startTutorial && hasGuided && !dashboardInfo) return <Loading />;
  return (
    <>
      {(startTutorial || !hasGuided) && <FullDimOverlay />}
      <TutorialStartModal />
      <RequireSubscribe />
      <ContentHeader title="대시보드" />

      {!fetchingUserLoading && needFreeTrial && !startTutorial && hasGuided && (
        <FreeTrialModal />
      )}

      {!startTutorial && isLoading && <Loading content={LOADING_CONTENT} />}

      {dashboardInfoData && (
        <DashBoardContainer>
          {startTutorial && (
            <CloseGuideButton type="button" onClick={handleNextStep}>
              {tutorialStep === tutorialSteps.length - 1
                ? "다음메뉴로"
                : "다음"}
            </CloseGuideButton>
          )}

          <SectionContainer>
            {renderGuideDescription(0)}

            <FilterContainer
              ref={tutorialRefs.tutorialRef1}
              className={
                tutorialStep === 0 && startTutorial ? "tutorial-highlight" : ""
              }
            >
              {Object.keys(AVAILABLE_DATE_RANGES).map((content) => {
                const contentKey = content as RangeDateMapKey;
                return (
                  <ButtonWrapper key={content}>
                    <CutomButton
                      selected={contentKey === buttonType}
                      onClick={() => handleDateFilterButton(contentKey)}
                      type="button"
                      textcolor={(props) => props.theme.colors.black}
                      color={(props) => props.theme.colors.white}
                    >
                      {contentKey}
                    </CutomButton>
                  </ButtonWrapper>
                );
              })}

              <DateLabel>직접 선택</DateLabel>
              <DurationDatePicker
                value={dateRange}
                onChange={(date) => {
                  setDateChanged(true);
                  handleDateRangeChange(date);
                }}
              />
            </FilterContainer>
          </SectionContainer>

          {renderGuideDescription(1)}

          <SectionContainer>
            <CardGrid
              ref={tutorialRefs.tutorialRef2}
              className={
                tutorialStep === 1 && startTutorial ? "tutorial-highlight" : ""
              }
            >
              <DashboardStats
                title={"누적 매출"}
                value={dashboardInfoData.total_cost}
                diffRate={dashboardInfoData.diff_rates.total_cost}
                buttonType={buttonType}
                currencySymbol="₩"
              />
              <DashboardStats
                title={"전체 환자 수"}
                value={dashboardInfoData.total_visit_count}
                diffRate={dashboardInfoData.diff_rates.total_visit_count}
                buttonType={buttonType}
                currencySymbol="명"
              />
              <DashboardStats
                title={"신규 환자 수"}
                value={dashboardInfoData.sinhwan_visit_count}
                diffRate={dashboardInfoData.diff_rates.sinhwan_visit_count}
                buttonType={buttonType}
                currencySymbol="명"
              />
              <DashboardStats
                title={"재방문 환자 수"}
                value={dashboardInfoData.chojin_rejin_visit_count}
                diffRate={dashboardInfoData.diff_rates.chojin_rejin_visit_count}
                buttonType={buttonType}
                currencySymbol="명"
              />
            </CardGrid>
          </SectionContainer>

          {renderGuideDescription(2)}

          <SectionContainer>
            <CardGrid
              ref={tutorialRefs.tutorialRef3}
              className={
                tutorialStep === 2 && startTutorial ? "tutorial-highlight" : ""
              }
            >
              <Card>
                <ChartTitle>일자별 매출 통계</ChartTitle>
                <BaseLineChart
                  data={dashboardInfoData.cost_by_date}
                  xField="date"
                  yField="매출액"
                  labelFormatterY={(v) => `${v / 1000}K`}
                  formatData={formatChartData}
                  height={350}
                  limitDateXLength={30}
                />
              </Card>
            </CardGrid>
          </SectionContainer>

          {renderGuideDescription(3)}

          <SectionContainer>
            <CardGrid
              ref={tutorialRefs.tutorialRef4}
              className={
                tutorialStep === 3 && startTutorial ? "tutorial-highlight" : ""
              }
            >
              <Card>
                <ChartTitle>최근 3개월 월평균 성장률</ChartTitle>
                <DashboardGrowthStats
                  data={dashboardInfoData?.average_growths}
                  isDashboard
                />
              </Card>
              <Card>
                <ChartTitle>연령 별 환자 분포</ChartTitle>
                <BarChart
                  data={dashboardInfoData.patient_count_by_age_group}
                  xField="age"
                  yField="value"
                  formatData={formatBarData}
                  height={430}
                />
              </Card>
            </CardGrid>
          </SectionContainer>
        </DashBoardContainer>
      )}
    </>
  );
}

const DashBoardContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: 2rem;
`;

const SectionContainer = styled.div`
  position: relative;
  margin-bottom: 24px;
`;

const ButtonWrapper = styled.div`
  width: 85px;
`;

const FilterContainer = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 10px;
  position: relative;
  z-index: ${(props) => props.theme.zIndex.rank4};

  &.tutorial-highlight {
    z-index: ${(props) => props.theme.zIndex.rank2};
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1rem;
  position: relative;
  z-index: ${(props) => props.theme.zIndex.rank4};

  &.tutorial-highlight {
    z-index: ${(props) => props.theme.zIndex.rank2};
  }
`;

const Card = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  padding: 1.5rem 2.2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: center;
  border-radius: 5px;
  border: 1px solid ${(props) => props.theme.colors.gray01};
`;

const ChartTitle = styled.span`
  font-size: 1.4rem;
  font-weight: 700;
  padding-bottom: 1.5rem;
`;

const CutomButton = styled(BaseButton)<{ selected: boolean }>`
  font-weight: ${(props) => (props.selected ? "bold" : 500)};
  min-width: 85px;
  max-width: 100px;
  flex-grow: 0;
  transition: border 0.2s ease;
  border: 1.5px solid
    ${(props) =>
      props.selected ? props.theme.colors.primary : props.theme.colors.gray03};

  color: ${(props) =>
    props.selected ? props.theme.colors.primary : props.theme.colors.black};

  &:hover {
    border: 1.5px solid ${(props) => props.theme.colors.primary};
    color: ${(props) => props.theme.colors.primary};
  }
`;

const DateLabel = styled.div`
  min-width: 85px;
  max-width: 100px;
  flex-grow: 0;
  border-radius: 6px;
  color: ${(props) => props.theme.colors.white};
  font-weight: bold;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => props.theme.colors.primary};
`;

const CloseGuideButton = styled(BaseButton)`
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: ${(props) => props.theme.colors.primary};
  color: ${(props) => props.theme.colors.white};
  max-width: 12rem;
  z-index: 102;
`;
