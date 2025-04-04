import styled from "styled-components";

interface SegmentedControlProps {
  options: string[];
  selected: string;
  onChange?: (value: string) => void;
}

const BaseToggle: React.FC<SegmentedControlProps> = ({
  options,
  selected,
  onChange
}) => {
  return (
    <SegmentedWrapper>
      {options.map((option, index) => (
        <SegmentedButton
          key={index}
          isSelected={selected === option}
          onClick={() => onChange?.(option)}
        >
          {option}
        </SegmentedButton>
      ))}
    </SegmentedWrapper>
  );
};

export default BaseToggle;

const SegmentedWrapper = styled.div`
  display: flex;
  background: #f1f1f1;
  border-radius: 8px;
  border-radius: 50px;
  width: fit-content;
  padding: 0.2rem;
`;

const SegmentedButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== "isSelected"
})<{ isSelected: boolean }>`
  padding: 0.5rem 1.2rem;
  border-radius: 50px;
  font-size: 1.2rem;
  font-weight: ${({ isSelected }) => (isSelected ? "bold" : "normal")};
  border: none;
  cursor: pointer;
  background: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.black01 : "transparent"};
  color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.white : theme.colors.black01};

  &:hover {
    background: ${({ isSelected, theme }) =>
      isSelected ? theme.colors.black01 : theme.colors.gray02};
  }
`;
