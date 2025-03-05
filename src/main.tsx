import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App";
import { ConfigProvider } from "antd";

// Dynamically load Naver Maps API
// @ts-ignore


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/** Ant Design etting */}
    <ConfigProvider
      theme={{
        token: { colorPrimary: "#9F9FF8", fontFamily: `"Inter", sans-serif` },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>
);
