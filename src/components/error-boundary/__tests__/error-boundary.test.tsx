/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../error-boundary";

// Mock Sentry
jest.mock("@sentry/nextjs", () => ({
	withScope: (fn: (scope: { setTag: jest.Mock; setExtra: jest.Mock }) => void) =>
		fn({ setTag: jest.fn(), setExtra: jest.fn() }),
	captureException: jest.fn(),
}));

// Component that throws during render
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
	if (shouldThrow) throw new Error("Test error");
	return <div>Normal content</div>;
};

describe("ErrorBoundary", () => {
	// Suppress console.error for expected errors
	beforeEach(() => {
		jest.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("renders children when no error occurs", () => {
		render(
			<ErrorBoundary componentName="Test">
				<div>Child content</div>
			</ErrorBoundary>
		);
		expect(screen.getByText("Child content")).toBeInTheDocument();
	});

	it("renders fallback UI when child throws", () => {
		render(
			<ErrorBoundary componentName="Test">
				<ThrowingComponent shouldThrow={true} />
			</ErrorBoundary>
		);

		// Should show error UI
		expect(screen.getByText(/Unable to load/i)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
	});

	it("renders custom fallback when provided", () => {
		render(
			<ErrorBoundary
				componentName="Test"
				fallback={<div>Custom fallback</div>}
			>
				<ThrowingComponent shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(screen.getByText("Custom fallback")).toBeInTheDocument();
	});

	it("recovers when reset is clicked and child no longer throws", () => {
		// Use a stateful wrapper to control throwing behavior
		let shouldThrow = true;

		const ControlledComponent = () => {
			if (shouldThrow) throw new Error("Test error");
			return <div>Normal content</div>;
		};

		render(
			<ErrorBoundary componentName="Test">
				<ControlledComponent />
			</ErrorBoundary>
		);

		// Should be in error state
		expect(screen.getByText(/Unable to load/i)).toBeInTheDocument();

		// Stop throwing before clicking retry
		shouldThrow = false;

		// Click retry - this will re-render the boundary and its children
		fireEvent.click(screen.getByRole("button", { name: /retry/i }));

		// Should show normal content
		expect(screen.getByText("Normal content")).toBeInTheDocument();
	});

	it("calls Sentry.captureException on error", () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Sentry = require("@sentry/nextjs") as { captureException: jest.Mock };

		render(
			<ErrorBoundary componentName="TestComponent">
				<ThrowingComponent shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(Sentry.captureException).toHaveBeenCalled();
	});

	it("calls onError callback when error occurs", () => {
		const onError = jest.fn();

		render(
			<ErrorBoundary componentName="Test" onError={onError}>
				<ThrowingComponent shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(onError).toHaveBeenCalledWith(
			expect.any(Error),
			expect.objectContaining({ componentStack: expect.any(String) })
		);
	});

	it("shows component name in fallback UI", () => {
		render(
			<ErrorBoundary componentName="MyComponent">
				<ThrowingComponent shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(screen.getByText(/Unable to load MyComponent/i)).toBeInTheDocument();
	});

	it("resets when resetKeys change", () => {
		const { rerender } = render(
			<ErrorBoundary componentName="Test" resetKeys={["key1"]}>
				<ThrowingComponent shouldThrow={true} />
			</ErrorBoundary>
		);

		// Should be in error state
		expect(screen.getByText(/Unable to load/i)).toBeInTheDocument();

		// Change resetKeys with non-throwing child
		rerender(
			<ErrorBoundary componentName="Test" resetKeys={["key2"]}>
				<ThrowingComponent shouldThrow={false} />
			</ErrorBoundary>
		);

		// Should recover and show normal content
		expect(screen.getByText("Normal content")).toBeInTheDocument();
	});
});
