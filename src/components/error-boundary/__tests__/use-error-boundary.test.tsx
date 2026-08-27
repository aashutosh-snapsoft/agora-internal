/**
 * @jest-environment jsdom
 */
import React, { useEffect } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ErrorBoundary, useErrorBoundary } from "../index";

// Mock Sentry
jest.mock("@sentry/nextjs", () => ({
	withScope: (fn: (scope: { setTag: jest.Mock; setExtra: jest.Mock }) => void) =>
		fn({ setTag: jest.fn(), setExtra: jest.fn() }),
	captureException: jest.fn(),
}));

// Component that uses the hook to trigger boundary on button click
const AsyncErrorComponent = () => {
	const { showBoundary } = useErrorBoundary();

	const handleClick = () => {
		// Simulate async error
		showBoundary(new Error("Async error"));
	};

	return <button onClick={handleClick}>Trigger Error</button>;
};

// Component that simulates RxJS-style subscription error
const RxJSStyleComponent = ({ shouldError }: { shouldError: boolean }) => {
	const { showBoundary } = useErrorBoundary();

	useEffect(() => {
		if (shouldError) {
			// Simulate RxJS subscription error after a delay
			const timeout = setTimeout(() => {
				showBoundary(new Error("Subscription error"));
			}, 10);
			return () => clearTimeout(timeout);
		}
	}, [shouldError, showBoundary]);

	return <div>Loading...</div>;
};

describe("useErrorBoundary", () => {
	beforeEach(() => {
		jest.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("triggers error boundary when showBoundary is called", () => {
		render(
			<ErrorBoundary componentName="Test">
				<AsyncErrorComponent />
			</ErrorBoundary>
		);

		// Should show the button initially
		expect(screen.getByText("Trigger Error")).toBeInTheDocument();

		// Click the button to trigger error
		fireEvent.click(screen.getByText("Trigger Error"));

		// Should show error UI
		expect(screen.getByText(/Unable to load/i)).toBeInTheDocument();
		// Button should no longer be visible
		expect(screen.queryByText("Trigger Error")).not.toBeInTheDocument();
	});

	it("works with simulated RxJS subscription errors", async () => {
		render(
			<ErrorBoundary componentName="Test">
				<RxJSStyleComponent shouldError={true} />
			</ErrorBoundary>
		);

		// Should show loading initially
		expect(screen.getByText("Loading...")).toBeInTheDocument();

		// Wait for the timeout to trigger the error
		await act(async () => {
			await new Promise((r) => setTimeout(r, 20));
		});

		// Should show error UI
		expect(screen.getByText(/Unable to load/i)).toBeInTheDocument();
	});

	it("does not trigger error boundary when shouldError is false", async () => {
		render(
			<ErrorBoundary componentName="Test">
				<RxJSStyleComponent shouldError={false} />
			</ErrorBoundary>
		);

		// Should show loading
		expect(screen.getByText("Loading...")).toBeInTheDocument();

		// Wait a bit
		await act(async () => {
			await new Promise((r) => setTimeout(r, 20));
		});

		// Should still show loading (no error)
		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("allows recovery after async error via reset", async () => {
		const { rerender } = render(
			<ErrorBoundary componentName="Test">
				<AsyncErrorComponent />
			</ErrorBoundary>
		);

		// Trigger error
		fireEvent.click(screen.getByText("Trigger Error"));

		// Should show error UI
		expect(screen.getByText(/Unable to load/i)).toBeInTheDocument();

		// Click retry
		fireEvent.click(screen.getByRole("button", { name: /retry/i }));

		// Rerender
		rerender(
			<ErrorBoundary componentName="Test">
				<AsyncErrorComponent />
			</ErrorBoundary>
		);

		// Should show the button again
		expect(screen.getByText("Trigger Error")).toBeInTheDocument();
	});

	it("calls Sentry when async error is triggered", () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Sentry = require("@sentry/nextjs") as { captureException: jest.Mock };

		render(
			<ErrorBoundary componentName="AsyncTest">
				<AsyncErrorComponent />
			</ErrorBoundary>
		);

		// Trigger error
		fireEvent.click(screen.getByText("Trigger Error"));

		// Sentry should be called
		expect(Sentry.captureException).toHaveBeenCalled();
	});
});
