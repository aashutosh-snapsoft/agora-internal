import React, { useState, useEffect, useRef } from "react";
import { UploadSimple, Table, Info, CheckCircle, CaretDown, ChartBar, Rows, StackSimple, CalendarBlank, FileText, Clock, CalendarCheck } from "@phosphor-icons/react";
import { Box, Button, Typography, CircularProgress, Tooltip, Alert, Stack, useTheme } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { SuccessIcon, ErrorIcon } from "./CustomStatusIcons";
import { FILE_SIZE_LIMITS, formatFileSize } from "@/lib/utils/fileValidation";
import { validateFileType, validateFileSize, validateFileName, validateFileContent } from '@/lib/utils/fileValidation';
import EnhancedErrorDisplay from './EnhancedErrorDisplay';
import ExcelFileIcon from "@/components/icons/ExcelFileIcon";

type Status = "default" | "loading" | "success" | "error";

interface ValidationItem {
	label: string;
	details?: string;
}

interface UploadChecklistProps {
	requirements: ValidationItem[];
	onUpload: (file: File) => void;
	isProcessing?: boolean;
	initialStatuses?: Status[];
	backendErrorMessages?: (string | null)[];
	variant?: "default" | "simple" | "grid";
	showDropzone?: boolean;
	dropzoneReplacement?: React.ReactNode;
	uploadedFileName?: string | null;
	uploadedFileSize?: number | null;
	showUploadedFileCard?: boolean;
	statusBanner?: React.ReactNode;
	showRequirementLoading?: boolean;
	projectName?: string;
}

