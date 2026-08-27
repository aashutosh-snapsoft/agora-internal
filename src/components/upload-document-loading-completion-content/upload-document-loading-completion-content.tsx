import { Box, Typography } from "@mui/material";
import { FC } from "react";
import { ActionsLoadingProgress } from "../actions-loading-progress/actions-loading-progress";
import { CheckCircle } from "@phosphor-icons/react";

interface UploadDocumentLoadingCompletionContentProps {
	isLoading: boolean;
	isLoadingSuccessfull: boolean;
}

const UploadDocumentLoadingCompletionContent: FC<
	UploadDocumentLoadingCompletionContentProps
> = ({ isLoading, isLoadingSuccessfull }) => {
	return (
		<Box
			sx={{
				minHeight: "113px",
				minWidth: "550px",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			{isLoading && (
				<ActionsLoadingProgress loading_text="Documents are being uploaded...." />
			)}
			{!isLoading && isLoadingSuccessfull && (
				<Box display="flex" alignItems="center" gap={1} flexDirection="column">
					<CheckCircle size={32} color="green" />
					<Typography variant="Text4Regular" color="text.primary">
						Upload successful
					</Typography>
				</Box>
			)}
		</Box>
	);
};

export default UploadDocumentLoadingCompletionContent;
