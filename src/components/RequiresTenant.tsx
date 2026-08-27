"use client";

// src/components/Unauthorized.tsx
import React from "react";
import { Box, Typography, Card, Button } from "@mui/material";
import LoginButton from "./Login";
import { useAppSelector } from "@/store/store";
import { userSelector } from "@/store/users/user-selectors";
const RequiresTenantPage: React.FC = () => {
	const { loading } = useAppSelector(userSelector);
	return (
		<Box pt={3}>
			<Card>
				<Box padding={3} flexDirection="column" display="flex" gap={1}>
					<Typography variant="Text1Bold">
						Socratics.ai Access
					</Typography>
					<Typography variant="Text5Regular">
						We couldn&apos;t confirm your access context. Please sign in again to continue.
					</Typography>
				</Box>
				<Button disabled={loading} sx={{ marginBottom: 3, marginLeft: 3 }}>
					<LoginButton />
				</Button>
			</Card>
		</Box>
	);
};

export default RequiresTenantPage;
