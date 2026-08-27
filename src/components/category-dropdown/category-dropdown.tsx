import React, { useMemo } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAppSelector } from "@/store/store";
import { fmSelector } from "@/store/financialModels/financial-model-selectors";

import {
	FormControl,
	Skeleton,
	useTheme,
	TextField,
	Autocomplete,
	Box,
} from "@mui/material";
import { CustomTheme } from "@/external/essence/theme/createTheme";
import {
	HEADER_CLASSIFICATION_VALUE,
	OTHER_CLASSIFICATION_VALUE,
	TOTAL_CLASSIFICATION_VALUE,
} from "@/lib/utils/classification";
import { displayTaxonomyName } from "@/lib/utils/taxonomy-format";
import { TaxonomyConcept } from "@/types/content";
import { CategoryDropdownProps } from "./category-dropdown.types";

/**
 * A dropdown component for selecting a category from a list of options, intended
 * for reclassifying a line item.
 */
type ClassificationOption = {
	value: string;
	label: string;
	isDerived?: boolean;
	sort_order: number;
};

const STRUCTURAL_CLASSIFICATION_OPTIONS: ClassificationOption[] = [
	{
		value: HEADER_CLASSIFICATION_VALUE,
		label: HEADER_CLASSIFICATION_VALUE,
		sort_order: -2,
	},
	{
		value: TOTAL_CLASSIFICATION_VALUE,
		label: TOTAL_CLASSIFICATION_VALUE,
		sort_order: -1,
	},
	{
		value: OTHER_CLASSIFICATION_VALUE,
		label: OTHER_CLASSIFICATION_VALUE,
		sort_order: 0,
	},
];

