import { Drawer } from "antd";
import DurationDatePicker from "../common/datepicker/DurationDatePicker";
import BaseButton from "../common/button/BaseButton";
import styled from "styled-components";
import StatsBox, { STATSTYPE } from "./StatsBox";
import mapStore from "../../store/mapStore";
import BarChart from "./chart/BarChart";
import BaseLineChart from "./chart/BaseLineChart";
import dayjs from "dayjs";
import useRangeDurationDatePicker from "../../hooks/useRangeDurationDatePicker";

interface StatisticsDrawerProps {
  open: boolean;
  handleDrawerOpen: () => void;
}
const StatisticsDrawer = ({
  open,
  handleDrawerOpen
}: StatisticsDrawerProps) => {
  const { rangeDate, handleDateChange } = useRangeDurationDatePicker();
  const {
    areaName,
    totalCost,
    totalPatients,
    firstVisitPatients,
    revisitedPatients,
    dailyRevenue,
    revenueTrend
  } = mapStore();

  const formatData = (data: any) => {
    return Object.entries(data).map(([date, value]) => {
      const averageRevenue =
        value.patientCount > 0 ? value.totalCost / value.patientCount : 0;
      return {
        date,
        value: averageRevenue
      };
    });
  };

  const formatData2 = (data: any) => {
    return Object.entries(revenueTrend).map(([date, value]) => ({
      date,
      value
    }));
  };

  const statsData: { [key: number]: string } = {
    1: `${totalPatients}명`,
    2: `${totalCost.toLocaleString()} ₩`,
    3: `${revisitedPatients}명`,
    4: `${firstVisitPatients}명`,
    5: `${0}명`,
    6: `${0}명`
  };

  return (
    <Drawer
      width={"35rem"}
      placement="right"
      onClose={handleDrawerOpen}
      style={{ backgroundColor: "#FAFAFB" }}
      styles={{
        header: {
          padding: "0.8rem 1rem"
        },
        mask: { backgroundColor: "rgba(0, 0, 0, 0)", pointerEvents: "none" },
        body: {
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          backgroundColor: "#FAFAFB"
        }
      }}
      open={open}
    >
      {/** 날짜 필터 */}
      <DateFilterWrapper>
        <div style={{ flex: 3 }}>
          <DurationDatePicker
            rangeDate={rangeDate}
            handleDateChange={handleDateChange}
          />
        </div>
        <div style={{ flex: 1 }}>
          <BaseButton
            type="submit"
            onClick={() => {}}
            color="#EDEEFC"
            textcolor="#000000"
          >
            오늘
          </BaseButton>
        </div>
      </DateFilterWrapper>
      {/** 증가&감소 지표 */}
      <div style={{ padding: "0.8rem 0rem" }}>
        <AddressTitleStyle>{areaName}</AddressTitleStyle>
      </div>
      <GridWrapper>
        {STATSTYPE.map((data) => {
          return (
            <StatsBox
              key={data.id}
              title={data.title}
              data={statsData[data.id]}
            />
          );
        })}
      </GridWrapper>
      <GraphContainer>
        <GrapWrapper>
          <ChartTitleStyle>매출액 변화 추이</ChartTitleStyle>
          <BaseLineChart
            data={revenueTrend}
            xField="date"
            yField="value"
            labelFormatterY={(v: number) => `${v / 1000}K`}
            labelFormatterX={(v: string) => dayjs(v).format("MM/DD")}
            formatData={formatData2}
          />
        </GrapWrapper>
        <GrapWrapper>
          <ChartTitleStyle>연령대 별 환자 분포</ChartTitleStyle>
          <BarChart />
        </GrapWrapper>
        <GrapWrapper>
          <ChartTitleStyle>1인당 평균 매출액</ChartTitleStyle>
          <BaseLineChart
            data={dailyRevenue}
            xField="date"
            yField="value"
            labelFormatterY={(v: number) => `${v / 1000}K`}
            labelFormatterX={(v: string) => dayjs(v).format("MM/DD")}
            formatData={formatData}
          />
        </GrapWrapper>
      </GraphContainer>
    </Drawer>
  );
};

export default StatisticsDrawer;

const AddressTitleStyle = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
`;

const ChartTitleStyle = styled.span`
  font-size: 1.2rem;
  margin-left: 1rem;
  font-weight: bold;
`;

const GridWrapper = styled.section`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  width: 100%;
`;

const GraphContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GrapWrapper = styled.div`
  background-color: #ffffff;
  border-radius: 1rem;
  padding: 2rem 1rem 0rem 1rem;
`;

const DateFilterWrapper = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
`;
