import { style, createVar } from "@vanilla-extract/css";

export const buttonColorVar = createVar();
export const buttonTextColorVar = createVar();

export const buttonBase = style({
  height: "3rem",
  width: "100%",
  border: "none",
  borderRadius: "6px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
  cursor: "pointer",
  backgroundColor: buttonColorVar,
  color: buttonTextColorVar,

  fontWeight: 600,
  transition: "background-color 0.3s ease, opacity 0.3s ease",
  ":disabled": {
    opacity: 0.3
  }
});

// 스피너를 위한 스타일
export const buttonSpinner = style({
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
});

// 컨텐츠를 위한 스타일
export const buttonContent = style({
  display: "inline-flex"
});
