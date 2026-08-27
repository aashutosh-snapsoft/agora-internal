import React from "react";
import {
	Box,
	Typography,
	Dialog,
	useTheme,
	IconButton,
} from "@mui/material";
import { Warning, X } from "@phosphor-icons/react";
import { ValidationDetailModalProps } from "./validation-detail-modal.types";
import { getModalButtonStyles } from "@/external/essence/theme/components/button-styles";

const ValidationDetailModal: React.FC<ValidationDetailModalProps> = ({
	open,
	onClose,
	validationType,
	title,
	description,
	deltaValue,
	periodLabel,
	lineItemName,
	reportedValue,
	calculatedValue,
}) => {
	const theme = useTheme();
	const modalButtonStyles = getModalButtonStyles(theme);
	const formatNumericDisplay = (value?: string) => {
		if (!value) return value;
		const trimmed = value.trim();
		if (trimmed.length === 0) return value;
		let normalized = trimmed;
		let isNegative = false;
		if (normalized.startsWith("(") && normalized.endsWith(")")) {
			isNegative = true;
			normalized = normalized.slice(1, -1);
		}
		normalized = normalized.replace(/,/g, "");
		if (normalized.startsWith("-")) {
			isNegative = true;
			normalized = normalized.slice(1);
		}
		const parsed = parseFloat(normalized);
		if (!Number.isFinite(parsed)) {
			return value;
		}
		const formatted = Math.abs(parsed).toLocaleString("en-US", {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		});
		return isNegative ? `(${formatted})` : formatted;
	};

	// Extract line item name and period from description if not provided
	const extractInfoFromDescription = () => {
		if (!description) return { lineItem: '', period: '' };
		
		// Try to extract line item and period from description
		// Example: "Our calculated value for Gross Profit in 2022 A does not match..."
		const lineItemMatch = description.match(/for (.+?) in/);
		const periodMatch = description.match(/in (.+?) does/);
		
		return {
			lineItem: lineItemMatch ? lineItemMatch[1] : lineItemName || '',
			period: periodMatch ? periodMatch[1] : periodLabel || ''
		};
	};

	const { lineItem, period } = extractInfoFromDescription();

	// Extract values from description if not provided
	const extractValuesFromDescription = () => {
		if (reportedValue && calculatedValue) {
			return {
				reported: reportedValue,
				calculated: calculatedValue,
				difference: deltaValue || ''
			};
		}

		// Try to extract from description like "Reported 4,408,032 does not match calculated 4,408,154 (Δ -122)"
		const reportedMatch = description?.match(/[Rr]eported\s+([\d,.-]+)/);
		const calculatedMatch = description?.match(/calculated\s+([\d,.-]+)/);
		const deltaMatch = description?.match(/\(Δ\s*([+-]?[\d,.-]+)\)/);

		return {
			reported: reportedMatch ? reportedMatch[1] : reportedValue || '',
			calculated: calculatedMatch ? calculatedMatch[1] : calculatedValue || '',
			difference: deltaMatch ? deltaMatch[1] : deltaValue || ''
		};
	};

	const { reported, calculated, difference } = extractValuesFromDescription();
	const formattedReported = formatNumericDisplay(reported);
	const formattedCalculated = formatNumericDisplay(calculated);
	const formattedDifference = formatNumericDisplay(difference);

	const formatDescription = () => {
		// Format the period to be more readable
		let formattedPeriod = period;
		if (period && period.includes('T')) {
			// Handle ISO date format like "2021-01-01T00:00:00+00:00 - 2021-12-31T00:00:00+00:00"
			const dateRange = period.split(' - ');
			if (dateRange.length === 2) {
				const startDate = new Date(dateRange[0]);
				const endDate = new Date(dateRange[1]);
				
				// Format as "Jan 1, 2021 - Dec 31, 2021"
				const formatDate = (date: Date) => {
					return date.toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
						year: 'numeric'
					});
				};
				
				formattedPeriod = `${formatDate(startDate)} - ${formatDate(endDate)}`;
			}
		}
		
		// Format the line item name to be more readable
		let formattedLineItem = lineItem;
		if (lineItem && lineItem.includes('=')) {
			// Handle cases like "Net Income Reported = Calculated"
			formattedLineItem = lineItem.split('=')[0].trim();
		}
		
		return `Our calculated value for **${formattedLineItem}** in **${formattedPeriod}** does not match the value reported in the uploaded documents. This could be because:`;
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			slotProps={{
				paper: {
					sx: {
						borderRadius: theme.shape.borderRadius,
						padding: 0,
						maxWidth: '600px',
					},
				},
			}}
		>
			{/* Header */}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '24px 32px 16px 32px',
                    mb: 2
				}}
			>
				<Box display="flex" alignItems="center" gap={1.5}>
					<Warning size={24} color={theme.palette.warning.main} weight="fill" />
					<Typography variant="body1" fontWeight={600} sx={{ fontSize: '18px !important' }}>
						Data Inconsistency
					</Typography>
				</Box>
				<IconButton onClick={onClose} size="small" sx={{ color: "grey.900", "&:hover": { color: "grey.900" } }}>
					<X size={24} />
				</IconButton>
			</Box>

			{/* Content */}
			<Box sx={{ padding: '0 32px 32px 32px' }}>
				{/* Data Comparison Table */}
				<Box sx={{ marginBottom: 3 }}>
					{/* Table Headers */}
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr 1fr',
							gap: 2,
							paddingBottom: 1,
							borderBottom: '4px solid black',
						}}
					>
						<Typography variant="body1" fontWeight={500} color="text.secondary" textAlign="right" sx={{ 
                            fontSize: '0.75rem !important',
                            mr: 1
                        }}>
							Reported
						</Typography>
						<Typography variant="body1" fontWeight={500} color="text.secondary" textAlign="right" sx={{ 
                            fontSize: '0.75rem !important', 
                            mr:1 
                        }}>
							Calculated
						</Typography>
						<Typography variant="body1" fontWeight={500} color="text.secondary" textAlign="right" sx={{ 
                            fontSize: '0.75rem !important',
                            mr: 1
                        }}>
							Difference
						</Typography>
					</Box>

					{/* Table Values */}
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr 1fr',
							gap: 2,
							paddingTop: 2,
							paddingBottom: 2,
							// borderBottom: '2px solid black',
							height: '40px',
							alignItems: 'center',
                            alignContent: 'center',
						}}
					>
						<Typography variant="body1" fontWeight={900} textAlign="right" sx={{ 
                            fontSize: '1rem !important',
                            mr:1
                        }}>
							{formattedReported || '—'}
						</Typography>
						<Typography variant="body1" fontWeight={900} textAlign="right" sx={{ 
                            fontSize: '1rem !important',
                            mr:1
                        }}>
							{formattedCalculated || '—'}
						</Typography>
						<Typography variant="body1" fontWeight={900} textAlign="right" sx={{ 
                            fontSize: '1rem !important',
                            mr:1
                        }}>
							{formattedDifference || '—'}
						</Typography>
					</Box>
				</Box>

				{/* Description */}
				<Box sx={{ marginBottom: 3 }}>
					<Typography variant="body1" sx={{lineHeight: 1.4, marginBottom: 2, fontSize: '1.2rem !important', fontWeight: 450 }}>
						{(() => {
							// const description = formatDescription();
							const parts = description.split(/\*\*(.*?)\*\*/);
							return parts.map((part, index) => {
								if (index % 2 === 1) {
									return (
										<Box
											key={index}
											component="span"
											sx={{
												fontWeight: 700,
												display: 'inline'
											}}
										>
											{part}
										</Box>
									);
								}
								// return part;
							});
						})()}
					</Typography>

					{/* Bullet Points */}
					{/* <Box component="ul" sx={{ margin: 0, paddingLeft: 2, listStyle: 'disc' }}>
						<Box component="li" sx={{ marginBottom: 1, display: 'list-item' }}>
							<Typography variant="body1" sx={{ lineHeight: 1.4, fontWeight: 450, fontSize: '1.2rem !important' }}>
								Input values contained errors
							</Typography>
						</Box>
						<Box component="li" sx={{ display: 'list-item' }}>
							<Typography variant="body1" sx={{ lineHeight: 1.4, fontWeight: 450, fontSize: '1.2rem !important' }}>
								Socratics classification moved line items around, altering formula inputs.
							</Typography>
						</Box>
					</Box> */}
				</Box>
			</Box>
		</Dialog>
	);
};

export default ValidationDetailModal;
