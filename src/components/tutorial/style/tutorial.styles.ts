import styled, { css } from "styled-components";
import BaseButton from "../../common/button/BaseButton";

export const tutorialHighlightWithBlink = css`
  position: relative;
  z-index: ${(props) => props.theme.zIndex.rank2};
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
  z-index: ${(props) => props.theme.zIndex.rank2};
  border-radius: 8px;
`;

export const FullDimOverlay = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  position: absolute;
  top: 0;
  left: 0;
  z-index: ${(props) => props.theme.zIndex.rank3};
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

export const TutorialBox = styled.div<{ left: string }>`
  position: fixed;
  top: 25%;
  left: ${(props) => props.left};
  transform: translate(-50%, -20%);
  background: white;
  border-radius: 1rem;
  padding: 2.5rem 2rem;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  width: 90%;
  max-width: 420px;
  transition: all 0.3s ease;
  animation: fadeInUp 0.4s ease;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate(-50%, 0%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -20%);
    }
  }
`;

export const TutorialTitle = styled.h3`
  font-size: 1.6rem;
  font-weight: bold;
  color: ${(props) => props.theme.colors.primary};
`;

export const TutorialDescription = styled.p`
  font-size: 1.2rem;
  color: ${(props) => props.theme.colors.gray06};
`;

export const TutorialButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

export const TutorialButton = styled(BaseButton)<{ primary?: boolean }>`
  flex: 1;
  background-color: ${(props) =>
    props.primary ? props.theme.colors.primary : props.theme.colors.gray02};
  color: ${(props) =>
    props.primary ? props.theme.colors.white : props.theme.colors.black};
  box-shadow: ${(props) =>
    props.primary ? `0 4px 12px rgba(0, 123, 255, 0.3)` : "none"};
  transition: background-color 0.2s ease;
`;

export const TutorialProgress = styled.div`
  font-size: 0.9rem;
  color: ${(props) => props.theme.colors.gray04};
  text-align: right;
  margin-bottom: 1rem;
`;
export const TutorialImageContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: ${(props) => props.theme.zIndex.rank4};
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
`;
