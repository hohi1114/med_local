import { style } from "@vanilla-extract/css";

export const resizeHandle = style({
  position: "absolute",
  width: "1.5rem",
  padding: "4px 0 0",
  top: 0,
  left: 0,
  bottom: 0,
  zIndex: 100,
  cursor: "ew-resize"
});
