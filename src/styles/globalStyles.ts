import { createGlobalStyle } from "styled-components";
import { fonts } from "./fonts";

export const GlobalStyles = createGlobalStyle`
  :root {
    font-size: 12px;
  }

  html, body {
    height: 100%;
    min-height: 100%;
    margin: 0;
    padding: 0;
    background-color: #fafafb;
    font-family: "Pretendard", sans-serif;
  }
  * {
    font-family: "Pretendard", sans-serif; 
  }

  ${fonts}
`;
