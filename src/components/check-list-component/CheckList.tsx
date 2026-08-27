import React, { useState, useEffect, useCallback } from "react";
import { UploadSimple, CaretDown, Table } from "@phosphor-icons/react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import { SuccessIcon, ErrorIcon } from "./CustomStatusIcons";

type Status = "default" | "loading" | "success" | "error";

interface RequirementItem {
	label: string;
	details?: string;
}

interface UploadChecklistProps {
	requirements: RequirementItem[];
	uploadFileToRequirementAPI: (
		file: File | null,
		label: string
	) => Promise<void>;
	uploadMode?: "manual" | "auto";
	onAllUploadsComplete?: () => void;
}

function StatusIcon({ status }: { status: Status }) {
	switch (status) {
		case "success":
			return (
				<Box sx={{ width: 24, height: 24 }}>
					<SuccessIcon />
				</Box>
			);
		case "error":
			return (
				<Box sx={{ width: 24, height: 24 }}>
					<ErrorIcon />
				</Box>
			);
		case "loading":
			return <CircularProgress size={20} thickness={5} color="inherit" />;
		default:
			return (
				<Box
					sx={{
						width: 20,
						height: 20,
						borderRadius: "50%",
						border: "1px solid",
						borderColor: "grey.400",
					}}
				/>
			);
	}
}

export default function UploadChecklist({
	requirements,
	uploadFileToRequirementAPI,
	uploadMode = "manual",
	onAllUploadsComplete,
}: UploadChecklistProps) {
	const [statuses, setStatuses] = useState<Status[]>(
		Array(requirements.length).fill("default")
	);
	const [errors, setErrors] = useState<(string | null)[]>(
		Array(requirements.length).fill(null)
	);
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const allSuccess = statuses.every((status) => status === "success");

	const processRequirementsSequentially = useCallback(
		async (file: File | null) => {
			const newStatuses = [...statuses];
			const newErrors = [...errors];
			setIsUploading(true);

			for (let i = 0; i < requirements.length; i++) {
				newStatuses[i] = "loading";
				setStatuses([...newStatuses]);

				try {
					await uploadFileToRequirementAPI(file, requirements[i].label);
					newStatuses[i] = "success";
					newErrors[i] = null;
				} catch (err: any) {
					newStatuses[i] = "error";
					newErrors[i] = err?.message || "Processing failed";
					setStatuses([...newStatuses]);
					setErrors([...newErrors]);
					setIsUploading(false);
					return;
				}
			}

			setStatuses([...newStatuses]);
			setErrors([...newErrors]);
			setIsUploading(false);
		},
		[statuses, errors, requirements, uploadFileToRequirementAPI]
	);

	useEffect(() => {
		if (uploadMode === "auto") {
			processRequirementsSequentially(null);
		}
	}, [uploadMode, processRequirementsSequentially]);

	useEffect(() => {
		if (allSuccess && onAllUploadsComplete) {
			onAllUploadsComplete();
		}
	}, [allSuccess, onAllUploadsComplete]);

	// Dependency arrays with unmemorized functions re-run more frequently than necessary, which can result in slowing.
	
	const handleFileChange = useCallback((file: File | null) => {
		if (!file) return;
		processRequirementsSequentially(file);
	}, [processRequirementsSequentially]);

	const handleToggleExpand = useCallback((index: number) => {
		setExpandedIndex(index === expandedIndex ? null : index);
	}, [expandedIndex]);

	const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) {
			handleFileChange(e.target.files[0]);
			e.target.value = "";
		}
	}, [handleFileChange]);

	const handleBuildForecast = useCallback(() => {
		if (onAllUploadsComplete) onAllUploadsComplete();
	}, [onAllUploadsComplete]);

	return (
		<Box
			sx={{
				bgcolor: "grey.100",
				borderRadius: 4,
				boxShadow: 2,
				p: 2.5,
				maxWidth: 480,
				width: "100%",
			}}
		>
			<Box display="flex" alignItems="center" mb={3} gap={1}>
				<Table size={24} />
				<Typography variant="h6" fontWeight={600}>
					{uploadMode === "manual"
						? "Upload Requirements"
						: "Assumptions Needed"}
				</Typography>
			</Box>

			<Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
				{requirements.map((item, index) => (
					<Box component="li" key={index} mb={3}>
						<Box display="flex" justifyContent="space-between">
							<Box display="flex" alignItems="center" gap={1}>
								<StatusIcon status={statuses[index]} />
								<Typography fontSize="14px" fontWeight={600}>
									{item.label}
								</Typography>
							</Box>
							<Button
								variant="text"
								disableRipple
								onClick={() => handleToggleExpand(index)}
								size="small"
								sx={{
									minWidth: 0,
									p: 0,
									color: "grey.500",
									"&:hover": { backgroundColor: "transparent" },
								}}
							>
								<CaretDown
									size={16}
									className={`transition-transform ${
										expandedIndex === index ? "rotate-180" : ""
									}`}
								/>
							</Button>
						</Box>

						{expandedIndex === index && item.details && (
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ ml: 4, mt: 1, display: "block" }}
							>
								{item.details}
							</Typography>
						)}

						{statuses[index] === "error" && (
							<Box ml={4} mt={1}>
								{errors[index] && (
									<Typography
										variant="caption"
										color="error"
										fontWeight={500}
										display="block"
									>
										{errors[index]}
									</Typography>
								)}
							</Box>
						)}
					</Box>
				))}
			</Box>

			{/* Bottom Button Section */}
			{uploadMode === "manual" && !allSuccess && (
				<Box mt={3} display="flex" justifyContent="center">
					<Button
						variant="contained"
						component="label"
						startIcon={<UploadSimple size={20} />}
						disabled={isUploading}
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
							"&:hover": {
								bgcolor: "grey.800",
							},
						}}
					>
						{isUploading ? "Processing..." : "Upload Documents"}
						<input
							type="file"
							hidden
							onChange={handleFileInputChange}
						/>
					</Button>
				</Box>
			)}

			{uploadMode === "auto" && allSuccess && (
				<Box mt={3} display="flex" justifyContent="center">
					<Button
						variant="contained"
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
							"&:hover": {
								bgcolor: "grey.800",
							},
						}}
						onClick={handleBuildForecast}
					>
						Build Forecast
					</Button>
				</Box>
			)}
		</Box>
	);
}