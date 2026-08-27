import "@mui/material/styles";
import "@mui/material/Typography";

declare module "@mui/material/styles" {
	interface TypographyVariants {
		Display1Regular: React.CSSProperties;
		Display1Bold: React.CSSProperties;
		Text1Regular: React.CSSProperties;
		Text1Bold: React.CSSProperties;
		Text3Bold: React.CSSProperties;
		Text3Regular: React.CSSProperties;
		Text4Bold: React.CSSProperties;
		Text4Regular: React.CSSProperties;
		Text5Bold: React.CSSProperties;
		Text5Regular: React.CSSProperties;
		Text6Black: React.CSSProperties;
		Text6Medium: React.CSSProperties;
		Text7Black: React.CSSProperties;
		Text7Medium: React.CSSProperties;
	}

	interface TypographyVariantsOptions {
		Display1Regular?: React.CSSProperties;
		Display1Bold?: React.CSSProperties;
		Text1Regular?: React.CSSProperties;
		Text1Bold?: React.CSSProperties;
		Text3Bold?: React.CSSProperties;
		Text3Regular?: React.CSSProperties;
		Text4Bold?: React.CSSProperties;
		Text4Regular?: React.CSSProperties;
		Text5Bold?: React.CSSProperties;
		Text5Regular?: React.CSSProperties;
		Text6Black?: React.CSSProperties;
		Text6Medium?: React.CSSProperties;
		Text7Black?: React.CSSProperties;
		Text7Medium?: React.CSSProperties;
	}
}

declare module "@mui/material/Typography" {
	interface TypographyPropsVariantOverrides {
		Display1Regular: true;
		Display1Bold: true;
		Text1Regular: true;
		Text1Bold: true;
		Text3Bold: true;
		Text3Regular: true;
		Text4Bold: true;
		Text4Regular: true;
		Text5Bold: true;
		Text5Regular: true;
		Text6Black: true;
		Text6Medium: true;
		Text7Black: true;
		Text7Medium: true;
	}
}
