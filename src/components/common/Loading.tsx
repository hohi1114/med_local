import { Spin } from "antd";
import styled from "styled-components";

interface LoadingProps {
  content?: string;
}

const Loading = ({ content }: LoadingProps) => {
  return (
    <Overlay>
      <ContentWrapper>
        <Spin tip="Loading" size="large" style={{ fontSize: "3rem" }} />
        {content && <Message>{content}</Message>}
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
  background-color: transparent;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Message = styled.span`
  font-size: 1.4rem;
  color: #0077c0;
  margin-top: 1rem;
`;
