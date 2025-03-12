import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App";
import Providers from "./Providers";

// Dynamically load Naver Maps API
// @ts-ignore

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <Providers>
    <App />
  </Providers>

  // </StrictMode>
);
