import React, { useState } from "react";
import {
	Dialog,
	DialogContent,
	Box,
	Typography,
	Button,
	IconButton,
	useTheme,
	Stack,
	Tab,
} from "@mui/material";
import { X } from "@phosphor-icons/react";
import ChevronLeft from "@/components/icons/ChevronLeft";
import ChevronRight from "@/components/icons/ChevronRight";
import { getModalButtonStyles } from "@/external/essence/theme/components/button-styles";

interface OnboardingPage {
	id: number;
	title: string;
	description: string;
	image: string;
}

interface OnboardingCarouselModalProps {
	open: boolean;
	onClose: () => void;
	onSkip: () => void;
	onDismissForever?: () => void;
}

const onboardingPages: OnboardingPage[] = [
	{
		id: 1,
		title: "Welcome to Socratics.ai",
		description: "10x faster: \n• Models\n• Valuations\n• KPIs in minutes",
		image: "/images/onboarding_01.png",
	},
	{
		id: 2,
		title: "Upload your financial statements",
		description: "In the chat on left: \n• Upload financial files (XLSX, PDF coming) \n• Check requirements above the upload documents button",
		image: "/images/onboarding_02.png",
	},
	{
		id: 3,
		title: "Verify → Check data is accurate & complete",
		description: "In the Validation Tab:\n• Make sure all checkmarks are green \n• Get AI recommendations to fix any issues in Analysis section at bottom (BETA)",
		image: "/images/onboarding_03.png",
	},
    {
        id: 4,
        title: "Edit → Adjust line items if needed",
        description: "In the Reported Tab:\n• View all extracted line items\n• Click items to adjust classifications\n• Click the Sync button after any changes",
        image: "/images/onboarding_05.png",
    },
    {
        id: 5,
        title: "Review → See your summary rollup",
        description: "In the Financials Tab: Check summary rollup (historical only on the app).",
        image: "/images/onboarding_04.png",
    },
    {
        id: 6,
        title: "Export to Excel",
        description: "Click 'Forecast and Export' button (top right).",
        image: "/images/onboarding_06.png",
    }
];

