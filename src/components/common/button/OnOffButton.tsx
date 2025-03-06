import styled from "styled-components";

interface OnOffButtonProps {
  imagePath: string;
  handleClickButton: () => void;
}

const OnOffButton = ({ imagePath, handleClickButton }: OnOffButtonProps) => {
  return (
    <OnOffContainer onClick={handleClickButton}>
      <img src={imagePath} style={{ width: "2.5rem", height: "2.5rem" }} />
    </OnOffContainer>
  );
};

export default OnOffButton;

const OnOffContainer = styled.div`
  background-color: white;
  border-radius: 100%;
  padding: 0.8rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
`;
