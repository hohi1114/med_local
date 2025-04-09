import { useState } from "react";

interface TutorialProps {
  steps: any;
}
const useTutorial = ({ steps }: TutorialProps) => {
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

  return {
    tutorialStep,
    nextStep,
    prevStep,
    setTutorialStep
  };
};

export default useTutorial;
