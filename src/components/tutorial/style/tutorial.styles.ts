import styled, { css } from "styled-components";
import BaseButton from "../../common/button/BaseButton";

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
export const tutorialHighlight = css`
  position: relative;
  z-index: 100;
  border-radius: 8px;
`;

export const FullDimOverlay = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 80;
`;
export const GuideDescription = styled.div`
  border-radius: 6px;
  padding: 0.5rem 0rem;
  font-size: 1.2rem;
  z-index: 101;
  position: relative;
  text-align: center;
  max-width: 80%;
  color: ${(props) => props.theme.colors.white};
`;

export const CloseGuideButton = styled(BaseButton)`
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: ${(props) => props.theme.colors.primary};
  color: ${(props) => props.theme.colors.white};
  max-width: 12rem;
  z-index: 102;
`;
