import { memo, forwardRef } from "react";
import styled from "styled-components";

interface StyledButtonProps {
  color?: string;
  children: React.ReactNode;
  disabled?: boolean;
  type: "button" | "submit" | "reset";
  onClick?: () => void;
  textcolor?: string;
}

const BaseButton = memo(
  forwardRef<HTMLButtonElement, StyledButtonProps>(
    (
      {
        children,
        type,
        disabled,
        color = "#9F9FF8",
        textcolor = "#ffffff",
        onClick,
        ...props
      },
      ref
    ) => {
      return (
        <ButtonContainer
          color={disabled ? "#F1F1F2" : color}
          textcolor={textcolor}
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
  width: 100%;
  border: none;
  border-radius: 6px;
  color: ${({ textcolor }) => textcolor};
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  cursor: pointer;
  font-weight: bold;
  background-color: ${({ color }) => color};
`;
const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02); /* 부드러운 배경 */
`;

const LoginWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  background-color: #ffffff;
  width: 100%;
  max-width: 28rem; /* 크기 제한 */
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  text-align: center;

  @media (max-width: 480px) {
    padding: 2rem;
    max-width: 90%;
  }
`;
