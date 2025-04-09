// styles/highlight.ts
import { css } from "styled-components";

export const tutorialHighlightWithBlink = css`
  position: relative;
  z-index: 100;
  box-shadow: 0 0 0 5px rgba(24, 144, 255, 0.5);
  border-radius: 3px;
  animation: highlight-blink 1.2s ease-in-out infinite;

  @keyframes highlight-blink {
    0%,
    100% {
      box-shadow: 0 0 0 5px rgba(24, 144, 255, 0.5);
    }
    50% {
      box-shadow: 0 0 0 5px rgba(24, 144, 255, 0.2);
    }
  }
`;

export const dimBackgroundStyle = css`
  display: flex;
  height: 100%;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 80;
`;
export const tutorialHighlight = css`
  position: relative;
  z-index: 100;
  border-radius: 8px;
`;
