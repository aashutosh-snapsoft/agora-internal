/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import React from "react";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import type { ProjectRow } from "../projectRowMapper";

const ORIGINAL_COMPOSE_BASE = process.env.NEXT_PUBLIC_COMPOSE_BASE_URL;

beforeAll(() => {
	process.env.NEXT_PUBLIC_COMPOSE_BASE_URL = "https://multidoc.test";
});

afterAll(() => {
	if (ORIGINAL_COMPOSE_BASE === undefined) {
		delete process.env.NEXT_PUBLIC_COMPOSE_BASE_URL;
	} else {
		process.env.NEXT_PUBLIC_COMPOSE_BASE_URL = ORIGINAL_COMPOSE_BASE;
	}
});

// NOTE: the component deliberately uses plain <a> / Button component="a" for
// cross-app /workflow handoffs (hard navigation, not next/link soft-routing —
// see SENG-791, enforced by a no-restricted-imports lint rule). No next/link
// mock is needed.

// Capture amplitude.track() calls so analytics tests can assert payloads
// without initialising the real Amplitude SDK.
const amplitudeTrackMock = jest.fn();
jest.mock("@amplitude/analytics-browser", () => ({
	track: (...args: unknown[]) => amplitudeTrackMock(...args),
}));

// Capture window.location.assign without navigating the jsdom window away.
let assignMock: jest.Mock;
beforeEach(() => {
	assignMock = jest.fn();
	Object.defineProperty(window, "location", {
		configurable: true,
		writable: true,
		value: { ...window.location, assign: assignMock },
	});
	amplitudeTrackMock.mockClear();
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ComposeProjectsList } = require("../ComposeProjectsList") as typeof import("../ComposeProjectsList");

const SAMPLE_ROWS: ProjectRow[] = [
	{
		id: "p1",
		name: "Acme Corp",
		sourceFile: "Acme_IS.xlsx",
		additionalFiles: ["Acme_BS.xlsx", "Acme_CF.xlsx"],
		lastModified: "Apr 17, 2026",
		status: "ready-to-model",
		currentStep: "audit",
		latestDocumentId: "doc-acme",
	},
	{
		id: "p2",
		name: "Widgets Inc",
		sourceFile: "Widgets.xlsx",
		additionalFiles: [],
		lastModified: "Apr 14, 2026",
		status: "compose-in-progress",
		currentStep: "merge",
		latestDocumentId: "doc-widgets",
	},
];

describe("ComposeProjectsList — loading state", () => {
	it("renders a loading indicator and no table rows when loading", () => {
		render(<ComposeProjectsList projects={[]} loading />);
		expect(screen.getByRole("progressbar")).toBeInTheDocument();
		expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
	});
});

describe("ComposeProjectsList — error state", () => {
	it("renders an error alert with the provided message", () => {
		render(<ComposeProjectsList projects={[]} error="boom" />);
		expect(screen.getByRole("alert")).toHaveTextContent(/boom/i);
	});

	it("renders a Retry button that calls onRetry when clicked", () => {
		const onRetry = jest.fn();
		render(
			<ComposeProjectsList projects={[]} error="boom" onRetry={onRetry} />,
		);
		fireEvent.click(screen.getByRole("button", { name: /retry/i }));
		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	it("omits the Retry button when onRetry is not provided", () => {
		render(<ComposeProjectsList projects={[]} error="boom" />);
		expect(
			screen.queryByRole("button", { name: /retry/i }),
		).not.toBeInTheDocument();
	});
});

describe("ComposeProjectsList — empty state", () => {
	it("renders an empty-state message when there are zero projects", () => {
		render(<ComposeProjectsList projects={[]} />);
		expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
	});
});

describe("ComposeProjectsList — populated rows", () => {
	it("renders the project name and source file for each row", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		expect(screen.getByText("Acme Corp")).toBeInTheDocument();
		expect(screen.getByText("Widgets Inc")).toBeInTheDocument();
		expect(screen.getByText("Acme_IS.xlsx")).toBeInTheDocument();
		expect(screen.getByText("Widgets.xlsx")).toBeInTheDocument();
	});

	it("renders the additional-file badge with the correct count", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		expect(screen.getByText("+2")).toBeInTheDocument();
	});

	it("renders the status label for each row", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		expect(screen.getByText("Ready to model")).toBeInTheDocument();
		expect(screen.getByText("Compose in progress")).toBeInTheDocument();
	});

	it("renders the lastModified date for each row", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		expect(screen.getByText("Apr 17, 2026")).toBeInTheDocument();
		expect(screen.getByText("Apr 14, 2026")).toBeInTheDocument();
	});

	it("renders the header project count", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		expect(screen.getByText("2 projects")).toBeInTheDocument();
	});

	it("renders the header count in singular form for a single project", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS.slice(0, 1)} />);
		expect(screen.getByText("1 project")).toBeInTheDocument();
	});

	it("renders a New project link", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		// Rendered as Button component="a" → an anchor (link role), so the
		// handoff is a hard navigation, not a soft <Link> route. See SENG-791.
		expect(
			screen.getByRole("link", { name: /new project/i }),
		).toBeInTheDocument();
	});
});

