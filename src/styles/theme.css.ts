// tokens/theme.css.ts
import { createThemeContract, createTheme } from "@vanilla-extract/css";

export const vars = createThemeContract({
  colors: {
    primary: "",
    darkPrimary: "",

    blue01: "",
    blue02: "",
    blue03: "",
    blue04: "",
    blue05: "",

    pink01: "",
    pink02: "",
    pink03: "",

    green01: "",
    green02: "",
    green03: "",
    macGreen: "",

    white: "",
    white01: "",
    gray00: "",
    gray0001: "",
    gray01: "",
    gray02: "",
    gray03: "",
    gray04: "",
    gray05: "",
    gray06: "",

    red: "",

    black: "",
    black01: ""
  },
  shadows: {
    small: "",
    medium: "",
    large: ""
  },
  zIndex: {
    rank1: "",
    rank2: "",
    rank3: "",
    rank4: ""
  }
});

export const themeClass = createTheme(vars, {
  colors: {
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
    macGreen: "#00C41E",

    white: "#ffffff",
    white01: "#FAFAFB",
    gray00: "#F9FAFA",
    gray0001: "#F5F6F6",
    gray01: "#F1F1F2",
    gray02: "#E7E7E8",
    gray03: "#D3D4D5",
    gray04: "#ABADAF",
    gray05: "#7D7F83",
    gray06: "#52555A",

    red: "#EF4261",

    black: "#2b2b2b",
    black01: "#333333"
  },
  shadows: {
    small: "0 0 5px rgba(0, 0, 0, 0.1)",
    medium: "0 4px 10px rgba(0, 0, 0, 0.1)",
    large: "0 10px 20px rgba(0, 0, 0, 0.2)"
  },
  zIndex: {
    rank1: "100",
    rank2: "90",
    rank3: "80",
    rank4: "70"
  }
});
