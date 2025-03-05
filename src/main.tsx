import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App";
import { ConfigProvider } from "antd";

// Dynamically load Naver Maps API
// @ts-ignore
console.log(
  "VITE_NAVER_MAPS_CLIENT_ID:",
  import.meta.env.VITE_NAVER_MAPS_CLIENT_ID
);

const script = document.createElement("script");
script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${
  import.meta.env.VITE_NAVER_MAPS_CLIENT_ID
}`;
script.async = true;
document.head.appendChild(script);

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
