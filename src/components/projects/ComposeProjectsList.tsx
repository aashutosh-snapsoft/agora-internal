"use client";

/**
 * ComposeProjectsList — presentational Compose projects table.
 *
 * Ported from socratics-v2-frontend (src/components/landing/ComposeProjectsList.tsx)
 * to Agora as part of PR2 of the projects-page migration. Differences from the
 * v2-frontend version:
 *
 * 1. Cross-origin handoff. All Compose links go through `resumeComposeUrl` /
 *    `newComposeUrl` / `modelingComposeUrl` (see `@/lib/composeUrl`), which
 *    bake in `NEXT_PUBLIC_COMPOSE_BASE_URL`. The v2-frontend version assumed
 *    same-origin and used relative URLs.
 *
 * 2. "New project" button is pure navigation — a plain `<a>` to v2-frontend's
 *    `/multidoc-preview`. A plain anchor (not next/link) forces a full-document
 *    navigation; see the cross-app note on the row handoffs below. The Hasura
 *    `projects` row is created there at
 *    upload-submit time (see v2-frontend#26 / PR5). Agora used to POST to
 *    `/api/projects/create` here, but that double-created rows once
 *    v2-frontend started creating them itself.
 *
 * 3. Button-driven nav uses `window.location.assign` instead of `router.push`
 *    because cross-origin URLs aren't supported by Next.js client routing.
 *
 * Data-source agnostic: receives projects, loading, error, and onRetry via
 * props. Wired to the BFF by `ComposeProjectsListContainer`.
 */

import { FC, MouseEvent, useEffect, useRef, useState } from "react";
import {
	Alert,
	Box,
	Typography,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Tooltip,
} from "@mui/material";
import {
	DotsThreeVertical,
	Trash,
	CheckCircle,
	Clock,
	Plus,
	FolderOpen,
} from "@phosphor-icons/react";
import * as amplitude from "@amplitude/analytics-browser";
import { DS_BTN_PRIMARY_MD, DS_BTN_SECONDARY_SM } from "./dsTokens";
import {
	composeUploadUrl,
	newComposeUrl,
	resumeComposeUrl,
	modelingComposeUrl,
} from "@/lib/composeUrl";
import type { ProjectRow, ProjectStatus } from "./projectRowMapper";

// ── Status meta (presentation only) ────────────────────────────────────────
const STATUS_META: Record<
	ProjectStatus,
	{
		label: string;
		nextStepLabel: string;
		color: string;
		icon: typeof CheckCircle;
	}
> = {
	"compose-in-progress": {
		label: "Compose in progress",
		nextStepLabel: "Continue composing",
		color: "#DC6803",
		icon: Clock,
	},
	"ready-to-model": {
		label: "Ready to model",
		nextStepLabel: "Start model",
		color: "#0C9E80",
		icon: CheckCircle,
	},
};

/**
 * Resolve the click-through URL for a row. Compose-in-progress rows hand off
 * to v2-frontend's resume URL when a document exists; otherwise (no document
 * yet) they hand off to the new-project entry. Ready-to-model rows go to
 * modeling.
 */
function rowHandoffUrl(row: ProjectRow): string {
	if (row.status === "ready-to-model") {
		// KNOWN GAP (deferred — SENG-811): v2-frontend has no
		// /workflow/modeling-preview route yet, so this handoff currently 404s.
		// Left pointing at the eventual route (no worse than the prior Vercel
		// target) rather than special-casing it; out of scope for SENG-791.
		return modelingComposeUrl(row.id);
	}
	if (row.latestDocumentId) {
		return resumeComposeUrl(row.currentStep, row.id, row.latestDocumentId);
	}
	// In-progress project with no document yet — land the user at the upload
	// step bound to the existing projectId.
	//
	// NOTE: with Cosmos as the directory source of truth, every listed row has a
	// canonical doc (id == project_id), so the mapper always sets
	// latestDocumentId and this branch is effectively unreachable for
	// Cosmos-sourced rows. Kept as a safe fallback (e.g. a row whose mapper
	// produced no id, or a future Hasura/shell path).
	return newComposeUrl(row.id);
}

