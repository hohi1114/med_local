import styled from "styled-components";
import { Pie } from "@ant-design/plots";

interface SexPieChartProps {
  type: string;
  value: number;
}

interface SexPieChartComponentProps {
  data: SexPieChartProps[];
  height: number;
}

const SexPieChart = ({ data, height }: SexPieChartComponentProps) => {
  const config = {
    height: height,
    data: data,
    angleField: "value",
    colorField: "type",
    autoFit: true,
    legend: {
      position: "top"
    },
    tooltip: ({ type, value }) => {
      return { type, value };
    },
    label: {
      text: "value",
      style: {
        fontWeight: "bold"
      }
    },
    scale: {
      color: {
        range: ["#92BFFF", "#FFB6C1"]
      }
    }
  };
  return (
    <PieContainer>
      <Pie {...config} />
    </PieContainer>
  );
};

export default SexPieChart;

const PieContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;
