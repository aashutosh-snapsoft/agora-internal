"use client";

import { forwardRef } from "react";
import { ButtonBase, ButtonBaseProps, styled } from "@mui/material";

/**
 * ⚠️ DS TOKEN GAP — see components/text-field for the full note.
 * Button tokens pulled from the Socratics DS (file 87YQbb7f33GYUHSOogYGjH):
 *   Button/Primary/Background #2e343e, Text/Inverse #fafafa,
 *   Button/Secondary/Background #ffffff, Button/Secondary/Stroke #a3a3a3,
 *   Text/Default #2e343e, Interactive/Stroke/Pressed #737373,
 *   Button/Secondary/Stroke/Focus #525252, Button/Danger/Background #b91c1c,
 *   shadow/sm. Danger hover/pressed are darker reds inferred from the ramp.
 * These are not yet in the app theme; centralized here until promoted.
 */
const DS = {
	primaryBg: "#2e343e",
	primaryBgHover: "#1c2026",
	primaryBgPressed: "#121017",
	textInverse: "#fafafa",
	secondaryBg: "#ffffff",
	secondaryBgHover: "#f5f5f5",
	secondaryBgPressed: "#e5e5e5",
	secondaryStroke: "#a3a3a3",
	strokePressed: "#737373",
	strokeFocus: "#525252",
	dangerBg: "#b91c1c",
	dangerBgHover: "#991b1b",
	dangerBgPressed: "#7f1d1d",
	textDefault: "#2e343e",
	textDisabled: "#a3a3a3",
	primaryDisabledBg: "#e5e5e5",
	secondaryDisabledBg: "#fafafa",
	disabledStroke: "#e5e5e5",
	radius: 6,
	shadowSm: "0 1px 2px rgba(0, 0, 0, 0.05)",
	focusRing:
		"0 0 0 2px #ffffff, 0 0 0 4px #525252, 0 1px 2px rgba(0, 0, 0, 0.05)",
} as const;

export type DSButtonVariant = "primary" | "secondary" | "danger";
export type DSButtonSize = "sm" | "md";

const Root = styled(ButtonBase, {
	shouldForwardProp: (prop) => prop !== "dsVariant" && prop !== "dsSize",
})<{ dsVariant: DSButtonVariant; dsSize: DSButtonSize }>(
	({ dsVariant, dsSize }) => ({
	height: dsSize === "sm" ? 24 : 32,
	minWidth: 0,
	padding: dsSize === "sm" ? "0 8px" : "0 12px",
	gap: 6,
	borderRadius: DS.radius,
	boxShadow: DS.shadowSm,
	// MD/Medium 12 — Inter comes from the theme.
	fontSize: "12px",
	fontWeight: 500,
	lineHeight: "16px",
	whiteSpace: "nowrap",
	transition:
		"background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease",
	"&.Mui-focusVisible": { boxShadow: DS.focusRing },
	...{
		primary: {
			backgroundColor: DS.primaryBg,
			color: DS.textInverse,
			border: "1px solid transparent",
			"&:hover": { backgroundColor: DS.primaryBgHover },
			"&:active": { backgroundColor: DS.primaryBgPressed },
			"&.Mui-disabled": {
				backgroundColor: DS.primaryDisabledBg,
				color: DS.textDisabled,
			},
		},
		secondary: {
			backgroundColor: DS.secondaryBg,
			color: DS.textDefault,
			border: `1px solid ${DS.secondaryStroke}`,
			"&:hover": {
				backgroundColor: DS.secondaryBgHover,
				borderColor: DS.strokePressed,
			},
			"&:active": { backgroundColor: DS.secondaryBgPressed },
			"&.Mui-disabled": {
				backgroundColor: DS.secondaryDisabledBg,
				color: DS.textDisabled,
				borderColor: DS.disabledStroke,
			},
		},
		danger: {
			backgroundColor: DS.dangerBg,
			color: DS.textInverse,
			border: "1px solid transparent",
			"&:hover": { backgroundColor: DS.dangerBgHover },
			"&:active": { backgroundColor: DS.dangerBgPressed },
			"&.Mui-disabled": {
				backgroundColor: DS.primaryDisabledBg,
				color: DS.textDisabled,
			},
		},
	}[dsVariant],
}));

export interface DSButtonProps extends ButtonBaseProps {
	/** "primary" = dark filled; "secondary" = white with hairline border. */
	variant?: DSButtonVariant;
	/** "md" = 32px (default); "sm" = 24px, for card footers. */
	size?: DSButtonSize;
}

/**
 * Socratics DS button — matches the Figma Button component (Size=MD): 32px tall,
 * 6px radius, 12px Inter Medium label. Use for form actions and page-heading
 * actions instead of raw MUI Button so buttons share the DS look and states.
 */
export const Button = forwardRef<HTMLButtonElement, DSButtonProps>(
	function Button({ variant = "primary", size = "md", children, ...rest }, ref) {
		return (
			<Root ref={ref} dsVariant={variant} dsSize={size} {...rest}>
				{children}
			</Root>
		);
	},
);

export default Button;
