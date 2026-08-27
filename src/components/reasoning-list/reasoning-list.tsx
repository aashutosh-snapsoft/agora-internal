import {
	Box,
	Table,
	TableHead,
	TableRow,
	TableCell,
	Paper,
	TableContainer,
	Typography,
	TableBody,
	Stack,
	Button,
	Skeleton,
	Fade,
	Portal,
	Chip,
} from "@mui/material";
import { FC, useState, useRef, useCallback, useMemo, Fragment } from "react";

import { styled } from "@mui/material/styles";
import { ReasoningListProps } from "./reasoning-list.types";
import { Claim } from "@/types/claim";
import { ThumbsDown, ThumbsUp } from "@phosphor-icons/react";
import Link from "next/link";
import * as amplitude from "@amplitude/analytics-browser";
import { callGtag } from "@/lib/gtag";

const SECTION_CONFIG: Array<{ label: string; matchers: string[] }> = [
	{ label: "Net Revenue", matchers: ["net_revenue", "revenue"] },
	{ label: "Gross Profit", matchers: ["gross_profit"] },
	{ label: "Net Incomes", matchers: ["net_income"] },
	{ label: "Total Assets", matchers: ["asset"] },
	{ label: "Total Liabilities", matchers: ["liabilit"] },
	{
		label: "Total stockholder's equity",
		matchers: ["stockholder", "equity"],
	},
];