// ── Table layout ───────────────────────────────────────────────────────────
const TABLE_COLUMNS = [
	"Project name",
	"Source file",
	"Last modified",
	"Status",
	"Next step",
] as const;
// + 1 for the trailing kebab/actions column; loading/error/empty rows colSpan over all cells.
const TOTAL_COLUMNS = TABLE_COLUMNS.length + 1;

// ── Shared table tokens ────────────────────────────────────────────────────
const CELL_BORDER = "#d4d4d4";
const HEADER_BORDER = "#a3a3a3";
const TEXT_STRONG = "#121017";
const TEXT_DEFAULT = "#2E343E";
const TEXT_WEAK = "#555E69";
const ICON_DEFAULT = "#555E69";
const ICON_WEAK = "#737373";

// ── Semantic color tokens ──────────────────────────────────────────────────
/** Destructive action color (e.g. "Remove project"). */
const DANGER = "#DC2626";
/** Hover state for destructive actions. */
const DANGER_HOVER = "#B91C1C";

// ── Props ──────────────────────────────────────────────────────────────────
export type ComposeProjectsListProps = {
	projects: ProjectRow[];
	loading?: boolean;
	error?: string | null;
	onRetry?: () => void;
	/**
	 * Called with the projectId when the user confirms deletion. Must return a
	 * Promise so the dialog can stay open during the in-flight request and close
	 * only on resolution (success). On rejection the dialog stays open and
	 * `deleteError` is shown inside it.
	 */
	onDeleteProject?: (projectId: string) => Promise<void>;
	/** True while a delete mutation is in-flight; disables the confirm button. */
	deleteIsPending?: boolean;
	/** Error message from the last failed delete attempt, if any. */
	deleteError?: string | null;
	/**
	 * Called by the parent after a successful delete (e.g. when `mutateAsync`
	 * resolves). The list uses this to close the confirmation dialog so the
	 * dialog is guaranteed to be open during the mutation and closes only on
	 * success.
	 */
	onDeleteSuccess?: () => void;
};