export const OnboardingCarouselModal: React.FC<OnboardingCarouselModalProps> = ({
	open,
	onClose,
	onSkip,
	onDismissForever,
}) => {
	const theme = useTheme();
	const modalButtonStyles = getModalButtonStyles(theme);
	const [currentPage, setCurrentPage] = useState(0);

	// Reset to first page when modal opens
	React.useEffect(() => {
		if (open) {
			setCurrentPage(0);
		}
	}, [open]);

	const handleNext = () => {
		if (currentPage < onboardingPages.length - 1) {
			setCurrentPage(currentPage + 1);
		}
	};

	const handlePrevious = () => {
		if (currentPage > 0) {
			setCurrentPage(currentPage - 1);
		}
	};

	const handleSkip = () => {
		onSkip();
		onClose();
	};

	const handleDialogClose = () => {
		onClose();
	};

	const handleDismissForever = () => {
		onDismissForever?.();
		onClose();
	};

	const currentPageData = onboardingPages[currentPage];
	const isFirstPage = currentPage === 0;
	const isLastPage = currentPage === onboardingPages.length - 1;

	return (
		<Dialog
			open={open}
			onClose={handleDialogClose}
			maxWidth="md"
			fullWidth
			sx={{
				"& .MuiDialog-paper": {
					borderRadius: theme.spacing(3),
					height: { xs: "auto", sm: "500px" },
					maxHeight: { xs: "90vh", sm: "500px" },
					overflow: "hidden",
					width: { xs: "95%", sm: "90%" },
					maxWidth: { xs: "400px", sm: "1000px" },
				},
			}}
		>
			<DialogContent
				sx={{
					padding: 0,
					position: "relative",
					height: { xs: "auto", sm: "500px" },
					maxHeight: { xs: "90vh", sm: "500px" },
					width: "100%",
					display: "flex",
					flexDirection: "column",
				}}
			>
				{/* Header with close button */}
				<Box
					sx={{
						position: "absolute",
						top: theme.spacing(2),
						right: theme.spacing(2),
						zIndex: 1,
					}}
				>
					<IconButton
						onClick={handleDismissForever}
						sx={{
							backgroundColor: theme.palette.background.paper,
							"&:hover": {
								backgroundColor: theme.palette.grey[100],
							},
						}}
					>
						<X size={20} />
					</IconButton>
				</Box>

				{/* Main content area */}
				<Box
					sx={{
						display: "flex",
						flexDirection: { xs: "column", sm: "row" },
						height: { xs: "auto", sm: "100%" },
						width: "100%",
						overflow: "hidden",
					}}
				>
					{/* Left side - Image */}
					<Box
						sx={{
							flex: { xs: "0 0 auto", sm: "0 0 50%" },
							width: { xs: "100%", sm: "50%" },
							height: { xs: "200px", sm: "100%" },
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							backgroundColor: theme.palette.grey[50],
							padding: theme.spacing(0),
							overflow: "hidden",
						}}
					>
						<Box
							component="img"
							src={currentPageData.image}
							alt={currentPageData.title}
							sx={{
								width: "100%",
								height: "100%",
								objectFit: "cover",
								borderRadius: theme.spacing(0),
							}}
						/>
					</Box>

					{/* Right side - Content */}
					<Box
						sx={{
							flex: { xs: "1 1 auto", sm: "0 0 50%" },
							width: { xs: "100%", sm: "50%" },
							display: "flex",
							flexDirection: "column",
							justifyContent: "space-between",
							padding: { xs: theme.spacing(3), sm: theme.spacing(6) },
							backgroundColor: theme.palette.background.paper,
							minHeight: { xs: "auto", sm: "100%" },
							overflow: "hidden",
						}}
					>
						{/* Content area */}
						<Box>
							{/* Page indicator */}
							<Box
								sx={{
									display: "flex",
									gap: theme.spacing(1),
									mb: theme.spacing(4),
								}}
							>
								{onboardingPages.map((_, index) => (
									<Box
										key={index}
										sx={{
											width: 8,
											height: 8,
											borderRadius: "50%",
											backgroundColor:
												index === currentPage
													? theme.palette.primary.main
													: theme.palette.grey[300],
											transition: "background-color 0.3s ease",
										}}
									/>
								))}
							</Box>

							{/* Step Header (for steps 1-5) */}
							{currentPageData.id >= 2 && currentPageData.id <= 6 && (
								<Typography
									// variant="body2"
									sx={{
										fontSize: "12px",
										fontWeight: 400,
										color: theme.palette.text.primary,
										mb: 2,
										fontFamily: "Satoshi Variable",
									}}
								>
									Step {currentPageData.id - 1}
								</Typography>
							)}

							{/* Title */}
							<Typography
								variant="h4"
								component="h2"
								sx={{
									fontWeight: 700,
									fontSize: { xs: "24px", sm: "28px" },
									lineHeight: { xs: "32px", sm: "36px" },
									color: theme.palette.text.primary,
									mb: theme.spacing(2),
									fontFamily: "Satoshi Variable",
								}}
							>
								{currentPageData.title}
							</Typography>

							{/* Description */}
							<Typography
								variant="body1"
								sx={{
									fontSize: { xs: "14px", sm: "18px" },
									lineHeight: { xs: "20px", sm: "24px" },
									color: theme.palette.text.primary,
									fontFamily: "Satoshi Variable",
									whiteSpace: "pre-line",
								}}
							>
								{currentPageData.description}
							</Typography>
						</Box>

						{/* Navigation buttons - positioned at bottom */}
						<Box sx={{ mt: theme.spacing(4) }}>
							<Stack
								direction="row"
								spacing={1}
								justifyContent="flex-start"
								alignItems="center"
							>
							{/* Skip button */}
							<Button
								onClick={handleSkip}
								variant="outlined"
								sx={modalButtonStyles.modalCloseButton}
							>
								<Typography
									variant="body1"
									fontWeight={500}
									sx={{ fontSize: "14px" }}
								>
									Skip
								</Typography>
							</Button>

							{/* Previous button */}
							<Button
								onClick={handlePrevious}
								disabled={isFirstPage}
								variant="outlined"
								sx={{
									...modalButtonStyles.modalCloseButton,
									opacity: isFirstPage ? 0.5 : 1,
									minWidth: "40px",
									width: "40px",
									height: "40px",
									padding: 0,
								}}
							>
								<ChevronLeft sx={{ fontSize: 20 }} />
							</Button>

							{/* Next/Get Started button */}
							<Button
								onClick={isLastPage ? handleSkip : handleNext}
								variant="contained"
								sx={{
									...modalButtonStyles.modalSaveButton,
									...(isLastPage ? {
										minWidth: "120px",
									} : {
										minWidth: "40px",
										width: "40px",
										height: "40px",
										padding: 0,
									}),
								}}
							>
								{isLastPage ? (
									<Typography
										variant="body1"
										fontWeight={500}
										sx={{ fontSize: "14px" }}
									>
										Get started
									</Typography>
								) : (
									<ChevronRight sx={{ fontSize: 20 }} />
								)}
							</Button>
							</Stack>
						</Box>
					</Box>
				</Box>
			</DialogContent>
		</Dialog>
	);
};
