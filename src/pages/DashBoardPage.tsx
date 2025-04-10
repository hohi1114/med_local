import { useEffect, useState } from "react";
import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";
import BaseButton from "../components/common/button/BaseButton";
import DurationDatePicker from "../components/common/datepicker/DurationDatePicker";
import useDashBoard from "../hooks/useDashBoard";
import BarChart from "../components/medi_map/chart/BarChart";
import dayjs from "dayjs";
import BaseLineChart from "../components/medi_map/chart/BaseLineChart";
import BaseTable from "../components/medi_map/chart/BaseTable";
import DashboardStats from "../components/dashboard/DashboardStats";
import Loading from "../components/common/Loading";
import Error from "../components/common/Error";
import userStore from "../store/userStore";
import { FreeTrialModal } from "../components/membership/FreeTrialModal";
import RequireSubscribe from "../components/common/RequireSubscribe";
import { useNavigate } from "react-router-dom";
import { mockDashboard } from "../utils/\bTutorialMock";
import { FullDimOverlay } from "../components/tutorial/style/tutorial.styles";
import TutorialStartModal from "../components/tutorial/TutorialStartModal";

const LOADINGCONTENT = "데이터를 불러오는 중입니다.";
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

  const {
    user,
    fetchingUserLoading,
    lastedUpdatedDate,
    startTutorial,
    hasGuided,
    needFreeTrial
  } = userStore();

  const navigate = useNavigate();

  const dashboardInfoData = startTutorial ? mockDashboard : dashboardInfo;

  const barFormatData = () => {
    if (!dashboardInfoData) return [];
    return Object.entries(dashboardInfoData.patient_count_by_age_group).map(
      ([age, value]) => ({
        age,
        value
      })
    );
  };

  const chartFormatData = () => {
    if (!dashboardInfoData) return [];
    return Object.entries(dashboardInfoData?.cost_by_date).map(
      ([date, value]) => ({
        date,
        매출액: value
      })
    );
  };

  useEffect(() => {
    if (lastedUpdatedDate && lastedUpdatedDate.length > 0) {
      const start = dayjs(lastedUpdatedDate)
        .subtract(1, "month")
        .format("YYYY-MM-DD");
      const end = dayjs(lastedUpdatedDate).format("YYYY-MM-DD");
      handleDateRangeChange({ startDate: start, endDate: end });
    }
  }, [lastedUpdatedDate]);

  const handleTutorialButton = () => {
    navigate("/compare-avenue");
  };

  if (isError)
    return (
      <Error status={error?.status ?? "Unknown"} message={error?.message} />
    );

  return (
    <>
      {(startTutorial || !hasGuided) && <FullDimOverlay />}
      <TutorialStartModal />
      <RequireSubscribe />
      <ContentHeader title="대시보드" />
      {!fetchingUserLoading && needFreeTrial && !startTutorial && hasGuided && (
        <FreeTrialModal />
      )}
      {isLoading && <Loading content={LOADINGCONTENT} />}
      {dashboardInfoData && (
        <DashBoardContainer>
          {/** GUIDE CLOSE BUTTON*/}
          {startTutorial && (
            <CloseGuideButton type="button" onClick={handleTutorialButton}>
              다음메뉴로
            </CloseGuideButton>
          )}

          <SectionContainer>
            {/** GUIDE */}
            {startTutorial && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <GuideDescription>
                  기본 날짜는 <b>마지막 업데이트일 기준으로 1개월 전</b>이며,
                  버튼을 통해 기간을 빠르게 조정하거나 직접 선택을 통해 원하는
                  기간을 설정할 수 있어요.
                </GuideDescription>
              </div>
            )}
            <FilterContainer highlight={startTutorial}>
              {Object.keys(AVAILABLE_DATE_RANGES).map(
                (content: string, index: number) => {
                  const contentKey =
                    content as keyof typeof AVAILABLE_DATE_RANGES;
                  return (
                    <div style={{ width: "85px" }} key={content}>
                      <CutomButton
                        selected={contentKey === buttonType}
                        onClick={() => handleDateFilterButton(contentKey)}
                        type="button"
                        textcolor={(props) => props.theme.colors.black}
                        color={(props) => props.theme.colors.white}
                        key={index}
                      >
                        {contentKey}
                      </CutomButton>
                    </div>
                  );
                }
              )}

              <>
                <DateLabel>직접 선택</DateLabel>
                <DurationDatePicker
                  value={dateRange}
                  onChange={(date) => {
                    setDateChanged(true);
                    handleDateRangeChange(date);
                  }}
                />
              </>
            </FilterContainer>
          </SectionContainer>
          {/** GUIDE */}
          {startTutorial && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <GuideDescription>
                선택하신 날짜 기간 동안의 <b>매출 및 환자 통계</b>를 제공합니다.
                상단의 날짜 필터를 변경하면 해당 기간에 맞는 데이터로 자동
                갱신됩니다.
              </GuideDescription>
            </div>
          )}
          <SectionContainer>
            <CardGrid highlight={startTutorial}>
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

          <SectionContainer>
            <CardGrid highlight={startTutorial}>
              <Card>
                <ChartTitle>일자별 매출 통계</ChartTitle>
                <BaseLineChart
                  data={dashboardInfoData.cost_by_date}
                  xField="date"
                  yField="매출액"
                  labelFormatterY={(v: number) => `${v / 1000}K`}
                  formatData={chartFormatData}
                  height={350}
                  limitDateXLength={30}
                />
              </Card>
            </CardGrid>
          </SectionContainer>

          <SectionContainer>
            <CardGrid highlight={startTutorial}>
              <Card>
                <ChartTitle>지역 별 매출 순위</ChartTitle>
                <BaseTable data={dashboardInfoData.topRegions} />
              </Card>
              <Card>
                <ChartTitle>연령 별 환자 분포</ChartTitle>
                <BarChart
                  data={dashboardInfoData.patient_count_by_age_group}
                  xField="age"
                  yField="value"
                  formatData={barFormatData}
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

const FilterContainer = styled.div<{ highlight?: boolean }>`
  background-color: ${(props) => props.theme.colors.white};
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 10px;
  position: relative;
  z-index: ${(props) =>
    props.highlight ? props.theme.zIndex.rank2 : props.theme.zIndex.rank4};
`;

const CardGrid = styled.div<{ highlight?: boolean }>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1rem;
  position: relative;
  z-index: ${(props) =>
    props.highlight ? props.theme.zIndex.rank2 : props.theme.zIndex.rank4};
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

const CutomButton = styled(BaseButton)<{ selected?: boolean }>`
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

const GuideDescription = styled.div`
  border-radius: 6px;
  padding: 0.5rem 0rem;
  font-size: 1.2rem;
  z-index: 101;
  position: relative;
  text-align: center;
  max-width: 80%;
  color: ${(props) => props.theme.colors.white};
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
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
