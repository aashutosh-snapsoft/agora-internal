"use client";

import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { CheckCircle, Circle } from "@phosphor-icons/react";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Card } from "@/components/card/card";
import { Button } from "@/components/button/button";
import { TextField } from "@/components/text-field/text-field";

// DS icon tokens (Icons/Success, Icons/Default) — not yet in the app theme.
const ICON_SUCCESS = "#1a8263";
const ICON_DEFAULT = "#737373";

// Live password requirements — each is checked against the current input so the
// list gives real-time feedback instead of a static checklist.
const getRequirements = (pw: string) => [
	{ label: "Minimum 8 characters", met: pw.length >= 8 },
	{
		label: "At least one uppercase and one lowercase letter",
		met: /[a-z]/.test(pw) && /[A-Z]/.test(pw),
	},
	{
		label: "At least one number or symbol",
		met: /[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw),
	},
];

const PasswordSection = () => {
	// Server-verified error for the current password. The client can't check the
	// current password (it never holds it) — the backend/Auth0 verifies it on
	// submit and we surface an "incorrect" response here.
	const [currentPwError, setCurrentPwError] = useState<string | null>(null);

	const formik = useFormik({
		initialValues: {
			currentPassword: "",
			newPassword: "",
			confirmNewPassword: "",
		},
		validationSchema: Yup.object({
			currentPassword: Yup.string().required("Enter your current password"),
			newPassword: Yup.string()
				.required("Enter a new password")
				.min(8, "Must be at least 8 characters")
				.matches(/[a-z]/, "Add a lowercase letter")
				.matches(/[A-Z]/, "Add an uppercase letter")
				.matches(/[0-9]|[^A-Za-z0-9]/, "Add a number or symbol"),
			confirmNewPassword: Yup.string()
				.oneOf([Yup.ref("newPassword")], "Passwords don't match")
				.required("Confirm your new password"),
		}),
		onSubmit: async (_values, { setSubmitting }) => {
			setCurrentPwError(null);
			try {
				// TODO(auth): POST to the password-change endpoint. The BACKEND/Auth0
				// verifies the current password — the client can't. On an
				// "incorrect current password" response, surface it on the field:
				//     setCurrentPwError("Current password is incorrect.");
				// On success, confirm and reset. No endpoint exists yet.
			} finally {
				setSubmitting(false);
			}
		},
	});

	const {
		values,
		errors,
		handleChange,
		handleBlur,
		handleSubmit,
		isSubmitting,
		isValid,
		dirty,
		resetForm,
	} = formik;

	const requirements = getRequirements(values.newPassword);

	// Only surface an error once the field has content — an empty field never
	// shows red (the disabled Update button enforces "required" instead).
	const confirmError =
		values.confirmNewPassword.length > 0 && Boolean(errors.confirmNewPassword);

	return (
		<Card>
			<Box
				component="h2"
				sx={{
					m: 0,
					px: 2,
					height: 48,
					boxSizing: "border-box",
					borderBottom: "1px solid #d4d4d4",
					display: "flex",
					alignItems: "center",
					fontSize: "14px",
					fontWeight: 700,
					lineHeight: "20px",
					color: "#121017",
				}}
			>
				Change password
			</Box>

			<form onSubmit={handleSubmit}>
				<Stack spacing={2} sx={{ p: 3 }}>
					<TextField
						required
						type="password"
						name="currentPassword"
						label="Current Password"
						autoComplete="current-password"
						onBlur={handleBlur}
						onChange={(e) => {
							handleChange(e);
							// Clear the server error as soon as they edit the field.
							if (currentPwError) setCurrentPwError(null);
						}}
						value={values.currentPassword}
						error={Boolean(currentPwError)}
						helperText={currentPwError ?? undefined}
						disabled={isSubmitting}
					/>

					{/* Single column — password fields stack. New Password is guided by
					    the live requirements list below rather than an error message. */}
					<TextField
						required
						type="password"
						name="newPassword"
						label="New Password"
						autoComplete="new-password"
						onBlur={handleBlur}
						onChange={handleChange}
						value={values.newPassword}
						disabled={isSubmitting}
					/>
					<TextField
						required
						type="password"
						name="confirmNewPassword"
						label="Confirm New Password"
						autoComplete="new-password"
						onBlur={handleBlur}
						onChange={handleChange}
						value={values.confirmNewPassword}
						error={confirmError}
						helperText={confirmError ? errors.confirmNewPassword : undefined}
						disabled={isSubmitting}
					/>

					<Stack spacing={1}>
						{requirements.map((req) => (
							<Stack
								key={req.label}
								direction="row"
								spacing={1}
								alignItems="center"
							>
								{req.met ? (
									<CheckCircle size={16} weight="fill" color={ICON_SUCCESS} />
								) : (
									<Circle size={16} weight="regular" color={ICON_DEFAULT} />
								)}
								<Typography
									variant="Text7Medium"
									color={req.met ? "text.primary" : "text.secondary"}
								>
									{req.label}
								</Typography>
							</Stack>
						))}
					</Stack>
				</Stack>

				{/* DS card footer: 48px bar, top border, right-aligned SM buttons. */}
				<Box
					sx={{
						height: 48,
						boxSizing: "border-box",
						borderTop: "1px solid #d4d4d4",
						px: 2,
						display: "flex",
						alignItems: "center",
						justifyContent: "flex-end",
						gap: 1.5,
					}}
				>
					<Button
						type="button"
						size="sm"
						variant="secondary"
						onClick={() => resetForm()}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						size="sm"
						variant="primary"
						disabled={isSubmitting || !isValid || !dirty}
					>
						Update password
					</Button>
				</Box>
			</form>
		</Card>
	);
};

PasswordSection.displayName = "PasswordSection";

export default PasswordSection;
