import { Fragment, useState, useEffect } from "react";
import {
	Box,
	Button,
	Card,
	Divider,
	Grid,
	styled,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import LinearProgress from "@mui/material/LinearProgress";
import * as Yup from "yup";
import { useFormik } from "formik";
// CUSTOM ICON COMPONENTS
// CUSTOM COMPONENTS
import { AvatarBadge } from "@/components/avatar-badge";
import { FlexBox } from "@/components/flexbox";
import { H6, Paragraph } from "@/components/typography";
import { AvatarLoading } from "@/components/avatar-loading";
import { SealCheck, CalendarBlank } from "@phosphor-icons/react";
import type { User } from "@/types/user";
import { getInitials } from "@/lib/utils/getNameInitials";
import { config } from "@/config";
import { useLogout } from "@/hooks/useLogout";

// STYLED COMPONENTS
const ContentWrapper = styled(Box)(({ theme }) => ({
	zIndex: 1,
	marginTop: 55,
	position: "relative",
	[theme.breakpoints.down("sm")]: { paddingLeft: 20, paddingRight: 20 },
}));

const CoverPicWrapper = styled(Box)(({ theme }) => ({
	top: 0,
	left: 0,
	height: 125,
	width: "100%",
	overflow: "hidden",
	position: "absolute",
	backgroundColor: theme.palette.background.default,
}));

const BasicInformation = () => {
	const onLogout = useLogout(`${config.url}/welcome`);

	return (
		<Fragment>
			<Card sx={{ padding: 2, position: "relative" }}>
				{/* USER INFO SECTION */}

				<Box>
					<Typography variant="Text1Bold">Log Out</Typography>
					<FlexBox
						flexWrap="wrap"
						margin="auto"
						component="div"
						justifyContent="space-between"
						flexDirection="column"
					>
						<FlexBox mb={2} flexWrap="wrap" gap={3} component="div">
							<FlexBox
								alignItems="center"
								gap={1}
								color="grey.500"
								component="div"
							>
								<Typography variant="Text5Regular">
									To end your session securely, please click the button below.
								</Typography>
							</FlexBox>
						</FlexBox>
						<Button
							color="primary"
							sx={{ width: "fit-content" }}
							onClick={onLogout}
						>
							Logout
						</Button>
					</FlexBox>
				</Box>
			</Card>
		</Fragment>
	);
};

export default BasicInformation;
