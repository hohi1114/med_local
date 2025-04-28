import styled from "styled-components";
import DashboardGrowthStats from "../../dashboard/DashboardGrowthStats";
import {
  GridWrapper,
  GraphContainer,
  GrapWrapper,
  ChartTitleStyle
} from "../StatisticsDrawer";
import StatsBox, { STATSTYPE } from "../StatsBox";
import BarChart from "./BarChart";

import mapStore from "../../../store/mapStore";
import BaseMultipleLineChart from "./BaseMultipleLineChart";
import { usePrivateDataChart } from "../../../hooks/usePrivateDataChart";
import { RegionPrivateData } from "../../../types/naver-maps";
import { Radio } from "antd";

interface RevenuInfoProps {
  statsData: { [key: number]: { data: string; diffRate: number | null } };
  disabledCompare?: boolean;
  costRank?: number;
  data: RegionPrivateData;
  drawerWidth?: number;
}
const RevenuInfo: React.FC<RevenuInfoProps> = ({
  statsData,
  disabledCompare = false,
  costRank,
  data,
  drawerWidth
}) => {
  const { isChangedDateRange } = mapStore();
  const {
    formatPatientCountBarData,
    formatWeeklyDataForBarChart,
    formatTotalCostBarData,
    formatDataForAverageRevenue,
    formatYAxisLabelForLineChart,
    chartType,
    handleChartRadioChange,
    formatLineChartData
  } = usePrivateDataChart(data);

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
      {!disabledCompare && costRank && !isChangedDateRange && (
        <GrowthCommentContainer>
          <DashboardGrowthStats
            data={data.growth_metrics}
            costRank={costRank}
          />
        </GrowthCommentContainer>
      )}

      <GraphContainer>
        <GrapWrapper>
          <div
            style={{
              display: "flex",
              gap: "3rem",
              alignItems: "center"
            }}
          >
            <ChartTitleStyle>일자별 매출 통계</ChartTitleStyle>
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
            xField="date"
            yField="value"
            colorField="category"
            labelFormatterY={formatYAxisLabelForLineChart}
            height={500}
            valueXSymbol=" ₩"
            data={formatLineChartData(chartType)}
          />
        </GrapWrapper>
        <GrapWrapper>
          <ChartTitleStyle>연령대 별 환자 분포</ChartTitleStyle>
          <BarChart
            height={280}
            xField="age"
            yField="value"
            data={formatPatientCountBarData()}
          />
        </GrapWrapper>
        <GrapWrapper>
          <ChartTitleStyle>1인당 평균 매출액</ChartTitleStyle>
          <BaseMultipleLineChart
            xField="date"
            yField="매출액"
            data={formatDataForAverageRevenue()}
            height={350}
            width={drawerWidth}
          />
        </GrapWrapper>
        <GrapWrapper>
          <ChartTitleStyle>요일별 매출 통계</ChartTitleStyle>
          <BarChart
            xField="day"
            yField="value"
            data={formatTotalCostBarData()}
            height={380}
            colors={"#96E2D6"}
            valueXSymbol=" ₩"
          />
        </GrapWrapper>
        <GrapWrapper>
          <ChartTitleStyle>요일별 신규/재방문 환자 비율</ChartTitleStyle>
          <BarChart
            data={formatWeeklyDataForBarChart()}
            xField="day"
            yField="value"
            height={380}
            isGrouped={true}
            seriesField="type"
            legend={true}
            colors={["#FFB6C1", "#92BFFF"]}
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
