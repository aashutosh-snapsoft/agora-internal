/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor, within, act } from "@testing-library/react";
import type { ProjectRow } from "../projectRowMapper";

beforeAll(() => {
	process.env.NEXT_PUBLIC_COMPOSE_BASE_URL = "https://multidoc.test";
});

const amplitudeTrackMock = jest.fn();
jest.mock("@amplitude/analytics-browser", () => ({
	track: (...args: unknown[]) => amplitudeTrackMock(...args),
}));

beforeEach(() => {
	Object.defineProperty(window, "location", {
		configurable: true,
		writable: true,
		value: { ...window.location, assign: jest.fn() },
	});
	amplitudeTrackMock.mockClear();
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ComposeProjectsList } = require("../ComposeProjectsList") as typeof import("../ComposeProjectsList");

const ROWS: ProjectRow[] = [
	{
		id: "p1",
		name: "Acme Corp",
		sourceFile: "Acme_IS.xlsx",
		additionalFiles: [],
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

function openRowMenu(rowName: string) {
	const row = screen.getByText(rowName).closest("tr") as HTMLElement;
	const trigger = within(row).getByLabelText(/open project actions/i);
	fireEvent.click(trigger);
}

describe("ComposeProjectsList — Remove project menu item", () => {
	it("does not render 'Remove project' when onDeleteProject is not provided", () => {
		render(<ComposeProjectsList projects={ROWS} />);
		openRowMenu("Acme Corp");
		expect(screen.queryByText(/remove project/i)).not.toBeInTheDocument();
	});

	it("renders 'Remove project' in the kebab menu when onDeleteProject is provided", () => {
		render(<ComposeProjectsList projects={ROWS} onDeleteProject={jest.fn().mockResolvedValue(undefined)} />);
		openRowMenu("Acme Corp");
		expect(screen.getByText(/remove project/i)).toBeInTheDocument();
	});
});

describe("ComposeProjectsList — Delete confirmation dialog", () => {
	it("does not show the dialog before the menu item is clicked", () => {
		render(<ComposeProjectsList projects={ROWS} onDeleteProject={jest.fn().mockResolvedValue(undefined)} />);
		expect(screen.queryByText(/remove project\?/i)).not.toBeInTheDocument();
	});

	it("opens the confirmation dialog when 'Remove project' is clicked", () => {
		render(<ComposeProjectsList projects={ROWS} onDeleteProject={jest.fn().mockResolvedValue(undefined)} />);
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/remove project/i));
		expect(screen.getByText(/remove project\?/i)).toBeInTheDocument();
	});

	it("calls onDeleteProject with the correct projectId when confirmed", async () => {
		const onDelete = jest.fn().mockResolvedValue(undefined);
		render(<ComposeProjectsList projects={ROWS} onDeleteProject={onDelete} />);
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/remove project/i));
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));
		});
		expect(onDelete).toHaveBeenCalledWith("p1");
		expect(onDelete).toHaveBeenCalledTimes(1);
	});

	it("does not call onDeleteProject when Cancel is clicked", () => {
		const onDelete = jest.fn().mockResolvedValue(undefined);
		render(<ComposeProjectsList projects={ROWS} onDeleteProject={onDelete} />);
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/remove project/i));
		fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
		expect(onDelete).not.toHaveBeenCalled();
	});

	it("closes the dialog when Cancel is clicked", async () => {
		render(<ComposeProjectsList projects={ROWS} onDeleteProject={jest.fn().mockResolvedValue(undefined)} />);
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/remove project/i));
		fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
		// MUI Dialog uses CSS transitions — wait for the element to leave the DOM
		await waitFor(() =>
			expect(screen.queryByText(/remove project\?/i)).not.toBeInTheDocument(),
		);
	});

	it("dialog does NOT close immediately when Remove is clicked (stays open during mutation)", async () => {
		// onDeleteProject returns a never-settling promise to simulate in-flight
		let _resolve: () => void;
		const onDelete = jest.fn().mockReturnValue(
			new Promise<void>((resolve) => { _resolve = resolve; }),
		);
		render(<ComposeProjectsList projects={ROWS} onDeleteProject={onDelete} />);
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/remove project/i));
		fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));
		// Dialog must still be open — mutation hasn't settled yet
		expect(screen.getByText(/remove project\?/i)).toBeInTheDocument();
	});

	it("closes the dialog after onDeleteProject resolves (success path)", async () => {
		const onDelete = jest.fn().mockResolvedValue(undefined);
		render(<ComposeProjectsList projects={ROWS} onDeleteProject={onDelete} />);
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/remove project/i));
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));
		});
		await waitFor(() =>
			expect(screen.queryByText(/remove project\?/i)).not.toBeInTheDocument(),
		);
	});

	it("calls onDeleteProject with the correct id for a different row", async () => {
		const onDelete = jest.fn().mockResolvedValue(undefined);
		render(<ComposeProjectsList projects={ROWS} onDeleteProject={onDelete} />);
		openRowMenu("Widgets Inc");
		fireEvent.click(screen.getByText(/remove project/i));
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));
		});
		expect(onDelete).toHaveBeenCalledWith("p2");
	});
});

