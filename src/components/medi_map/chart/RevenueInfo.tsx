import styled from "styled-components";
import { AverageGrowth } from "../../../types/dashboard";
import DashboardGrowthStats from "../../dashboard/DashboardGrowthStats";
import {
  GridWrapper,
  GraphContainer,
  GrapWrapper,
  ChartTitleStyle
} from "../StatisticsDrawer";
import StatsBox, { STATSTYPE } from "../StatsBox";
import BarChart from "./BarChart";
import BaseLineChart from "./BaseLineChart";

interface RegionStatisticsProps {
  statsData: { [key: number]: { data: string; diffRate: number | null } };
  revenueTrend: any;
  dailyRevenue: any;
  ageGroups: any;
  formatDataForRevenueTrend: (data: any) => any;
  formatDataForAverageRevenue: (data: any) => any;
  barFormatData: () => any;
  disabledCompare?: boolean;
  avgGrowth: AverageGrowth;
  costRank?: number;
}
const RevenuInfo: React.FC<RegionStatisticsProps> = ({
  statsData,
  revenueTrend,
  dailyRevenue,
  ageGroups,
  formatDataForRevenueTrend,
  formatDataForAverageRevenue,
  barFormatData,
  disabledCompare = false,
  avgGrowth,
  costRank
}) => {
  return (
    <>
      <GridWrapper>
        {STATSTYPE.map((data) => {
          return (
            <StatsBox
              key={data?.id}
              title={data?.title}
              data={statsData[data.id]?.data}
              diffRateData={statsData[data.id]?.diffRate}
              disabledCompare={disabledCompare}
            />
          );
        })}
      </GridWrapper>
      {!disabledCompare && costRank && (
        <GrowthCommentContainer>
          <DashboardGrowthStats data={avgGrowth} costRank={costRank} />
        </GrowthCommentContainer>
      )}

      <GraphContainer>
        <GrapWrapper>
          <ChartTitleStyle>매출액 변화 추이</ChartTitleStyle>
          <BaseLineChart
            height={330}
            width={390}
            data={revenueTrend}
            xField="date"
            yField="매출액"
            labelFormatterY={(v: number) => `${v / 1000}K`}
            formatData={formatDataForRevenueTrend}
          />
        </GrapWrapper>
        <GrapWrapper>
          <ChartTitleStyle>연령대 별 환자 분포</ChartTitleStyle>
          <BarChart
            height={280}
            width={390}
            data={ageGroups}
            xField="연령"
            yField="세"
            formatData={barFormatData}
          />
        </GrapWrapper>
        <GrapWrapper>
          <ChartTitleStyle>1인당 평균 매출액</ChartTitleStyle>
          <BaseLineChart
            data={dailyRevenue}
            xField="date"
            yField="매출액"
            labelFormatterY={(v: number) => `${v / 1000}K`}
            formatData={formatDataForAverageRevenue}
            height={350}
            width={390}
          />
        </GrapWrapper>
      </GraphContainer>
    </>
  );
};

export default RevenuInfo;

const GrowthCommentContainer = styled.div`
  padding: 1rem 0;
  border-style: solid;
  border-width: 1px 0px;
  border-color: ${(props) => props.theme.colors.gray02};
`;
