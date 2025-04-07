import styled from "styled-components";

export const STATSTYPE = [
  { id: 1, title: "내원 횟수" },
  { id: 2, title: "누적 매출액" },
  { id: 3, title: "내원당 평균 매출액" },
  { id: 4, title: "1인당 평균 매출액" },
  { id: 5, title: "재방문 환자수" },
  { id: 6, title: "신규 환자수" },
  { id: 7, title: "지역 매출 순위" },
  { id: 8, title: "유입 비율" }
];

interface StatsBoxProps {
  title: string;
  data: string;
  diffRateData?: number | null;
  disabledCompare?: boolean;
}

const StatsBox = ({
  title,
  data,
  diffRateData,
  disabledCompare
}: StatsBoxProps) => {
  const fontSize = data?.length >= 15 ? 1.3 : 1.5;
  return (
    <StatsBoxContainer
      isDecreased={diffRateData ? diffRateData < 0 : false}
      disabledCompare={disabledCompare}
    >
      <TitleContainer>
        <ChipTextStyle>{title}</ChipTextStyle>
        {!disabledCompare &&
          diffRateData !== 0 &&
          diffRateData !== null &&
          diffRateData !== undefined && (
            <DiffRateContainer>
              <img
                src="/images/bendedArrow.svg"
                alt={diffRateData >= 0 ? "increase" : "decrease"}
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  marginRight: "2px",
                  transform: diffRateData >= 0 ? "rotate(180deg)" : "none"
                }}
              />
              <DiffRateValue>{diffRateData}%</DiffRateValue>
            </DiffRateContainer>
          )}
      </TitleContainer>

      <DataContainer>
        <ChipTitleTextStyle fontSize={fontSize}>{data}</ChipTitleTextStyle>
      </DataContainer>
    </StatsBoxContainer>
  );
};

export default StatsBox;

const StatsBoxContainer = styled.div.withConfig({
  shouldForwardProp: (prop) =>
    prop !== "isDecreased" && prop !== "disabledCompare"
})<{ isDecreased: boolean; disabledCompare?: boolean }>`
  background-color: ${(props) =>
    props.disabledCompare
      ? props.theme.colors.gray00
      : props.isDecreased
      ? props.theme.colors.pink01
      : props.theme.colors.blue01};

  border-radius: 16px;
  padding: 1.5rem 0.8rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 25rem;
  box-sizing: border-box;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DiffRateContainer = styled.div`
  display: flex;
  align-items: center;
`;

const DiffRateValue = styled.div`
  font-size: 11px;
  color: ${(props) => props.theme.colors.black01};
`;

const ChipTextStyle = styled.span`
  font-size: 1rem;
`;

const ChipTitleTextStyle = styled.span<{ fontSize: number }>`
  font-size: ${(props) => props.fontSize}rem;
`;

const DataContainer = styled.div`
  display: flex;
  align-items: center;
`;
