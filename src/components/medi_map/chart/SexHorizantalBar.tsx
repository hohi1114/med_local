import { Bar } from "@ant-design/plots";

interface SexHorizantalBarProps {
  type: string;
  value: number;
}

interface SexHorizantalBarComponentProps {
  data: SexHorizantalBarProps[];
}
const SexHorizantalBar = ({ data }: SexHorizantalBarComponentProps) => {
  const config = {
    data,
    height: 250,
    width: 340,
    xField: "type",
    yField: "value",
    colorField: "type",
    autoFit: true,
    legend: {
      color: { size: 20, autoWrap: true, maxRows: 3, cols: 3 }
    },
    style: {
      maxWidth: 20
    },
    scale: {
      color: {
        range: ["#3897f0", "#F4A7B9"]
      }
    }
  };
  return <Bar {...config} />;
};

export default SexHorizantalBar;
