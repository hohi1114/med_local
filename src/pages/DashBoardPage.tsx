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
  const { user, isInActiveUser, fetchingUserLoading, isFreetrialUser } =
    userStore();

  const barFormatData = () => {
    if (!dashboardInfo) return [];
    return Object.entries(dashboardInfo.patient_count_by_age_group).map(
      ([age, value]) => ({
        age,
        value
      })
    );
  };

  const chartFormatData = () => {
    if (!dashboardInfo) return [];
    return Object.entries(dashboardInfo?.cost_by_date).map(([date, value]) => ({
      date,
      매출액: value
    }));
  };

  if (isError)
    return (
      <Error status={error?.status ?? "Unknown"} message={error?.message} />
    );

  return (
    <>
      {isInActiveUser && <RequireSubscribe />}
      <ContentHeader title="대시보드" />
      {!fetchingUserLoading && !user?.free && user?.is_free_trial === false && (
        <FreeTrialModal />
      )}
      {isLoading && <Loading content={LOADINGCONTENT} />}
      {dashboardInfo && (
        <DashBoardContainer>
          <FilterContainer>
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
            {!isFreetrialUser && (
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
            )}
          </FilterContainer>

          <CardGrid>
            <DashboardStats
              title={"누적 매출"}
              value={dashboardInfo.total_cost}
              diffRate={dashboardInfo.diff_rates.total_cost}
              buttonType={buttonType}
              currencySymbol="₩"
            />
            <DashboardStats
              title={"전체 환자 수"}
              value={dashboardInfo.total_visit_count}
              diffRate={dashboardInfo.diff_rates.total_visit_count}
              buttonType={buttonType}
              currencySymbol="명"
            />
            <DashboardStats
              title={"신규 환자 수"}
              value={dashboardInfo.sinhwan_visit_count}
              diffRate={dashboardInfo.diff_rates.sinhwan_visit_count}
              buttonType={buttonType}
              currencySymbol="명"
            />
            <DashboardStats
              title={"재방문 환자 수"}
              value={dashboardInfo.chojin_rejin_visit_count}
              diffRate={dashboardInfo.diff_rates.chojin_rejin_visit_count}
              buttonType={buttonType}
              currencySymbol="명"
            />
          </CardGrid>

          <CardGrid>
            <Card>
              <ChartTitle>일자별 매출 통계</ChartTitle>
              <BaseLineChart
                data={dashboardInfo.cost_by_date}
                xField="date"
                yField="매출액"
                labelFormatterY={(v: number) => `${v / 1000}K`}
                labelFormatterX={(v: string) => dayjs(v).format("MM/DD")}
                formatData={chartFormatData}
                height={350}
                number_of_points={10}
              />
            </Card>
          </CardGrid>
          <CardGrid>
            <Card>
              <ChartTitle>지역 별 매출 순위</ChartTitle>
              <BaseTable data={dashboardInfo.topRegions} />
            </Card>
            <Card>
              <ChartTitle>연령 별 환자 분포</ChartTitle>
              <BarChart
                data={dashboardInfo.patient_count_by_age_group}
                xField="age"
                yField="value"
                formatData={barFormatData}
                height={430}
              />
            </Card>
          </CardGrid>
        </DashBoardContainer>
      )}
    </>
  );
}

const DashBoardContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const FilterContainer = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 10px;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1rem;
`;

const Card = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  padding: 1.5rem 2.2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: center;
  border-radius: 5;
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
