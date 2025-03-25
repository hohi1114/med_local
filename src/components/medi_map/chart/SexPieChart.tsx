import styled from "styled-components";
import { Pie } from "@ant-design/plots";

interface SexPieChartProps {
  type: string;
  value: number;
}

interface SexPieChartComponentProps {
  data: SexPieChartProps[];
}

const SexPieChart = ({ data }: SexPieChartComponentProps) => {
  const config = {
    height: 200,
    width: 350,
    data: data,
    angleField: "value",
    colorField: "type",
    autoFit: true,
    tooltip: false,
    label: {
      text: "value",
      style: {
        fontWeight: "bold"
      }
    },
    scale: {
      color: {
        range: ["#3897f0", "#F4A7B9"]
      }
    },
    legend: {
      color: {
        title: false,
        position: "right",
        rowPadding: 5
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
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
`;
