import { Bar } from "@ant-design/charts";
import styled from "styled-components";

interface SexHorizantalBarProps {
  type: string;
  value: number;
}

interface SexHorizantalBarComponentProps {
  data: SexHorizantalBarProps[];
  height: number;
}
const SexHorizantalBar = ({ data, height }: SexHorizantalBarComponentProps) => {
  const config = {
    data,
    height: height,
    xField: "type",
    yField: "value",
    colorField: "type",
    autoFit: true,
    legend: {
      position: "top"
    },
    style: {
      maxWidth: 20
    },
    scale: {
      color: {
        range: ["#92BFFF", "#FFB6C1"]
      }
    },
    tooltip: ({ type, value }) => {
      return { type, value };
    }
  };
  return (
    <BarChartContainer>
      <Bar {...config} />
    </BarChartContainer>
  );
};

export default SexHorizantalBar;
const BarChartContainer = styled.div`
  width: 100%;
  height: 100%;
`;
