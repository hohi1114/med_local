import userStore from "../../store/userStore";
import {
  TutorialBox,
  TutorialButton,
  TutorialButtonContainer,
  TutorialDescription,
  TutorialTitle
} from "./style/tutorial.styles";

const TutorialStartModal = () => {
  const { hasGuided, setGuided, setStartTutorial } = userStore();

  const handlSkipTutorialButton = () => {
    localStorage.setItem("tutorial", "true");
    setGuided(true);
  };

  const handleStartTutorialButton = () => {
    localStorage.setItem("tutorial", "true");
    setGuided(true);
    setStartTutorial(true);
  };

  return (
    !hasGuided && (
      <TutorialBox left="50%">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <TutorialTitle>오비스는 처음이신가요?</TutorialTitle>
          <TutorialDescription>
            오비스 튜토리얼을 통해 오비스의 다양한 기능을 알려드리겠습니다.
          </TutorialDescription>
          <TutorialButtonContainer>
            <TutorialButton type="button" onClick={handlSkipTutorialButton}>
              Skip
            </TutorialButton>

            <TutorialButton
              primary
              type="button"
              onClick={handleStartTutorialButton}
            >
              시작하기
            </TutorialButton>
          </TutorialButtonContainer>
        </div>
      </TutorialBox>
    )
  );
};

export default TutorialStartModal;
