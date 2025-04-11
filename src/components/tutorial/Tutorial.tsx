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
  tutorialStep: number;
  showTutorial?: boolean;
  handleNextStep: () => void;
  handlePrevStep: () => void;
}
const Tutorial = ({
  steps,
  tutorialStep,
  showTutorial,
  handleNextStep,
  handlePrevStep
}: TutorialProps) => {
  // 튜토리얼 모달이 보이지 않으면 렌더링하지 않음
  if (!showTutorial) return null;

  // 특별한 배경이 필요한 경우
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
