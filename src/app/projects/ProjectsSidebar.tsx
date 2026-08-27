"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box } from "@mui/material";
import { ArrowLeft, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useAppSelector } from "@/store/store";
import { userSelector } from "@/store/users/user-selectors";
import { DS_STROKE_DEFAULT, DS_TEXT_DEFAULT } from "@/components/projects/dsTokens";
import CustomTooltip from "@/components/tooltip/tooltip";

/**
 * The projects page's left rail — the design system's "Data Room — sidebar"
 * component, in both of its states:
 *
 *   collapsed (56) — node 43420:72150
 *   expanded (260) — node 43420:72137
 *
 * Starts collapsed, and is the only sidebar on this route: DashboardLayout
 * suppresses the global `DashboardSidebar` for exactly `/projects` (see its
 * `isProjectsHomePath`) on the grounds that the page brings its own chrome.
 * This is that chrome.
 *
 * Collapsed by default because the column holds only the brand and the account
 * — there is no navigation in it. The page *is* the project list, so a nav
 * listing projects would point at where you already are, and 260px of empty
 * white beside the one thing the page is for is 260px wasted.
 *
 * What the nodes do not carry, and this adds: the states are static art in
 * Figma, so the toggle's button semantics, its labels, and the account row's
 * link are this component's.
 */

const WIDTH_EXPANDED = 260;
const WIDTH_COLLAPSED = 56;

/** Icons/Default — the avatar's initials. */
const ICON_DEFAULT = "#737373";
/** Icons/Primary — the caret. Darker than the avatar's initials, deliberately. */
const ICON_PRIMARY = "#1c2026";
/** Interactive/Surface/Hover. */
const SURFACE_HOVER = "#f5f5f5";

/** The app header the /projects list sits under; the upload page has none. */
const HEADER_HEIGHT = 72;

/**
 * `fullHeight` — the upload page renders the rail in a full-height `100dvh`
 * shell with no top header, so the rail spans the whole viewport there. The
 * /projects list sits under the app's 72px header, so by default the rail is
 * `100dvh - 72px`. The rail's flex parent on the list has no set height, so a
 * viewport-relative value (not `100%`) is what actually resolves in both.
 */
