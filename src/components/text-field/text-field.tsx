"use client";

import { forwardRef, useEffect, useState, type FocusEvent } from "react";
import { Box, InputBase, InputBaseProps, styled } from "@mui/material";
import { Asterisk } from "@phosphor-icons/react";

/**
 * Focus-visible modality tracker. Native `:focus-visible` still matches text
 * inputs on mouse click (they accept keyboard input), so to show the DS focus
 * ring for keyboard users only we track the last interaction modality here —
 * the same approach as the focus-visible polyfill / MUI's ButtonBase.
 */
let hadKeyboardEvent = true;
let modalityListenersAttached = false;
function ensureModalityListeners() {
	if (modalityListenersAttached || typeof window === "undefined") return;
	modalityListenersAttached = true;
	window.addEventListener(
		"keydown",
		(e) => {
			if (e.metaKey || e.altKey || e.ctrlKey) return;
			hadKeyboardEvent = true;
		},
		true,
	);
	const onPointer = () => {
		hadKeyboardEvent = false;
	};
	window.addEventListener("mousedown", onPointer, true);
	window.addEventListener("pointerdown", onPointer, true);
	window.addEventListener("touchstart", onPointer, true);
}

/**
 * ⚠️ DS TOKEN GAP — read before editing.
 *
 * These values are the Socratics.ai design-system "Form" tokens, pulled
 * directly from Figma (file 87YQbb7f33GYUHSOogYGjH → node 429:28124):
 *   Text/*, Interactive/Surface/*, Interactive/Stroke/*, Accent green/600,
 *   shadow/sm, focus/state.
 *
 * The app theme (src/external/essence/theme/colors.ts) does NOT yet define
 * these interactive/text semantic tokens — the coded theme has drifted from
 * the current DS. They are centralized here so this component matches Figma
 * exactly today; they SHOULD be promoted into the theme palette so the whole
 * app can share one source of truth. Until then, this is the single place they
 * live — do not scatter these hexes into consumers.
 */
const DS = {
	text: {
		default: "#2e343e",
		weak: "#555e69",
		danger: "#b91c1c",
		disabled: "#a3a3a3",
		hint: "#6b7280",
	},
	surface: { default: "#ffffff", disabled: "#fafafa" },
	stroke: {
		default: "#d4d4d4",
		hover: "#a3a3a3",
		error: "#dc2626",
		focus: "#525252",
	},
	// Required marker — Danger/danger-600 (red), NOT green.
	requiredMark: "#dc2626",
	radius: 6,
	shadowSm: "0 1px 2px rgba(0, 0, 0, 0.05)",
	// focus/state: 2px white gap + 4px ring + base shadow (inner → outer)
	focusRing:
		"0 0 0 2px #ffffff, 0 0 0 4px #525252, 0 1px 2px rgba(0, 0, 0, 0.05)",
	// MD/Medium 12 and MD/Regular 12 — Inter comes from the theme; only the
	// size/weight/line-height are DS-specific here. fontSize is a string ("12px")
	// so MUI's sx system prop applies it literally instead of rescaling a bare
	// number (which happens inside <Typography>, not in styled()).
	labelFont: { fontSize: "12px", fontWeight: 500, lineHeight: "16px" },
	textFont: { fontSize: "12px", fontWeight: 400, lineHeight: "16px" },
} as const;