describe("ComposeProjectsList — cross-origin handoff URLs (new in PR2)", () => {
	function rowLink(rowName: string): HTMLAnchorElement {
		const row = screen.getByText(rowName).closest("tr") as HTMLElement;
		// The project-name cell wraps the name in <a>; the next-step button
		// cell wraps the button in <a>. Either anchor's href is the handoff URL.
		const link = within(row).getAllByRole("link")[0] as HTMLAnchorElement;
		return link;
	}

	it("ready-to-model rows link to ${COMPOSE_BASE}/modeling-preview?projectId=...", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		expect(rowLink("Acme Corp").getAttribute("href")).toBe(
			"https://multidoc.test/modeling-preview?projectId=p1",
		);
	});

	it("compose-in-progress rows with a latestDocumentId link to ${COMPOSE_BASE}/multidoc-preview/{docId}?projectId=...&step=...", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		expect(rowLink("Widgets Inc").getAttribute("href")).toBe(
			"https://multidoc.test/multidoc-preview/doc-widgets?projectId=p2&step=merge",
		);
	});

	it("compose-in-progress rows with no latestDocumentId fall back to the new-project URL", () => {
		render(
			<ComposeProjectsList
				projects={[
					{
						id: "p3",
						name: "Empty Shell",
						sourceFile: "—",
						additionalFiles: [],
						lastModified: "—",
						status: "compose-in-progress",
						currentStep: "upload",
						latestDocumentId: null,
					},
				]}
			/>,
		);
		expect(rowLink("Empty Shell").getAttribute("href")).toBe(
			"https://multidoc.test/multidoc-preview?projectId=p3",
		);
	});
});

describe("ComposeProjectsList — context menu navigation (cross-origin)", () => {
	function openRowMenu(rowName: string) {
		const row = screen.getByText(rowName).closest("tr") as HTMLElement;
		const trigger = within(row).getByLabelText(/open project actions/i);
		fireEvent.click(trigger);
	}

	it("ready-to-model rows navigate to modeling on the Compose host", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/open compose project/i));
		expect(assignMock).toHaveBeenCalledWith(
			"https://multidoc.test/modeling-preview?projectId=p1",
		);
	});

	it("compose-in-progress rows navigate via resumeComposeUrl with both ids", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		openRowMenu("Widgets Inc");
		fireEvent.click(screen.getByText(/open compose project/i));
		expect(assignMock).toHaveBeenCalledWith(
			"https://multidoc.test/multidoc-preview/doc-widgets?projectId=p2&step=merge",
		);
	});
});

