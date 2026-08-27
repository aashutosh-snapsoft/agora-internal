import React, { useState, useEffect, useCallback } from "react";
import { CaretDown, Table } from "@phosphor-icons/react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import { SuccessIcon, ErrorIcon } from "./CustomStatusIcons";

type Status = "default" | "loading" | "success" | "error";

interface AssumptionItem {
	label: string;
	details?: string;
}

interface AssumptionChecklistProps {
	assumptions: AssumptionItem[];
	validateAssumption: (label: string) => Promise<void>;
	onAllAssumptionsComplete?: () => void;
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

export default function AssumptionChecklist({
	assumptions,
	validateAssumption,
	onAllAssumptionsComplete,
}: AssumptionChecklistProps) {
	const [statuses, setStatuses] = useState<Status[]>(
		Array(assumptions.length).fill("default")
	);
	const [errors, setErrors] = useState<(string | null)[]>(
		Array(assumptions.length).fill(null)
	);
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const allSuccess = statuses.every((status) => status === "success");

	useEffect(() => {
		if (allSuccess && onAllAssumptionsComplete) {
			onAllAssumptionsComplete();
		}
	}, [allSuccess, onAllAssumptionsComplete]);

	const validateAssumptions = useCallback(async () => {
		const newStatuses = [...statuses];
		const newErrors = [...errors];
		setIsProcessing(true);

		for (let i = 0; i < assumptions.length; i++) {
			newStatuses[i] = "loading";
			setStatuses([...newStatuses]);

			try {
				await validateAssumption(assumptions[i].label);
				newStatuses[i] = "success";
				newErrors[i] = null;
			} catch (err: any) {
				newStatuses[i] = "error";
				newErrors[i] = err?.message || "Validation failed";
				setStatuses([...newStatuses]);
				setErrors([...newErrors]);
				setIsProcessing(false);
				return;
			}
		}

		setStatuses([...newStatuses]);
		setErrors([...newErrors]);
		setIsProcessing(false);
	}, [assumptions, validateAssumption, errors, statuses]);

	useEffect(() => {
		validateAssumptions();
	}, [validateAssumptions]); // Run validation on mount

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
					Assumptions Needed
				</Typography>
			</Box>

			<Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
				{assumptions.map((item, index) => (
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
								onClick={() =>
									setExpandedIndex(index === expandedIndex ? null : index)
								}
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

			{allSuccess && (
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
						onClick={() => {
							if (onAllAssumptionsComplete) onAllAssumptionsComplete();
						}}
					>
						Build Forecast
					</Button>
				</Box>
			)}
		</Box>
	);
}
