"use client";

import {
	Box,
	Typography,
	CardContent,
	Card,
	Button,
	Alert,
	Stack,
} from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation";
import Logo from "@/components/icons/Logo";
import { ALERT_MESSAGES } from "@/lib/content/alert-messages";

export default function VerifyEmail() {
	const searchParams = useSearchParams();
	const router = useRouter();
	
	const reason = searchParams?.get("reason");
	const email = searchParams?.get("email");

	const handleBackToLogin = () => {
		router.push("/welcome");
	};

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100vh",
				backgroundColor: "#f5f5f5",
				padding: 2,
			}}
		>
			<Card sx={{ maxWidth: 500, width: "100%" }}>
				<CardContent sx={{ padding: 4 }}>
					<Stack spacing={3} alignItems="center">
						<Logo />
						
						<Typography variant="h4" textAlign="center" fontWeight="bold">
							Verify Your Email
						</Typography>

						{reason === "unverified" ? (
							<Alert severity="warning" sx={{ width: "100%" }}>
								{ALERT_MESSAGES.VERIFY_EMAIL_UNVERIFIED.message}
							</Alert>
						) : (
							<Alert severity="info" sx={{ width: "100%" }}>
								{ALERT_MESSAGES.VERIFY_EMAIL_SENT.message}
							</Alert>
						)}

						{email && (
							<Typography variant="body1" textAlign="center" color="text.secondary">
								Verification email sent to: <strong>{email}</strong>
							</Typography>
						)}

						<Box sx={{ textAlign: "center", width: "100%" }}>
							<Typography variant="body2" color="text.secondary" mb={2}>
								{ALERT_MESSAGES.VERIFY_EMAIL_CHECK_INBOX.message}
							</Typography>
							
							<Typography variant="body2" color="text.secondary">
								{ALERT_MESSAGES.VERIFY_EMAIL_AFTER.message}
							</Typography>
						</Box>

						<Button
							variant="contained"
							onClick={handleBackToLogin}
							fullWidth
						>
							Back to Login
						</Button>

						<Typography variant="caption" color="text.secondary" textAlign="center">
							{ALERT_MESSAGES.LOGIN_CONTACT_SUPPORT.message}
						</Typography>
					</Stack>
				</CardContent>
			</Card>
		</Box>
	);
}