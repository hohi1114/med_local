import styled from "styled-components";

export const STATSTYPE = [
  { id: 1, title: "전체 환자 수" },
  { id: 2, title: "누적 매출액" },
  { id: 3, title: "재방문 환자수" },
  { id: 4, title: "초진 환자 수" },
  { id: 5, title: "전체 인구 수" },
  { id: 6, title: "유입 비율" },
];

interface StatsBoxProps {
  title: string;
  data: number;
}
const StatsBox = ({ title, data }: StatsBoxProps) => {
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
        <ChipTitleTextStyle>{data}</ChipTitleTextStyle>
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
