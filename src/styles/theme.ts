import { DefaultTheme } from "styled-components";

const colors = {
  primary: "#3897f0",
  darkPrimary: "#2a7ac2",

  blue01: "#e6f1fd",
  blue02: "#92BFFF",
  blue03: "#AEC7ED",
  blue04: "#0077C0",
  blue05: "#22577A",

  pink01: "#FFEAE8",
  pink02: "#E4A9FF",
  pink03: "#F4A7B9",

  green01: "#96E2D6",
  green02: "#94E9B8",
  green03: "#30bf78",

  white: "#ffffff",
  white01: "#FAFAFB",
  gray00: "#F9FAFA",
  gray01: "#F1F1F2",
  gray02: "#E7E7E8",
  gray03: "#D3D4D5",
  gray04: "#ABADAF",
  gray05: "#7D7F83",
  gray06: "#52555A",

  red: "#EF4261",

  black: "#2b2b2b",
  black01: "#333333"
};

const shadows = {
  small: "0 0 5px rgba(0, 0, 0, 0.1)",
  medium: "0 4px 10px rgba(0, 0, 0, 0.1)",
  large: "0 10px 20px rgba(0, 0, 0, 0.2)"
};

export type ColorsTypes = typeof colors;
export type ShadowTypes = typeof shadows;
export const theme: DefaultTheme = {
  colors,
  shadows
};
