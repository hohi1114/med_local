import BarChart from "./chart/BarChart";
import SexHorizantalBar from "./chart/SexHorizantalBar";
import {
  ChartTitleStyle,
  GraphContainer,
  GridWrapper,
  GrapWrapper
} from "./StatisticsDrawer";
import StatsBox from "./StatsBox";
import SexPieChart from "./chart/SexPieChart";
import { JSX } from "react";

const BOXTYPE = [
  { id: 1, title: "월평균 소득" },
  { id: 2, title: "월 평균 의료비 지출액" },
  { id: 3, title: "전체 평균 연령" },
  { id: 4, title: "총 인구" }
];

type RegionInfoProps = {
  data: RegionInfo;
};

type RegionInfo = {
  male_avg_age: number;
  female_avg_age: number;
  total_avg_age: number;
  monthly_avg_income: number;
  total_population: number;
  male_population: number;
  female_population: number;
  medical_expense: number;
  age_group_population: {
    "0-9": number;
    "10-19": number;
    "20-29": number;
    "30-39": number;
    "40-49": number;
    "50-59": number;
    "60-69": number;
    "70-79": number;
    "80-89": number;
    "90-99": number;
    "100세 이상": number;
  };
};
const RegionInfo = ({ data }: RegionInfoProps) => {
  const barFormatData = () => {
    return Object.entries(data.age_group_population).map(([age, value]) => ({
      age,
      value
    }));
  };

  const statsData: { [key: number]: string } = {
    1: data.monthly_avg_income?.toLocaleString() + " ₩",
    2: data.medical_expense?.toLocaleString() + " ₩",
    3: data.total_avg_age + "세",
    4: Math.ceil(data.total_population)?.toLocaleString() + "명"
  };

  const horizantalBarData = [
    { type: "남성", value: data.female_population },
    { type: "여성", value: data.male_population }
  ];

  const pieChartData = [
    { type: "남성", value: data.female_avg_age },
    { type: "여성", value: data.male_avg_age }
  ];
  const renderGraphWrapper = (title: string, chart: JSX.Element) => (
    <GraphContainer>
      <GrapWrapper>
        <ChartTitleStyle>{title}</ChartTitleStyle>
        {chart}
      </GrapWrapper>
    </GraphContainer>
  );
  return (
    <>
      <GridWrapper>
        {BOXTYPE.map((content) => {
          return (
            <StatsBox
              key={content.id}
              title={content.title}
              data={statsData[content.id]}
            />
          );
        })}
      </GridWrapper>
      {renderGraphWrapper(
        "성별 인구 수",
        <SexHorizantalBar data={horizantalBarData} />
      )}
      {renderGraphWrapper(
        "성별 평균 연령",
        <SexPieChart data={pieChartData} />
      )}
      {renderGraphWrapper(
        "연령대별 인구 수",
        <BarChart
          width={350}
          height={280}
          data={data.age_group_population}
          xField="age"
          yField="value"
          formatData={barFormatData}
        />
      )}
    </>
  );
};

export default RegionInfo;
