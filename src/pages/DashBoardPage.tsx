import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";
import BaseButton from "../components/common/button/BaseButton";
import DurationDatePicker from "../components/common/datepicker/DurationDatePicker";
import { useEffect } from "react";
import userStore from "../store/userStore";
import { useQuery } from "@tanstack/react-query";
import { getUserInfo } from "../utils/api/apis";
import useDashBoard from "../hooks/useDashBoard";
import BarChart from "../components/medi_map/chart/BarChart";

const FILTERDATA = ["오늘", "3일", "7일", "1개월", "3개월", "1년", "직접선택"];
export default function DashBoardPage() {
  const {
    rangeDate,
    totalCost,
    totalPatients,
    totalNewPatients,
    averageAge,
    totalRevisitedPatitents,
    handleDateChange
  } = useDashBoard();
  const { user, setUser } = userStore();
  const { data, refetch } = useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfo(),
    enabled: false
  });

  useEffect(() => {
    if (!user) {
      refetch();
    } else if (data) {
      setUser(data);
    }
  }, [user, data]);

  return (
    <DashBoardContainer>
      <ContentHeader title="대시보드" />
      <FilterContainer>
        {FILTERDATA.map((data, index) => {
          return (
            <div style={{ width: "85px" }} key={index}>
              <CutomButton
                type="button"
                textcolor="#000000"
                color={"직접선택" === data ? "#EDEEFC" : "#ffffff"}
                key={index}
              >
                {data}
              </CutomButton>
            </div>
          );
        })}
        <DurationDatePicker
          rangeDate={rangeDate}
          handleDateChange={handleDateChange}
        />
      </FilterContainer>

      <CardGrid>
        <Card>
          <Title>누적 매출</Title>
          <ValueWrapper>
            <Value>{totalCost.toLocaleString()}₩</Value>
            <img src="/images/arrow_up.svg" alt="increase" />
            <Percentage>3.36%</Percentage>
          </ValueWrapper>
          <SubText>동일 기간 작년 매출 4,946,015,190₩</SubText>
        </Card>

        <Card>
          <Title>전체 환자 수</Title>
          <ValueWrapper>
            <Value>{totalPatients.toLocaleString()}명</Value>
            <img src="/images/arrow_up.svg" alt="increase" />
            <Percentage>3.36%</Percentage>
          </ValueWrapper>
          <SubText>동일 기간 작년 환자 수 5,000명</SubText>
        </Card>

        <Card>
          <Title>신규 환자 수</Title>
          <ValueWrapper>
            <Value>{totalNewPatients.toLocaleString()}명</Value>
            <img src="/images/arrow_up.svg" alt="increase" />
            <Percentage>2.5%</Percentage>
          </ValueWrapper>
          <SubText>동일 기간 작년 신규 환자 수 1,180명</SubText>
        </Card>

        <Card>
          <Title>재방문 환자 수</Title>
          <ValueWrapper>
            <Value>{totalRevisitedPatitents.toLocaleString()}명</Value>
            <img src="/images/arrow_up.svg" alt="increase" />
            <Percentage>5.1%</Percentage>
          </ValueWrapper>
          <SubText>동일 기간 작년 재방문 환자 수 4,000명</SubText>
        </Card>
      </CardGrid>

      <CardGrid>
        <Card>
          <Title>누적 배출 분포</Title>
          <div style={{ paddingTop: "1rem" }}>
            {/* <BaseLineChart
              data={test}
              xField="data"
              yField="value"
              labelFormatterY={(v: number) => `${v / 1000}K`}
              labelFormatterX={(v: string) => dayjs(v).format("MM/DD")}
              formatData={formatDataForRevenueTrend}
            /> */}
          </div>
        </Card>
      </CardGrid>
      <CardGrid>
        <Card>
          <Title>지역 별 매출 순위</Title>
        </Card>
        <Card>
          <Title>연령 별 환자 분포</Title>
          <BarChart data={averageAge} />
        </Card>
      </CardGrid>
    </DashBoardContainer>
  );
}

const DashBoardContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
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

const Percentage = styled.div`
  font-size: 1rem;
  color: #30bf78;
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
`;
