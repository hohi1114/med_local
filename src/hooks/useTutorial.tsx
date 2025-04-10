import { useEffect, useState } from "react";

interface TutorialProps {
  steps: any;
  showTutorialModal?: boolean;
  onComplate?: () => void;
}
const useTutorial = ({
  steps,
  showTutorialModal = false,
  onComplate
}: TutorialProps) => {
  const [tutorialStep, setTutorialStep] = useState(0);

  const nextStep = () => {
    if (tutorialStep < steps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    }
  };

  const prevStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  };

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
      onComplate && onComplate();
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

  return {
    tutorialStep,
    nextStep,
    prevStep,
    setTutorialStep,
    handleNextStep,
    handlePrevStep
  };
};

export default useTutorial;