const CategoryDropdown = ({
	value,
	onChange,
	modelTemplateId,
	isHighlighted = false,
	highlightColor,
	fontSize,
	variant = "compact",
	disabled = false,
	showLoadingIndicator = true,
	includeStructuralOptions = false,
}: CategoryDropdownProps) => {
	const { taxonomyConcepts, loading } = useAppSelector(fmSelector);
	const theme = useTheme<CustomTheme>();
	const isModalVariant = variant === "modal";
	const controlHeight = isModalVariant ? 24 : 30;
	const controlRadius = isModalVariant ? theme.spacing(2) : theme.spacing(1.5);
	const dropdownFontSize =
		fontSize ??
		(isModalVariant
			? theme.typography.body2?.fontSize ?? "14px"
			: undefined) ??
		theme.typography.Text6Medium?.fontSize ??
		theme.typography.body2?.fontSize ??
		"12px";

	const baseOptions: ClassificationOption[] = useMemo(() => {
		if (!taxonomyConcepts) {
			return includeStructuralOptions ? [...STRUCTURAL_CLASSIFICATION_OPTIONS] : [];
		}

		const filteredConcepts = taxonomyConcepts.filter((concept) => {
			const sameModelTemplate = (concept: TaxonomyConcept) => {
				return (
					concept.template_concepts.find(
						(tc) => tc.model_template_id === modelTemplateId
					) !== undefined
				);
			};

			return sameModelTemplate(concept);
		});
		const conceptOptions = filteredConcepts
			.map((concept: TaxonomyConcept) => ({
				value: concept.id,
				label: displayTaxonomyName(concept),
				sort_order: concept.presentation_linkbase?.order ?? 0,
				isDerived:
					concept.type === "derived" ||
					(concept.type === "dynamic" &&
						concept.metadata?.type?.reported === "derived"),
			}))
			// Omit any concepts that include a percentage from the dropdown list.
			.filter((option) => !option.label?.includes("%"))
			.sort((a, b) => a.sort_order - b.sort_order);

		return includeStructuralOptions
			? [...STRUCTURAL_CLASSIFICATION_OPTIONS, ...conceptOptions]
			: conceptOptions;
	}, [taxonomyConcepts, modelTemplateId, includeStructuralOptions]);

	const options: ClassificationOption[] = useMemo(() => {
		if (!value || value === "") {
			return baseOptions;
		}
		const rawLineItemOutsideSelection =
			baseOptions.find((option) => option.value === value) === undefined;
		if (!rawLineItemOutsideSelection) {
			return baseOptions;
		}
		return [
			{
				value: value,
				label: "No Change",
				sort_order: 0,
				isDerived: false,
			},
			...baseOptions,
		];
	}, [baseOptions, value]);

	// Return the selected option so the Autocomplete can display the label.
	const selectedOption =
		value && value !== ""
			? (options.find((option) => option.value === value) ?? null)
			: null;

	const handleChange = (
		_: React.SyntheticEvent,
		newValue: { value: string; label: string; isDerived?: boolean } | null
	) => {
		if (newValue === null) {
			onChange("");
		} else if (newValue.value !== value) {
			onChange(newValue.value);
		}
	};

	return (
		<FormControl fullWidth disabled={disabled}>
			<Autocomplete
				fullWidth
				size="small"
				disabled={disabled}
				disableClearable={false}
				value={selectedOption}
				className="category-dropdown"
				onChange={handleChange}
				options={options}
				loading={loading}
				getOptionLabel={(option) => option.label}
				isOptionEqualToValue={(option, value) => option.value === value?.value}
				clearIcon={
					<CloseIcon
						fontSize="small"
						sx={{ color: theme.palette.grey[500] }}
					/>
				}
				popupIcon={
					<ExpandMoreIcon
						sx={{ color: isModalVariant ? theme.palette.grey[700] : theme.palette.grey[500] }}
					/>
				}
				forcePopupIcon="auto"
				sx={{
					fontFamily: theme.typography.fontFamily,
					textTransform: "none",
					height: controlHeight,
					display: "flex",
					alignItems: "center",
					fontSize: dropdownFontSize,
					minWidth: {
						xs: "120px",
						sm: "180px",
					},
					"& .MuiAutocomplete-inputRoot": {
						minHeight: controlHeight,
						// Let the selected value fill the control; keep icons to the far right.
						justifyContent: "flex-start",
						width: "100%",
						paddingRight: theme.spacing(4),
						paddingLeft: isModalVariant ? theme.spacing(0.5) : 0,
						gap: theme.spacing(0.5),
					},
					// Keep the clear (×) icon to the far right so the input can fill the remaining width.
					"& .MuiAutocomplete-endAdornment": {
						position: "absolute",
						right: theme.spacing(1),
						top: "50%",
						transform: "translateY(-50%)",
						display: "flex",
						alignItems: "center",
						height: "100%",
					},
					"& .MuiAutocomplete-input": {
						flexGrow: 1,
						minWidth: 0,
						width: "100%",
						textAlign: "left",
					},
					"& .MuiOutlinedInput-root": {
						borderRadius: controlRadius,
						minHeight: controlHeight,
						padding: 0,
						boxShadow: "none",
						backgroundColor: theme.palette.background.paper,
						position: "relative",
						zIndex: 1,
					},
					"& .MuiOutlinedInput-notchedOutline": {
						padding: 0,
						borderRadius: controlRadius,
						border: isModalVariant
							? "none"
							: `1px solid ${
									isHighlighted
										? highlightColor ?? theme.palette.success.main
										: theme.palette.grey[300]
								}`,
					},
					"& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
						borderColor: isModalVariant
							? "transparent"
							: isHighlighted
							? highlightColor ?? theme.palette.success.main
							: theme.palette.grey[300],
					},
					"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
						borderColor: isModalVariant
							? "transparent"
							: isHighlighted
							? highlightColor ?? theme.palette.success.main
							: theme.palette.grey[300],
					},
				}}
				renderInput={(params) => (
					<TextField
						{...params}
						placeholder={value && value !== "" ? undefined : "Select classification"}
						variant="outlined"
						InputProps={{
							...params.InputProps,
							endAdornment: (
								<React.Fragment>
									{loading && showLoadingIndicator ? (
										<Skeleton
											variant="circular"
											width={20}
											height={20}
											sx={{ mr: 0.5 }}
										/>
									) : null}
									{params.InputProps.endAdornment}
								</React.Fragment>
							),
						}}
						inputProps={{
							...params.inputProps,
							style: {
								width: "100%",
								padding: isModalVariant ? "4px 0" : 0,
								minHeight: controlHeight,
								textAlign: "left",
								fontSize: dropdownFontSize,
								...params.inputProps?.style,
							},
						}}
						sx={{
							width: "100%",
							backgroundColor: theme.palette.background.paper,
							borderRadius: controlRadius,
							"& .MuiInputBase-input": {
								fontSize: dropdownFontSize,
								padding: isModalVariant ? "4px 0" : 0,
								minHeight: controlHeight,
								lineHeight: 1.25,
								paddingTop: theme.spacing(0.5),
								paddingBottom: theme.spacing(0.5),
							},
							"& .MuiInputBase-input::placeholder": {
								fontSize: dropdownFontSize,
							},
							"& .MuiOutlinedInput-root": {
								padding: 0,
								display: "flex",
								alignItems: "center",
								backgroundColor: theme.palette.background.paper,
							},
							"& .MuiInputBase-root": {
								backgroundColor: theme.palette.background.paper,
							},
						}}
					/>
				)}
				slotProps={{
					popper: {
						style: {
							zIndex: 1400,
						},
					},
					paper: {
						style: {
							borderRadius: theme.spacing(2),
							background: theme.palette.background.paper,
							boxShadow: theme.shadows[16],
							overflow: "hidden",
						},
					},
					listbox: {
						style: {
							maxHeight: 300,
							overflowY: "auto",
						},
					},
					clearIndicator: {
						sx: {
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							alignSelf: "center",
							color: theme.palette.grey[500],
							"&:hover": {
								color: theme.palette.grey[700],
							},
							p: 0,
						},
					},
				}}
				renderOption={(props, option) => {
					const { key, ...otherProps } = props;
					return (
						<li
							key={key}
							{...otherProps}
							style={{
								...theme.typography.Text6Medium,
								fontSize: dropdownFontSize,
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
							}}
						>
							{option.label}
							{option.isDerived && (
								<Box
									sx={{
										ml: 1,
										px: 1.5,
										py: 0.25,
										borderRadius: "16px",
										bgcolor: theme.palette.grey[200],
										color: theme.palette.grey[700],
										fontSize: theme.typography.Text7Medium.fontSize,
										fontWeight: theme.typography.Text7Medium.fontWeight,
									}}
									>
										Excluded
								</Box>
							)}
						</li>
					);
				}}
			/>
		</FormControl>
	);
};

export default CategoryDropdown;
