import { alpha } from "@mui/material/styles";

declare module "@mui/material/styles" {
	interface PaletteColor {
		25: string;
		50: string;
		100: string;
		200: string;
		300: string;
		400: string;
		500: string;
		600: string;
		700: string;
		800: string;
		900: string;
	}

	interface TypeText {
		linked: string;
		hardCoded: string;
		dataSourced: string;
		textReverse: string;
	}

	interface TypeBackground {
		default: string;
		paper: string;
		primary: string;
		100: string;
		200: string;
		300: string;
	}

	interface Palette {
		accent: {
			primary: string;
			secondary: string;
		};
		divider: string;
		border: {
			primary: string;
		};
		constants: {
			white: string;
			black: string;
		};
	}

	interface PaletteOptions {
		accent?: {
			primary: string;
			secondary: string;
		};
		divider?: string;
		border?: {
			primary: string;
		};
	}
}

type ColorAsHex = string;

export type BaseColorScheme = {
	25: ColorAsHex;
	50: ColorAsHex;
	100: ColorAsHex;
	200: ColorAsHex;
	300: ColorAsHex;
	400: ColorAsHex;
	500: ColorAsHex;
	600: ColorAsHex;
	700: ColorAsHex;
	800: ColorAsHex;
	900: ColorAsHex;
};

export type ColorScheme = BaseColorScheme & {
	main: ColorAsHex;
};

export const grey: BaseColorScheme = {
	25: "#F9FAFB",
	50: "#F6F7F8",
	100: "#f3f4f6",
	200: "#e5e7eb",
	300: "#d1d5db",
	400: "#9ca3af",
	500: "#6b7280",
	600: "#4b5563",
	700: "#374151",
	800: "#1f2937",
	900: "#111827",
};

export const primary: ColorScheme = {
	25: grey[25],
	50: grey[50],
	100: grey[100],
	200: grey[200],
	300: grey[300],
	400: grey[400],
	500: grey[500],
	600: grey[600],
	700: grey[700],
	800: grey[800],
	900: grey[900],
	main: grey[900],
};
export const brand: ColorScheme = {
	25: "#AFFF481A",
	50: "#AFFF4826",
	100: "#AFFF4840",
	200: "#AFFF4866",
	300: "#AFFF4899",
	400: "#AFFF48CC",
	500: "#AFFF48",
	600: "#95E52E",
	700: "#5E9C11",
	800: "#355908",
	900: "#223D00",
	main: "#AFFF48",
};

export const success: ColorScheme = {
	25: "#F1FEF5",
	50: "#E3FDEB",
	100: "#CDFBDB",
	200: "#9DF7C2",
	300: "#6AE9AA",
	400: "#43D49A",
	500: "#11b886",
	600: "#0C9E80",
	700: "#088477",
	800: "#056A6A",
	900: "#035058",
	main: "#11b886",
};

export const warning: ColorScheme = {
	25: "#FFFCF5",
	50: "#FFF8E",
	100: "#FFF8E6",
	200: "#FFEBB3",
	300: "#FEDE80",
	400: "#FED14D",
	500: "#FEBF06",
	600: "#DB7E24",
	700: "#B75F19",
	800: "#93440F",
	900: "#7A3109",
	main: "#FEBF06",
};

export const error: ColorScheme = {
	25: "#FEF6F8",
	50: "#FEF1F4",
	100: "#FDE8ED",
	200: "#FBD5DE",
	300: "#F7A6BA",
	400: "#F37795",
	500: "#EF4770",
	600: "#EB194C",
	700: "#C0113C",
	800: "#910D2D",
	900: "#63091F",
	main: "#EF4770",
};

export const constants: {
	white: ColorAsHex;
	black: ColorAsHex;
} = {
	white: "#fff",
	black: grey[900],
};

export const secondary: ColorScheme = {
	...grey,
	main: "#F1F5F9",
};

export const info: {
	light: ColorAsHex;
	main: ColorAsHex;
	dark: ColorAsHex;
} = {
	light: "#F4F4FF",
	main: "#8C8DFF",
	dark: "#0C53B7",
};

export type ThemeBaseColorScheme = {
	primary: ColorAsHex;
	secondary: ColorAsHex;
	disabled: ColorAsHex;
	danger: ColorAsHex;
	linked: ColorAsHex;
	hardCoded: ColorAsHex;
	dataSourced: ColorAsHex;
	textReverse: ColorAsHex;
};

