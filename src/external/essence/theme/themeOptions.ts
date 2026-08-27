import { THEMES } from "@/external/essence/utils/constants";
import { brand, darkPalette, lightPalette } from "./colors";

type CustomizedPalette = (typeof lightPalette | typeof darkPalette) &
	typeof brand;

const themesOptions = {
	[THEMES.LIGHT]: { palette: lightPalette as CustomizedPalette },
	[THEMES.DARK]: { palette: darkPalette as CustomizedPalette },
};

export default themesOptions;
