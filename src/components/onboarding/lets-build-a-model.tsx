import { Box, Typography } from "@mui/material";
import Image from "next/image";
import {
	OnboardingChatState,
	OnboardingUploadState,
} from "@/types/onboarding/main";
import { Document } from "@/types/documents";
import React from "react";
import OnboardingProgress from './onboarding-progress';
import { Project } from '@/types/project';
import { ALERT_MESSAGES } from "@/lib/content/alert-messages";

interface OnboardingLetsBuildAModelProps {
	isExpanded: boolean;
	onboardingUploadState: OnboardingUploadState;
	project: Project | null;
	pastStates: OnboardingChatState[];
	documents: Document[];
}

/**
 * The OnboardingLetsBuildAModel component is a simple component that displays a message
 * to the user when they are onboarding.
 *
 * This is used for the case where the user has zero documents in a project.
 *
 *
 */
const OnboardingLetsBuildAModel: React.FC<OnboardingLetsBuildAModelProps> = ({
	isExpanded,
	onboardingUploadState,
	project,
	pastStates,
	documents,
}) => {
	documents = documents ?? [];
	const showUploadFailedMessage =
		onboardingUploadState === OnboardingUploadState.NO_VALID_DOCUMENTS ||
		documents.some((doc) => doc?.state === "failed") ||
		documents.length === 0;

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
			{/* Show progress indicator when not in initial state */}
			{onboardingUploadState !== OnboardingUploadState.INITIAL && (
				<OnboardingProgress
					uploadState={onboardingUploadState}
					chatState={OnboardingChatState.UPLOAD_FILES}
					project={project}
					pastStates={pastStates}
				/>
			)}
			{showUploadFailedMessage && (
				<Box sx={{ mt: 2, maxWidth: 520 }}>
					<Typography variant="Text6Medium" align="center">
						{ALERT_MESSAGES.UPLOAD_NOT_SUCCESSFUL.title}
					</Typography>
					<Typography variant="Text6Medium" align="center" sx={{ mt: 1 }}>
						{ALERT_MESSAGES.UPLOAD_NOT_SUCCESSFUL.message}
					</Typography>
				</Box>
			)}
			</Box>
		</Box>
	);
};

export default OnboardingLetsBuildAModel;
