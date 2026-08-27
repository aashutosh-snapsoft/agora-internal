"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Box, Button, Dialog, IconButton } from "@mui/material";
import { CheckCircle, CircleNotch, FileX, FolderOpen, Plus, Trash, WarningCircle, XCircle } from "@phosphor-icons/react";
import {
	uploadFile as uploadBlobViaSas,
} from "@/lib/projects/blob-browser-client";
import { H6, Paragraph, Small } from "@/external/essence/components/typography";
import { Badge, type BadgeType } from "@/components/badge";
import CustomTooltip from "@/components/tooltip/tooltip";
import {
	DS_BTN_DANGER_MD,
	DS_BTN_PRIMARY_MD,
	DS_BTN_SECONDARY_MD,
	DS_BTN_SECONDARY_SM,
	DS_SHADOW_SM,
	DS_STROKE_DEFAULT,
	DS_TEXT_STRONG,
} from "@/components/projects/dsTokens";
import { useAppSelector } from "@/store/store";
import { userSelector } from "@/store/users/user-selectors";
import { inter } from "./fonts";
import ProjectsSidebar from "./ProjectsSidebar";
import {
	analyzeFile,
	analysisMessage,
	STATUS_LABEL,
	STATUS_TONE,
	type FileAnalysis,
	type FileStatus,
} from "./fileAnalysis";
import styles from "./ProjectsWorkspace.module.css";

/**
 * The real projects list + upload flow (promoted from the demo-staging route,
 * SCS-110 follow-up — see /demo/[token]/DemoControl.tsx, now removed, for the
 * fuller original with in-Agora chat/processing screens this intentionally
 * drops). Chat and analysis-run tracking are not rebuilt here: per the intended
 * architecture, submitting a project should hand off into the Ares/Theia
 * workspace, where the chat engine actually lives. That hand-off (URL scheme +
 * auth handshake between Agora and Ares) doesn't exist yet — `handoffToAres`
 * below is a deliberate stub marking exactly where it plugs in.
 */

interface ContainerInfo {
	account: string;
	container: string;
	sas_url: string;
	display_name: string;
}

