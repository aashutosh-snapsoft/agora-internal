// ── DS Button Styles ────────────────────────────────────────────────────────
// Ported from socratics-v2-frontend (src/components/multidoc/dsTokens.ts) as
// part of the projects-page migration (PR2). Until Agora's essence theme is
// extended with these primitives, the Compose surface keeps its own copy so
// the visual design matches Figma exactly. When the essence theme adopts these
// tokens natively, this file should be deleted in favor of the theme override.
//
// Values are the Button component's own variables, read from the Socratics.ai
// design system file (87YQbb7f33GYUHSOogYGjH), node 358:31444:
//
//   Button/Primary/Background/{Default,Hover,Pressed,Disabled}
//                             #2e343e / #1c2026 / #121017 / #e5e5e5
//   Button/Secondary/Background/{Default,Hover,Pressed,Disabled}
//                             #ffffff / #fafafa / #f5f5f5 / #fafafa
//   Button/Secondary/Stroke/{Default,Hover,Pressed,Focus,Disabled}
//                             #a3a3a3 / #737373 / #525252 / #525252 / #e5e5e5
//   Text/{Inverse,Default,Strong,Disabled}
//                             #fafafa / #2e343e / #121017 / #a3a3a3
//   shadow/sm                 0 1px 2px #0000000D
//   MD/Medium 12              Inter Medium 12/16
//
// NOTE: The Essence theme's MuiButton overrides (outlined variant) set
//   backgroundColor: grey[100], border: "none", borderRadius: 10, height: 30
// These fight against sx props, so we use !important on conflicting properties.

/** shadow/sm — the resting elevation on both button types, and on the Card. */
const SHADOW_SM = "0px 1px 2px rgba(0,0,0,0.05)";

/**
 * Interactive/Stroke/Default — the design system's own stroke, used by the Card
 * (node 1312:27609) for its border and for the rules closing its header and
 * footer. Notably NOT essence's `grey.200` (#e5e7eb), which is a shade lighter.
 */
export const DS_STROKE_DEFAULT = "#d4d4d4";

/** Text/Strong and Text/Default. */
export const DS_TEXT_STRONG = "#121017";
export const DS_TEXT_DEFAULT = "#2e343e";

/** shadow/sm, for surfaces that are not buttons. */
export const DS_SHADOW_SM = SHADOW_SM;

/**
 * focus/state — a 2px white halo inside a 4px #525252 ring, over shadow/sm.
 * Applied on `.Mui-focusVisible` rather than `:focus`, so a pointer click does
 * not leave a ring behind but keyboard traversal always shows one.
 */
const FOCUS_RING = `0 0 0 2px #FFFFFF, 0 0 0 4px #525252, ${SHADOW_SM}`;

const secondaryBtnBase = {
	backgroundColor: "#fff !important",
	border: "1px solid #A3A3A3 !important",
	borderRadius: "6px !important",
	boxShadow: `${SHADOW_SM} !important`,
	color: "#2E343E !important",
	fontSize: "12px",
	fontWeight: 500,
	lineHeight: "16px",
	textTransform: "none" as const,
	"&:hover": {
		backgroundColor: "#fafafa !important",
		border: "1px solid #737373 !important",
		boxShadow: `${SHADOW_SM} !important`,
	},
	// Pressed is the one state where the label changes colour, to Text/Strong.
	"&:active": {
		backgroundColor: "#f5f5f5 !important",
		border: "1px solid #525252 !important",
		color: "#121017 !important",
	},
	"&.Mui-focusVisible": {
		border: "1px solid #525252 !important",
		boxShadow: `${FOCUS_RING} !important`,
	},
	"&.Mui-disabled": {
		backgroundColor: "#fafafa !important",
		border: "1px solid #E5E5E5 !important",
		color: "#A3A3A3 !important",
		boxShadow: "none !important",
		cursor: "not-allowed",
	},
};

/** SM secondary button — height 24, px 8 */
export const DS_BTN_SECONDARY_SM = {
	...secondaryBtnBase,
	height: "24px !important",
	px: "8px",
	py: "2px",
};

// ── DS Primary Button Styles ────────────────────────────────────────────────
const primaryBtnBase = {
	backgroundColor: "#2E343E !important",
	border: "none !important",
	borderRadius: "6px !important",
	boxShadow: `${SHADOW_SM} !important`,
	color: "#FAFAFA !important",
	fontSize: "12px",
	fontWeight: 500,
	lineHeight: "16px",
	textTransform: "none" as const,
	"&:hover": {
		backgroundColor: "#1c2026 !important",
		boxShadow: `${SHADOW_SM} !important`,
	},
	"&:active": {
		backgroundColor: "#121017 !important",
	},
	"&.Mui-focusVisible": {
		boxShadow: `${FOCUS_RING} !important`,
	},
	"&.Mui-disabled": {
		backgroundColor: "#E5E5E5 !important",
		color: "#A3A3A3 !important",
		boxShadow: "none !important",
		cursor: "not-allowed",
	},
};

/** MD primary button — height 32, px 12 */
export const DS_BTN_PRIMARY_MD = {
	...primaryBtnBase,
	height: "32px !important",
	px: "12px",
	py: "6px",
};

// ── DS Danger Button Styles ─────────────────────────────────────────────────
// Button/Danger/Background/{Default,Hover,Pressed} — #b91c1c / #991b1b / #7f1d1d.
const dangerBtnBase = {
	backgroundColor: "#b91c1c !important",
	border: "none !important",
	borderRadius: "6px !important",
	boxShadow: `${SHADOW_SM} !important`,
	color: "#FAFAFA !important",
	fontSize: "12px",
	fontWeight: 500,
	lineHeight: "16px",
	textTransform: "none" as const,
	"&:hover": {
		backgroundColor: "#991b1b !important",
		boxShadow: `${SHADOW_SM} !important`,
	},
	"&:active": {
		backgroundColor: "#7f1d1d !important",
	},
	"&.Mui-focusVisible": {
		boxShadow: `${FOCUS_RING} !important`,
	},
	"&.Mui-disabled": {
		backgroundColor: "#E5E5E5 !important",
		color: "#A3A3A3 !important",
		boxShadow: "none !important",
		cursor: "not-allowed",
	},
};

/** MD danger button — height 32, px 12 */
export const DS_BTN_DANGER_MD = {
	...dangerBtnBase,
	height: "32px !important",
	px: "12px",
	py: "6px",
};

/** MD secondary button — height 32, px 12 */
export const DS_BTN_SECONDARY_MD = {
	...secondaryBtnBase,
	height: "32px !important",
	px: "12px",
	py: "6px",
};
