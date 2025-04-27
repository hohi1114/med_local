import { JSX, useState } from "react";
import BarChart from "./chart/BarChart";
import SexHorizantalBar from "./chart/SexHorizantalBar";
import SexPieChart from "./chart/SexPieChart";
import BaseLineChart from "./chart/BaseLineChart";
import StatsBox from "./StatsBox";
import {
  ChartTitleStyle,
  GraphContainer,
  GridWrapper,
  GrapWrapper
} from "./StatisticsDrawer";
import { RegionData } from "../../types/naver-maps";
import BaseToggle from "../common/toggle/BaseToggle";
import BaseMultipleLineChart from "./chart/BaseMultipleLineChart";

const STATS_BOXES = [
  { id: 1, title: "월 평균 소득" },
  { id: 2, title: "월 평균 1인당 의료비 지출액" },
  { id: 3, title: "전체 평균 연령" },
  { id: 4, title: "총 인구" }
];

const FOOT_TRAFFIC_OPTIONS = ["시간대", "요일"];

type RegionInfoProps = {
  data: RegionData;
  region: string;
};

const RegionInfo = ({ data, region }: RegionInfoProps) => {
  const [footTrafficToggle, setFootTrafficToggle] = useState<string>("시간대");

  const statsData: { [key: number]: string } = {
    1: `${data.monthly_avg_income?.toLocaleString()} ₩`,
    2: `${Math.ceil(
      data.medical_expense /
        (3 *
          (region === "small" ? data?.dong_population ?? 1 : data?.population))
    ).toLocaleString()} ₩`,
    3: `${data.total_avg_age}세`,
    4: `${Math.ceil(data.population)?.toLocaleString()}명`
  };

  const horizontalBarData = [
    { type: "남성", value: data.male_population },
    { type: "여성", value: data.female_population }
  ];

  const pieChartData = [
    { type: "남성", value: data.male_avg_age },
    { type: "여성", value: data.female_avg_age }
  ];

  const ageGroupData = () => {
    return Object.entries(data.age_group_population || {}).map(
      ([age, value]) => ({
        연령: age,
        세: value
      })
    );
  };

  const timePopulationData = data.population_by_time
    ? Object.entries(data.population_by_time || {}).map(([key, value]) => ({
        time: `${key}시`,
        "유동 인구 수": value // 올바른 문자열 키 사용
      }))
    : [];

  const dayPopulationData = () => {
    return data.population_by_day
      ? data.population_by_day.map((item) => ({
          day: item.day,
          value: item.value
        }))
      : [];
  };

  const renderGraphWrapper = (title: string, chart: JSX.Element) => (
    <GraphContainer>
      <GrapWrapper>
        <ChartTitleStyle>{title}</ChartTitleStyle>
        {title === "시간대별/요일 유동인구 수" ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2rem",
              marginTop: "1.5rem"
            }}
          >
            <BaseToggle
              options={FOOT_TRAFFIC_OPTIONS}
              selected={footTrafficToggle}
              onChange={(val) => setFootTrafficToggle(val)}
            />

            {chart}
          </div>
        ) : (
          chart
        )}
      </GrapWrapper>
    </GraphContainer>
  );

  return (
    <>
      <GridWrapper>
        {STATS_BOXES.map((content) => (
          <StatsBox
            key={content.id}
            title={content.title}
            data={statsData[content.id]}
          />
        ))}
      </GridWrapper>

      {renderGraphWrapper(
        "성별 인구 수",
        <SexHorizantalBar data={horizontalBarData} />
      )}

      {renderGraphWrapper(
        "성별 평균 연령",
        <SexPieChart data={pieChartData} />
      )}

      {renderGraphWrapper(
        "연령대별 인구 수",
        <BarChart
          height={280}
          width={390}
          data={ageGroupData()}
          xField="연령"
          yField="세"
        />
      )}

      {renderGraphWrapper(
        "시간대별/요일 유동인구 수",
        footTrafficToggle === "시간대" ? (
          <BaseMultipleLineChart
            width={390}
            height={280}
            data={data.population_by_time}
            xField="time"
            yField="유동 인구 수"
            valueXSymbol={"명"}
            formatData={() => timePopulationData}
          />
        ) : (
          <BarChart
            width={400}
            height={280}
            data={dayPopulationData()}
            xField="day"
            yField="value"
          />
        )
      )}
    </>
  );
};

export default RegionInfo;
