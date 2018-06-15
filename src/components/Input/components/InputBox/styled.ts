import idx from "idx";
import * as React from "react";
import {
  override,
  styled,
  StyledComponent,
  StyledProps,
  Theme
} from "../../../styles";

// @ts-ignore: module missing definition file
import AutosizeInput from "react-input-autosize";
import { SearchIcon as Icon } from "./SeachIcon";

export interface InputContainerProps extends StyledProps<HTMLFormElement> {
  isDropdownOpen: boolean;
}

export const InputContainer = styled<InputContainerProps, "form">("form")(
  {
    "&:hover": {
      boxShadow: "0 3px 8px 0 rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.08)"
    },
    borderRadius: 2,
    boxShadow: "0 2px 2px 0 rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.08)",
    padding: "3px 9px",
    transition: "box-shadow 200ms cubic-bezier(0.4, 0.0, 0.2, 1)"
  },
  ({ isDropdownOpen }) =>
    isDropdownOpen
      ? {
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0
        }
      : {},
  override
);

export const SearchContainer = styled("div")({
  alignItems: "center",
  alignContent: "stretch",
  display: "flex",
  flexWrap: "nowrap",
  justifyContent: "space-between",
  width: "100%"
});

const searchIconSize = "1.5em";

export const InputInnerContainer = styled<StyledProps<HTMLDivElement>, "div">(
  "div"
)(
  {
    overflow: "auto"
  },
  override
);

export const Input = styled(AutosizeInput)({
  "& input:focus, & input:active": {
    outline: "none"
  }
});

export const inputResetStyles = {
  container: {
    "& > div": {
      // fixes sizing bug in firefox
      overflow: "unset !important"
    },
    background: "none",
    maxWidth: "100%",
    padding: 0
  },
  input: {
    backgroundColor: "transparent",
    border: "none",
    borderRadius: 0,
    color: "currentcolor",
    fontFamily: "inherit",
    fontSize: "1em",
    height: 34,
    padding: 0,
    textRendering: "optimizeLegibility"
  }
};

export interface SearchButtonProps extends StyledProps<HTMLButtonElement> {}

export const SearchButton = styled<SearchButtonProps, "button">("button")(
  {
    "&:focus, &:active": {
      outline: "none"
    },
    background: "transparent",
    border: "none",
    color: "#808080",
    cursor: "pointer",
    fontSize: "1em",
    height: searchIconSize,
    minHeight: searchIconSize,
    minWidth: searchIconSize,
    padding: 0,
    width: searchIconSize
  },
  ({ theme }) => ({
    "&:hover": {
      // @ts-ignore: idx
      color: idx(theme, _ => _.colors.brand.primary) || "#333"
    }
  }),
  override
);

export const SearchIcon = styled(Icon)({
  height: searchIconSize,
  minHeight: searchIconSize,
  minWidth: searchIconSize,
  width: searchIconSize
});

export const ButtonContainer = styled("div")({
  display: "inline-flex",
  justifyContent: "space-between"
});