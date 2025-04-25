import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";
import BaseButton from "../components/common/button/BaseButton";
import DurationDatePicker from "../components/common/datepicker/DurationDatePicker";
import useDashBoard from "../hooks/useDashBoard";
import BarChart from "../components/medi_map/chart/BarChart";
import dayjs from "dayjs";
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
import { Radio } from "antd";
import { RadioChangeEvent } from "antd/lib";
import BaseMultipleLineChart from "../components/medi_map/chart/BaseMultipleLineChart";

const LOADING_CONTENT = "데이터를 불러오는 중입니다.";
enum ChartType {
  REVENUE = 1,
  PATIENT_COUNT = 2
}
interface ChartDataPoint {
  date: string;
  value: number;
  category: string;
}
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
    setDateChanged,
    latestDateRangeRef
  } = useDashBoard();

  const { selectedDateRange, setSelectedDateRange } = useDashboardStore();
  const [chartType, setChartType] = useState<ChartType>(ChartType.REVENUE);
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

  const formatBarData2 = () => {
    if (!dashboardInfoData) return [];

    return Object.entries(dashboardInfoData.total_cost_by_day_of_week).map(
      ([day, value]) => ({ day, value })
    );
  };

  const formatChartData = (chartType: ChartType): ChartDataPoint[] => {
    if (!dashboardInfo) return [];

    const dataConfig =
      chartType === ChartType.REVENUE
        ? [
            { source: "cost_by_date", category: "전체 매출액" },
            { source: "sinhwan_cost_by_date", category: "신규환자 별 매출액" },
            {
              source: "chojin_rejin_cost_by_date",
              category: "재방문 환자 별 매출액"
            }
          ]
        : [
            { source: "visit_count_by_date", category: "전체 환자 수" },
            { source: "sinhwan_visit_count_by_date", category: "신규환자 수" },
            {
              source: "chojin_rejin_visit_count_by_date",
              category: "재방문 환자 수"
            }
          ];

    const result: ChartDataPoint[] = [];
    dataConfig.forEach((config) => {
      const sourceData = dashboardInfo[config.source];

      Object.entries(sourceData).forEach(([date, value]) => {
        result.push({
          date,
          value,
          category: config.category
        });
      });
    });

    return result;
  };

  const formatMonthlyData = (rawData) => {
    const result = [];
    for (let i = 0; i < rawData.length; i++) {
      result.push({
        month: rawData.month
      });
    }
  };

  const formatYAxisLabel = (value: number): string => {
    return chartType === ChartType.REVENUE
      ? `${value / 1000}K`
      : value.toString() + "명";
  };

  useEffect(() => {
    //만약 사용자가 처음 대시보드에 접근했을때
    if (selectedDateRange) {
      //사용자가 업데이트한 날짜가 있다면
      handleDateRangeChange(selectedDateRange);
    } else {
      if (lastedUpdatedDate && lastedUpdatedDate.length > 0) {
        const start = dayjs(lastedUpdatedDate)
          .subtract(1, "month")
          .format("YYYY-MM-DD");
        const end = dayjs(lastedUpdatedDate).format("YYYY-MM-DD");
        handleDateRangeChange({ startDate: start, endDate: end });
      }
    }
  }, [lastedUpdatedDate]);

  useEffect(() => {
    return () => {
      setSelectedDateRange(latestDateRangeRef.current);
    };
  }, []);

  const handleChartRadioChange = (e: RadioChangeEvent) => {
    setChartType(e.target.value);
  };

  if (isError) {
    return (
      <Error status={error?.status ?? "Unknown"} message={error?.message} />
    );
  }

  const formatWeeklyData = () => {
    const result = [];
    if (!dashboardInfo) return [];
    console.log(dashboardInfo);

    const daysOfWeek = [
      "월요일",
      "화요일",
      "수요일",
      "목요일",
      "금요일",
      "토요일",
      "일요일"
    ];

    daysOfWeek.forEach((day) => {
      result.push({
        day,
        type: "신규 환자 수",
        value: dashboardInfo.sinhwan_visit_count_by_day_of_week[day] || 0
      });

      result.push({
        day,
        type: "재방문 환자 수",
        value: dashboardInfo.chojin_rejin_visit_count_by_day_of_week[day] || 0
      });
    });
    console.log(result);
    return result;
  };

  formatWeeklyData();

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
                <div style={{ display: "flex", gap: "3rem" }}>
                  <ChartTitle>일자별 매출 통계</ChartTitle>
                  <Radio.Group
                    onChange={handleChartRadioChange}
                    value={chartType}
                    options={[
                      {
                        value: 1,
                        label: <div style={{ color: "#52555A" }}>매출</div>
                      },
                      {
                        value: 2,
                        label: <div style={{ color: "#52555A" }}>환자 수</div>
                      }
                    ]}
                  />
                </div>

                <BaseMultipleLineChart
                  data={formatChartData(chartType)}
                  xField="date"
                  yField="value"
                  colorField="category"
                  labelFormatterY={formatYAxisLabel}
                  height={500}
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
                  height={380}
                />
              </Card>
            </CardGrid>
          </SectionContainer>
          <SectionContainer>
            <CardGrid
              ref={tutorialRefs.tutorialRef4}
              className={
                tutorialStep === 3 && startTutorial ? "tutorial-highlight" : ""
              }
            >
              <Card>
                <ChartTitle>요일별 매출 통계</ChartTitle>

                <BarChart
                  data={dashboardInfoData.total_cost_by_day_of_week}
                  xField="day"
                  yField="value"
                  formatData={formatBarData2}
                  height={380}
                  colors={["#EF7E32"]}
                />
              </Card>
              <Card>
                <ChartTitle>요일별 신규/재방문 환자 비율</ChartTitle>
                <BarChart
                  data={formatWeeklyData()}
                  xField="day"
                  yField="value"
                  height={380}
                  isGrouped={true}
                  seriesField="type"
                  legend={true}
                  colors={[
                    "#0077C0",
                    "#96E2D6",
                    "#000000",
                    "#92BFFF",
                    "#AEC7ED",
                    "#94E9B8",
                    "#E4A9FF"
                  ]}
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
