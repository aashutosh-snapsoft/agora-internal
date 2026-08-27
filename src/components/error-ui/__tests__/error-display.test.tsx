/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ErrorDisplay } from "../error-display";

// Mock next/navigation
jest.mock("next/navigation", () => ({
	useRouter: () => ({
		push: jest.fn(),
	}),
}));

// Mock the Logo component
jest.mock("@/components/icons/Logo", () => ({
	__esModule: true,
	default: () => <div data-testid="logo">Logo</div>,
}));

// Wrapper with MUI theme for testing
const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
	const theme = createTheme();
	return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

const renderWithTheme = (ui: React.ReactElement) => {
	return render(ui, { wrapper: ThemeWrapper });
};

describe("ErrorDisplay", () => {
	const mockReset = jest.fn();
	const testError = Object.assign(new Error("Test error message"), {
		digest: "test-digest-123",
	});

	const defaultProps = {
		error: testError,
		reset: mockReset,
	};

	beforeEach(() => {
		mockReset.mockClear();
	});

	it("renders default title and message", () => {
		renderWithTheme(<ErrorDisplay {...defaultProps} />);

		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		expect(
			screen.getByText(/We encountered an unexpected error/i)
		).toBeInTheDocument();
	});

	it("renders custom title and message", () => {
		renderWithTheme(
			<ErrorDisplay
				{...defaultProps}
				title="Custom Title"
				message="Custom error message"
			/>
		);

		expect(screen.getByText("Custom Title")).toBeInTheDocument();
		expect(screen.getByText("Custom error message")).toBeInTheDocument();
	});

	it("calls reset when Try Again is clicked", () => {
		renderWithTheme(<ErrorDisplay {...defaultProps} />);

		fireEvent.click(screen.getByRole("button", { name: /try again/i }));

		expect(mockReset).toHaveBeenCalledTimes(1);
	});

	it("renders secondary action button when provided", () => {
		renderWithTheme(
			<ErrorDisplay
				{...defaultProps}
				secondaryAction={{ label: "Go Home", href: "/" }}
			/>
		);

		expect(screen.getByRole("button", { name: "Go Home" })).toBeInTheDocument();
	});

	it("shows error digest when available", () => {
		renderWithTheme(<ErrorDisplay {...defaultProps} />);

		expect(screen.getByText(/Error ID: test-digest-123/i)).toBeInTheDocument();
	});

	it("renders the logo", () => {
		renderWithTheme(<ErrorDisplay {...defaultProps} />);

		expect(screen.getByTestId("logo")).toBeInTheDocument();
	});

	it("renders support message", () => {
		renderWithTheme(<ErrorDisplay {...defaultProps} />);

		expect(
			screen.getByText(/If this problem persists, please contact/i)
		).toBeInTheDocument();
	});

	it("uses custom primary action when provided", () => {
		const customAction = jest.fn();

		renderWithTheme(
			<ErrorDisplay
				{...defaultProps}
				primaryAction={{ label: "Retry Now", onClick: customAction }}
			/>
		);

		const button = screen.getByRole("button", { name: "Retry Now" });
		fireEvent.click(button);

		expect(customAction).toHaveBeenCalledTimes(1);
		expect(mockReset).not.toHaveBeenCalled();
	});

	describe("development mode error details", () => {
		const originalEnv = process.env.NODE_ENV;

		afterEach(() => {
			// Restore original NODE_ENV
			Object.defineProperty(process.env, "NODE_ENV", {
				value: originalEnv,
				writable: true,
			});
		});

		it("shows error details toggle in development mode", () => {
			Object.defineProperty(process.env, "NODE_ENV", {
				value: "development",
				writable: true,
			});

			renderWithTheme(<ErrorDisplay {...defaultProps} />);

			expect(
				screen.getByRole("button", { name: /show error details/i })
			).toBeInTheDocument();
		});

		it("expands error details when toggle is clicked in development", () => {
			Object.defineProperty(process.env, "NODE_ENV", {
				value: "development",
				writable: true,
			});

			renderWithTheme(<ErrorDisplay {...defaultProps} />);

			// Click to expand
			fireEvent.click(
				screen.getByRole("button", { name: /show error details/i })
			);

			// Should show error message in the details section (use getAllByText since it may appear multiple times)
			const errorMessages = screen.getAllByText(/Test error message/i);
			expect(errorMessages.length).toBeGreaterThan(0);
		});

		it("hides error details toggle in production mode", () => {
			Object.defineProperty(process.env, "NODE_ENV", {
				value: "production",
				writable: true,
			});

			renderWithTheme(<ErrorDisplay {...defaultProps} />);

			expect(
				screen.queryByRole("button", { name: /show error details/i })
			).not.toBeInTheDocument();
		});
	});
});