interface ProjectSummary {
	container: string;
	displayName: string;
	status: string;
	createdAt: string;
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * A staged file plus what we've read from it. Files are wrapped on drop/select
 * so each carries a stable id (for keys and per-row updates) and its analysis
 * status, which starts `uploading` and settles asynchronously (see analyzeFile).
 */
interface IntakeFile {
	id: string;
	file: File;
	status: FileStatus;
	analysis?: FileAnalysis;
	/**
	 * Soft-removed: the row stays in place as an undoable "removed" state and is
	 * kept out of all counts, the payload, and processing. Nothing is destroyed
	 * yet, so removal is reversible until the row is dropped for real (Undo, the
	 * grace-period timer, or starting the run).
	 */
	removed?: boolean;
}

/**
 * A default project name from the first uploaded filename: drop the extension,
 * then drop trailing bookkeeping tokens (fiscal years, quarters, LTM/YTD, GL/TB,
 * dates, version tags) so `Atlas_GL_FY22-LTM.xlsx` becomes `Atlas` and
 * `Financial_statements_FY22-FY24.pdf` becomes `Financial statements`.
 */
function deriveProjectName(filename: string): string {
	const base = filename.replace(/\.[^.]+$/, "");
	const noise = /^(fy[-_]?\d{2,4}|q[1-4]|h[12]|ltm|ytd|mtd|ttm|gl|tb|pl|p&l|bs|cf|actuals?|budget|final|draft|v\d+|\d{4}([-_]\d{2,4})?|\d{1,2}[-_.]\d{1,2}[-_.]\d{2,4})$/i;
	const tokens = base.split(/[\s_\-.]+/).filter(Boolean);
	while (tokens.length > 1 && noise.test(tokens[tokens.length - 1])) tokens.pop();
	const cleaned = tokens.join(" ").trim();
	if (!cleaned) return base;
	return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Short label shown inside the row's status badge. */
const STATUS_BADGE_LABEL: Record<FileStatus, string> = {
	uploading: "Uploading",
	parsing: "Checking",
	ready: "Ready",
	needs_attention: "Needs attention",
	failed: "Failed",
};

/**
 * The glyph inside the status badge — a spinner while working, otherwise the
 * settled-state icon. Colour is inherited from the badge (the design system's
 * Badge foreground, node 397:46024), so it always matches the pill's text.
 */
function StatusIcon({ status }: { status: FileStatus }) {
	if (STATUS_TONE[status] === "progress") {
		return (
			<span className={styles.statusSpin} aria-hidden="true">
				<CircleNotch size={12} weight="bold" />
			</span>
		);
	}
	const Icon = status === "ready" ? CheckCircle : status === "failed" ? XCircle : WarningCircle;
	return <Icon size={12} weight="fill" aria-hidden />;
}

/**
 * "just now" / "20m ago" / "1h ago" / "yesterday" / "3d ago" for project cards.
 *
 * Short forms, and no "Updated " prefix: this sits in the card's 48px header
 * between a name that truncates and a status badge, so every character it
 * spends is width taken off the name. What it means is carried by the header,
 * not repeated in each cell.
 */
function relativeUpdated(iso: string): string {
	const t = new Date(iso).getTime();
	// A missing or unparseable createdAt yields NaN, which fails every comparison
	// below and would fall through to "NaNd ago". Fall back to a neutral label.
	if (Number.isNaN(t)) return "recently";
	const mins = Math.floor((Date.now() - t) / 60000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days === 1) return "yesterday";
	return `${days}d ago`;
}

/**
 * The card's status chip, mapped onto the design system's Badge types.
 *
 * "primary" is the DS's neutral: `Status/Primary` is grey (#e4e6e8 on #121017),
 * not a brand colour.
 *
 * Three variants because the design has three. Live data has one: the ownership
 * registry writes `status: "active"` and nothing ever changes it — the field is
 * annotated "advisory; not load-bearing for authz" there — so "Ready" is the
 * only chip real projects currently show. The other two are wired rather than
 * invented: they are what the page renders once a projects service starts
 * reporting progress, and until then an unrecognised status shows its own label
 * in the neutral variant instead of being silently dropped or mislabelled.
 */
function statusBadge(status: string): { type: BadgeType; label: string } {
	switch (status.toLowerCase()) {
		case "active":
		case "ready":
			return { type: "success", label: "Ready" };
		case "review":
		case "in review":
			return { type: "warning", label: "In review" };
		case "processing":
			return { type: "primary", label: "Processing" };
		default:
			return { type: "primary", label: status };
	}
}

function fileExt(name: string): string {
	const dot = name.lastIndexOf(".");
	return dot !== -1 ? name.slice(dot + 1).toLowerCase() : "file";
}

/**
 * The design system's file-type icons (nodes 41211:110 DOC / 134 PDF / 122 XLS,
 * saved to public/static/file-icons). Each is a monochrome Icons/Default
 * (#737373) glyph with the format lettering drawn into the path.
 *
 * Extensions map to the nearest glyph: pdf → PDF, spreadsheets → XLS,
 * PowerPoint → PPT, and everything else (Word and unknown types) → the DOC
 * glyph as the generic document.
 */
function fileIconSrc(ext: string): string {
	if (ext === "pdf") return "/static/file-icons/pdf.svg";
	if (["xls", "xlsx", "xlsm", "csv"].includes(ext)) return "/static/file-icons/xls.svg";
	if (["ppt", "pptx"].includes(ext)) return "/static/file-icons/ppt.svg";
	return "/static/file-icons/doc.svg";
}

function FileTypeIcon({ ext }: { ext: string }) {
	return (
		<img
			src={fileIconSrc(ext)}
			alt=""
			aria-hidden="true"
			style={{ flex: "none", display: "block", width: 16, height: 16 }}
		/>
	);
}

/**
 * TODO(ares-handoff, SCS-121): design the actual cross-app contract (URL,
 * project/workspace identifier, auth handshake so Ares can verify the same
 * user without a token/session leak) and replace this stub. Deliberately a
 * no-op for now rather than a guessed URL/redirect. The "Open →" button and
 * "Create project" submit both call this — review on PR #569 flagged the
 * button as looking live while silently no-oping; ARES_HANDOFF_COMING_SOON
 * below is what actually surfaces that to the user instead.
 */
function handoffToAres(container: string): void {
	console.info(`[projects] TODO: hand off to Ares workspace for "${container}" — not wired up yet.`);
}

/** Shown in place of navigating, until the Ares hand-off (SCS-121) exists. */
const ARES_HANDOFF_COMING_SOON = "Opens in Ares — coming soon";

/**
 * The design system's Trash glyph (node 41214:212), inlined so it takes the
 * button's `currentColor` — muted at rest, darker on hover.
 */
function TrashIcon() {
	return (
		<svg width="15" height="16" viewBox="0 0 18.4615 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: "block" }}>
			<path d="M17.6923 3.07692H13.8462V2.30769C13.8462 1.69565 13.603 1.10868 13.1702 0.675908C12.7375 0.243131 12.1505 0 11.5385 0H6.92308C6.31104 0 5.72407 0.243131 5.29129 0.675908C4.85852 1.10868 4.61538 1.69565 4.61538 2.30769V3.07692H0.769231C0.565218 3.07692 0.369561 3.15797 0.225303 3.30223C0.0810439 3.44648 0 3.64214 0 3.84615C0 4.05017 0.0810439 4.24582 0.225303 4.39008C0.369561 4.53434 0.565218 4.61538 0.769231 4.61538H1.53846V18.4615C1.53846 18.8696 1.70055 19.2609 1.98907 19.5494C2.27758 19.8379 2.6689 20 3.07692 20H15.3846C15.7926 20 16.184 19.8379 16.4725 19.5494C16.761 19.2609 16.9231 18.8696 16.9231 18.4615V4.61538H17.6923C17.8963 4.61538 18.092 4.53434 18.2362 4.39008C18.3805 4.24582 18.4615 4.05017 18.4615 3.84615C18.4615 3.64214 18.3805 3.44648 18.2362 3.30223C18.092 3.15797 17.8963 3.07692 17.6923 3.07692ZM7.69231 14.6154C7.69231 14.8194 7.61126 15.0151 7.46701 15.1593C7.32275 15.3036 7.12709 15.3846 6.92308 15.3846C6.71906 15.3846 6.52341 15.3036 6.37915 15.1593C6.23489 15.0151 6.15385 14.8194 6.15385 14.6154V8.46154C6.15385 8.25753 6.23489 8.06187 6.37915 7.91761C6.52341 7.77335 6.71906 7.69231 6.92308 7.69231C7.12709 7.69231 7.32275 7.77335 7.46701 7.91761C7.61126 8.06187 7.69231 8.25753 7.69231 8.46154V14.6154ZM12.3077 14.6154C12.3077 14.8194 12.2266 15.0151 12.0824 15.1593C11.9381 15.3036 11.7425 15.3846 11.5385 15.3846C11.3344 15.3846 11.1388 15.3036 10.9945 15.1593C10.8503 15.0151 10.7692 14.8194 10.7692 14.6154V8.46154C10.7692 8.25753 10.8503 8.06187 10.9945 7.91761C11.1388 7.77335 11.3344 7.69231 11.5385 7.69231C11.7425 7.69231 11.9381 7.77335 12.0824 7.91761C12.2266 8.06187 12.3077 8.25753 12.3077 8.46154V14.6154ZM12.3077 3.07692H6.15385V2.30769C6.15385 2.10368 6.23489 1.90802 6.37915 1.76376C6.52341 1.61951 6.71906 1.53846 6.92308 1.53846H11.5385C11.7425 1.53846 11.9381 1.61951 12.0824 1.76376C12.2266 1.90802 12.3077 2.10368 12.3077 2.30769V3.07692Z" />
		</svg>
	);
}

// The grey field the intake card sits on (the card's own CSS `--off`).
const UPLOAD_OFF = "#f6f7f8";

export default function ProjectsWorkspace() {
	const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
	const [showIntake, setShowIntake] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// Separate from `error`: "Opens in Ares — coming soon" is informational, not
	// a failure (PR #569 re-review — reusing the error banner for a successful
	// create made it look like the create had failed).
	const [notice, setNotice] = useState<string | null>(null);
	const [busy, setBusy] = useState<null | "create">(null);
	const [deleting, setDeleting] = useState<string | null>(null);
	// Carries the display name as well as the id: the dialog names the engagement
	// the way the card does, and `container` is the blob-container id, which is
	// not what anyone recognises their project by.
	const [confirmDelete, setConfirmDelete] = useState<
		{ container: string; displayName: string } | null
	>(null);
	// The MUI Dialog stays mounted through its exit animation, re-rendering with
	// `confirmDelete` already null — reading the name off `confirmDelete` there
	// flashes "Delete ?" for the fade's duration. Hold the last name so the
	// closing dialog keeps showing it.
	const lastDeleteName = useRef("");
	if (confirmDelete) lastDeleteName.current = confirmDelete.displayName;

	// ── Intake screen state ─────────────────────────────────────────────────
	const [projectName, setProjectName] = useState("");
	// Once the user has typed in the name field we never auto-fill over them,
	// even after more files are added.
	const [nameTouched, setNameTouched] = useState(false);
	// Inline validation on the name field, shown only after a submit attempt.
	const [nameError, setNameError] = useState<string | null>(null);
	const nameInputRef = useRef<HTMLInputElement>(null);
	const [intakeFiles, setIntakeFiles] = useState<IntakeFile[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	// A polite screen-reader announcement for the latest file status change.
	const [liveMsg, setLiveMsg] = useState("");
	// Monotonic id source for staged files (stable React keys + row updates).
	const fileIdRef = useRef(0);
	// Grace-period timers for soft-removed rows, keyed by file id, so Undo and the
	// run start can cancel a pending drop and unmount can clean them all up.
	const removeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	// The signed-in user, for the "Welcome, …" greeting and the account avatar.
	const { authenticatedUser } = useAppSelector(userSelector);
	const firstName = useMemo(
		() => authenticatedUser?.first_name?.trim() || authenticatedUser?.email?.split("@")[0] || "",
		[authenticatedUser],
	);

	// Rows currently in the queue (soft-removed rows are shown but don't count),
	// and of those, the ones that will actually be processed (a `failed` file
	// can't be read, so it produces nothing).
	const activeFiles = useMemo(() => intakeFiles.filter((f) => !f.removed), [intakeFiles]);
	const processableCount = useMemo(
		() => activeFiles.filter((f) => f.status !== "failed").length,
		[activeFiles],
	);

	// Clear any pending soft-remove timers when the component goes away.
	useEffect(() => {
		const timers = removeTimers.current;
		return () => {
			timers.forEach((t) => clearTimeout(t));
			timers.clear();
		};
	}, []);

	const clearError = () => setError(null);
	const clearNotice = () => setNotice(null);

	// ── Projects list ───────────────────────────────────────────────────────
	const refreshProjects = useCallback(async () => {
		try {
			const res = await fetch("/api/projects/list", { method: "GET" });
			if (!res.ok) throw new Error(`Could not load your projects (${res.status})`);
			const data = (await res.json()) as { projects: ProjectSummary[] };
			const rows = data.projects ?? [];
			rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
			setProjects(rows);
		} catch (e) {
			setProjects([]);
			setError(e instanceof Error ? e.message : "Failed to load your projects");
		}
	}, []);

	useEffect(() => {
		void refreshProjects();
	}, [refreshProjects]);

	// ── All-in-one intake submit: create → upload files → hand off to Ares ──
	// The name is validated on the button (focus + inline error); this guard is
	// the last-resort net so a programmatic call can't create a nameless project.
	const handleIntakeSubmit = useCallback(async () => {
		if (busy !== null) return;
		if (!projectName.trim()) { setNameError("Add a project name to continue."); return; }
		clearError();
		setBusy("create");
		// Starting the run collapses any soft-removed rows right away, and only the
		// files that survived removal are uploaded.
		removeTimers.current.forEach((t) => clearTimeout(t));
		removeTimers.current.clear();
		const filesToUpload = intakeFiles.filter((f) => !f.removed);
		setIntakeFiles(filesToUpload);
		try {
			const res = await fetch("/api/projects/container", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ projectName: projectName.trim() }),
			});
			if (!res.ok) throw new Error(`Container creation failed (${res.status})`);
			const data = (await res.json()) as ContainerInfo;

			for (const item of filesToUpload) {
				await uploadBlobViaSas(data.sas_url, item.file);
			}

			setIntakeFiles([]);
			setProjectName("");
			setNameTouched(false);
			setNameError(null);
			setShowIntake(false);
			void refreshProjects();
			handoffToAres(data.container);
			setNotice(ARES_HANDOFF_COMING_SOON);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to create project");
		} finally {
			setBusy(null);
		}
	}, [busy, projectName, intakeFiles, refreshProjects]);

