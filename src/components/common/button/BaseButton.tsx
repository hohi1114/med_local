import { Spin } from "antd";
import { memo, forwardRef } from "react";
import styled from "styled-components";

interface StyledButtonProps {
  color?: string;
  children: React.ReactNode;
  disabled?: boolean;
  type: "button" | "submit" | "reset";
  onClick?: () => void;
  textcolor?: string;
  isLoading?: boolean;
}

const BaseButton = memo(
  forwardRef<HTMLButtonElement, StyledButtonProps>(
    (
      {
        children,
        type,
        disabled,
        color = "#0F52BA",
        textcolor = "#ffffff",
        isLoading,
        onClick,
        ...props
      },
      ref
    ) => {
      return (
        <ButtonContainer
          color={disabled ? "#ffffff" : color}
          textcolor={textcolor}
          type={type}
          ref={ref}
          disabled={disabled}
          onClick={onClick}
          {...props}
        >
          {isLoading ? <Spin size="small" /> : <span>{children}</span>}
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
