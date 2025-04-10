import { useEffect, useState } from "react";
import styled from "styled-components";
import BaseButton from "../common/button/BaseButton";
import {
  FullDimOverlay,
  TutorialBox,
  TutorialButton,
  TutorialButtonContainer,
  TutorialDescription,
  TutorialProgress,
  TutorialTitle
} from "./style/tutorial.styles";

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
