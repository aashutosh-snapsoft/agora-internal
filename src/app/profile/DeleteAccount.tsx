"use client";

import { useState } from "react";
import { Box, Dialog, Stack } from "@mui/material";
import { WarningCircle } from "@phosphor-icons/react";
import { Card } from "@/components/card/card";
import { Button } from "@/components/button/button";

// DS danger tokens (status/error bg + danger icon) — not yet in the app theme.
const ERROR_BG = "#fee2e2";
const DANGER = "#b91c1c";

const DeleteAccount = () => {
	const [open, setOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const handleClose = () => {
		if (deleting) return;
		setOpen(false);
	};

	const handleConfirmDelete = async () => {
		setDeleting(true);
		try {
			// TODO(backend): no account-deletion endpoint exists yet. Wire this to a
			// trusted backend route that disables the Auth0 user and schedules data
			// deletion (30-day retention per policy), then sign the user out. Until
			// then this flow is UI-complete but does not delete anything.
			console.warn("[DeleteAccount] delete confirmed — backend not wired");
		} finally {
			setDeleting(false);
		}
	};

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
				Delete account
			</Box>

			<Stack spacing={1} sx={{ p: 3 }}>
				{/* DS body text — 14px, matching the modal description / page subtext,
				    not the oversized Text5/Text6 variants. */}
				<Box
					component="p"
					sx={{
						m: 0,
						fontSize: "14px",
						fontWeight: 500,
						lineHeight: "20px",
						color: "#121017",
					}}
				>
					Permanently delete your account and all associated data.
				</Box>
				<Box
					component="p"
					sx={{
						m: 0,
						fontSize: "14px",
						fontWeight: 400,
						lineHeight: "20px",
						color: "#555e69",
					}}
				>
					You&apos;ll lose access to your projects and financial data, and your
					account will be disabled. Data is retained for 30 days after deletion,
					then permanently removed — you&apos;ll be notified by email. This
					can&apos;t be undone.
				</Box>
			</Stack>

			{/* Danger action lives on the left of the footer, per the DS card spec. */}
			<Box
				sx={{
					height: 48,
					boxSizing: "border-box",
					borderTop: "1px solid #d4d4d4",
					px: 2,
					display: "flex",
					alignItems: "center",
					justifyContent: "flex-start",
				}}
			>
				<Button size="sm" variant="danger" onClick={() => setOpen(true)}>
					Delete account
				</Button>
			</Box>

			{/* Confirmation — DS danger modal (Dialogue, Style=Danger). */}
			<Dialog
				open={open}
				onClose={handleClose}
				aria-labelledby="delete-account-dialog-title"
				PaperProps={{
					sx: {
						width: 512,
						maxWidth: "calc(100% - 32px)",
						borderRadius: "8px",
						boxShadow:
							"0px 20px 25px -5px rgba(0,0,0,0.1), 0px 10px 10px -5px rgba(0,0,0,0.04)",
						m: 2,
					},
				}}
			>
				{/* Body — icon badge + title + description */}
				<Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", pt: 3, pb: 2, px: 3 }}>
					<Box
						sx={{
							flexShrink: 0,
							width: 48,
							height: 48,
							borderRadius: "24px",
							backgroundColor: ERROR_BG,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<WarningCircle size={24} weight="regular" color={DANGER} />
					</Box>
					<Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
						<Box
							component="h3"
							id="delete-account-dialog-title"
							sx={{
								m: 0,
								fontSize: "18px",
								fontWeight: 700,
								lineHeight: "24px",
								color: "#121017",
							}}
						>
							Delete account?
						</Box>
						<Box
							component="p"
							sx={{
								m: 0,
								fontSize: "14px",
								fontWeight: 400,
								lineHeight: "20px",
								color: "#555e69",
							}}
						>
							This permanently deletes your account and all associated data.
							This action can&apos;t be undone.
						</Box>
					</Box>
				</Box>

				{/* Footer — border-top, right-aligned Cancel + Danger. */}
				<Box
					sx={{
						borderTop: "1px solid #d4d4d4",
						display: "flex",
						alignItems: "center",
						justifyContent: "flex-end",
						gap: 1.5,
						px: 3,
						py: 1.5,
					}}
				>
					<Button variant="secondary" onClick={handleClose} disabled={deleting}>
						Cancel
					</Button>
					<Button
						variant="danger"
						onClick={handleConfirmDelete}
						disabled={deleting}
					>
						{deleting ? "Deleting…" : "Delete account"}
					</Button>
				</Box>
			</Dialog>
		</Card>
	);
};

export default DeleteAccount;
