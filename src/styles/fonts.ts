import { css } from "styled-components";
import PrettendardRegular from "../fonts/Pretendard-Regular.woff";
import PrettendardBold from "../fonts/Pretendard-Bold.woff";
import PrettendardLight from "../fonts/Pretendard-Light.woff";
import PrettendardSemiBold from "../fonts/Pretendard-SemiBold.woff";
import PrettendardThin from "../fonts/Pretendard-Thin.woff";

export const fonts = css`
  @font-face {
    font-family: "Pretendard";
    src: local("Pretendard"), url(${PrettendardThin}) format("woff");
    font-weight: 100;
    font-style: normal;
  }

  @font-face {
    font-family: "Pretendard";
    src: local("Pretendard"), url(${PrettendardLight}) format("woff");
    font-weight: 300;
    font-style: normal;
  }

  @font-face {
    font-family: "Pretendard";
    src: local("Pretendard"), url(${PrettendardRegular}) format("woff");
    font-weight: 400;
    font-style: normal;
  }

  @font-face {
    font-family: "Pretendard";
    src: local("Pretendard"), url(${PrettendardSemiBold}) format("woff");
    font-weight: 600;
    font-style: normal;
  }

  @font-face {
    font-family: "Pretendard";
    src: local("Pretendard"), url(${PrettendardBold}) format("woff");
    font-weight: 700;
    font-style: normal;
  }
`;
