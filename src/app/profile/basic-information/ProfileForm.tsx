import { memo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Card } from "@/components/card/card";
import { Button } from "@/components/button/button";
import { TextField } from "@/components/text-field/text-field";
import * as Yup from "yup";
import { Formik } from "formik";
import type { User } from "@/types/user";

// Form interface for type safety
interface FormValues {
	firstName: string;
	lastName: string;
	title: string;
	organization: string;
	email: string;
}

interface ProfileFormProps {
	user: User;
	onSubmit: (values: FormValues, userId: string) => Promise<void>;
	loginEmail?: string;
}

const ProfileForm = memo(({ user, onSubmit, loginEmail }: ProfileFormProps) => {
	// Validation schema
	const validationSchema = Yup.object({
		firstName: Yup.string()
			.min(3, "Must be greater than 3 characters")
			.required("First Name is Required!"),
		lastName: Yup.string().required("Last Name is Required!"),
		title: Yup.string().required("Title is Required!"),
		organization: Yup.string().required("Organization is Required!"),
	});

	// Get initial values from user data
	const getInitialValues = (): FormValues => ({
		firstName: user?.first_name || "",
		lastName: user?.last_name || "",
		title: user?.title || "",
		organization: user?.organization || "",
		email: loginEmail || user?.email || "",
	});

	// Get cancel form values
	const getCancelValues = (): FormValues => ({
		firstName: user?.first_name || "",
		lastName: user?.last_name || "",
		title: user?.title || "",
		organization: user?.organization || "",
		email: loginEmail || user?.email || "",
	});

	// Two short related fields per row; each stacks on narrow screens.
	const pairSx = {
		display: "grid",
		gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
		gap: 2,
	} as const;

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
				Edit your account information
			</Box>

			<Formik
				initialValues={getInitialValues()}
				validationSchema={validationSchema}
				enableReinitialize={true}
				onSubmit={async (values, { setSubmitting, resetForm }) => {
					if (!user) return;

					try {
						await onSubmit(values, user.id);
						resetForm({ values });
					} catch (error) {
						console.error("Form submission failed:", error);
					} finally {
						setSubmitting(false);
					}
				}}
			>
				{({
					values,
					errors,
					touched,
					handleChange,
					handleBlur,
					handleSubmit,
					isSubmitting,
					isValid,
					dirty,
					resetForm,
				}) => (
					<form onSubmit={handleSubmit}>
						<Stack spacing={2} sx={{ p: 3 }}>
							<TextField
								name="email"
								label="Email"
								value={values.email}
								readOnly
								helperText="Managed by your login — contact an admin to change it."
							/>

							<Box sx={pairSx}>
								<TextField
									required
									name="firstName"
									label="First Name"
									onBlur={handleBlur}
									onChange={handleChange}
									value={values.firstName}
									helperText={touched.firstName ? (errors.firstName as string) : undefined}
									error={Boolean(touched.firstName && errors.firstName)}
									disabled={isSubmitting}
								/>
								<TextField
									required
									name="lastName"
									label="Last Name"
									onBlur={handleBlur}
									onChange={handleChange}
									value={values.lastName}
									helperText={touched.lastName ? (errors.lastName as string) : undefined}
									error={Boolean(touched.lastName && errors.lastName)}
									disabled={isSubmitting}
								/>
							</Box>

							{/* Single column — Job Title and Organization stack (only the
							    First/Last name pair sits side by side). */}
							<TextField
								required
								name="title"
								label="Job Title"
								onBlur={handleBlur}
								onChange={handleChange}
								value={values.title}
								helperText={touched.title ? (errors.title as string) : undefined}
								error={Boolean(touched.title && errors.title)}
								disabled={isSubmitting}
							/>
							<TextField
								required
								name="organization"
								label="Organization"
								onBlur={handleBlur}
								onChange={handleChange}
								value={values.organization}
								helperText={
									touched.organization
										? (errors.organization as string)
										: undefined
								}
								error={Boolean(touched.organization && errors.organization)}
								disabled={isSubmitting}
							/>
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
								onClick={() => resetForm({ values: getCancelValues() })}
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
								{isSubmitting ? "Saving…" : "Save"}
							</Button>
						</Box>
					</form>
				)}
			</Formik>
		</Card>
	);
});

ProfileForm.displayName = "ProfileForm";

export default ProfileForm;
