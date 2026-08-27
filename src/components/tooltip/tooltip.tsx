import { Tooltip, TooltipProps as MuiTooltipProps } from "@mui/material";
import React, { FC, ReactElement } from "react";
import { SxProps, Theme } from "@mui/material/styles";

/**
 * The design system's Tooltip — node 1880:35726 (all four placements).
 *
 *   Toast/Bg      #121017   surface
 *   Text/Inverse  #fafafa   label
 *   MD/Medium 12  Inter Medium 12/16
 *   radius 4, padding 4px 8px
 *   shadow/md     0 2px 4px -1px #0000000F, 0 4px 6px -1px #0000001A
 *   tip           8x4 (top/bottom) or 4x8 (left/right), on the edge facing the anchor
 *
 * The tip is MUI's own arrow element, kept because popper's arrow modifier keeps
 * it pointed at the anchor even when the tooltip body is nudged sideways to stay
 * on screen — a tip drawn on the body instead sits at the body's centre and
 * drifts off a small control the moment the wider tooltip shifts.
 *
 * Two things are corrected off MUI's default arrow: it is cut to the node's 8x4
 * / 4x8 triangle with a clip-path (MUI draws a blunt ~10px rotated square), and
 * its overlap margin is set to the arrow's own height. MUI's default −0.71em
 * assumes its ~8.5px arrow; against a 4px one it over-pulls and leaves the arrow
 * floating a few px off the body — the detachment this margin fixes.
 */

const TOAST_BG = "#121017";
const TEXT_INVERSE = "#fafafa";
const SHADOW_MD = "0px 2px 4px -1px rgba(0,0,0,0.06), 0px 4px 6px -1px rgba(0,0,0,0.10)";

/** The tip, per placement — size, the triangle cut, and the flush overlap. */
const arrowByPlacement = {
	top: {
		'&[data-popper-placement*="top"] .MuiTooltip-arrow': {
			width: "8px",
			height: "4px",
			marginBottom: "-4px", // arrow height, so the base sits on the body edge
			"&::before": { clipPath: "polygon(50% 100%, 0 0, 100% 0)" }, // points down
		},
	},
	bottom: {
		'&[data-popper-placement*="bottom"] .MuiTooltip-arrow': {
			width: "8px",
			height: "4px",
			marginTop: "-4px",
			"&::before": { clipPath: "polygon(50% 0, 0 100%, 100% 100%)" }, // points up
		},
	},
	left: {
		'&[data-popper-placement*="left"] .MuiTooltip-arrow': {
			width: "4px",
			height: "8px",
			marginRight: "-4px",
			"&::before": { clipPath: "polygon(100% 50%, 0 0, 0 100%)" }, // points right
		},
	},
	right: {
		'&[data-popper-placement*="right"] .MuiTooltip-arrow': {
			width: "4px",
			height: "8px",
			marginLeft: "-4px",
			"&::before": { clipPath: "polygon(0 50%, 100% 0, 100% 100%)" }, // points left
		},
	},
};

interface TooltipProps extends Omit<MuiTooltipProps, "title" | "children"> {
	title: any;
	children: ReactElement<unknown, any>;
	sx?: SxProps<Theme>;
}

const CustomTooltip: FC<TooltipProps> = ({
	title,
	children,
	placement,
	sx,
	...props
}) => {
	return (
		<Tooltip
			title={title}
			arrow
			placement={placement || "right"}
			{...props}
			slotProps={{
				popper: {
					sx: {
						"& .MuiTooltip-tooltip": {
							backgroundColor: TOAST_BG,
							color: TEXT_INVERSE,
							borderRadius: "4px",
							padding: "4px 8px",
							margin: 0,
							fontSize: "12px",
							fontWeight: 500,
							lineHeight: "16px",
							textAlign: "center",
							// No `whiteSpace: nowrap` here: this is a shared component, and
							// some callers pass long or multi-line titles (e.g.
							// summary-rollups' <Fragment> tooltip). Forcing nowrap collapsed
							// those onto one line and could overrun the viewport. The DS's
							// single-line labels on /projects are short enough to stay on one
							// line without it; MUI's default maxWidth still wraps long text.
							boxShadow: SHADOW_MD,
						},
						// The arrow's colour drives the clipped `::before` (currentColor),
						// so the triangle is the toast surface, not MUI's grey.
						"& .MuiTooltip-arrow": {
							color: TOAST_BG,
							// The clip-path triangle replaces MUI's rotated-square fill;
							// drop the rotation and the overflow clip it depended on.
							"&::before": {
								transform: "none",
								borderRadius: 0,
							},
						},
						...arrowByPlacement.top,
						...arrowByPlacement.bottom,
						...arrowByPlacement.left,
						...arrowByPlacement.right,
					},
				},
			}}
			sx={sx}
		>
			{children}
		</Tooltip>
	);
};
export default CustomTooltip;
