import { Spin } from "antd";
import { memo, forwardRef } from "react";
import styled from "styled-components";

interface StyledButtonProps {
  color?: string | ((props: any) => string);
  children: React.ReactNode;
  disabled?: boolean;
  type: "button" | "submit" | "reset";
  onClick?: () => void;
  textcolor?: string | ((props: any) => string);
  isLoading?: boolean;
}

const BaseButton = memo(
  forwardRef<HTMLButtonElement, StyledButtonProps>(
    (
      {
        children,
        type,
        disabled,
        color = (props) => props.theme.colors.primary,
        textcolor = (props) => props.theme.colors.white,
        isLoading,
        onClick,
        ...props
      },
      ref
    ) => {
      return (
        <ButtonContainer
          color={color}
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

const ButtonContainer = styled.button.withConfig({
  shouldForwardProp: (prop) => !["color", "textcolor"].includes(prop)
})<StyledButtonProps>`
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
  font-weight: 600;
  background-color: ${({ color }) => color};
  transition: background-color 0.3s ease, opacity 0.3s ease;

  &:disabled {
    opacity: 0.3;
  }
`;
