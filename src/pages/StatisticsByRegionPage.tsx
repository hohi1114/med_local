import styled, { keyframes } from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";

export default function StatisticsByRegionPage() {
  return (
    <>
      <ContentHeader title="지역 별 통계" />
      <DashBoardContainer>
        <ComingSoonText>Coming Soon!</ComingSoonText>
      </DashBoardContainer>
    </>
  );
}

// 깜빡이는 효과 (페이드 인 & 아웃)
const fadeInOut = keyframes`
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
`;

// 메인 컨테이너
const DashBoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 80vh;
  justify-content: center;
  align-items: center;
  color: white;
`;

// "Coming Soon!" 스타일링
const ComingSoonText = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  text-transform: uppercase;
  background: linear-gradient(90deg, #9f9ff8, #ccccf9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${fadeInOut} 3s infinite ease-in-out;
  letter-spacing: 3px;
`;
