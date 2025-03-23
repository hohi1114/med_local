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

const LOADINGCONTENT = "데이터를 불러오는 중입니다.";
export default function DashBoardPage() {
  const {
    rangeDate,
    handleDateFilterButton,
    handleDateChange,
    isError,
    isLoading,
    error,
    dashboardInfo,
    buttonType,
    RANGE_DATE_MAP,
    setDateChanged
  } = useDashBoard();

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
      value
    }));
  };

  if (isError)
    return (
      <Error
        status={error?.status ?? "Unknown"}
        message={error?.response?.data?.error ?? "An unexpected error occurred"}
      />
    );
  return (
    <>
      <ContentHeader title="대시보드" />
      {(isLoading || !dashboardInfo) && <Loading content={LOADINGCONTENT} />}
      {dashboardInfo && (
        <DashBoardContainer>
          <FilterContainer>
            {Object.keys(RANGE_DATE_MAP).map(
              (content: string, index: number) => {
                const contentKey = content as keyof typeof RANGE_DATE_MAP;
                return (
                  <div style={{ width: "85px" }} key={index}>
                    <CutomButton
                      selected={contentKey === buttonType}
                      onClick={() => handleDateFilterButton(contentKey)}
                      type="button"
                      textcolor="#000000"
                      color={"#ffffff"}
                      key={index}
                    >
                      {contentKey}
                    </CutomButton>
                  </div>
                );
              }
            )}
            <DateLabel>직접 선택</DateLabel>
            <DurationDatePicker
              rangeDate={rangeDate}
              handleDateChange={(date) => {
                if (date?.length === 2 && date[0] && date[1]) {
                  setDateChanged(true);
                  handleDateChange({ startDate: date[0], endDate: date[1] });
                }
              }}
            />
          </FilterContainer>

          <CardGrid>
            <DashboardStats
              title={"누적 매출"}
              value={dashboardInfo.total_cost}
              diffRate={dashboardInfo.diff_rates.total_cost}
              currencySymbol="₩"
            />
            <DashboardStats
              title={"전체 환자 수"}
              value={dashboardInfo.total_visit_count}
              diffRate={dashboardInfo.diff_rates.total_visit_count}
              currencySymbol="명"
            />
            <DashboardStats
              title={"신규 환자 수"}
              value={dashboardInfo.sinhwan_visit_count}
              diffRate={dashboardInfo.diff_rates.sinhwan_visit_count}
              currencySymbol="명"
            />
            <DashboardStats
              title={"재방문 환자 수"}
              value={dashboardInfo.chojin_rejin_visit_count}
              diffRate={dashboardInfo.diff_rates.chojin_rejin_visit_count}
              currencySymbol="명"
            />
          </CardGrid>

          <CardGrid>
            <Card>
              <ChartTitle>일자별 매출 통계</ChartTitle>
              <BaseLineChart
                data={dashboardInfo.cost_by_date}
                xField="date"
                yField="value"
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
  background-color: #ffffff;
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
  background-color: #ffffff;
  padding: 1.5rem 2.2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: center;
  border-radius: 5;
  border: 1px solid #f3f2f3;
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
  border: ${(props) =>
    props.selected ? "1.5px solid #0F52BA" : "1.5px solid #f3f2f3"};
  color: ${(props) => (props.selected ? "#0F52BA" : "#000000")};

  &:hover {
    border: 1.5px solid #0f52ba;
    color: #0f52ba;
  }
`;

const DateLabel = styled.div`
  min-width: 85px;
  max-width: 100px;
  flex-grow: 0;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #0f52ba;
`;
