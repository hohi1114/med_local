import styled from "styled-components";
import { tutorialHighlight } from "../../styles/highlight";

type CardWithChangeProps = {
  title: string;
  value: number;
  pastValue?: number | string;
  diffRate: number;
  buttonType: string | null;
  currencySymbol?: string;
};

const DashboardStats: React.FC<CardWithChangeProps> = ({
  title,
  value,
  diffRate,
  buttonType,
  currencySymbol = "₩"
}) => {
  const isDecreased = diffRate < 0;

  return (
    <Card>
      <Title>{title}</Title>
      <ValueWrapper>
        <Value textLength={value.toString().length}>
          {value?.toLocaleString()}
          {currencySymbol}
        </Value>
        <div style={{ display: "flex", gap: 1.5 }}>
          {diffRate >= 0 ? (
            <img src="/images/arrow_up.svg" alt="increase" />
          ) : (
            <img src="/images/arrow_down.svg" alt="decrease" />
          )}
          <Percentage isDecreased={isDecreased}>{diffRate} %</Percentage>
        </div>
      </ValueWrapper>
      <SubText>
        {buttonType || "동일기간"} 전 {title}{" "}
        {value === 0
          ? 0
          : Math.ceil(value / (1 + diffRate / 100)).toLocaleString() || 0}
        {currencySymbol}
      </SubText>
    </Card>
  );
};

export default DashboardStats;

const Card = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  padding: 1.5rem 2.2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: center;
  border-radius: 5;
  border: 1px solid ${(props) => props.theme.colors.gray01};
  ${tutorialHighlight}
`;

const Title = styled.span`
  font-size: 1.2rem;
  font-weight: 500;
`;
const Value = styled.span<{ textLength: number }>`
  font-size: ${(props) =>
    props.textLength >= 9
      ? props.textLength >= 10
        ? "1.5rem"
        : "1.2rem"
      : "2.2rem"};
  font-size: 2rem;
  font-weight: bold;
  box-sizing: border-box;
`;

const ValueWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
  flex-wrap: wrap;

  img {
    width: 15px;
    height: 15px;
  }
`;

const SubText = styled.div`
  font-size: 1rem;
  color: ${(props) => props.theme.colors.gray05};
`;
const Percentage = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "isDecreased"
})<{ isDecreased: boolean }>`
  font-size: 1rem;
  color: ${(props) =>
    props.isDecreased ? props.theme.colors.red : props.theme.colors.green03};
`;
