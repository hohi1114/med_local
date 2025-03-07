import { Spin } from "antd";

interface LoadingProps {
  content: string;
}
const Loading = ({ content }: LoadingProps) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh"
      }}
    >
      <Spin tip="Loading" size="large">
        {content}
      </Spin>
    </div>
  );
};

export default Loading;
