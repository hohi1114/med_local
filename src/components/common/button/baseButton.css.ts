import { style, createVar } from "@vanilla-extract/css";

// Create a CSS variable
export const buttonColorVar = createVar();

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
  fontWeight: 600,
  transition: "background-color 0.3s ease, opacity 0.3s ease",
  ":disabled": {
    opacity: 0.3
  }
});

export const buttonPrimary = style({
  backgroundColor: "var(--primary-color)",
  color: "var(--white-color)"
});

export const buttonTextColor = style({
  color: "var(--white-color)"
});

export const buttonColorStyle = style({
  backgroundColor: buttonColorVar
});
