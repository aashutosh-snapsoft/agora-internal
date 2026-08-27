"use client";

import { useSearchParams } from "next/navigation";
import { 
	Box, 
	Typography, 
	Card, 
	CardContent, 
	Button, 
	Alert,
	Stack 
} from "@mui/material";
import { useRouter } from "next/navigation";
import Logo from "@/components/icons/Logo";
import { ALERT_MESSAGES } from "@/lib/content/alert-messages";

export default function LoginError() {
	const searchParams = useSearchParams();
	const router = useRouter();
	
	const error = searchParams?.get("error");
	const description = searchParams?.get("description");
	const reason = searchParams?.get("reason");

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
						
						<Typography variant="h4" textAlign="center" fontWeight="bold" color="error">
							{ALERT_MESSAGES.LOGIN_ERROR_TITLE.title}
						</Typography>

						<Alert severity="error" sx={{ width: "100%" }}>
							{ALERT_MESSAGES.AUTH_FAILED_TRY_AGAIN.message}
						</Alert>

						{error && (
							<Box sx={{ textAlign: "center", width: "100%" }}>
								<Typography variant="body2" color="text.secondary">
									<strong>Error:</strong> {error}
								</Typography>
								{description && (
									<Typography variant="body2" color="text.secondary">
										<strong>Description:</strong> {decodeURIComponent(description)}
									</Typography>
								)}
								{reason && (
									<Typography variant="body2" color="text.secondary">
										<strong>Reason:</strong> {reason}
									</Typography>
								)}
							</Box>
						)}

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
