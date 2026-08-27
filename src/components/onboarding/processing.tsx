import { Box, Typography } from "@mui/material";
import Image from "next/image";
import { OnboardingUploadState } from "@/types/onboarding/main";
import { ALERT_MESSAGES } from "@/lib/content/alert-messages";
import OnboardingProgress from './onboarding-progress';
import { OnboardingChatState } from "@/types/onboarding/chat";
import { Project } from "@/types/project";
interface OnboardingProcessingProps {
	isExpanded: boolean;
	onboardingUploadState: OnboardingUploadState;
	project?: Project | null;
	pastStates?: OnboardingChatState[];
}

/**
 * The OnboardingProcessing component is a simple component that displays a message
 * to the user while their data is being processed.
 *
 * This is useful with the following onboarding chat states:
 * - `PROCESSING_DATA` - The user has uploaded a document, but its type is not yet determined and time has not yet exceeded 3 minutes.
 * - `PROCESSING_FAILED` - The user has uploaded a document, but its type is not yet determined and time has exceeded 3 minutes.
 * - `PROCESSING_FINANCIALS` - The user has uploaded a document and we've determined that it is a financial statement. Now, it is ingesting line items and periods.
 *
 */
const OnboardingProcessing: React.FC<OnboardingProcessingProps> = ({
	isExpanded,
	onboardingUploadState,
	project = null,
	pastStates = [],
}) => {
	const isProcessingFailed =
		onboardingUploadState === OnboardingUploadState.PROCESSING_FAILED;

	return (
		<Box
			sx={{
				position: "relative",
				width: isExpanded ? "calc(100% - 25%)" : "100%",
				transition: "width 0.3s ease, transform 0.3s ease",
				transform: "translateX(0)",
				padding: "16px",
				overflowY: "auto",
				backgroundColor: "#fff",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "-webkit-fill-available",
				minWidth: "-webkit-fill-available",
			}}
		>
			{/* Show progress indicator during processing */}
			<OnboardingProgress
				uploadState={onboardingUploadState}
				chatState={OnboardingChatState.UPLOAD_FILES}
				project={project}
				pastStates={pastStates}
			/>
			
			<Box textAlign="center">
				<Box
					sx={{
						position: "relative",
					}}
				>
					<Image
						priority
						src="/images/lets-build-a-model.png"
						alt="Grayscale illustration of building a financial model"
						width={200}
						height={100}
						className="mx-auto"
						style={{
							position: "absolute",
							top: 0,
							left: "50%",
							transform: "translateX(-50%)",
							filter: "grayscale(100%)",
						}}
					/>
					<Image
						priority
						src="/images/lets-build-a-model.png"
						alt="Colored illustration of building a financial model"
						width={200}
						height={100}
						className="mx-auto fade-in-and-out"
					/>
				</Box>
				<Box display="flex" flexDirection="column" alignItems="center">
					<Typography
						variant="Text4Regular"
						sx={{ marginTop: "16px", fontFamily: "Satoshi Variable" }}
					>
						Building a Model
					</Typography>
					<Typography variant="Text6Medium" sx={{ marginTop: "16px" }}>
						{onboardingUploadState === OnboardingUploadState.PROCESSING_DATA
							? "Processing your data..."
							: onboardingUploadState ===
							  OnboardingUploadState.PROCESSING_FAILED
							? ALERT_MESSAGES.UPLOAD_NOT_SUCCESSFUL.title
							: onboardingUploadState ===
							  OnboardingUploadState.PROCESSING_FINANCIALS
							? "Processing your financial data..."
							: "Processing your data..."}
					</Typography>
					{isProcessingFailed && (
						<Typography
							variant="Text6Medium"
							sx={{ marginTop: "8px", maxWidth: 520 }}
						>
							{ALERT_MESSAGES.UPLOAD_NOT_SUCCESSFUL.message}
						</Typography>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default OnboardingProcessing;
