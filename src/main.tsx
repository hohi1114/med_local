import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import Providers from "./Providers";

//dayjs 설정
import dayjs from "dayjs";
import isLeapYear from "dayjs/plugin/isLeapYear";
import "dayjs/locale/ko";

dayjs.extend(isLeapYear);
dayjs.locale("ko");

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <Providers>
    <App />
  </Providers>

  // </StrictMode>
);