describe("ComposeProjectsList — Delete pending state", () => {
	it("disables the Remove button while deleteIsPending is true", () => {
		render(
			<ComposeProjectsList
				projects={ROWS}
				onDeleteProject={jest.fn().mockResolvedValue(undefined)}
				deleteIsPending
			/>,
		);
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/remove project/i));
		const removeBtn = screen.getByRole("button", { name: /removing/i });
		expect(removeBtn).toBeDisabled();
	});

	it("disables the Cancel button while deleteIsPending is true", () => {
		render(
			<ComposeProjectsList
				projects={ROWS}
				onDeleteProject={jest.fn().mockResolvedValue(undefined)}
				deleteIsPending
			/>,
		);
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/remove project/i));
		expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
	});

	it("shows 'Removing…' on the button while deleteIsPending is true", () => {
		render(
			<ComposeProjectsList
				projects={ROWS}
				onDeleteProject={jest.fn().mockResolvedValue(undefined)}
				deleteIsPending
			/>,
		);
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/remove project/i));
		expect(screen.getByRole("button", { name: /removing/i })).toBeInTheDocument();
	});

	it("dialog stays open while deleteIsPending is true (pending/error render inside open dialog)", () => {
		render(
			<ComposeProjectsList
				projects={ROWS}
				onDeleteProject={jest.fn().mockResolvedValue(undefined)}
				deleteIsPending
			/>,
		);
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/remove project/i));
		// Dialog is open — deleteIsPending/deleteError are visible
		expect(screen.getByText(/remove project\?/i)).toBeInTheDocument();
	});
});

describe("ComposeProjectsList — Delete error state", () => {
	it("shows the error message inside the dialog when deleteError is set", () => {
		render(
			<ComposeProjectsList
				projects={ROWS}
				onDeleteProject={jest.fn().mockResolvedValue(undefined)}
				deleteError="Failed to remove project. Please try again."
			/>,
		);
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/remove project/i));
		expect(
			screen.getByText(/failed to remove project/i),
		).toBeInTheDocument();
	});

	it("dialog stays open when deleteError is set (error is visible in dialog)", () => {
		// Simulate the error path: onDeleteProject rejects, deleteError is set by parent
		render(
			<ComposeProjectsList
				projects={ROWS}
				onDeleteProject={jest.fn().mockRejectedValue(new Error("Network error"))}
				deleteError="Network error"
			/>,
		);
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/remove project/i));
		// Dialog must be open so the error alert is visible
		expect(screen.getByText(/remove project\?/i)).toBeInTheDocument();
		expect(screen.getByText(/network error/i)).toBeInTheDocument();
	});

	it("the row stays in the list when deleteError is set (no optimistic removal)", () => {
		render(
			<ComposeProjectsList
				projects={ROWS}
				onDeleteProject={jest.fn().mockResolvedValue(undefined)}
				deleteError="Network error"
			/>,
		);
		// Both rows should still be visible even after a delete error
		expect(screen.getByText("Acme Corp")).toBeInTheDocument();
		expect(screen.getByText("Widgets Inc")).toBeInTheDocument();
	});

	it("does not show an error alert when deleteError is null", () => {
		render(
			<ComposeProjectsList
				projects={ROWS}
				onDeleteProject={jest.fn().mockResolvedValue(undefined)}
				deleteError={null}
			/>,
		);
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/remove project/i));
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});

describe("ComposeProjectsList — Dialog soft-delete copy", () => {
	it("shows soft-delete language (not 'permanently delete')", () => {
		render(
			<ComposeProjectsList
				projects={ROWS}
				onDeleteProject={jest.fn().mockResolvedValue(undefined)}
			/>,
		);
		openRowMenu("Acme Corp");
		fireEvent.click(screen.getByText(/remove project/i));
		expect(screen.getByText(/files and data are retained/i)).toBeInTheDocument();
		expect(screen.queryByText(/permanently delete/i)).not.toBeInTheDocument();
	});
});
