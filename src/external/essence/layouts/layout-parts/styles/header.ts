import { AppBar, Breadcrumbs, Toolbar, styled } from "@mui/material";
import { NavItemButton } from "./sidebar";

export const DashboardHeaderRoot = styled(AppBar)(({ theme }) => ({
	boxShadow: "none",
	padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
	backgroundImage: "none",
	backdropFilter: "blur(6px)",
	backgroundColor: 'rgba(246, 247, 248, 0.7)', //to apply transparency and backdrop effect, convert hex to rgba with opacity
	color: theme.palette.text.primary,
	marginLeft: theme.spacing(0),
	marginRight: theme.spacing(0),
	top: 0,
	zIndex: 1000,
	transition: "background-color 0.3s ease, backdrop-filter 0.3s ease"
}));

export const StyledToolBar = styled(Toolbar)(({ theme }) => ({
	// Add horizontal padding
	padding: `${theme.spacing(0)} ${theme.spacing(0)}`, // 8px vertical, 24px horizontal
	minHeight: "40px !important",

	[theme.breakpoints.up("sm")]: {
		padding: `${theme.spacing(0)} ${theme.spacing(0)}`, // 8px vertical, 32px horizontal
	},

	[theme.breakpoints.up("md")]: {
		padding: `${theme.spacing(0)} ${theme.spacing(0)}`,
	},
}));

export const StyledBreadCrumbs = styled(Breadcrumbs)(({ theme }) => ({
	padding: `${theme.spacing(0)} ${theme.spacing(2)}`,
}));

export const StyledNavItemButton = styled(NavItemButton)(({ theme }) => ({
	justifyContent: "center",
}));

// export const ToggleIcon = styled(Box)<{ width?: number }>(({ theme, width }) => ({
//   height: 3,
//   margin: "5px",
//   marginLeft: 0,
//   width: width || 25,
//   borderRadius: "10px",
//   transition: "width 0.3s",
//   backgroundColor: theme.palette.primary.main,
// }));