function StatusIcon({ status }: { status: Status }) {
	switch (status) {
		case "success":
			return (
				<Box
					sx={{
						width: 20,
						height: 20,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<SuccessIcon />
				</Box>
			);
		case "error":
			return (
				<Box
					sx={{
						width: 20,
						height: 20,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<ErrorIcon />
				</Box>
			);
		case "loading":
			return (
				<Box
					sx={{
						width: 20,
						height: 20,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						position: "relative",
					}}
				>
					<Box
						sx={{
							position: "absolute",
							width: 20,
							height: 20,
							borderRadius: "50%",
							backgroundColor: "#E5E7EB",
						}}
					/>
					<CircularProgress 
						size={20} 
						thickness={5} 
						sx={{
							color: "#4B5563",
							position: "relative",
							zIndex: 1,
						}}
					/>
				</Box>
			);
		default:
			return (
				<Box
					sx={{
						width: 20,
						height: 20,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
						<circle cx="12" cy="12" r="9.75" stroke="#D1D5DB" strokeWidth="1.5" />
						<path d="M16.2806 10.2806L11.0306 15.5306C10.961 15.6004 10.8783 15.6557 10.7872 15.6934C10.6962 15.7312 10.5986 15.7506 10.5 15.7506C10.4014 15.7506 10.3038 15.7312 10.2128 15.6934C10.1218 15.6557 10.039 15.6004 9.96938 15.5306L7.71938 13.2806C7.57865 13.1399 7.49959 12.949 7.49959 12.75C7.49959 12.551 7.57865 12.3601 7.71938 12.2194C7.86011 12.0786 8.05098 11.9996 8.25 11.9996C8.44903 11.9996 8.6399 12.0786 8.78063 12.2194L10.5 13.9397L15.2194 9.21937C15.2891 9.14969 15.3718 9.09442 15.4628 9.0567C15.5539 9.01899 15.6515 8.99958 15.75 8.99958C15.8486 8.99958 15.9461 9.01899 16.0372 9.0567C16.1282 9.09442 16.2109 9.14969 16.2806 9.21937C16.3503 9.28906 16.4056 9.37178 16.4433 9.46283C16.481 9.55387 16.5004 9.65145 16.5004 9.75C16.5004 9.84855 16.481 9.94613 16.4433 10.0372C16.4056 10.1282 16.3503 10.2109 16.2806 10.2806Z" fill="#D1D5DB" />
					</svg>
				</Box>
			);
	}
}

const getRequirementIcon = (label: string, color: string) => {
	if (/income statement/i.test(label)) {
		return (
			<ExcelFileIcon
				sx={{
					width: 20,
					height: 20,
					"& path": { fill: color },
				}}
			/>
		);
	}

	if (/balance sheet/i.test(label)) {
		return <StackSimple size={20} color={color} weight="bold" />;
	}

	if (/multiple time periods/i.test(label)) {
		return <Clock size={20} color={color} weight="bold" />;
	}

	if (/time period/i.test(label)) {
		return <CalendarCheck size={20} color={color} weight="bold" />;
	}

	return <Info size={20} color={color} weight="bold" />;
};

export default function UploadChecklist({
	requirements,
	onUpload,
	isProcessing = false,
	initialStatuses,
	backendErrorMessages = [],
	variant = "default",
	showDropzone = true,
	dropzoneReplacement = null,
	uploadedFileName = null,
	uploadedFileSize = null,
	showUploadedFileCard = false,
	statusBanner = null,
	showRequirementLoading = true,
	projectName = "",
}: UploadChecklistProps) {
	const theme = useTheme();
	const [statuses, setStatuses] = useState<Status[]>(
		initialStatuses || Array(requirements.length).fill("default")
	);
	const [errorMessages, setErrorMessages] = useState<(string | null)[]>(Array(requirements.length).fill(null));
	const [isUploading, setIsUploading] = useState(false);
	const [expandedItems, setExpandedItems] = useState<boolean[]>(Array(requirements.length).fill(false));
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (initialStatuses) {
			setStatuses(initialStatuses);
			setErrorMessages(Array(requirements.length).fill(null));
		}
		if (backendErrorMessages.length > 0) {
			setErrorMessages(backendErrorMessages);
		}
	}, [initialStatuses, requirements.length, backendErrorMessages]);

	// Auto-expand dropdown when error occurs
	useEffect(() => {
		const newExpandedItems = [...expandedItems];
		let hasChanges = false;
		
		statuses.forEach((status, index) => {
			if (status === "error" && !expandedItems[index]) {
				newExpandedItems[index] = true;
				hasChanges = true;
			}
		});
		
		if (hasChanges) {
			setExpandedItems(newExpandedItems);
		}
	}, [statuses, expandedItems]);

	const handleFileUpload = async (file: File) => {
		console.log("📁 [UploadChecklist] handleFileUpload called:", {
			fileName: file.name,
			fileSize: file.size,
			fileType: file.type,
			isUploading,
			projectName
		});
		
		if (isUploading) {
			console.warn("⚠️ [UploadChecklist] Upload already in progress, ignoring");
			return;
		}
		try {
			setIsUploading(true);
			console.log("🔄 [UploadChecklist] Starting file validation...");
			setErrorMessages(Array(requirements.length).fill(null));
			setStatuses(Array(requirements.length).fill("default"));
			// Close all dropdown menus when starting a new file upload
			setExpandedItems(Array(requirements.length).fill(false));
			const errors: (string | null)[] = Array(requirements.length).fill(null);
			const statusesCopy: Status[] = Array(requirements.length).fill("default");
			// File type validation (requirement 0)
			if (requirements[0]?.label === "File in XLSX workbook format") {
				const isTypeValid = validateFileType(file);
				if (!isTypeValid) {
					errors[0] = "Invalid file type. Please upload XLSX, XLS, PDF, CSV, or TXT files only.";
					statusesCopy[0] = "error";
					setStatuses(statusesCopy);
					setErrorMessages(errors);
					setIsUploading(false);
					return;
				} else {
					statusesCopy[0] = "success";
				}
			}
			// File size validation (requirement 0)
			if (requirements[0]?.label === "File in XLSX workbook format") {
				const isSizeValid = validateFileSize(file);
				if (!isSizeValid) {
					const extension = '.' + file.name.split('.').pop()?.toLowerCase();
					const maxSize = FILE_SIZE_LIMITS[extension as keyof typeof FILE_SIZE_LIMITS] || FILE_SIZE_LIMITS.default;
					errors[0] = `File size exceeds limit. Maximum size for ${extension} files is ${formatFileSize(maxSize)}`;
					statusesCopy[0] = "error";
					setStatuses(statusesCopy);
					setErrorMessages(errors);
					setIsUploading(false);
					return;
				}
			}
			// File name validation (requirement 0)
			if (requirements[0]?.label === "File in XLSX workbook format") {
				const result = validateFileName(file.name);
				if (!result.isValid) {
					errors[0] = result.error || "Invalid file name.";
					statusesCopy[0] = "error";
					setStatuses(statusesCopy);
					setErrorMessages(errors);
					setIsUploading(false);
					return;
				}
			}
			// File content validation (requirement 0)
			if (requirements[0]?.label === "File in XLSX workbook format") {
				console.log("🔍 [UploadChecklist] Validating file content...");
				const contentResult = await validateFileContent(file);
				if (!contentResult.isValid) {
					console.error("❌ [UploadChecklist] File content validation failed:", contentResult.error);
					errors[0] = contentResult.error || "File content is invalid.";
					statusesCopy[0] = "error";
					setStatuses(statusesCopy);
					setErrorMessages(errors);
					setIsUploading(false);
					return;
				}
				console.log("✅ [UploadChecklist] File content validation passed");
			}
			// If all validations pass, clear errors and proceed
			setErrorMessages(errors);
			setStatuses(statusesCopy);
			console.log("✅ [UploadChecklist] All validations passed, calling onUpload callback");
			onUpload(file);
		} catch (err) {
			console.error("❌ [UploadChecklist] File upload error:", err);
			const errorMessage = err instanceof Error ? err.message : String(err);
			console.error("❌ [UploadChecklist] Error details:", {
				error: errorMessage,
				fileName: file.name,
				stack: err instanceof Error ? err.stack : undefined
			});
		} finally {
			setIsUploading(false);
		}
	};

	const canUpload =
		!isProcessing && !isUploading && !statuses.every((s) => s === "success") && projectName.trim().length > 0;

	const handleToggleExpand = (index: number) => {
		const newExpandedItems = [...expandedItems];
		newExpandedItems[index] = !newExpandedItems[index];
		setExpandedItems(newExpandedItems);
	};

	const handleLocalFile = (file: File) => {
		handleFileUpload(file);
	};

	const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			handleLocalFile(file);
		}
		event.target.value = "";
	};

	const handleDropZone = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDragging(false);
		const file = event.dataTransfer.files?.[0];
		if (file) {
			handleLocalFile(file);
		}
	};

	const handleDragOverZone = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeaveZone = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDragging(false);
	};

	const allRequirementsSatisfied = statuses.every((status) => status === "success");
	const hasTrackingStarted = statuses.some((status) => status !== "default");
	const shouldShowUploadedFileCard = !!showUploadedFileCard && !!uploadedFileName;
	const formattedFileSize =
		typeof uploadedFileSize === "number" ? formatFileSize(uploadedFileSize) : null;

	if (variant === "grid") {
		// Grid layout to mirror the two-column cards shown in the reference UI.
		return (
			<Box
				sx={{
					bgcolor: "grey.50",
					borderRadius: 3,
					boxShadow: 2,
					p: 3,
					border: "1px solid",
					borderColor: "grey.200",
					width: "100%",
					fontFamily: '"Inter", sans-serif',
				}}
			>
				{statusBanner && <Box mb={2}>{statusBanner}</Box>}
				{showDropzone ? (
					<Box
						onDrop={handleDropZone}
						onDragOver={handleDragOverZone}
						onDragLeave={handleDragLeaveZone}
						sx={{
							border: "1.5px dashed",
							borderColor: isDragging ? "grey.500" : "grey.300",
							borderRadius: 2,
							p: 4,
							textAlign: "center",
							bgcolor: isDragging ? "grey.50" : "transparent",
							mb: 2,
						}}
					>
						<Stack spacing={1} alignItems="center">
							<UploadSimple size={24} color="#111827" />
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{
									display: "inline-flex",
									alignItems: "center",
									gap: 0.5,
									flexWrap: { xs: "wrap", sm: "nowrap" },
									justifyContent: "center",
									textAlign: "center",
								}}
							>
								Drag and drop files here or
								<Button
									type="button"
									variant="contained"
									size="small"
									disableElevation
									onClick={() => fileInputRef.current?.click()}
									disabled={!projectName.trim() || isProcessing || isUploading}
									sx={{
										textTransform: "none",
										fontSize: "0.6875rem",
										lineHeight: 1.1,
										px: 0.875,
										py: 0.25,
										borderRadius: 2,
										backgroundColor: "#1F2937",
										color: "#FFFFFF",
										"&:hover": {
											backgroundColor: "#111827",
										},
										"&.Mui-disabled": {
											backgroundColor: "#D1D5DB",
											color: "#6B7280",
										},
									}}
								>
									Click to browse
								</Button>
							</Typography>
							<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
								Files accepted: XLSX
							</Typography>
						{!shouldShowUploadedFileCard && uploadedFileName && hasTrackingStarted && (
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{
									fontSize: "0.875rem",
									fontWeight: 500,
								}}
							>
								{uploadedFileName}
							</Typography>
						)}
							<input
								type="file"
								hidden
								ref={fileInputRef}
								accept=".xlsx"
								onChange={handleFileInputChange}
							/>
						</Stack>
					</Box>
				) : dropzoneReplacement ? (
					<Box
						sx={{
							border: "1.5px solid",
							borderColor: "grey.200",
							borderRadius: 2,
							p: 4,
							mb: 2,
							bgcolor: "common.white",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							// Keep this area stable so the checklist doesn't jump when replacing drag/drop with progress UI.
							minHeight: { xs: 180, sm: 208 },
						}}
					>
						{dropzoneReplacement}
					</Box>
				) : null}
				{shouldShowUploadedFileCard && (
					<Box
						sx={{
							borderRadius: 2,
							border: "1px solid",
							borderColor: "grey.200",
							bgcolor: "common.white",
							p: 2,
							display: "flex",
							alignItems: "center",
							gap: 2,
							mb: 2,
						}}
					>
						<Box
							sx={{
								width: 44,
								height: 44,
								borderRadius: 2,
								bgcolor: "#E0ECFF",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexShrink: 0,
							}}
						>
							<FileText size={24} color="#1F2937" />
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="Text5Bold" sx={{ fontSize: "14px" }} noWrap>
								{uploadedFileName}
							</Typography>
							{formattedFileSize && (
								<Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem", mt: 0.25 }}>
									{formattedFileSize}
								</Typography>
							)}
						</Box>
					</Box>
				)}
				<Box mb={2}>
					<Typography variant="Text5Bold" sx={{ fontSize: "14px", display: "block" }}>Document requirements:</Typography>
					<Typography variant="Text5Regular" sx={{ fontSize: "14px", color: "#6B7280", display: "block" }}>Make sure your document does not have any hidden sheets.</Typography>
				</Box>
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
						gap: 1.5,
					}}
				>
					{requirements.map((item, index) => {
						const status = statuses[index];
						const isError = status === "error";
						const isLoading = showRequirementLoading && status === "loading";
						const isSuccess = allRequirementsSatisfied;
						const requirementIconColor = "#6B7280";

						// Per design: failed = light red card with red stroke; success/pending = white card with gray info icon
						const borderColor = isError ? "#F87171" : isSuccess ? "#86EFAC" : "grey.300";
						const backgroundColor = isError ? "#FEE2E2" : isSuccess ? "#DCFCE7" : "common.white";
						const titleColor = isError ? "#7F1D1D" : isSuccess ? "#14532D" : "#4B5563";
						const detailsColor = titleColor;

						return (
							<Box
								key={index}
								sx={{
									borderRadius: 2,
									border: "1px solid",
									borderColor,
									bgcolor: backgroundColor,
									p: 2,
									display: "flex",
									alignItems: "flex-start",
									gap: 1,
								}}
							>
								<Box display="flex" alignItems="center" gap={0.75}>
									{isError ? (
										<Box
											sx={{
												width: 20,
												height: 20,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												color: "#7F1D1D",
											}}
										>
											<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M12 2L2 20H22L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
												<path d="M12 9V13M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
											</svg>
										</Box>
									) : isSuccess ? (
										<Box
											sx={{
												width: 20,
												height: 20,
												borderRadius: "50%",
												bgcolor: "#22C55E",
												color: "common.white",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											<CheckIcon sx={{ fontSize: 14, color: "common.white" }} />
										</Box>
									) : (
										<Box
											sx={{
												width: 20,
												height: 20,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											{getRequirementIcon(item.label, requirementIconColor)}
										</Box>
									)}
								</Box>
								<Box sx={{ flex: 1 }}>
									<Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
										<Typography variant="Text5Bold" sx={{ fontSize: "14px", color: titleColor }}>{item.label}</Typography>
										{isLoading && (
											<CircularProgress 
												size={16} 
												thickness={5} 
												sx={{ color: "#4B5563" }}
											/>
										)}
									</Box>
									{item.details && (
										<Typography variant="body2" sx={{ color: detailsColor }}>
											{item.details}
										</Typography>
									)}
								</Box>
							</Box>
						);
					})}
				</Box>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				bgcolor: variant === "simple" ? "#f7f8fa" : "grey.100",
				borderRadius: variant === "simple" ? 3 : 4,
				boxShadow: variant === "simple" ? 2 : 2,
				p: variant === "simple" ? 3 : 2.5,
				maxWidth: variant === "simple" ? 560 : 480,
				border: variant === "simple" ? "1px solid" : undefined,
				borderColor: variant === "simple" ? "grey.200" : undefined,
			}}
		>
			<Box mb={3}>
				<Box display="flex" alignItems="center" gap={1}>
					<Table size={24} />
					<Typography variant="Text5Bold" sx={{ fontSize: "14px" }}>Track your document requirements</Typography>
				</Box>
			</Box>
			
			{/* File size limits info */}
			{/* <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
				<Box display="flex" alignItems="center" gap={1} mb={1}>
					<Info size={16} />
					<Typography variant="Text6Medium" fontWeight={500}>File Size Limits</Typography>
				</Box>
				<Box display="flex" flexWrap="wrap" gap={1}>
					{Object.entries(FILE_SIZE_LIMITS).map(([ext, size]) => {
						if (ext === 'default') return null;
						return (
							<Tooltip key={ext} title={`Maximum size for ${ext} files`}>
								<Box sx={{ 
									px: 1, 
									py: 0.5, 
									bgcolor: 'grey.100', 
									borderRadius: 2,
									border: '1px solid',
									borderColor: 'grey.300',
									cursor: 'default'
								}}>
									<Typography variant="Text7Medium" color="text.secondary">
										{ext}: {formatFileSize(size)}
									</Typography>
								</Box>
							</Tooltip>
						);
					})}
				</Box>
			</Box> */}

			<Box
				component="ul"
				sx={{
					listStyle: "none",
					p: 0,
					m: 0,
					display: "flex",
					flexDirection: "column",
					gap: variant === "simple" ? 1 : 0,
				}}
			>
				{requirements.map((item, index) => (
					<Box component="li" key={index}>
						<Box
							mb={variant === "simple" ? 1 : 2}
							display="flex"
							alignItems="center"
							gap={1.5}
							sx={{
								cursor: "pointer",
								py: variant === "simple" ? 1 : 0,
								px: variant === "simple" ? 1 : 0,
								borderRadius: variant === "simple" ? 2 : 0,
								"&:hover": variant === "simple" ? { bgcolor: "grey.100" } : undefined,
							}}
							onClick={() => handleToggleExpand(index)}
						>
							{variant === "simple" ? (
								<Box
									sx={{
										width: 20,
										height: 20,
										borderRadius: "50%",
										border: `2px solid ${statuses[index] === "success" ? "#AFFF48" : "#D1D5DB"}`,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										bgcolor: statuses[index] === "success" ? "#AFFF48" : "transparent",
									}}
								>
									{statuses[index] === "success" && (
										<CheckCircle weight="bold" size={12} color="#000000" />
									)}
								</Box>
							) : (
								<StatusIcon status={statuses[index]} />
							)}
							<Typography variant="Text5Regular" sx={{ flex: 1 }}>{item.label}</Typography>
							<CaretDown 
								size={16} 
								style={{ 
									transform: expandedItems[index] ? 'rotate(180deg)' : 'rotate(0deg)',
									transition: 'transform 0.2s ease'
								}}
							/>
						</Box>
						
						{/* Expanded details */}
						{expandedItems[index] && (
							<Box sx={{ ml: 1, mb: 2, pl: 2, borderLeft: '2px solid', borderColor: 'grey.200' }}>
								{item.details && (
									<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
										{item.details}
									</Typography>
								)}
								
								{/* Show error message if present */}
								{(statuses[index] === "error" && errorMessages[index]) && (
									<EnhancedErrorDisplay 
										errorMessage={errorMessages[index]!}
										sx={{ 
											mt: 0,
											mb: 0,
											borderRadius: 2
										}}
									/>
								)}
							</Box>
						)}
					</Box>
				))}
			</Box>

			{/* Success state when document is uploaded */}
			{/* Removed - moved to chat area */}

			{canUpload && (
				// <Box mt={3} display="flex" justifyContent="center">
				<Box mt={3} display="flex" flexDirection="column" alignItems="center">
					{/* {statuses.some((s) => s === "error") && (
						<Typography color="error" variant="Text6Medium" sx={{ mb: 3 }}>
							Please fix the errors above and try again
						</Typography>
					)} */}
					<Button
						variant="contained"
						component="label"
						startIcon={<UploadSimple size={20} />}
						disabled={isProcessing || isUploading || !projectName.trim()}
						sx={{
							width: "100%",
							borderRadius: 3,
							bgcolor: "grey.900",
							color: "white",
							px: 2,
							py: 1,
							fontSize: "18px",
							fontWeight: 450,
							textTransform: "none",
							"&:hover": { bgcolor: "grey.800" },
						}}
					>
						Upload Documents
						<input
							type="file"
							hidden
							onChange={(e) => {
								if (e.target.files?.[0]) {
									handleFileUpload(e.target.files[0]);
									e.target.value = "";
								}
							}}
						/>
					</Button>
				</Box>
			)}
		</Box>
	);
}
