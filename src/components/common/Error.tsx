import styled from "styled-components";

interface ErrorProps {
  status: string;
  message: string;
}
const Error = ({ status, message }: ErrorProps) => {
  return (
    <DashBoardContainer>
      <ComingSoonText>Error!</ComingSoonText>
      <span>{status}</span>
      <span>{message}</span>
    </DashBoardContainer>
  );
};

export default Error;

// 메인 컨테이너
const DashBoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 80vh;
  justify-content: center;
  align-items: center;
`;

// "Coming Soon!" 스타일링
const ComingSoonText = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  text-transform: uppercase;
  background: #e53e3e;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 3px;
`;
