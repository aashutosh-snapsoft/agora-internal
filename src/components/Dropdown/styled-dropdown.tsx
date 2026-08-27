import React, { useState } from "react";
import {
	FormControl,
	Select,
	Skeleton,
	Box,
	SelectChangeEvent,
	SxProps,
	Theme,
	Typography,
	useTheme,
} from "@mui/material";
import {
	selectStyles,
	StyledMenuItem,
	menuStyles,
	StyledSubText,
} from "./styled-dropdown-styles";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";

export type DropdownOption = {
	value: string | number;
	label: string;
	subValue?: any | null;
	isDisabled?: boolean;
};

interface DropdownProps {
	value: string | number;
	onChange: (event: SelectChangeEvent<any>) => void;
	options: DropdownOption[];
	loading?: boolean;
	placeholder?: string;
	sx?: SxProps<Theme>;
}

const StyledDropdown = ({
	value,
	onChange,
	options,
	loading,
	placeholder,
	sx,
}: DropdownProps) => {
	const [open, setOpen] = useState<boolean>(false);
	const theme = useTheme();

	const handleOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	return (
		<FormControl fullWidth sx={{ padding: "0px", ...sx }}>
			<Select
				value={value}
				open={open}
				onOpen={handleOpen}
				onClose={handleClose}
				onChange={(e: SelectChangeEvent<any>) => onChange(e)}
				displayEmpty
				IconComponent={open ? KeyboardArrowUp : KeyboardArrowDown}
				renderValue={(selected) => {
					if (!selected) {
						return (
							<Box
								display="flex"
								justifyContent="space-between"
								sx={{ maxWidth: "calc(100% - 25px)", height: "100%" }}
							>
								<Typography variant="body2" fontWeight={600}>
									{placeholder || "Select an option"}
								</Typography>
							</Box>
						);
					}
					const selectedOption = options.find((opt) => opt.value === selected);
					return (
						<Box
							display="flex"
							justifyContent="space-between"
							sx={{ maxWidth: "calc(100% - 25px)", height: "100%" }}
						>
							<Typography
								variant="body2"
								fontWeight={600}
								sx={{ alignSelf: "center" }}
							>
								{selectedOption?.label || selected}
							</Typography>
							{selectedOption?.subValue && (
								<StyledSubText>{selectedOption?.subValue}</StyledSubText>
							)}
						</Box>
					);
				}}
				sx={selectStyles}
				MenuProps={{
					MenuListProps: {
						sx: {
							width: "100%",
							borderRadius: theme.spacing(2),
							"& .Mui-selected:hover": {
								background: theme.palette.background.paper,
							},
							"& .Mui-selected": {
								background: theme.palette.background.paper,
							},
						},
					},
					PaperProps: {
						sx: { ...menuStyles, borderRadius: theme.spacing(2) },
					},
				}}
			>
				{loading
					? Array.from({ length: 5 }).map((_, index) => (
							<StyledMenuItem key={index} disabled>
								<Skeleton variant="text" width="100%" />
							</StyledMenuItem>
					  ))
					: options.map((option) => (
							<StyledMenuItem
								key={option.value}
								value={option.value}
								disabled={option.isDisabled}
							>
								{option.label}
								{option?.subValue && (
									<StyledSubText>{option?.subValue}</StyledSubText>
								)}
							</StyledMenuItem>
					  ))}
			</Select>
		</FormControl>
	);
};

export default StyledDropdown;