// ── Component ──────────────────────────────────────────────────────────────
export const ComposeProjectsList: FC<ComposeProjectsListProps> = ({
	projects,
	loading = false,
	error = null,
	onRetry,
	onDeleteProject,
	deleteIsPending = false,
	deleteError = null,
	onDeleteSuccess,
}) => {
	const totalProjects = projects.length;

	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
	const [menuRowId, setMenuRowId] = useState<string | null>(null);
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	// Fire "View Compose Projects List" once per mount, after the first
	// successful (non-loading, non-error) render. A ref guards against
	// re-firing on subsequent refetches.
	const viewTrackedRef = useRef(false);
	useEffect(() => {
		if (viewTrackedRef.current) return;
		if (loading || error) return;
		viewTrackedRef.current = true;
		amplitude.track("View Compose Projects List", {
			project_count: projects.length,
		});
	}, [loading, error, projects.length]);

	const openRowMenu = (
		event: MouseEvent<HTMLButtonElement>,
		rowId: string,
	) => {
		event.stopPropagation();
		setMenuAnchor(event.currentTarget);
		setMenuRowId(rowId);
	};

	const closeRowMenu = () => {
		setMenuAnchor(null);
		setMenuRowId(null);
	};

	const handleOpenComposeProject = () => {
		const row = projects.find((r) => r.id === menuRowId);
		closeRowMenu();
		if (!row) return;
		amplitude.track("Open Compose Project", {
			project_id: row.id,
			status: row.status,
			has_document: Boolean(row.latestDocumentId),
		});
		// Hard navigation is required: Agora and Compose are separate Next.js
		// apps. Hosted, they share an origin but split by path (App Gateway
		// routes /workflow/* → Compose); in dev they're on different ports.
		// Either way a client-side router.push/<Link> would soft-route into
		// Agora's own router (no /workflow route → 404) and never reach the
		// gateway, so we force a full-document navigation.
		window.location.assign(rowHandoffUrl(row));
	};

	const handleDeleteClick = () => {
		setConfirmDeleteId(menuRowId);
		closeRowMenu();
	};

	const handleConfirmDelete = () => {
		if (!confirmDeleteId) return;
		// Do NOT close the dialog here. The dialog stays open while the mutation
		// is in-flight (so deleteIsPending/deleteError render inside an open dialog).
		// The dialog closes only after success, via onDeleteSuccess clearing
		// confirmDeleteId in the container. On error the dialog remains open so
		// the Alert is visible.
		onDeleteProject?.(confirmDeleteId)
			.then(() => {
				// Signal success upward; the container clears confirmDeleteId.
				onDeleteSuccess?.();
				setConfirmDeleteId(null);
			})
			.catch(() => {
				// Error is surfaced via deleteError prop — keep dialog open.
			});
	};

	const handleRowLinkClick = (row: ProjectRow) => {
		// Anchor-driven nav handles the navigation itself; we only fire the
		// analytics event here.
		amplitude.track("Open Compose Project", {
			project_id: row.id,
			status: row.status,
			has_document: Boolean(row.latestDocumentId),
		});
	};

	return (
		<Box sx={{ px: 4, py: 4 }}>
			{/* Page header */}
			<Box
				sx={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					mb: 3,
				}}
			>
				<Box>
					<Typography
						sx={{
							fontSize: "28px !important",
							fontWeight: 700,
							lineHeight: "36px",
							color: TEXT_STRONG,
						}}
					>
						Compose projects
					</Typography>
					<Typography
						sx={{
							mt: 0.5,
							fontSize: "13px !important",
							fontWeight: 400,
							lineHeight: "18px",
							color: TEXT_WEAK,
						}}
					>
						{totalProjects}{" "}
						{totalProjects === 1 ? "project" : "projects"}
					</Typography>
				</Box>
				{/* "New project" navigates to v2-frontend's upload step where the
				 * user types a name + selects files; the Hasura row is created
				 * there at upload-submit time. See v2-frontend#26 / PR5. */}
				<Button
					component="a"
					href={composeUploadUrl()}
					variant="contained"
					sx={DS_BTN_PRIMARY_MD}
					startIcon={<Plus size={14} weight="bold" />}
				>
					New project
				</Button>
			</Box>

			{/* Card — table wrapper */}
			<Box
				sx={{
					backgroundColor: "#fff",
					border: `1px solid ${CELL_BORDER}`,
					borderRadius: "10px",
					overflow: "hidden",
					boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
				}}
			>
				{/* Card header */}
				<Box
					sx={{
						px: 2,
						py: 1,
						borderBottom: `1px solid ${CELL_BORDER}`,
					}}
				>
					<Typography
						sx={{
							fontSize: "12px !important",
							fontWeight: 600,
							lineHeight: "16px",
							color: TEXT_STRONG,
						}}
					>
						All projects
					</Typography>
				</Box>

				{/* Table */}
				<Box
					component="table"
					sx={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}
				>
					<Box component="thead">
						<Box component="tr">
							{TABLE_COLUMNS.map((label) => (
								<Box
									key={label}
									component="th"
									sx={{
										position: "relative",
										textAlign: "left",
										height: 32,
										px: 1,
										backgroundColor: "#e5e5e5",
										borderBottom: `1px solid ${HEADER_BORDER}`,
										fontSize: "12px",
										fontWeight: 600,
										lineHeight: "16px",
										color: TEXT_STRONG,
										whiteSpace: "nowrap",
										"&::after": {
											content: '""',
											position: "absolute",
											right: 0,
											top: "50%",
											transform: "translateY(-50%)",
											width: "1px",
											height: "16px",
											backgroundColor: HEADER_BORDER,
										},
									}}
								>
									{label}
								</Box>
							))}
							<Box
								component="th"
								sx={{
									height: 32,
									width: 48,
									backgroundColor: "#e5e5e5",
									borderBottom: `1px solid ${HEADER_BORDER}`,
								}}
							/>
						</Box>
					</Box>

					<Box component="tbody">
						{loading && (
							<Box component="tr">
								<Box
									component="td"
									colSpan={TOTAL_COLUMNS}
									sx={{ py: 6, textAlign: "center" }}
								>
									<CircularProgress
										size={28}
										aria-label="Loading projects"
									/>
								</Box>
							</Box>
						)}
						{!loading && error && (
							<Box component="tr">
								<Box component="td" colSpan={TOTAL_COLUMNS} sx={{ p: 3 }}>
									<Alert
										severity="error"
										action={
											onRetry ? (
												<Button
													color="inherit"
													size="small"
													onClick={onRetry}
												>
													Retry
												</Button>
											) : undefined
										}
									>
										{error}
									</Alert>
								</Box>
							</Box>
						)}
						{!loading && !error && projects.length === 0 && (
							<Box component="tr">
								<Box
									component="td"
									colSpan={TOTAL_COLUMNS}
									sx={{ py: 6, textAlign: "center" }}
								>
									<Typography
										sx={{
											fontSize: "13px !important",
											fontWeight: 500,
											color: TEXT_WEAK,
										}}
									>
										No projects yet — click &ldquo;New project&rdquo; to get
										started.
									</Typography>
								</Box>
							</Box>
						)}
						{!loading &&
							!error &&
							projects.map((row, rowIdx) => {
								const isLastRow = rowIdx === projects.length - 1;
								const status = STATUS_META[row.status];
								const StatusIcon = status.icon;
								const handoffUrl = rowHandoffUrl(row);
								const cellSx = {
									height: 56,
									px: 1,
									py: 0,
									verticalAlign: "middle",
									lineHeight: 0,
									borderBottom: !isLastRow
										? `1px solid ${CELL_BORDER}`
										: "none",
								};
								return (
									<Box
										component="tr"
										key={row.id}
										sx={{
											height: 56,
											"&:hover": { backgroundColor: "#fafafa" },
										}}
									>
										<Box component="td" sx={cellSx}>
											<a
												href={handoffUrl}
												style={{ textDecoration: "none" }}
												onClick={() => handleRowLinkClick(row)}
											>
												<Typography
													sx={{
														fontSize: "12px !important",
														fontWeight: 500,
														color: TEXT_STRONG,
														lineHeight: "16px",
														whiteSpace: "nowrap",
														overflow: "hidden",
														textOverflow: "ellipsis",
														cursor: "pointer",
														"&:hover": { textDecoration: "underline" },
													}}
												>
													{row.name}
												</Typography>
											</a>
										</Box>

										<Box component="td" sx={cellSx}>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 1,
												}}
											>
												<Typography
													sx={{
														fontSize: "12px !important",
														fontWeight: 400,
														color: TEXT_STRONG,
														lineHeight: "16px",
													}}
												>
													{row.sourceFile}
												</Typography>
												{row.additionalFiles.length > 0 && (
													<Tooltip
														title={
															<Box
																sx={{
																	display: "flex",
																	flexDirection: "column",
																	gap: 0.5,
																	py: 0.5,
																}}
															>
																{row.additionalFiles.map((file) => (
																	<Typography
																		key={file}
																		sx={{
																			fontSize: "12px !important",
																			fontWeight: 400,
																			lineHeight: "16px",
																			color: "#fff",
																		}}
																	>
																		{file}
																	</Typography>
																))}
															</Box>
														}
														placement="top"
														arrow
													>
														<Box
															sx={{
																display: "inline-flex",
																alignItems: "center",
																justifyContent: "center",
																backgroundColor: "#EFF6FF",
																border: "1px solid #BFDBFE",
																color: "#1E40AF",
																fontSize: "12px",
																fontWeight: 500,
																lineHeight: "16px",
																px: 0.75,
																py: "1px",
																borderRadius: "4px",
																minWidth: "22px",
																flexShrink: 0,
																cursor: "default",
															}}
														>
															+{row.additionalFiles.length}
														</Box>
													</Tooltip>
												)}
											</Box>
										</Box>

										<Box component="td" sx={cellSx}>
											<Typography
												sx={{
													fontSize: "12px !important",
													fontWeight: 400,
													color: TEXT_STRONG,
													lineHeight: "16px",
												}}
											>
												{row.lastModified}
											</Typography>
										</Box>

										<Box component="td" sx={cellSx}>
											<Box
												sx={{
													display: "inline-flex",
													alignItems: "center",
													gap: 0.75,
												}}
											>
												<StatusIcon
													size={16}
													weight="fill"
													color={status.color}
												/>
												<Typography
													sx={{
														fontSize: "12px !important",
														fontWeight: 500,
														color: status.color,
														lineHeight: "16px",
														whiteSpace: "nowrap",
													}}
												>
													{status.label}
												</Typography>
											</Box>
										</Box>

										<Box component="td" sx={cellSx}>
											<Button
												component="a"
												href={handoffUrl}
												onClick={() => handleRowLinkClick(row)}
												variant="outlined"
												sx={DS_BTN_SECONDARY_SM}
											>
												{status.nextStepLabel}
											</Button>
										</Box>

										<Box
											component="td"
											sx={{ ...cellSx, textAlign: "center" }}
										>
											<IconButton
												size="small"
												sx={{ color: ICON_WEAK }}
												onClick={(e) => openRowMenu(e, row.id)}
												aria-label="Open project actions"
											>
												<DotsThreeVertical size={18} />
											</IconButton>
										</Box>
									</Box>
								);
							})}
					</Box>
				</Box>
			</Box>

			<Menu
				anchorEl={menuAnchor}
				open={Boolean(menuAnchor)}
				onClose={closeRowMenu}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				slotProps={{
					paper: {
						sx: {
							mt: 0.5,
							minWidth: 200,
							border: `1px solid ${CELL_BORDER}`,
							borderRadius: "8px",
							boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
						},
					},
				}}
			>
				<MenuItem onClick={handleOpenComposeProject} sx={{ py: 1 }}>
					<ListItemIcon sx={{ minWidth: "28px !important" }}>
						<FolderOpen size={16} color={ICON_DEFAULT} />
					</ListItemIcon>
					<ListItemText
						primaryTypographyProps={{
							sx: {
								fontSize: "12px !important",
								fontWeight: 500,
								color: TEXT_STRONG,
								lineHeight: "16px",
							},
						}}
					>
						Open compose project
					</ListItemText>
				</MenuItem>
				{onDeleteProject && (
					<MenuItem onClick={handleDeleteClick} sx={{ py: 1 }}>
						<ListItemIcon sx={{ minWidth: "28px !important" }}>
							<Trash size={16} color={DANGER} />
						</ListItemIcon>
						<ListItemText
							primaryTypographyProps={{
								sx: {
									fontSize: "12px !important",
									fontWeight: 500,
									color: DANGER,
									lineHeight: "16px",
								},
							}}
						>
							Remove project
						</ListItemText>
					</MenuItem>
				)}
			</Menu>

			{/* Confirmation dialog */}
			<Dialog
				open={Boolean(confirmDeleteId)}
				onClose={() => !deleteIsPending && setConfirmDeleteId(null)}
				PaperProps={{
					sx: { borderRadius: "10px", minWidth: 360 },
				}}
			>
				<DialogTitle sx={{ fontSize: "14px !important", fontWeight: 700, color: TEXT_STRONG, pb: 1 }}>
					Remove project?
				</DialogTitle>
				<DialogContent sx={{ pb: 1 }}>
					<DialogContentText sx={{ fontSize: "13px !important", color: TEXT_WEAK }}>
						This will remove the project from your list. Your files and data are retained and recoverable by your admin.
					</DialogContentText>
					{deleteError && (
						<Alert severity="error" sx={{ mt: 2, fontSize: "12px !important" }}>
							{deleteError}
						</Alert>
					)}
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
					<Button
						variant="outlined"
						size="small"
						onClick={() => setConfirmDeleteId(null)}
						disabled={deleteIsPending}
						sx={{ fontSize: "12px !important", textTransform: "none" }}
					>
						Cancel
					</Button>
					<Button
						variant="contained"
						size="small"
						onClick={handleConfirmDelete}
						disabled={deleteIsPending}
						sx={{
							fontSize: "12px !important",
							textTransform: "none",
							backgroundColor: DANGER,
							"&:hover": { backgroundColor: DANGER_HOVER },
						}}
					>
						{deleteIsPending ? "Removing…" : "Remove"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default ComposeProjectsList;
