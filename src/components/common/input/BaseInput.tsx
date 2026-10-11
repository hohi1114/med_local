import { forwardRef, InputHTMLAttributes } from "react";
import styled, { css } from "styled-components";
import { FieldError } from "react-hook-form";

interface BaseInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: FieldError | string;
  fullWidth?: boolean;
  inputSize?: "small" | "medium" | "large";
}

const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>(
  ({ label, error, fullWidth = true, inputSize = "medium", ...props }, ref) => {
    return (
      <InputContainer fullWidth={fullWidth}>
        {label && <Label>{label}</Label>}
        <StyledInput
          ref={ref}
          $size={inputSize}
          $hasError={!!error}
          {...props}
        />
        {error && <ErrorText>{error as string}</ErrorText>}
      </InputContainer>
    );
  }
);

const inputSizes = {
  small: css`
    padding: 7px 10px;
    font-size: 0.875rem;
  `,
  medium: css`
    padding: 12px 10px;
    font-size: 1.2rem;
  `,
  large: css`
    padding: 16px 12px;
    font-size: 1.4rem;
  `
};

const InputContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "fullWidth"
})<{ fullWidth: boolean }>`
  display: flex;
  flex-direction: column;
  width: ${(props) => (props.fullWidth ? "100%" : "auto")};
  min-width: 20rem;
`;

const Label = styled.label`
  margin-bottom: 8px;
  font-size: 1.2rem;
  color: ${(props) => props.theme.colors.black01};
`;

const StyledInput = styled.input<{
  $size?: "small" | "medium" | "large";
  $hasError?: boolean;
}>`
  ${(props) => inputSizes[props.$size || "medium"]}
  border: 0.5px solid ${(props) => props.theme.colors.gray02};
  background-color: white;
  border-radius: 6px;
  box-sizing: border-box;
  transition: 0.2s ease-in-out;
  width: 100%;

  ${(props) =>
    props.$hasError &&
    css`
      border-color: ${props.theme.colors.red};
    `}

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: ${(props) => props.theme.shadows.small};
  }

  &:disabled {
    background-color: ${(props) => props.theme.colors.gray00};
    cursor: not-allowed;
  }
`;

const ErrorText = styled.span`
  color: ${(props) => props.theme.colors.red};
  font-size: 0.8rem;
  margin-top: 4px;
`;

export default BaseInput;