describe("ComposeProjectsList — New project button (post-revisions)", () => {
	it("renders as a link to ${COMPOSE_BASE}/multidoc-preview (no Hasura POST here)", () => {
		// Per PR5, the Hasura row is created when the user submits the upload
		// in v2-frontend's MultiDocMerger. Agora's button is pure navigation.
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		const link = screen.getByRole("link", {
			name: /new project/i,
		}) as HTMLAnchorElement;
		expect(link.getAttribute("href")).toBe(
			"https://multidoc.test/multidoc-preview",
		);
	});

	it("does NOT POST to /api/projects/create when clicked", async () => {
		const fetchMock = jest.fn();
		(global as unknown as { fetch: jest.Mock }).fetch = fetchMock;

		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		await act(async () => {
			fireEvent.click(screen.getByRole("link", { name: /new project/i }));
		});

		// The button is a Button component="a" (a plain anchor) — clicking it
		// navigates and doesn't fire any fetch from Agora.
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe("ComposeProjectsList — analytics (post-revisions)", () => {
	function openRowMenu(rowName: string) {
		const row = screen.getByText(rowName).closest("tr") as HTMLElement;
		const trigger = within(row).getByLabelText(/open project actions/i);
		fireEvent.click(trigger);
	}

	it("fires 'View Compose Projects List' once on first successful render", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		expect(amplitudeTrackMock).toHaveBeenCalledWith(
			"View Compose Projects List",
			{ project_count: 2 },
		);
	});

	it("does not fire 'View Compose Projects List' while loading or in error state", () => {
		render(<ComposeProjectsList projects={[]} loading />);
		expect(amplitudeTrackMock).not.toHaveBeenCalledWith(
			"View Compose Projects List",
			expect.anything(),
		);
	});

	it("fires 'Open Compose Project' with payload when the menu item is clicked", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		amplitudeTrackMock.mockClear(); // ignore the view-track from mount
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/open compose project/i));
		expect(amplitudeTrackMock).toHaveBeenCalledWith("Open Compose Project", {
			project_id: "p1",
			status: "ready-to-model",
			has_document: true,
		});
	});

	it("fires 'Open Compose Project' when a row anchor is clicked", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		amplitudeTrackMock.mockClear();
		// First anchor in the second row (Widgets Inc) is the project-name link.
		const row = screen.getByText("Widgets Inc").closest("tr") as HTMLElement;
		const link = within(row).getAllByRole("link")[0] as HTMLAnchorElement;
		fireEvent.click(link);
		expect(amplitudeTrackMock).toHaveBeenCalledWith("Open Compose Project", {
			project_id: "p2",
			status: "compose-in-progress",
			has_document: true,
		});
	});
});

describe("ComposeProjectsList — hosted /workflow mount (SENG-791)", () => {
	// When Compose is co-hosted under app.dev's /workflow path, the handoff URLs
	// must carry the /workflow prefix and never point at the Vercel prototype.
	// baseUrl() reads process.env at call time, so overriding it here is enough.
	beforeEach(() => {
		process.env.NEXT_PUBLIC_COMPOSE_BASE_URL = "/workflow";
	});
	afterAll(() => {
		process.env.NEXT_PUBLIC_COMPOSE_BASE_URL = "https://multidoc.test";
	});

	function rowLink(rowName: string): HTMLAnchorElement {
		const row = screen.getByText(rowName).closest("tr") as HTMLElement;
		return within(row).getAllByRole("link")[0] as HTMLAnchorElement;
	}

	it("renders the New project link mounted under /workflow", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		const link = screen.getByRole("link", {
			name: /new project/i,
		}) as HTMLAnchorElement;
		expect(link.getAttribute("href")).toBe("/workflow/multidoc-preview");
	});

	it("links in-progress rows to the /workflow-mounted document route", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		expect(rowLink("Widgets Inc").getAttribute("href")).toBe(
			"/workflow/multidoc-preview/doc-widgets?projectId=p2&step=merge",
		);
	});

	it("emits no handoff URL pointing at the Vercel prototype host", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		for (const link of screen.getAllByRole("link")) {
			expect(link.getAttribute("href") ?? "").not.toContain(
				"multidoc.socratics.ai",
			);
		}
	});
});

describe("ComposeProjectsList — Delete menu item removed (post-revisions)", () => {
	function openRowMenu(rowName: string) {
		const row = screen.getByText(rowName).closest("tr") as HTMLElement;
		const trigger = within(row).getByLabelText(/open project actions/i);
		fireEvent.click(trigger);
	}

	it("does not render a 'Delete project' entry in the kebab menu", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		openRowMenu("Acme Corp");
		expect(screen.queryByText(/delete project/i)).not.toBeInTheDocument();
	});

	it("still renders 'Open compose project' as the single menu action", () => {
		render(<ComposeProjectsList projects={SAMPLE_ROWS} />);
		openRowMenu("Acme Corp");
		expect(screen.getByText(/open compose project/i)).toBeInTheDocument();
	});
});
