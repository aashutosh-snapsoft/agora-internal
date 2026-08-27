import type { ReactElement } from "react";
import {
	Box,
	Typography,
	CardContent,
	Card,
	Button,
	Stack,
} from "@mui/material";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/icons/Logo";
import { buildAuth0LoginUrl } from "@/utils/auth0";
import { auth0 } from "@/lib/auth0";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function Welcome() {
	const session = await auth0.getSession();
	if (session?.user?.sub) {
		redirect("/projects");
	}

	const loginUrl = buildAuth0LoginUrl("/projects");

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100vh",
			}}
		>
			<Card>
				<CardContent sx={{ display: "flex", flexDirection: "column" }}>
					<Stack direction="row" spacing={2}>
						<Logo />
						<Typography variant="Text1Bold">Welcome to Socratics.ai</Typography>
					</Stack>
					<Typography variant="Text5Regular" mb={5}>
						Our platform is currently available through a closed beta program.
					</Typography>
					<Stack direction="row" spacing={2}>
						<Link href={loginUrl}>
							<Button
								variant="contained"
								color="primary"
								sx={{ width: "fit-content", minWidth: "80px" }}
							>
								Login
							</Button>
						</Link>
						<Link
							href="https://socratics.ai/request-demo?utm_source=app&utm_medium=welcome"
							target="_blank"
						>
							<Button
								variant="contained"
								color="secondary"
								sx={{ width: "fit-content", minWidth: "80px" }}
							>
								Request Demo
							</Button>
						</Link>
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
				</CardContent>
			</Card>
		</Box>
	);
}

Welcome.getLayout = function getLayout(page: ReactElement) {
	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100vh",
			}}
		>
			{page}
		</Box>
	);
};
