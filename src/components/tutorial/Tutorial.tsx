import { useEffect, useState } from "react";
import styled from "styled-components";
import BaseButton from "../common/button/BaseButton";
import { FullDimOverlay } from "./style/tutorial.styles";

interface TutorialProps {
  steps: any;
  onComplete?: () => void;
  tutorialStep: number;
  showTutorial?: boolean;
  setTutorialStep: (step: number) => void;
}
const Tutorial = ({
  steps,
  tutorialStep,
  setTutorialStep,
  showTutorial,
  onComplete
}: TutorialProps) => {
  const [showTutorialModal, setShowTutorialModal] = useState(showTutorial);

  const handleNextStep = () => {
    if (tutorialStep < steps.length - 1) {
      setTutorialStep(tutorialStep + 1);

      if (steps[tutorialStep + 1].targetRef?.current) {
        steps[tutorialStep + 1].targetRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    } else {
      setShowTutorialModal(false);
      if (onComplete) onComplete();
    }
  };

  const handlePrevStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);

      if (steps[tutorialStep - 1].targetRef?.current) {
        steps[tutorialStep - 1].targetRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    }
  };

  useEffect(() => {
    if (showTutorialModal && steps[tutorialStep]?.targetRef?.current) {
      const currentElement = steps[tutorialStep].targetRef.current;
      currentElement.classList.add("tutorial-highlight");

      return () => {
        currentElement.classList.remove("tutorial-highlight");
      };
    }
  }, [tutorialStep, showTutorialModal, steps]);

  // 튜토리얼 모달이 보이지 않으면 렌더링하지 않음
  if (!showTutorialModal) return null;

  // 특별한 배경이 필요한 경우 (예: 아이템 클릭 유도)
  const needsSpecialBackground = steps[tutorialStep]?.specialBackground;
  return (
    <>
      {!needsSpecialBackground && <FullDimOverlay />}
      <TutorialBox left={steps[tutorialStep]?.boxPosition || "50%"}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <TutorialTitle>{steps[tutorialStep].title}</TutorialTitle>
          <TutorialDescription>
            {steps[tutorialStep].description}
          </TutorialDescription>
          <TutorialProgress>
            {tutorialStep + 1} / {steps.length}
          </TutorialProgress>
          <TutorialButtonContainer>
            {tutorialStep > 0 && (
              <TutorialButton type="button" onClick={handlePrevStep}>
                이전
              </TutorialButton>
            )}
            <TutorialButton primary type="button" onClick={handleNextStep}>
              {tutorialStep === steps.length - 1 ? "다음 메뉴로" : "다음"}
            </TutorialButton>
          </TutorialButtonContainer>
        </div>
      </TutorialBox>
    </>
  );
};

export default Tutorial;

const TutorialBox = styled.div<{ left: string }>`
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

const TutorialTitle = styled.h3`
  margin: 0;
  font-size: 1.6rem;
  font-weight: bold;
  color: ${(props) => props.theme.colors.primary};
`;

const TutorialDescription = styled.p`
  font-size: 1.2rem;
  color: ${(props) => props.theme.colors.gray06};
`;

const TutorialProgress = styled.div`
  font-size: 0.9rem;
  color: ${(props) => props.theme.colors.gray04};
  text-align: right;
  margin-bottom: 1rem;
`;
const TutorialButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

const TutorialButton = styled(BaseButton)<{ primary?: boolean }>`
  flex: 1;
  background-color: ${(props) =>
    props.primary ? props.theme.colors.primary : props.theme.colors.gray02};
  color: ${(props) =>
    props.primary ? props.theme.colors.white : props.theme.colors.black};
  box-shadow: ${(props) =>
    props.primary ? `0 4px 12px rgba(0, 123, 255, 0.3)` : "none"};
  transition: background-color 0.2s ease;
`;