const ReasoningRow = ({
	claim,
	projectId,
}: {
	claim: Claim;
	projectId: string;
}) => {
	const [isFeedbackSet, setIsFeedbackSet] = useState(false);
	const [feedbackType, setFeedbackType] = useState<"up" | "down" | null>(null);
	const [showThankYou, setShowThankYou] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [thankYouPosition, setThankYouPosition] = useState({ top: 0, left: 0 });

    const clickFeedback = useCallback((type: "up" | "down") => {
		if (isFeedbackSet) return;
		setIsFeedbackSet(true);
		setFeedbackType(type);

		// Calculate position for thank you message
		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			setThankYouPosition({
				top: rect.bottom + 8, // Position below the button with a small gap
				left: rect.left + rect.width / 2, // Center horizontally with the button
			});
		}

		setShowThankYou(true);

		// Hide thank you message after 5 seconds
		setTimeout(() => {
			setShowThankYou(false);
		}, 1200);

		// Guard the GA call as users click feedback while the tracker loads.
		callGtag("event", "feedback", {
			category: "claims_reasoning",
			label: claim.id,
			value: type === "up" ? 1 : -1,
		});
        amplitude.track("feedback", {
			category: "claims_reasoning",
			label: claim.id,
			value: type === "up" ? 1 : -1,
		});
    }, [isFeedbackSet, claim.id]);

	const handleUpClick = useCallback(() => {
		clickFeedback("up");
	}, [clickFeedback]);

	const handleDownClick = useCallback(() => {
		clickFeedback("down");
	}, [clickFeedback]);

	return (
		<TableRow>
      <TableCell>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 1.25 }}>
          {claim.str_value || ""}
        </Typography>
      </TableCell>
			<TableCell align="center">
				{claim.line_item_id !== "" && claim.line_item_id !== null && (
					<Link
						href={`/projects/${projectId}/reported?focus_line_item_id=${claim.line_item_id}`}
					>
						<Button size="small" variant="outlined">
							View Line Item
						</Button>
					</Link>
				)}
			</TableCell>
			<TableCell align="center">
				<Stack
					ml={"auto"}
					width="100%"
					direction="row"
					justifyContent="flex-end"
					spacing={1}
				>
					{!isFeedbackSet ? (
						<>
							<Button
								size="small"
								variant="outlined"
								sx={{ width: "70px" }}
								onClick={handleUpClick}
								ref={buttonRef}
							>
								<ThumbsUp size={16} />
							</Button>
							<Button
								size="small"
								variant="outlined"
								sx={{ width: "70px" }}
								onClick={handleDownClick}
								ref={feedbackType === null ? buttonRef : undefined}
							>
								<ThumbsDown size={16} />
							</Button>
						</>
					) : (
						<>
							<Stack
								direction="column"
								alignItems="center"
								spacing={1}
								sx={{ position: "relative" }}
							>
								{feedbackType === "up" && (
									<Button
										size="small"
										variant="outlined"
										disabled
										sx={{
											width: "70px",
										}}
										ref={buttonRef}
									>
										<ThumbsUp size={16} />
									</Button>
								)}
								{feedbackType === "down" && (
									<Button
										size="small"
										variant="outlined"
										disabled
										sx={{
											width: "70px",
										}}
										ref={buttonRef}
									>
										<ThumbsDown size={16} />
									</Button>
								)}
							</Stack>
							{showThankYou && (
								<Portal>
									<Fade in={showThankYou} timeout={500}>
										<Typography
											variant="Text6Medium"
											color="success.main"
											sx={{
												position: "fixed",
												top: `${thankYouPosition.top}px`,
												left: `${thankYouPosition.left}px`,
												transform: "translateX(-50%)",
												fontWeight: "medium",
												backgroundColor: "rgba(76, 175, 80, 0.1)",
												padding: "4px 8px",
												borderRadius: "4px",
												boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
											}}
										>
											Thank you for your feedback!
										</Typography>
									</Fade>
								</Portal>
							)}
						</>
					)}
				</Stack>
			</TableCell>
		</TableRow>
	);
};
const ReasoningList: FC<ReasoningListProps> = ({
	className,
	claims,
	projectId,
	isLoading = false,
}) => {
	const sections = useMemo(() => {
		const buckets = SECTION_CONFIG.map(({ label }) => ({
			label,
			claims: [] as Claim[],
			hasNoIssues: false,
		}));

		(claims ?? []).forEach((claim) => {
			const text = claim.str_value?.trim();
			if (!text) {
				return;
			}

			const lowerKey = claim.key.toLowerCase();
			let sectionIndex = SECTION_CONFIG.findIndex(({ matchers }) =>
				matchers.some((matcher) => lowerKey.includes(matcher))
			);

			if (sectionIndex < 0) {
				const lowerText = text.toLowerCase();
				sectionIndex = SECTION_CONFIG.findIndex(({ matchers }) =>
					matchers.some((matcher) => lowerText.includes(matcher))
				);
			}

			if (sectionIndex < 0) {
				return;
			}

			const target = buckets[sectionIndex];

			const normalized = text.toLowerCase();
			const mentionsNoIssues =
				normalized.includes("no discrep") ||
				normalized.includes("no inconsisten") ||
				normalized.includes("no issue") ||
				normalized.includes("none detected");

			if (mentionsNoIssues) {
				target.hasNoIssues = true;
				return;
			}

			target.claims.push(claim);
		});

		return buckets;
	}, [claims]);

	return (
		<Box
			className={`reasoning-list ${className}`}
			sx={{ paddingBottom: 3, padding: 0 }}
		>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
				{/* Changed the word 'Error Validation' to 'Error Analysis' as per the requirement */}
                <Typography component="h1" variant="Text1Bold">
                    Error Analysis
                </Typography>
                <Chip
                    label="BETA"
                    size="small"
                    variant="outlined"
                    sx={(theme) => ({
                        height: 20,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        color: theme.palette.grey[900],
                        borderColor: theme.palette.grey[900],
                        backgroundColor: theme.palette.constants.white,
                    })}
                />
			</Box>
			{isLoading ? (
				<Skeleton sx={{ margin: 2 }} variant="rounded" height={300} />
			) : (
				<TableContainer component={Paper}>
					<Table
						sx={{
							minWidth: 650,
							"& .MuiTableCell-root": {
								padding: 0.5,
							},
						}}
						aria-label="error analysis table"
					>
						<TableHead>
							<TableRow>
								<TableCell width="70%">
									<Typography variant="Text6Medium">Explanation</Typography>
								</TableCell>
								<TableCell width="20%" align="center">
									<Typography variant="Text6Medium">Reference</Typography>
								</TableCell>
								<TableCell width="10%" align="center">
									<Typography variant="Text6Medium">Feedback</Typography>
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{sections.map((section) => (
								<Fragment key={section.label}>
									<TableRow>
										<TableCell
											colSpan={3}
											sx={(theme) => ({
												backgroundColor: theme.palette.grey[100],
												px: 1.5,
												py: 1,
											})}
										>
											<Typography variant="Text6Medium">{section.label}</Typography>
										</TableCell>
									</TableRow>
									{section.claims.length > 0 ? (
										section.claims.map((claim) => (
											<ReasoningRow
												key={claim.id}
												claim={claim}
												projectId={projectId}
											/>
										))
									) : (
										<TableRow>
											<TableCell colSpan={3}>
												<Typography
													variant="body2"
													color="text.secondary"
													sx={{ py: 1 }}
												>
													No issues
												</Typography>
											</TableCell>
										</TableRow>
									)}
								</Fragment>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Box>
	);
};

const StyledReasoningList = styled(ReasoningList)(({ theme }) => ({
	backgroundColor: theme.palette.background.paper,
	borderRadius: theme.shape.borderRadius,
}));

export default StyledReasoningList;
export { ReasoningList };
