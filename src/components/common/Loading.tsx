import { Spin } from "antd";
import styled from "styled-components";

interface LoadingProps {
  content?: string;
}

const Loading = ({ content }: LoadingProps) => {
  return (
    <Overlay>
      <ContentWrapper>
        <Spin tip="Loading" size="default" style={{ fontSize: "3rem" }} />
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
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.6);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Message = styled.span`
  font-size: 1.2rem;
  color: #0077c0;
  margin-top: 1rem;
`;
