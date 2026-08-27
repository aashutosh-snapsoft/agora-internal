import { styled, TableCell, TableRow } from "@mui/material";
import { Box } from "@mui/system";

const COMMON = {
	paddingBlock: "1.5rem",
	"&:first-of-type": { paddingLeft: 24 },
	"&:last-of-type": { paddingRight: 24 },
};

// ---------------------------------------------------------
// table cell component version 1 - example account page - recent devices and notifications tab
export const BodyTableCell = styled(TableCell)(({ theme }) => ({
	...COMMON,
	color: theme.palette.text.primary,
}));

export const HeadTableCell = styled(TableCell)(({ theme }) => ({
	...COMMON,
	fontWeight: 500,
	color: theme.palette.text.secondary,
	backgroundColor: theme.palette.action.selected,
}));

export const BodyTableRow = styled(TableRow)(({ theme }) => ({
	borderBottom: `1px solid ${theme.palette.divider}`,
	":last-of-type": { borderBottom: 0 },
}));

// ----------------------------------------------------------

// ---------------------------------------------------------
// table cell component version 1 - example account page - billing, statements referrals etc.
export const BodyTableCellV2 = styled(TableCell)(({ theme }) => ({
	paddingBlock: "1.5rem",
	"&:last-of-type": {
		paddingRight: 24,
		maxWidth: 90,
	},
	"&:first-of-type": {
		paddingLeft: 24,
		fontWeight: 500,
		color: theme.palette.text.primary,
	},
}));

export const HeadTableCellV2 = styled(BodyTableCellV2)(({ theme }) => ({
	fontWeight: 600,
	paddingBlock: "1.5rem",
	color: theme.palette.text.primary,
}));

// ----------------------------------------------------------

export const StyledForecastCell = styled("div")(({ theme }) => ({
	backgroundColor: "var(--Colors-Primary-100, rgba(175, 255, 72, 0.25))",
	borderRadius: 8,
	padding: "2px var(--8, 8px)",
	fontSize: "0.75rem",
	fontWeight: 600,
	lineHeight: "1.35rem",
	display: "flex",
	alignItems: "center",
	alignSself: "stretch",
}));
