import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";
import BaseButton from "../components/common/button/BaseButton";
import DurationDatePicker from "../components/common/datepicker/DurationDatePicker";
import useDashBoard from "../hooks/useDashBoard";
import BarChart from "../components/medi_map/chart/BarChart";
import dayjs from "dayjs";
import BaseLineChart from "../components/medi_map/chart/BaseLineChart";
import BaseTable from "../components/medi_map/chart/BaseTable";

const FILTERDATA = ["오늘", "3일", "7일", "1개월", "3개월", "1년", "직접 선택"];
export default function DashBoardPage() {
  const {
    rangeDate,
    totalCost,
    totalPatients,
    totalNewPatients,
    averageAge,
    totalRevisitedPatitents,
    revenueByDate,
    rankedRegion,
    handleDateFilterButton,
    handleDateChange
  } = useDashBoard();

  const barFormatData = () => {
    return Object.entries(averageAge).map(([age, value]) => ({
      age,
      value
    }));
  };

  const chartFormatData = () => {
    return Object.entries(revenueByDate).map(([date, value]) => ({
      date,
      value
    }));
  };

  return (
    <>
      <ContentHeader title="대시보드" />
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
          <Card>
            <Title>누적 매출</Title>
            <ValueWrapper>
              <Value>{totalCost?.current?.toLocaleString()}₩</Value>
              {totalCost.past > 0 &&
                totalCost.past !== totalCost.current &&
                (totalCost.current > totalCost.past ? (
                  <img src="/images/arrow_up.svg" alt="increase" />
                ) : (
                  <img src="/images/arrow_down.svg" alt="decrease" />
                ))}

              <Percentage isDecreased={totalCost.current < totalCost.past}>
                {totalCost.past === 0
                  ? "-"
                  : `${(
                      ((totalCost.current - totalCost.past) / totalCost.past) *
                      100
                    ).toFixed(2)}%`}
              </Percentage>
            </ValueWrapper>
            <SubText>
              동일 기간 작년 매출{" "}
              {totalCost?.past === 0 ? "-" : totalCost?.past?.toLocaleString()}{" "}
              ₩
            </SubText>
          </Card>

          <Card>
            <Title>전체 환자 수</Title>
            <ValueWrapper>
              <Value>{totalPatients.current.toLocaleString()}명</Value>
              {totalPatients.past > 0 &&
                totalPatients.past !== totalPatients.current &&
                (totalPatients.current > totalPatients.past ? (
                  <img src="/images/arrow_up.svg" alt="increase" />
                ) : (
                  <img src="/images/arrow_down.svg" alt="decrease" />
                ))}
              <Percentage
                isDecreased={totalPatients.current < totalPatients.past}
              >
                {totalPatients.past === 0
                  ? "-"
                  : `${(
                      ((totalPatients.current - totalPatients.past) /
                        totalPatients.past) *
                      100
                    ).toFixed(2)}%`}
              </Percentage>
            </ValueWrapper>
            <SubText>
              동일 기간 작년 환자 수{" "}
              {totalPatients?.past === 0
                ? "-"
                : totalPatients?.past?.toLocaleString()}{" "}
              명
            </SubText>
          </Card>

          <Card>
            <Title>신규 환자 수</Title>
            <ValueWrapper>
              <Value>{totalNewPatients.current.toLocaleString()}명</Value>
              {totalNewPatients.past > 0 &&
                totalNewPatients.past !== totalNewPatients.current &&
                (totalNewPatients.current > totalNewPatients.past ? (
                  <img src="/images/arrow_up.svg" alt="increase" />
                ) : (
                  <img src="/images/arrow_down.svg" alt="decrease" />
                ))}
              <Percentage
                isDecreased={totalNewPatients.current < totalNewPatients.past}
              >
                {totalNewPatients.past === 0
                  ? "-"
                  : `${(
                      ((totalNewPatients.current - totalNewPatients.past) /
                        totalNewPatients.past) *
                      100
                    ).toFixed(2)}%`}
              </Percentage>
            </ValueWrapper>
            <SubText>
              동일 기간 작년 신규 환자 수
              {totalNewPatients?.past === 0
                ? "-"
                : totalNewPatients?.past?.toLocaleString()}
              명
            </SubText>
          </Card>

          <Card>
            <Title>재방문 환자 수</Title>
            <ValueWrapper>
              <Value>
                {totalRevisitedPatitents.current.toLocaleString()}명
              </Value>
              {totalRevisitedPatitents.past > 0 &&
                totalRevisitedPatitents.past !==
                  totalRevisitedPatitents.current &&
                (totalRevisitedPatitents.current >
                totalRevisitedPatitents.past ? (
                  <img src="/images/arrow_up.svg" alt="increase" />
                ) : (
                  <img src="/images/arrow_down.svg" alt="decrease" />
                ))}
              <Percentage
                isDecreased={
                  totalRevisitedPatitents.current < totalRevisitedPatitents.past
                }
              >
                {totalRevisitedPatitents.past === 0
                  ? "-"
                  : `${(
                      ((totalRevisitedPatitents.current -
                        totalRevisitedPatitents.past) /
                        totalRevisitedPatitents.past) *
                      100
                    ).toFixed(2)}%`}
              </Percentage>
            </ValueWrapper>
            <SubText>
              동일 기간 작년 재방문 환자 수{" "}
              {totalRevisitedPatitents?.past === 0
                ? "-"
                : totalRevisitedPatitents?.past?.toLocaleString()}{" "}
              명
            </SubText>
          </Card>
        </CardGrid>

        <CardGrid>
          <Card>
            <ChartTitle>누적 매출 분포</ChartTitle>
            <BaseLineChart
              data={revenueByDate}
              xField="date"
              yField="value"
              labelFormatterY={(v: number) => `${v / 1000}K`}
              labelFormatterX={(v: string) => dayjs(v).format("MM/DD")}
              formatData={chartFormatData}
              height={350}
            />
          </Card>
        </CardGrid>
        <CardGrid>
          <Card>
            <ChartTitle>지역 별 매출 순위</ChartTitle>
            <BaseTable data={rankedRegion} />
          </Card>
          <Card>
            <ChartTitle>연령 별 환자 분포</ChartTitle>
            <BarChart
              data={averageAge}
              xField="age"
              yField="value"
              formatData={barFormatData}
              height={350}
            />
          </Card>
        </CardGrid>
      </DashBoardContainer>
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

const Title = styled.span`
  font-size: 1.2rem;
  font-weight: 500;
`;

const ChartTitle = styled.span`
  font-size: 1.4rem;
  font-weight: 700;
  padding-bottom: 1rem;
`;

const ValueWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0;

  img {
    width: 15px;
    height: 15px;
  }
`;

const Value = styled.span`
  font-size: 2rem;
  font-weight: bold;
`;

const Percentage = styled.div<{ isDecreased: boolean }>`
  font-size: 1rem;
  color: ${(props) => (props.isDecreased ? "#EF4261" : "#30bf78")};
`;

const SubText = styled.div`
  font-size: 1rem;
  color: #969696;
`;

const CutomButton = styled(BaseButton)`
  border: 1px solid #f3f2f3;
  font-weight: 500;
  min-width: 85px;
  max-width: 100px;
  flex-grow: 0;
  transition: border 0.2s ease;

  &:focus {
    border: 1.5px solid #9f9ff8;
  }
`;
