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

const FILTERDATA = ["오늘", "3일", "7일", "1개월", "3개월", "1년", "직접 선택"];
const LOADINGCONTENT = "데이터를 불러오는 중입니다.";
export default function DashBoardPage() {
  const {
    rangeDate,
    handleDateFilterButton,
    handleDateChange,
    dashboardInfo,
    isError,
    isRefetching,
    isLoading,
    error
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
  if (isLoading) return <Loading content={LOADINGCONTENT} />;
  if (isError) return <div>{error?.message}</div>;

  return (
    <>
      {isRefetching ? (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 100,
            backgroundColor: "rgba(0, 0, 0, 0.1)"
          }}
        >
          <Loading content={LOADINGCONTENT} />
        </div>
      ) : null}
      <ContentHeader title="대시보드" />
      {dashboardInfo && (
        <DashBoardContainer>
          <FilterContainer>
            {FILTERDATA.map((content, index) => {
              return (
                <div style={{ width: "85px" }} key={index}>
                  <CutomButton
                    onClick={() =>
                      content !== "직접 선택" && handleDateFilterButton(content)
                    }
                    type="button"
                    textcolor="#000000"
                    color={"직접 선택" === content ? "#EDEEFC" : "#ffffff"}
                    key={index}
                    disabled={content === "직접 선택"}
                  >
                    {content}
                  </CutomButton>
                </div>
              );
            })}
            <DurationDatePicker
              rangeDate={rangeDate}
              handleDateChange={(date) => {
                if (date?.length === 2 && date[0] && date[1]) {
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
                height={350}
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

const CutomButton = styled(BaseButton)`
  border: 1px solid #f3f2f3;
  font-weight: 500;
  min-width: 85px;
  max-width: 100px;
  flex-grow: 0;
  transition: border 0.2s ease;

  &:focus {
    border: 1.5px solid #0077c0;
  }
`;