export const textLight: ThemeBaseColorScheme = {
	primary: grey[900],
	secondary: grey[500],
	disabled: grey[200],
	danger: error[500],
	linked: "#447A00",
	hardCoded: "#136CCC",
	dataSourced: error[700],
	textReverse: constants.white,
};

// FOR DARK THEME TEXT COLORS
export const textDark: ThemeBaseColorScheme = {
	primary: "#ffffff",
	secondary: grey[400],
	disabled: grey[200],
	danger: error[500],
	linked: primary[500],
	hardCoded: "#47E0FF",
	dataSourced: error[500],
	textReverse: constants.black,
};

export type ThemeActionColorScheme = {
	focusOpacity: number;
	hoverOpacity: number;
	disabledOpacity: number;
	selectedOpacity: number;
	activatedOpacity: number;
	disabled?: ColorAsHex;
	selected: ColorAsHex;
	focus: ColorAsHex;
	hover: ColorAsHex;
	active: ColorAsHex;
	disabledBackground: ColorAsHex;
};

// FOR LIGHT THEME ACTION COLORS
export const actionLight: ThemeActionColorScheme = {
	focusOpacity: 0.12,
	hoverOpacity: 0.04,
	disabledOpacity: 0.38,
	selectedOpacity: 0.08,
	activatedOpacity: 0.12,
	disabled: grey[200],
	selected: grey[50],
	focus: alpha(grey[900], 0.12),
	hover: alpha(grey[900], 0.04),
	active: alpha(grey[900], 0.54),
	disabledBackground: alpha(grey[900], 0.12),
};

// FOR DARK THEME ACTION COLORS
export const actionDark: ThemeActionColorScheme = {
	focusOpacity: 0.12,
	hoverOpacity: 0.04,
	disabledOpacity: 0.38,
	selectedOpacity: 0.16,
	activatedOpacity: 0.24,
	selected: grey[700],
	// disabled: grey[200],
	focus: alpha(grey[100], 0.12),
	hover: alpha(grey[100], 0.04),
	active: alpha(grey[100], 0.54),
	disabledBackground: alpha(grey[100], 0.12),
};

export const accentLight: {
	primary: ColorAsHex;
	secondary: ColorAsHex;
} = {
	primary: primary.main,
	secondary: grey[100],
};

export const accentDark: {
	primary: ColorAsHex;
	secondary: ColorAsHex;
} = {
	primary: brand.main,
	secondary: grey[100],
};

export const dividerLight: ColorAsHex = grey[200];

export const dividerDark: ColorAsHex = grey[700];

export const borderLight: {
	primary: ColorAsHex;
} = {
	primary: grey[200],
};

export const borderDark: {
	primary: ColorAsHex;
} = {
	primary: grey[700],
};

// export const buttonLight = {
//   primary: {
//     text: "#fff",
//     background: primary.main,
//   },
// };

// export const buttonDark = {
//   primary: {
//     text: grey[200],
//     background: brand.main,
//   },
// };

// COMMON COLOR PALETTE
const palette: {
	constants: any;
	brand: ColorScheme;
	grey: BaseColorScheme;
	info: {
		light: ColorAsHex;
		main: ColorAsHex;
		dark: ColorAsHex;
	};
	error: ColorScheme;
	primary: ColorScheme;
	success: ColorScheme;
	warning: ColorScheme;
	secondary: ColorScheme;
} = {
	constants,
	brand,
	grey,
	info,
	error,
	primary,
	success,
	warning,
	secondary,
};

// LIGHT THEME COLOR PALETTE
export const lightPalette = {
	...palette,
	mode: "light",
	text: textLight,
	divider: dividerLight,
	action: actionLight,
	accent: accentLight,
	background: {
		default: "#fdfdff",
		paper: "#ffffff",
		primary: "#ffffff", // Excel Export on Agora Figma uses 'primary' semantic label
		25: "#fdfdff",
		100: grey[50],
		200: grey[100],
	},
	border: borderLight,
	// button: buttonLight,
};

// DARK THEME COLOR PALETTE
export const darkPalette = {
	...palette,
	mode: "dark",
	text: textDark,
	divider: dividerDark,
	action: actionDark,
	accent: accentDark,
	background: {
		default: grey[900],
		paper: grey[800],
		100: grey[800],
		200: grey[100],
	},
	border: borderDark,
	// button: buttonDark,
};
