import dayjs from "dayjs";
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
}
const RevenuInfo: React.FC<RegionStatisticsProps> = ({
  statsData,
  revenueTrend,
  dailyRevenue,
  ageGroups,

  formatDataForRevenueTrend,
  formatDataForAverageRevenue,
  barFormatData
}) => {
  return (
    <>
      <GridWrapper>
        {STATSTYPE.map((data) => {
          return (
            <StatsBox
              key={data.id}
              title={data.title}
              data={statsData[data.id].data}
              diffRateData={statsData[data.id]?.diffRate}
            />
          );
        })}
      </GridWrapper>
      <GraphContainer>
        <GrapWrapper>
          <ChartTitleStyle>매출액 변화 추이</ChartTitleStyle>
          <BaseLineChart
            height={280}
            width={350}
            data={revenueTrend}
            xField="date"
            yField="매출액"
            labelFormatterY={(v: number) => `${v / 1000}K`}
            labelFormatterX={(v: string) => dayjs(v).format("MM/DD")}
            formatData={formatDataForRevenueTrend}
          />
        </GrapWrapper>
        <GrapWrapper>
          <ChartTitleStyle>연령대 별 환자 분포</ChartTitleStyle>
          <BarChart
            height={280}
            width={350}
            data={ageGroups}
            xField="연령"
            yField="세"
            formatData={barFormatData}
          />
        </GrapWrapper>
        <GrapWrapper>
          <ChartTitleStyle>1인당 평균 매출액</ChartTitleStyle>
          <BaseLineChart
            width={350}
            data={dailyRevenue}
            xField="date"
            yField="매출액"
            labelFormatterY={(v: number) => `${v / 1000}K`}
            labelFormatterX={(v: string) => dayjs(v).format("MM/DD")}
            formatData={formatDataForAverageRevenue}
            height={280}
          />
        </GrapWrapper>
      </GraphContainer>
    </>
  );
};

export default RevenuInfo;