	// ── Delete project ──────────────────────────────────────────────────────
	const deleteProject = useCallback(
		async (id: string) => {
			clearError();
			setDeleting(id);
			try {
				const res = await fetch("/api/projects/delete", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ container: id }),
				});
				if (!res.ok) throw new Error(`Delete failed (${res.status})`);
				void refreshProjects();
			} catch (e) {
				setError(e instanceof Error ? e.message : "Failed to delete project");
			} finally {
				setDeleting(null);
			}
		},
		[refreshProjects],
	);

	// ── File ingestion + analysis ────────────────────────────────────────────
	/** Merge a new status/analysis into one staged file; a no-op if it's gone. */
	const patchFile = useCallback((id: string, patch: Partial<IntakeFile>) => {
		setIntakeFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
	}, []);

	/** Drop a staged file from the queue for real. In-flight analysis becomes a
	 *  no-op. Used by the grace-period timer once removal is no longer undoable. */
	const dropFile = useCallback((id: string) => {
		const t = removeTimers.current.get(id);
		if (t !== undefined) { clearTimeout(t); removeTimers.current.delete(id); }
		setIntakeFiles((prev) => prev.filter((f) => f.id !== id));
	}, []);

	/**
	 * Soft-remove a staged file: the row stays in place as an undoable "removed"
	 * state (out of counts and the payload) and is dropped for real after a short
	 * grace period. Nothing is destroyed, so there's no confirmation.
	 */
	const removeFile = useCallback((id: string) => {
		setIntakeFiles((prev) => {
			const target = prev.find((f) => f.id === id);
			if (!target || target.removed) return prev;
			setLiveMsg(`${target.file.name} removed`);
			return prev.map((f) => (f.id === id ? { ...f, removed: true } : f));
		});
		const existing = removeTimers.current.get(id);
		if (existing !== undefined) clearTimeout(existing);
		removeTimers.current.set(id, setTimeout(() => dropFile(id), 6000));
	}, [dropFile]);

	/** Undo a soft-remove: cancel the pending drop and restore the row in place
	 *  with its prior status. */
	const undoRemove = useCallback((id: string) => {
		const t = removeTimers.current.get(id);
		if (t !== undefined) { clearTimeout(t); removeTimers.current.delete(id); }
		setIntakeFiles((prev) => {
			const target = prev.find((f) => f.id === id);
			if (target) setLiveMsg(`${target.file.name} restored`);
			return prev.map((f) => (f.id === id ? { ...f, removed: false } : f));
		});
	}, []);

	/**
	 * Wrap dropped/picked files, kick off analysis for each, and — if the name
	 * field is still untouched — pre-fill a default from the first file's name.
	 */
	const ingestFiles = useCallback(
		(files: File[]) => {
			if (files.length === 0) return;
			const items: IntakeFile[] = files.map((file) => ({
				id: `f${(fileIdRef.current += 1)}`,
				file,
				status: "uploading",
			}));
			setIntakeFiles((prev) => {
				const next = [...prev, ...items];
				if (!nameTouched && !projectName.trim() && next[0]) {
					const derived = deriveProjectName(next[0].file.name);
					setProjectName(derived);
					if (derived) setNameError(null);
				}
				return next;
			});

			for (const item of items) {
				// uploading → parsing after a beat, so the transition is visible.
				window.setTimeout(() => patchFile(item.id, { status: "parsing" }), 350);
				analyzeFile(item.file)
					.then((res) => {
						patchFile(item.id, { status: res.status, analysis: res.analysis });
						setLiveMsg(`${item.file.name} ${STATUS_LABEL[res.status]}`);
					})
					.catch(() => {
						patchFile(item.id, { status: "failed" });
						setLiveMsg(`${item.file.name} ${STATUS_LABEL.failed}`);
					});
			}
		},
		[nameTouched, projectName, patchFile],
	);

	// ── Intake drag-and-drop handlers ───────────────────────────────────────
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		ingestFiles(Array.from(e.dataTransfer.files));
	}, [ingestFiles]);

	const handleIntakeFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		ingestFiles(Array.from(e.target.files ?? []));
		e.target.value = "";
	}, [ingestFiles]);

	// ── Render ──────────────────────────────────────────────────────────────
	return (
		/* Inter, the design system's typeface, applied by overriding the `--font`
		   token this stylesheet already routes every rule through — so the whole
		   surface switches from one declaration rather than a family per rule.
		   Inheritance carries it to the essence typography and the MUI boxes
		   below; the `!important` Satoshi on `html, body` (createTheme.ts) does
		   not fight this, because a declaration on a descendant beats an
		   inherited value whatever its weight. What it does NOT reach is anything
		   that sets its own family — see the buttons, which do. */
		<div
			className={styles.demo}
			style={{ "--font": inter.style.fontFamily } as CSSProperties}
		>
			{/* A MUI Dialog rather than the hand-rolled overlay this replaced: it
			    brings the focus trap, the Escape handler and the aria wiring that
			    the div did not have. The layout is the design's — a 512px card, a
			    48px error badge in its own column beside the two text rows, and a
			    full-bleed footer rule. */}
			<Dialog
				open={confirmDelete !== null}
				onClose={() => setConfirmDelete(null)}
				aria-labelledby="delete-dialog-title"
				aria-describedby="delete-dialog-description"
				slotProps={{
					paper: {
						sx: {
							boxSizing: "border-box",
							width: 512,
							maxWidth: "calc(100% - 32px)",
							m: 2,
							p: "24px 24px 0",
							borderRadius: "8px",
							bgcolor: "background.paper",
							boxShadow:
								"0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
							fontFamily: inter.style.fontFamily,
						},
					},
				}}
			>
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "48px 1fr",
						gridTemplateAreas: `"icon title" "icon msg" "footer footer"`,
						columnGap: 2,
					}}
				>
					{/* Status/Error/bg #fee2e2, a 48px disc with a 20px glyph. */}
					<Box
						aria-hidden="true"
						sx={{
							gridArea: "icon",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: 48,
							height: 48,
							borderRadius: "24px",
							backgroundColor: "#fee2e2",
							color: "#b91c1c",
						}}
					>
						<WarningCircle size={20} weight="fill" />
					</Box>

					{/* DS Heading 4 — Inter Bold 18/24. */}
					<Box
						id="delete-dialog-title"
						component="h2"
						sx={{
							gridArea: "title",
							m: 0,
							mb: 1,
							fontSize: "18px",
							fontWeight: 700,
							lineHeight: "24px",
							color: "#121017",
						}}
					>
						Delete {lastDeleteName.current}?
					</Box>

					{/* DS LG/Regular 14 — 14/20, in the weaker text colour.

					    The copy stops at "can't be undone" rather than promising the
					    undo window the mockup's wording offers: this delete calls
					    /api/projects/delete immediately and nothing takes it back.
					    Wording ahead of the behaviour teaches people to disbelieve
					    the warning. */}
					<Box
						id="delete-dialog-description"
						sx={{
							gridArea: "msg",
							pb: 2,
							fontSize: "14px",
							fontWeight: 400,
							lineHeight: "20px",
							color: "#737373",
						}}
					>
						<Box component="span" sx={{ fontWeight: 500, color: "#2e343e" }}>
							{lastDeleteName.current}
						</Box>{" "}
						and all of its files will be permanently deleted. This can&apos;t be
						undone.
					</Box>

					{/* Full-bleed footer: the card owns the 24px inset, so the rule is
					    pulled back out to meet both edges. */}
					<Box
						sx={{
							gridArea: "footer",
							display: "flex",
							alignItems: "center",
							justifyContent: "flex-end",
							gap: 1,
							mx: "-24px",
							px: 3,
							py: 1.5,
							borderTop: "1px solid",
							borderColor: DS_STROKE_DEFAULT,
						}}
					>
						{/* Focus starts on Cancel, not on the destructive action: this
						    dialog exists to interrupt, and one that deletes on the Enter
						    someone was already pressing has not interrupted anything. */}
						<Button
							autoFocus
							sx={{ ...DS_BTN_SECONDARY_MD, fontFamily: inter.style.fontFamily }}
							onClick={() => setConfirmDelete(null)}
						>
							Cancel
						</Button>
						<Button
							sx={{ ...DS_BTN_DANGER_MD, fontFamily: inter.style.fontFamily }}
							onClick={() => {
								const target = confirmDelete;
								setConfirmDelete(null);
								if (target) void deleteProject(target.container);
							}}
						>
							Delete
						</Button>
					</Box>
				</Box>
			</Dialog>

			{/* The rail sits beside the content rather than above it, and stays put
			    while the content scrolls — `.intakeScreen` is its own scroll box at
			    the same height, so only the column beside the rail moves. */}
			<Box sx={{ display: "flex" }}>
				{/* The list's own rail. Hidden during intake — the upload screen below
				    brings its own full-height rail, and two would stack side by side.
				    `fullHeight`: /projects home has no dashboard header (suppressed in
				    DashboardLayout), so the rail fills the full viewport. */}
				{!showIntake && <ProjectsSidebar fullHeight />}
				<Box sx={{ flex: 1, minWidth: 0 }}>
			{!showIntake && (
				<div className={styles.intakeScreen}>
					<div className={styles.projectsPage}>
						{/* `center`, not `flex-start`: one line on each side now that the
						    subtitle is gone, and top-aligning a 32px button against a 36px
						    heading leaves it sitting visibly high. */}
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: 2,
								mb: 3,
							}}
						>
							{/* The DS "Heading 2" step: Inter Bold 28/32, letter-spacing 0.
							    essence's H6 is the 28px component; its default weight is 600
							    and its leading and tracking come from elsewhere, so both are
							    stated here to match the type scale exactly. */}
							<H6 component="h1" fontWeight={700} lineHeight="32px" color="grey.900">
								Your projects
							</H6>
							{/* The page's one primary action, at the DS Button Size=MD
							    Type=Primary already tokenised for this surface. The
							    startIcon margin is MUI's own 8px default; the DS node
							    specifies a 6px gap to a 12px glyph.

							    No tooltip: it would only echo the button's own visible label. */}
							<Button
								sx={{
									...DS_BTN_PRIMARY_MD,
									// essence's MuiButton override sets the family explicitly
									// (theme.typography.fontFamily), so buttons are the one
									// thing the page-level `--font` override cannot reach.
									fontFamily: inter.style.fontFamily,
									"& .MuiButton-startIcon": { ml: 0, mr: "6px" },
								}}
								// Icons/Primary btn icon is #ffffff — a shade off the #fafafa
								// Text/Inverse the label uses, so it is set, not inherited.
								startIcon={<Plus size={12} weight="bold" color="#ffffff" />}
								onClick={() => { clearError(); setShowIntake(true); }}
							>
								New project
							</Button>
						</Box>

						{error && (
							<div className={styles.errorBanner}>
								<span>{error}</span>
								<button className={styles.errorBannerClose} onClick={clearError}>✕</button>
							</div>
						)}

						{notice && (
							<div className={styles.noticeBanner}>
								<span>{notice}</span>
								<button className={styles.noticeBannerClose} onClick={clearNotice}>✕</button>
							</div>
						)}

						{projects === null || projects.length === 0 ? (
							<div className={styles.projectsEmpty}>
								{projects === null
									? "Loading your projects…"
									: "No projects yet — create your first one."}
							</div>
						) : (
							<Box
								component="ul"
								sx={{
									display: "grid",
									// `min(320px, 100%)`, not a bare 320px: a hard 320 floor cannot
									// shrink, so once the column is narrower than that — the sidebar
									// expanded on a small viewport is the case that surfaced it — the
									// track overflows and the whole page scrolls sideways. Wrapping
									// the floor in min() lets the last track collapse to the column
									// instead.
									gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
									gap: 3,
									m: 0,
									p: 0,
									listStyle: "none",
								}}
							>
								{projects.map((p) => {
									const badge = statusBadge(p.status);
									const cardBusy = busy !== null || deleting !== null;
									return (
										/* The DS Card, Style=Bordered with header and footer (node
										   1312:27609): a surface on Interactive/Surface/Default inside
										   an Interactive/Stroke/Default hairline at radius 8 with
										   shadow/sm, divided by rules into a 48px header, a content
										   area that takes what is left, and a 48px footer.
										   `overflow: hidden` is the component's own clip, and it is
										   what lets the two rules run the full width without escaping
										   the rounded corners. */
										<Box
											component="li"
											key={p.container}
											sx={{
												position: "relative",
												display: "flex",
												flexDirection: "column",
												overflow: "hidden",
												bgcolor: "background.paper",
												border: "1px solid",
												borderColor: DS_STROKE_DEFAULT,
												borderRadius: "8px",
												boxShadow: DS_SHADOW_SM,
											}}
										>
											{deleting === p.container && (
												<div className={styles.projDeletingOverlay}>
													<span className={styles.spinner} aria-hidden="true" />
													Deleting project…
												</div>
											)}
											{/* Header: the name, then the two things that say where the
											    engagement stands. Both are read rather than operated, so
											    they sit together and the footer takes the controls. */}
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 1,
													flexShrink: 0,
													boxSizing: "border-box",
													height: 48,
													pl: 2,
													pr: 1.5,
													borderBottom: "1px solid",
													borderColor: DS_STROKE_DEFAULT,
												}}
											>
												{/* h2 because it heads the card under the page's h1.
												    `ellipsis` is essence's own truncation prop — the band
												    is a fixed height, so a name long enough to wrap would
												    be clipped mid-letter instead. Full name on title. */}
												<Paragraph
													component="h2"
													ellipsis
													title={p.displayName}
													m={0}
													flex={1}
													minWidth={0}
													fontWeight={700}
													lineHeight="20px"
													color={DS_TEXT_STRONG}
												>
													{p.displayName}
												</Paragraph>
												{/* createdAt, not a modified time — the registry records
												    no updates. The title says so rather than letting a
												    bare "3d ago" imply activity that isn't tracked.
												    Never shrinks: a truncated timestamp says less than
												    nothing. */}
												{/* DS "MD/Regular 12" — 12/16. */}
												<Small
													color="grey.500"
													lineHeight="16px"
													flexShrink={0}
													whiteSpace="nowrap"
													title={`Created ${new Date(p.createdAt).toLocaleString()}`}
												>
													{relativeUpdated(p.createdAt)}
												</Small>
												<Box flexShrink={0} display="flex">
													<Badge type={badge.type}>{badge.label}</Badge>
												</Box>
											</Box>
											{/* Content: the card's growing slot. Growing rather than
											    sized keeps every card in a row the same height, which is
											    what puts all the footers on one line. */}
											<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, p: 2 }}>
												{/* The folder chip — an identity mark, not a control. */}
												<Box
													aria-hidden="true"
													sx={{
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														flexShrink: 0,
														width: 40,
														height: 40,
														borderRadius: "8px",
														bgcolor: "grey.100",
														color: "grey.500",
													}}
												>
													<FolderOpen size={20} weight="fill" />
												</Box>
												<Paragraph m={0} color="grey.500">
													Buy-side · Quality of Earnings
												</Paragraph>
											</Box>
											{/* Footer: the card's two actions, the destructive one
											    furthest from the affirmative one. */}
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
													gap: 1.5,
													flexShrink: 0,
													boxSizing: "border-box",
													height: 48,
													px: 2,
													borderTop: "1px solid",
													borderColor: DS_STROKE_DEFAULT,
												}}
											>
												{/* The DS Button at Size=MD, Type=Icon Only, Style=Tertiary
												    (node 1315:42587): a 32px box at radius 6, transparent at
												    rest, Button/Tertiary/Background Hover #fafafa and Pressed
												    #f5f5f5, its glyph in Icons/Tertiary btn icon #3c434d.

												    Always rendered, never hover-gated: a control that appears
												    only under a pointer does not exist on a touch screen, and
												    one hidden at rest cannot be tabbed to in any obvious
												    order.

												    NOTE: the DS tertiary hover is a grey wash, so this no
												    longer reddens on approach the way the mockup did. The
												    destructive warning now rests entirely on the trash mark
												    and the confirm dialog behind the click. The DS's own
												    destructive control is Type=Danger, which is a filled red
												    button — too loud for a card footer. */}
												{/* The label rides on the DS tooltip rather than the `title`
												    attribute the browser would draw in its own style; the
												    aria-label stays, so assistive tech is not relying on the
												    tooltip being open. */}
												<CustomTooltip title="Delete project" placement="top">
													<IconButton
														aria-label={`Delete project ${p.displayName}`}
														onClick={() =>
															setConfirmDelete({
																container: p.container,
																displayName: p.displayName,
															})
														}
														disabled={cardBusy}
														sx={{
															width: 32,
															height: 32,
															borderRadius: "6px",
															color: "#3c434d",
															backgroundColor: "transparent",
															"&:hover": { backgroundColor: "#fafafa" },
															"&:active": { backgroundColor: "#f5f5f5" },
															"&.Mui-focusVisible": {
																backgroundColor: "#fafafa",
																boxShadow: "0 0 0 2px #FFFFFF, 0 0 0 4px #525252",
															},
															"&.Mui-disabled": { color: "#a3a3a3" },
														}}
													>
														{/* The node's 16px icon slot. Phosphor's viewBox carries
														    its own padding, so a 16px glyph inks about the 12px
														    the node draws inside that slot. */}
														<Trash size={16} weight="fill" />
													</IconButton>
												</CustomTooltip>
												{/* DS Button Size=SM Type=Secondary. Secondary rather than
												    primary: the cards come as a grid, and filled buttons
												    down a page compete with each other and with the page's
												    one real primary, "New project".

												    "Open" is a labelled action, not a whole-card click
												    target — the card carries its own delete control, and a
												    card that navigates on any click turns every near-miss
												    of that button into a navigation. */}
												{/* "Open project", not the coming-soon notice: the tooltip
												    says what the control is for. That the hand-off is not
												    wired up yet is said on click, by the notice banner —
												    a hover label is the wrong place to carry a caveat. */}
												<CustomTooltip title="Open project" placement="top">
													<Button
														sx={{ ...DS_BTN_SECONDARY_SM, fontFamily: inter.style.fontFamily }}
														aria-label={`Open project ${p.displayName}`}
														onClick={() => {
															handoffToAres(p.container);
															setNotice(ARES_HANDOFF_COMING_SOON);
														}}
														disabled={cardBusy}
													>
														Open
													</Button>
												</CustomTooltip>
											</Box>
										</Box>
									);
								})}
							</Box>
						)}
					</div>
				</div>
			)}

			{showIntake && (
				/* The upload page's own chrome — a left nav rail and a top bar around
				   the intake card — modelled on the v2 prototype. Inter throughout: the
				   `--font` override reaches the card's CSS-module rules (they route
				   through `var(--font)`), and `fontFamily` covers the MUI boxes here. */
				<Box
					sx={{
						display: "flex",
						height: "100dvh",
						fontFamily: inter.style.fontFamily,
						bgcolor: UPLOAD_OFF,
					}}
					style={{ "--font": inter.style.fontFamily } as CSSProperties}
				>
					{/* ── Left nav rail — the design system's collapsible sidebar (nodes
					    43420:72137 expanded / 72150 collapsed), starting collapsed.
					    `fullHeight`: this shell is 100dvh with no top header. ─────────── */}
					<ProjectsSidebar fullHeight />

					{/* ── Content — the intake card, centred on the grey field. No top
					    bar: the account and brand live in the rail. ─────────────────── */}
					<Box
						sx={{
							flex: 1,
							minWidth: 0,
							overflowY: "auto",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							px: "24px",
							py: "40px",
							bgcolor: UPLOAD_OFF,
						}}
					>
							<div className={styles.demoCard}>
								{/* "← All projects" only once there is a list to go back to. A
								    first-time user reaches this screen with no projects yet, so
								    the link would point at an empty page they just came from; the
								    intake is effectively their home until they have created
								    something. `projects` is null while loading and [] when
								    genuinely empty — both hide it; it appears once at least one
								    project exists. */}
								{!!projects?.length && (
									<button className={styles.wsBack} onClick={() => setShowIntake(false)}>
										← All projects
									</button>
								)}
								{firstName && <div className={styles.eyebrow}>Welcome, {firstName}</div>}
								<h1 className={styles.cardTitle}>Upload your financial documents</h1>
								<p className={styles.cardSub}>
									Drop in whatever financials you have, QuickBooks exports, Excel,
									PDFs, even scanned statements. Socratics reads what you upload and
									guides you through the rest.
								</p>

								{error && (
									<div className={styles.errorBanner}>
										<span>{error}</span>
										<button className={styles.errorBannerClose} onClick={clearError}>✕</button>
									</div>
								)}

								<div className={styles.field}>
									<label className={styles.fieldLabel} htmlFor="intake-project-name">
										Project name <span className={styles.required}>*</span>
									</label>
									<input
										id="intake-project-name"
										ref={nameInputRef}
										className={styles.fieldInput}
										type="text"
										placeholder="Name this project"
										value={projectName}
										aria-invalid={nameError !== null}
										aria-describedby={nameError ? "intake-project-name-error" : undefined}
										onChange={(e) => {
											setProjectName(e.target.value);
											// Any keystroke is a deliberate edit — stop auto-filling.
											setNameTouched(true);
											if (e.target.value.trim() && nameError) setNameError(null);
											if (error) clearError();
										}}
									/>
									{nameError && (
										<div id="intake-project-name-error" className={styles.fieldError}>
											{nameError}
										</div>
									)}
								</div>

								{/* Drag-and-drop zone. The whole zone is a drop target and a
								    click-to-browse target (the hidden input covers it). */}
								{/* No green "has files" state — the box stays neutral; the
								    uploaded files are shown in the list below it instead. */}
								<div
									className={[
										styles.bigdrop,
										isDragging ? styles.bigdropActive : "",
									].join(" ")}
									onDragOver={handleDragOver}
									onDragLeave={handleDragLeave}
									onDrop={handleDrop}
								>
									<svg className={styles.bdIc} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
									<div className={styles.bdTitle}>Drop your files here</div>
									<div className={styles.bdDesc}>
										QuickBooks exports, bank statements, scanned PDFs, messy is fine.
									</div>
									<input
										type="file"
										multiple
										className={styles.fileInputHidden}
										onChange={handleIntakeFileChange}
									/>
								</div>

								{intakeFiles.length > 0 && (
									<div className={styles.uploadList}>
										<div className={styles.uploadListHead}>
											{/* Counts only what will actually be processed — soft-removed
											    rows and unreadable (failed) files are excluded. When some
											    files won't be processed, both numbers are shown so the drop
											    is explicit rather than a silently smaller total. */}
											{processableCount === activeFiles.length
												? `${processableCount} file${processableCount === 1 ? "" : "s"} added`
												: `${processableCount} of ${activeFiles.length} file${activeFiles.length === 1 ? "" : "s"} will be processed`}
										</div>
										{/* Honesty signal: these rows are estimated from file names before
										    upload — Socratics only reads the contents once the files are in.
										    Keeps the per-row previews from reading as confirmed parse
										    results. */}
										<div className={styles.uploadListNote}>
											Previews are estimated from file names — Socratics reads the
											contents after you upload.
										</div>
										{intakeFiles.map((item) => {
											// A soft-removed row: muted, dashed, with an Undo affordance. It
											// holds the file's place in the list so Undo restores it here.
											if (item.removed) {
												return (
													<div key={item.id} className={`${styles.uploadRow} ${styles.uploadRowRemoved}`}>
														<span className={styles.removedIcon} aria-hidden="true">
															<FileX size={16} />
														</span>
														<div className={styles.uploadMeta}>
															<span className={styles.removedName}>{item.file.name} removed</span>
														</div>
														<button
															type="button"
															className={styles.undoBtn}
															aria-label={`Undo removing ${item.file.name}`}
															onClick={() => undoRemove(item.id)}
														>
															Undo
														</button>
													</div>
												);
											}
											const toneClass = styles[`tone_${STATUS_TONE[item.status]}`];
											// Detail beneath the badge — skip it while uploading, where the
											// badge label already says everything.
											const detail = item.status === "uploading"
												? ""
												: analysisMessage(item.status, item.analysis, item.file.name);
											return (
												<div key={item.id} className={styles.uploadRow}>
													<FileTypeIcon ext={fileExt(item.file.name)} />
													<div className={styles.uploadMeta}>
														<span className={styles.uploadName}>{item.file.name}</span>
														{detail && <span className={styles.statusDetail}>{detail}</span>}
													</div>
													<span className={styles.uploadSize}>{formatBytes(item.file.size)}</span>
													{/* Status as a DS Badge pill (node 397:46024), inside a fixed
													    right-aligned cell so every pill's right edge — and the
													    size column before it — lines up regardless of label width. */}
													<div className={styles.statusCell}>
														<span className={`${styles.statusBadge} ${toneClass}`}>
															<StatusIcon status={item.status} />
															{STATUS_BADGE_LABEL[item.status]}
														</span>
													</div>
													{/* Remove from the queue — the DS trash glyph (node 41214:212).
													    Removal is reversible (undo row), so it's immediate, no dialog. */}
													<button
														type="button"
														className={styles.uploadRemove}
														aria-label={`Remove ${item.file.name}`}
														onClick={() => removeFile(item.id)}
													>
														<TrashIcon />
													</button>
												</div>
											);
										})}
									</div>
								)}

								{/* Status changes are announced politely to assistive tech. */}
								<div className={styles.srOnly} role="status" aria-live="polite">
									{liveMsg}
								</div>

								{/* Enabled unless a create is in flight — an empty name is caught on
								    click (focus + inline error) rather than sitting dead. */}
								<button
									className={`${styles.btnPrimary} ${styles.btnIntake}`}
									onClick={() => {
										if (!projectName.trim()) {
											setNameError("Add a project name to continue.");
											nameInputRef.current?.focus();
											nameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
											return;
										}
										void handleIntakeSubmit();
									}}
									disabled={busy !== null}
								>
									{busy === "create" ? "Creating project…" : "Create & start"}
								</button>
						</div>
					</Box>
				</Box>
			)}
				</Box>
			</Box>
		</div>
	);
}