const Field = styled(InputBase, {
	shouldForwardProp: (prop) => prop !== "hasError" && prop !== "showRing",
})<{ hasError?: boolean; showRing?: boolean }>(({ hasError, showRing }) => ({
	width: "100%",
	minHeight: 32,
	boxSizing: "border-box",
	borderRadius: DS.radius,
	border: `1px solid ${hasError ? DS.stroke.error : DS.stroke.default}`,
	backgroundColor: DS.surface.default,
	boxShadow: DS.shadowSm,
	transition: "border-color 120ms ease, box-shadow 120ms ease",
	"& .MuiInputBase-input": {
		padding: "6px 12px",
		...DS.textFont,
		color: DS.text.default,
		"&::placeholder": { color: DS.text.weak, opacity: 1 },
	},
	"&:hover": {
		borderColor: hasError ? DS.stroke.error : DS.stroke.hover,
	},
	// Focus: border always shifts; the prominent ring is keyboard-only
	// (showRing), so a mouse click gives just the active border, not the ring.
	"&.Mui-focused": {
		borderColor: hasError ? DS.stroke.error : DS.stroke.focus,
		...(showRing ? { boxShadow: DS.focusRing } : {}),
	},
	"&.Mui-disabled": {
		backgroundColor: DS.surface.disabled,
		borderColor: DS.stroke.default,
		boxShadow: "none",
		"& .MuiInputBase-input": {
			color: DS.text.disabled,
			WebkitTextFillColor: DS.text.disabled,
		},
	},
}));

export interface TextFieldProps extends Omit<InputBaseProps, "error"> {
	/** Static label rendered above the input. */
	label?: string;
	/** Appends the DS required star to the label. */
	required?: boolean;
	/** Shows the "Optional" corner hint, right-aligned in the label row. */
	optional?: boolean;
	/** Helper or error message below the input. */
	helperText?: string;
	/** Error styling (red border + danger helper text). */
	error?: boolean;
	id?: string;
}

/**
 * Socratics DS text field — a static label above a compact input, matching the
 * Figma "Form / Size=MD, Alignment=Top" component. Use this instead of a bare
 * MUI TextField so forms share the design-system look and states.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
	function TextField(
		{ label, required, optional, helperText, error, id, ...inputProps },
		ref,
	) {
		const inputId = id || inputProps.name;
		const { onFocus, onBlur, ...restInput } = inputProps;
		const [focusVisible, setFocusVisible] = useState(false);
		useEffect(ensureModalityListeners, []);

		const handleFocus = (e: FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
			setFocusVisible(hadKeyboardEvent);
			onFocus?.(e);
		};
		const handleBlur = (e: FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
			setFocusVisible(false);
			onBlur?.(e);
		};

		return (
			<Box sx={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
				{label && (
					<Box
						sx={{
							display: "flex",
							alignItems: "flex-start",
							gap: "4px",
							width: "100%",
						}}
					>
						<Box
							component="label"
							htmlFor={inputId}
							sx={{
								flex: 1,
								display: "inline-flex",
								alignItems: "flex-start",
								gap: "4px",
								...DS.labelFont,
								color: DS.text.default,
							}}
						>
							<span>{label}</span>
							{required && (
								<Asterisk
									size={8}
									weight="bold"
									color={DS.requiredMark}
									aria-hidden
								/>
							)}
						</Box>
						{optional && (
							<Box component="span" sx={{ ...DS.labelFont, color: DS.text.hint }}>
								Optional
							</Box>
						)}
					</Box>
				)}
				<Field
					id={inputId}
					inputRef={ref}
					hasError={error}
					showRing={focusVisible}
					onFocus={handleFocus}
					onBlur={handleBlur}
					{...restInput}
					// Expose required to assistive tech via aria-required rather than the
					// native `required` attribute, so browser validation doesn't fight
					// the form's own (Formik) validation. The visual asterisk is a11y-
					// hidden, so this is the only required signal AT receives. Kept after
					// the spread so it isn't clobbered by a caller's inputProps.
					inputProps={{
						...(restInput.inputProps as Record<string, unknown> | undefined),
						"aria-required": required || undefined,
					}}
				/>
				{helperText && (
					<Box
						component="p"
						sx={{
							m: 0,
							...DS.textFont,
							color: error ? DS.text.danger : DS.text.hint,
						}}
					>
						{helperText}
					</Box>
				)}
			</Box>
		);
	},
);

export default TextField;
