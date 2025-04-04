import { Card } from "antd";
import styled from "styled-components";
import BaseButton from "./button/BaseButton";
import { useNavigate } from "react-router-dom";

const RequireSubscribe = () => {
  const navigate = useNavigate();
  return (
    <Overlay>
      <CardContainer>
        <CardTitle>구독이 필요한 서비스입니다</CardTitle>
        <CardDescription>
          더 많은 기능과 데이터를 활용하기 위해 구독이 필요합니다.
        </CardDescription>
        <SubscribeButton type="button" onClick={() => navigate("/membership")}>
          구독하러 가기
        </SubscribeButton>
      </CardContainer>
    </Overlay>
  );
};

export default RequireSubscribe;

const Overlay = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
`;

const CardContainer = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => props.theme.colors.white};
  max-width: 43rem;
  width: 70%;
  max-height: 30rem;
  height: auto;
  padding: 2.5rem 3rem;
  box-shadow: ${(props) => props.theme.shadows.medium};
  border-radius: 16px;
  text-align: center;

  .ant-card-body {
    width: 100%;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`;

const CardTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: ${(props) => props.theme.colors.primary};
`;

const CardDescription = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: ${(props) => props.theme.colors.gray05};
`;

const SubscribeButton = styled(BaseButton)`
  min-width: 180px;
  height: 48px;
  font-size: 1.1rem;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;
