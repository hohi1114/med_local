import styled from "styled-components";

export const STATSTYPE = [
  { id: 1, title: "내원 환자 수" },
  { id: 2, title: "누적 매출액" },
  { id: 3, title: "내원당 평균 매출액" },
  { id: 4, title: "1인당 평균 매출" },
  { id: 5, title: "재방문 환자수" },
  { id: 6, title: "신규 환자수" },
  { id: 7, title: "전체 인구 수" },
  { id: 8, title: "유입 비율" }
];

interface StatsBoxProps {
  title: string;
  data: string;
}

const StatsBox = ({ title, data }: StatsBoxProps) => {
  /** If the data is too long, calculate font size */
  const calculateFontsize = () => {
    if (data.length > 13) {
      return 1.5;
    } else {
      return 1.5;
    }
  };

  return (
    <StatsBoxContainer>
      <ChipTextStyle>{title}</ChipTextStyle>
      <div style={{ display: "flex", alignItems: "center" }}>
        <ChipTitleTextStyle fontSize={calculateFontsize()}>
          {data}
        </ChipTitleTextStyle>
      </div>
    </StatsBoxContainer>
  );
};

export default StatsBox;

const StatsBoxContainer = styled.div`
  background-color: #e6f1fd;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;
  max-width: 300px;
  box-sizing: border-box;
`;

const ChipTextStyle = styled.span`
  font-size: 1rem;
`;

const ChipTitleTextStyle = styled.span<{ fontSize: number }>`
  font-size: ${(props) => props.fontSize}rem;
`;
