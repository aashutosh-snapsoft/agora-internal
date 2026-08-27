import { Theme } from "@mui/material";

export const THEMES = { LIGHT: "light", DARK: "dark" };

export const isDark = (theme: Theme) => theme.palette.mode === "dark";
