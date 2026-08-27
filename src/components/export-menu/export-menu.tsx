import { Box, Menu, MenuItem, Typography, useTheme, Tooltip } from "@mui/material";
import {
	FileCsv,
	MicrosoftExcelLogo,
	Share,
	Table,
} from "@phosphor-icons/react";
import { FC, useState, useRef } from "react";
import { ExportMenuProps } from "./export-menu.types";
const ExportMenu: FC<ExportMenuProps> = ({ handleExport, disabled = false, disabledReason }) => {
	const theme = useTheme();

	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const anchorRef = useRef<HTMLDivElement>(null);

	const _handleExport = () => {
		setIsMenuOpen(false);
		handleExport();
	};

	return (
		<>
			<Tooltip 
				title={disabled ? (disabledReason || "Model is not ready for the Forecast & Export") : ""}
				placement="bottom"
				arrow
			>
				<Box
					ref={anchorRef}
					display="flex"
					alignItems="center"
					gap={1}
					sx={{
						height: 40,
						minWidth: 172,
						padding: theme.spacing(1, 2),
						backgroundColor: disabled ? "#9CA3AF" : "#111827",
						color: "#FFFFFF",
						cursor: disabled ? "not-allowed" : "pointer",
						borderRadius: theme.spacing(1.25),
						width: "fit-content",
						opacity: disabled ? 0.6 : 1,
						"&:hover": {
							backgroundColor: disabled ? "#9CA3AF" : "#374151",
						},
					}}
					onClick={() => !disabled && setIsMenuOpen(true)}
				>
					<Share size={18} fontWeight={"bold"} color="#FFFFFF" />
					<Typography variant="body1" sx={{ color: "#FFFFFF", fontWeight: 600, fontSize: "14px !important" }}>Forecast & Export</Typography>
				</Box>
			</Tooltip>
			<Menu
				open={isMenuOpen}
				onClose={() => setIsMenuOpen(false)}
				anchorEl={anchorRef.current}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "right",
				}}
				transformOrigin={{
					vertical: "top",
					horizontal: "right",
				}}
			>
				<MenuItem onClick={_handleExport}
				sx={{
					borderRadius: 1,
					minWidth: 172,
					padding: theme.spacing(1, 2),
					fontWeight: 600,
				}}>
					<MicrosoftExcelLogo size={20} style={{ marginRight: "8px" }} />
					<Typography variant="Text6Medium" 
					>Excel</Typography>
				</MenuItem>
				{/* TODO: Enable options as per requirement change */}
				{/* <MenuItem disabled>
				<Table size={20} style={{ marginRight: "8px" }} />
				<Typography variant="Text6Medium">Sheets</Typography>
			</MenuItem> */}
				{/* <MenuItem disabled>
					<FileCsv size={20} style={{ marginRight: "8px" }} />
					<Typography variant="Text6Medium">CSV</Typography>
				</MenuItem> */}
			</Menu>
		</>
	);
};

export default ExportMenu;
