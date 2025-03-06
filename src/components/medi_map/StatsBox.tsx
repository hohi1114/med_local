import styled from "styled-components";

export const STATSTYPE = [
  "전체 환자 수",
  "누적 매출액",
  "재방문 환자수",
  "초진 환자 수",
  "전체 인구 수",
  "유입 비율",
];

interface StatsBoxProps {
  title: string;
}
const StatsBox = ({ title }: StatsBoxProps) => {
  return (
    <div
      style={{
        backgroundColor: "#E6F1FD",
        borderRadius: "16px",
        padding: "1.5rem",
        gap: "1rem",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ChipTextStyle>{title}</ChipTextStyle>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <ChipTitleTextStyle>7,265</ChipTitleTextStyle>
        <ChipTextStyle>+11.01%</ChipTextStyle>
        <img
          src="/images/increase.svg"
          alt="increase"
          style={{ width: "1rem", height: "1rem" }}
        />
      </div>
    </div>
  );
};

export default StatsBox;

const ChipTextStyle = styled.span`
  font-size: 1rem;
`;
const ChipTitleTextStyle = styled.span`
  font-size: 1.5rem;
`;
