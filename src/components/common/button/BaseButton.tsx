import { memo, forwardRef } from "react";
import styled from "styled-components";

interface StyledButtonProps {
  color?: string;
  children: React.ReactNode;
  disabled: boolean;
  type: "button" | "submit" | "reset";
  onClick?: () => void;
}

const BaseButton = memo(
  forwardRef<HTMLButtonElement, StyledButtonProps>(
    (
      { children, type, disabled, color = "#9F9FF8", onClick, ...props },
      ref
    ) => {
      return (
        <ButtonContainer
          color={color}
          type={type}
          ref={ref}
          disabled={disabled}
          onClick={onClick}
          {...props}
        >
          <span>{children}</span>
        </ButtonContainer>
      );
    }
  )
);

BaseButton.displayName = "BaseButton";

export default BaseButton;

const ButtonContainer = styled.button<StyledButtonProps>`
  height: 3rem;
  width: 19rem;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  cursor: pointer;
  background-color: ${({ color }) => color};
`;
