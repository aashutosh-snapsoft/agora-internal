"use client";
import { Card, Divider, Stack, Box, Typography, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAppDispatch } from "@/store/store";
import { config } from "@/config";
import { useCallback, useEffect, useState } from "react";
import * as amplitude from "@amplitude/analytics-browser";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/icons/Logo";
import { callGtag } from "@/lib/gtag";

const DeleteAccount = () => {
	const dispatch = useAppDispatch();
	const [countdown, setCountdown] = useState(15000);
	const searchParams = useSearchParams();
	const ERROR_REASON_DEFAULT = "unknown";
	let reason = searchParams?.get("reason") ?? ERROR_REASON_DEFAULT;

	const errorDescription = searchParams?.get("error_description");
	const state = searchParams?.get("state");

	type ErrorReason = {
		title: string;
		description: string;
	};

	const reasonMap: Record<string, ErrorReason> = {
		unknown: {
			title: "ERR100: Unknown error occurred",
			description: "Please log out and log in again.",
		},
		no_valid_role: {
			title: "ERR201: No valid role found",
			description:
				"Our team has already been notified of this issue. To expedite the resolution of this issue, please reach out to support@socratics.ai.",
		},
		no_tenant_id: {
			title: "ERR202: No tenant ID found",
			description:
				"Our team has already been notified of this issue. To expedite the resolution of this issue, please reach out to support@socratics.ai.",
		},
		no_organization: {
			title: "ERR203: No organization found",
			description:
				"Socratics.ai is currently in a closed beta and requires your account to be associated with a verified organization that is part of the beta program. Please reach out to support@socratics.ai to resolve this issue.",
		},
		no_claims: {
			title: "ERR204: No claims found",
			description:
				"Our team has already been notified of this issue. To expedite the resolution of this issue, please reach out to support@socratics.ai.",
		},
	};

	if (
		errorDescription &&
		errorDescription.includes(
			"client requires organization membership, but user does not belong to any organization"
		)
	) {
		reason = "no_organization";
	}

	if (!Object.keys(reasonMap).includes(reason)) {
		reason = ERROR_REASON_DEFAULT;
	}

	const theme = useTheme();
	const onLogout = useCallback(() => {
		// Use Next.js Auth0 SDK logout route
		window.location.href = `/api/auth/logout?returnTo=${encodeURIComponent(`${config.url}/welcome`)}`;
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			if (countdown === 0) {
				onLogout();
			}

			setCountdown((prevCountdown) => {
				if (prevCountdown - 1000 > 0) return prevCountdown - 1000;
				return 0;
			});
		}, 1000);
		return () => clearInterval(interval);
	}, [countdown, onLogout]);

	amplitude.track("logout_initiated", { reason });
	// Prevent ReferenceErrors when GA hasn't loaded during logout flows.
	callGtag("event", "logout_initiated", { reason });

	return (
		<Card sx={{ m: 2, p: 2 }}>
			<Box padding={2} flexDirection="column" display="flex" gap={1}>
				<Stack direction="row" spacing={2}>
					<Logo />
					<Typography variant="Text1Bold">Logging Out</Typography>
				</Stack>
				<Typography variant="Text5Regular">
					We&apos;re currently experiencing a technical issue that may be
					preventing access to your account. Your data remains secure, and our
					support team has already been alerted. We&apos;ll follow up with you
					shortly.
				</Typography>
				<Typography variant="Text6Medium" mt={2}>
					{reasonMap[reason].title} - {reasonMap[reason].description}
				</Typography>
			</Box>

			<Divider />

			<Stack direction="column" alignItems="left" padding={3} pl={2}>
				<Box sx={{ display: "flex", mb: 2 }}>
					<Typography
						display="inline"
						variant="Text7Medium"
						color={theme.palette.text.secondary}
						mr={1}
					>
						If you wish to log out manually, you may click the button below.
					</Typography>
					{countdown > 0 ? (
						<Typography
							display="inline"
							variant="Text7Medium"
							color={theme.palette.text.secondary}
						>
							You will automatically be logged out in{" "}
							{Math.floor(countdown / 1000)} seconds.
						</Typography>
					) : (
						<Typography
							display="inline"
							variant="Text5Regular"
							color={theme.palette.text.secondary}
						>
							Logging out...
						</Typography>
					)}
				</Box>
				<Stack direction="row" spacing={2}>
					<Button
						variant="contained"
						color="primary"
						onClick={onLogout}
						sx={{ width: "fit-content" }}
					>
						Logout
					</Button>
					<Link
						href="https://socratics.notion.site/Socratics-Product-Documentation-19f3c45d6b8480b89870d72dffe976a3?pvs=4"
						target="_blank"
					>
						<Button
							variant="contained"
							color="secondary"
							sx={{ width: "fit-content", minWidth: "80px" }}
						>
							Support Center
						</Button>
					</Link>
				</Stack>
			</Stack>
		</Card>
	);
};

export default DeleteAccount;
