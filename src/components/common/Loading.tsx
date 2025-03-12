import { Spin } from "antd";
import styled from "styled-components";

interface LoadingProps {
  content: string;
}

const Loading = ({ content }: LoadingProps) => {
  return (
    <Overlay>
      <ContentWrapper>
        <Spin tip="Loading" size="large" style={{ fontSize: "3rem" }} />
        <Message>{content}</Message>
      </ContentWrapper>
    </Overlay>
  );
};

export default Loading;

const Overlay = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Message = styled.span`
  font-size: 1.4rem;
  color: #7f7fdb;
  margin-top: 1rem;
`;