export default function ProjectsSidebar({ fullHeight = false }: { fullHeight?: boolean }) {
	const [collapsed, setCollapsed] = useState(true);
	const { authenticatedUser } = useAppSelector(userSelector);
	const pathname = usePathname();
	// "All projects" back link shows on sub-pages (e.g. /profile), not on the
	// projects list itself.
	const showBackToProjects = pathname !== "/projects";

	const displayName = useMemo(() => {
		const full = [authenticatedUser?.first_name, authenticatedUser?.last_name]
			.filter(Boolean)
			.join(" ")
			.trim();
		// Falls back to the email local part, then to nothing rather than to a
		// placeholder name — an invented name is worse than an absent one.
		return full || authenticatedUser?.email?.split("@")[0] || "";
	}, [authenticatedUser]);

	const initials = useMemo(() => {
		const first = authenticatedUser?.first_name?.trim()?.[0];
		const last = authenticatedUser?.last_name?.trim()?.[0];
		const fromName = [first, last].filter(Boolean).join("");
		return (fromName || authenticatedUser?.email?.[0] || "").toUpperCase();
	}, [authenticatedUser]);

	const toggleLabel = collapsed ? "Show sidebar" : "Hide sidebar";

	/* Avatar — 24px, radius 12 (full circle), hairline ring, initials
	   Inter Semi Bold 10px in Icons/Default. Identical in both nodes. */
	const avatar = (
		<Box
			aria-hidden="true"
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				flexShrink: 0,
				boxSizing: "border-box",
				width: 24,
				height: 24,
				border: "1px solid",
				borderColor: DS_STROKE_DEFAULT,
				borderRadius: "12px",
				backgroundColor: "transparent",
				color: ICON_DEFAULT,
				fontFamily: "inherit",
				fontSize: "10px",
				fontWeight: 600,
				lineHeight: "normal",
				whiteSpace: "nowrap",
			}}
		>
			{initials}
		</Box>
	);

	/* The caret. 24px in both nodes — collapsed it points right, expanded it is
	   the same glyph rotated 180°. Figma draws it as bare art; it is a button
	   here, so it carries a label and a hover. */
	const toggleButton = (
		<CustomTooltip title={toggleLabel} placement={collapsed ? "right" : "bottom"}>
			<Box
				component="button"
				type="button"
				aria-label={toggleLabel}
				aria-expanded={!collapsed}
				onClick={() => setCollapsed((c) => !c)}
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
					width: 24,
					height: 24,
					p: 0,
					border: "none",
					borderRadius: "6px",
					backgroundColor: "transparent",
					color: ICON_PRIMARY,
					cursor: "pointer",
					fontFamily: "inherit",
					"&:hover": { backgroundColor: SURFACE_HOVER },
				}}
			>
				{collapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
			</Box>
		</CustomTooltip>
	);

	return (
		<Box
			component="nav"
			aria-label="Socratics"
			// Collapsed, the whole rail is one expand target — a 56px column with a
			// single caret is a small thing to aim at, so a click anywhere in it
			// opens the panel. The caret stays as the keyboard-focusable control (it
			// is the real button); this is a pointer convenience on top of it, which
			// is why the nav is not itself a button. Expanded, the rail has its own
			// controls (caret, profile link) and no whole-surface click.
			onClick={collapsed ? () => setCollapsed(false) : undefined}
			sx={{
				display: "flex",
				flexDirection: "column",
				// Collapsed centres its children and spends no side inset; expanded
				// aligns them to a 12px inset and breathes three times as much.
				alignItems: collapsed ? "center" : "flex-start",
				gap: collapsed ? "4px" : "12px",
				flex: `0 0 ${collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED}px`,
				height: fullHeight ? "100dvh" : `calc(100dvh - ${HEADER_HEIGHT}px)`,
				boxSizing: "border-box",
				pt: "8px",
				px: collapsed ? 0 : "12px",
				// Expanded: no inset, so the full-width account row (and its hover
				// highlight) reaches the rail's bottom edge with no gap beneath it.
				// Collapsed: 8px, matching where the row's own 8px bottom padding
				// leaves the avatar — so the icon holds the same spot on toggle.
				pb: collapsed ? "8px" : "0px",
				bgcolor: "background.paper",
				borderRight: "1px solid",
				borderColor: DS_STROKE_DEFAULT,
				overflow: "hidden",
				cursor: collapsed ? "pointer" : "default",
			}}
		>
			{/* Brand. Collapsed, the rule under it is only as wide as the 32px logo
			    slot — it does not run the panel's full width, which is what keeps the
			    rail reading as a rail rather than a narrow panel. Expanded, it does
			    run full width, with the caret sharing the row.

			    `align-items: flex-start` expanded: the row's height comes from the
			    24px caret, and centring the mark against it would drop the logo lower
			    than the rail puts it. */}
			<Box
				sx={{
					display: "flex",
					alignItems: collapsed ? "center" : "flex-start",
					justifyContent: "center",
					gap: "6px",
					flexShrink: 0,
					overflow: "hidden",
					width: collapsed ? 32 : "100%",
					pb: collapsed ? "12px" : "8px",
					borderBottom: "1px solid",
					borderColor: DS_STROKE_DEFAULT,
				}}
			>
				{/* A 32px slot in both states, so the mark lands in the identical spot
				    rather than at two separately-tuned offsets. The DS mark, node
				    43055:249. */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexShrink: 0,
						overflow: "hidden",
						width: 32,
					}}
				>
					<Box
						component="img"
						src="/static/logo/socratics-mark.png"
						alt="Socratics"
						width={20}
						height={20}
					/>
				</Box>
				{/* The node's spacer: flex-1 at 24px, which is what gives the expanded
				    brand row its height. */}
				{!collapsed && <Box sx={{ flex: "1 0 0", minWidth: 0, height: 24 }} />}
				{!collapsed && toggleButton}
			</Box>

			{/* Collapsed, the opener sits just under the rule — the same corner the
			    collapse control occupies when open, so the one control that switches
			    the panel does not jump across it depending on which state you are in. */}
			{collapsed && toggleButton}

			{/* "All projects" back link — top of the content area, expanded only
			    (like the account row, it's a link only when the rail is open). */}
			{!collapsed && showBackToProjects && (
				<Box
					component={Link}
					href="/projects"
					onClick={(e: React.MouseEvent) => e.stopPropagation()}
					sx={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						width: "100%",
						mt: "8px",
						px: "8px",
						py: "8px",
						borderRadius: "6px",
						textDecoration: "none",
						color: DS_TEXT_DEFAULT,
						"&:hover": { backgroundColor: SURFACE_HOVER },
					}}
				>
					<ArrowLeft size={16} weight="bold" />
					<Box
						component="span"
						sx={{
							fontSize: "14px",
							fontWeight: 600,
							lineHeight: "20px",
							color: DS_TEXT_DEFAULT,
						}}
					>
						All projects
					</Box>
				</Box>
			)}

			{/* The node's content slot. Empty here: the Data Room fills it with its
			    file list, and this page has no equivalent — but it is what holds the
			    account against the bottom edge. */}
			<Box sx={{ flex: "1 0 0", minHeight: 0, width: "100%" }} />

			{/* Account. Expanded it is a full-width row linking to /profile, above a
			    rule; collapsed it is the avatar alone in a 32x24 block, with no rule.

			    Collapsed it is deliberately NOT the profile link: a click there has
			    to expand the rail like a click anywhere else on it, not navigate away
			    from the page. The profile link is only offered once expanded, where
			    the row reads as one. */}
			{collapsed ? (
				<Box
					sx={{
						display: "flex",
						// flex-end (not center): the mark sits on the slot's bottom edge
						// so its visible gap to the rail bottom is the true 32px pb,
						// not 32 + the slot's centering offset.
						alignItems: "flex-end",
						justifyContent: "center",
						flexShrink: 0,
						overflow: "hidden",
						boxSizing: "border-box",
						width: 32,
						height: 24,
					}}
				>
					{avatar}
				</Box>
			) : (
				<Box
					component={Link}
					href="/profile"
					aria-label={displayName ? `Account — ${displayName}` : "Account"}
					// The rail's own onClick is off when expanded, but a click on this
					// row would still bubble to the nav; stop it so following the link
					// never also re-triggers rail logic.
					onClick={(e: React.MouseEvent) => e.stopPropagation()}
					sx={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						flexShrink: 0,
						overflow: "hidden",
						boxSizing: "border-box",
						width: "100%",
						px: "4px",
						py: "8px",
						borderTop: "1px solid",
						borderColor: DS_STROKE_DEFAULT,
						textDecoration: "none",
						color: DS_TEXT_DEFAULT,
						"&:hover": { backgroundColor: SURFACE_HOVER },
					}}
				>
					{/* The node insets the avatar a further 4px inside the row. */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flexShrink: 0,
							overflow: "hidden",
							pl: "4px",
						}}
					>
						{avatar}
					</Box>
					{displayName && (
						<Box
							component="span"
							sx={{
								flex: "1 0 0",
								minWidth: 0,
								fontSize: "12px",
								fontWeight: 400,
								lineHeight: "16px",
								color: DS_TEXT_DEFAULT,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{displayName}
						</Box>
					)}
				</Box>
			)}
		</Box>
	);
}
