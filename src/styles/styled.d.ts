import type { CSSProp } from "styled-components";
import type { Theme } from "@src/shared/theme";
import { ColorsTypes, ShadowTypes, ZIndexTypes } from "./theme";

declare module "styled-components" {
  export interface DefaultTheme extends Theme {
    colors: ColorsTypes;
    shadows: ShadowTypes;
    zIndex: ZIndexTypes;
  }
}
