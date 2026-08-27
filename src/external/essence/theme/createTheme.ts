import {
	createTheme,
	responsiveFontSizes,
	ThemeOptions,
	Theme,
} from "@mui/material";
import merge from "lodash.merge";
import { shadows } from "./shadows";
import themesOptions from "./themeOptions";
import componentsOverride from "./components";
import { THEMES } from "@/external/essence/utils/constants";
import { typography } from "./typography";
import {
	Button,
	ButtonBase,
	ButtonGroup,
	IconButton,
	LoadingButton,
} from "./components/button";
import Alert from "./components/alert";
import { PaletteOptions } from "@mui/material/styles";

const baseOptions = {
	direction: "ltr",
	typography: { fontFamily: "Satoshi Variable" },
	breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
};

export type ThemeSettings = {
	theme: string;
	// activeLayout?: string;
	direction: "ltr" | "rtl";
	responsiveFontSizes?: boolean;
};

export interface CustomThemeOptions extends ThemeOptions {
	palette: PaletteOptions & {
		brand: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
		};
	};
}

export interface CustomTheme extends Theme {
	palette: Theme["palette"] & {
		brand: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
		};
	};
}

export type CustomTypography = typeof typography;

export const createCustomTheme = (settings: ThemeSettings): CustomTheme => {
	/**
	 * settings.theme value is 'light' or 'dark'
	 * update settings in contexts/settingsContext.tsx
	 */
	let themeOptions = themesOptions[settings.theme];

	if (!themeOptions) {
		themeOptions = themesOptions[THEMES.LIGHT];
	}

	const baseOptionsWithTypography = {
		...baseOptions,
		typography,
	};

	const mergedThemeOptions = merge(
		{},
		baseOptionsWithTypography,
		themeOptions,
		{
			direction: settings.direction,
		}
	) as CustomThemeOptions;

	let theme = createTheme(mergedThemeOptions) as CustomTheme;

	// OVERRIDE SHADOWS
	theme.shadows = shadows(theme);

	// OVERRIDE COMPONENTS
	theme.components = componentsOverride(theme);

	if (settings.responsiveFontSizes) {
		theme = responsiveFontSizes(theme);
	}

	theme.components = {
		MuiCssBaseline: {
			styleOverrides: `
				@layer base {
					html, body {
						font-family: Satoshi Variable !important;
					}
				}
			`,
		},
		// OVERRIDES BUTTON COMPONENTS USING ESSENCE THEME
		MuiButton: Button(theme),
		MuiButtonBase: ButtonBase(theme),
		MuiButtonGroup: ButtonGroup(theme),
		MuiIconButton: IconButton(theme),
		MuiLoadingButton: LoadingButton(theme),
		MuiAlert: Alert(theme),
		MuiDialog: {
			styleOverrides: {
				paper: {
					borderRadius: theme.spacing(3),
					background: theme.palette.constants.white,
					boxShadow: "0px 2px 4px 0px rgba(0, 0, 0, 0.10)",
				},
			},
		},
		// Add styling for Select components
		MuiSelect: {
			styleOverrides: {
				select: {
					fontFamily: "Satoshi Variable",
					fontSize: "0.875rem", // 14px
					fontWeight: 500,
				},
			},
		},
		MuiMenuItem: {
			styleOverrides: {
				root: {
					fontFamily: "Satoshi Variable",
					fontSize: "0.875rem", // 14px
					fontWeight: 400,
					"&.Mui-selected": {
						fontWeight: 500,
					},
				},
			},
		},
		MuiSwitch: {
			styleOverrides: {
				switchBase: {
					// Thumb color when OFF
					color: theme.palette.grey[500],
					// Thumb color when ON
					'&.Mui-checked': {
					  color: theme.palette.grey[800],
					},
					// Track color when ON
					'&.Mui-checked + .MuiSwitch-track': {
					  backgroundColor: theme.palette.grey[400],
					},
					// Track color when OFF
					'&.Mui-disabled + .MuiSwitch-track': {
					  backgroundColor: theme.palette.grey[800],
					},
				  },
				track: {
					borderRadius: 16,
					backgroundColor: theme.palette.grey[400],
				},
			},
		},
		MuiTooltip: {
			styleOverrides: {
				tooltip: {
					backgroundColor: theme.palette.grey[800],
				},
			},
		},
	};

	return theme;
};
