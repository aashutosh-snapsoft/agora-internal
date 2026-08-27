import { FC, PropsWithChildren } from "react";
import { Box } from "@mui/material";

/**
 * Badge — the Socratics.ai design system's Badge component.
 *
 * Figma: node 397:46024 in the Socratics.ai design system file
 * (87YQbb7f33GYUHSOogYGjH).
 *
 * The `Status/*` variables below are mirrored from that node rather than read
 * from the essence theme, which does not carry them: essence has its own
 * `success`/`warning`/`primary` scales with different values (e.g. its
 * success/50 is #E3FDEB against the DS's #e1f7f0), and its `StatusBadge`
 * component is built on those. This follows the precedent set by
 * `@/components/projects/dsTokens` — keep a local copy so the surface matches
 * Figma exactly, and delete it once the essence theme adopts these tokens
 * natively.
 *
 * NOT implemented from the DS node: `decorativeIcon` (a leading 16px glyph) and
 * `dismissible` (a trailing 8px close mark). Both are real variants; neither has
 * a caller yet, so they are left out rather than guessed at.
 */

/** Figma variant `Type`. "danger" is the DS's name for the error status. */
export type BadgeType = "success" | "warning" | "danger" | "info" | "primary";

/** Figma variant `Size`. */
export type BadgeSize = "SM" | "MD";

/**
 * Figma variant `Style`. "rounded" is the DS's `Rounded`; "filter" is its
 * `Token/Filter`, a near-square 2px radius used for filter chips.
 */
export type BadgeStyle = "rounded" | "filter";

/** Status/<type>/{bg,fg} — the DS colour variables, verbatim. */
const STATUS_TOKENS: Record<BadgeType, { bg: string; fg: string }> = {
	success: { bg: "#e1f7f0", fg: "#003d28" },
	warning: { bg: "#fff7d8", fg: "#7a4e00" },
	danger: { bg: "#fee2e2", fg: "#7f1d1d" },
	info: { bg: "#e6eefa", fg: "#1b3a66" },
	primary: { bg: "#e4e6e8", fg: "#121017" },
};

/** The node's per-size geometry. MD is 24px tall; SM has no vertical padding. */
const SIZE_TOKENS: Record<BadgeSize, { px: string; py: string; roundedRadius: string }> = {
	MD: { px: "8px", py: "4px", roundedRadius: "12px" },
	SM: { px: "6px", py: "0px", roundedRadius: "8px" },
};

interface Props extends PropsWithChildren {
	type?: BadgeType;
	size?: BadgeSize;
	style?: BadgeStyle;
}

const Badge: FC<Props> = ({ children, type = "info", size = "MD", style = "rounded" }) => {
	const status = STATUS_TOKENS[type];
	const geometry = SIZE_TOKENS[size];

	return (
		<Box
			component="span"
			sx={{
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				px: geometry.px,
				py: geometry.py,
				borderRadius: style === "rounded" ? geometry.roundedRadius : "2px",
				backgroundColor: status.bg,
				color: status.fg,
				// The node specifies Inter Medium 12/16. Size, weight and leading are
				// taken as given; the family is deliberately left to inherit, because
				// this component is shared and Agora is still Satoshi outside
				// /projects — a badge that hardcoded Inter would be the odd one out on
				// every other surface. /projects sets Inter on its own root (see
				// app/projects/fonts.ts), and this inherits it there.
				fontSize: "12px",
				fontWeight: 500,
				lineHeight: "16px",
				letterSpacing: 0,
				whiteSpace: "nowrap",
			}}
		>
			{children}
		</Box>
	);
};

export default Badge;
