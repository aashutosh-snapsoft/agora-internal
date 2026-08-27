import Link from "next/link";
import { Box, Typography, Link as MuiLink } from "@mui/material";

export default function NotFound() {
	return (
		<Box
			display="flex"
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			margin="auto"
			height="100vh"
		>
			<Typography variant="Text3Bold" fontWeight="bold" gutterBottom>
				This page is currently under construction.
			</Typography>
			<Typography variant="Text6Medium" color="text.secondary">
				Please check back soon.
			</Typography>
			<MuiLink
				component={Link}
				variant="Text6Medium"
				href="/"
				sx={{
					marginTop: 2,
					textDecoration: "underline",
				}}
			>
				<Typography variant="Text6Medium">Return Home</Typography>
			</MuiLink>
		</Box>
	);
}
