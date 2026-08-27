import React, { FC } from "react";
import { useAppSelector } from "@/store/store";
import { userSelector } from "@/store/users/user-selectors";
import { useAvatarManager } from "@/hooks/useAvatarManager";
import { BodyTableCell } from "@/app/projects/styles";
import {
	Avatar,
	Box,
	IconButton,
	TableBody,
	TableRow,
	Tooltip,
	Typography,
} from "@mui/material";
import { DotsThree } from "@phosphor-icons/react";
import CustomTooltip from "../tooltip/tooltip";
import {
	displayAuthor,
	getTooltipTitle,
	getIconForDocumentType,
} from "@/app/projects/utils";
import { DateTime } from "luxon";
import { Document } from "@/types/documents";
import {
  ALERT_MESSAGES,
  getDocumentExcelFormatMessage,
} from "@/lib/content/alert-messages";

interface DocumentsListBodyProps {
	setAnchorEl: (value: null | HTMLElement) => void;
	setSelectedDocuemnt: (value: Document) => void;
	documents: Document[];
}

const DocumentsListBody: FC<DocumentsListBodyProps> = ({
	setAnchorEl,
	setSelectedDocuemnt,
	documents,
}) => {
	const { authenticatedUser } = useAppSelector(userSelector);
	
	// Use centralized avatar management
	const { getAvatarUrl } = useAvatarManager();

	/**
	 * Handles the click event for the menu associated with a project.
	 *
	 * @param event - The mouse event triggered by clicking the menu.
	 * @param projectId - The unique identifier of the project.
	 * @param e - The mouse event to stop propagation.
	 */
	const handleMenuClick = (
		event: React.MouseEvent<HTMLElement>,
		doc: Document,
		e: React.MouseEvent
	) => {
		e.stopPropagation();
		setAnchorEl(event.currentTarget);
		setSelectedDocuemnt(doc);
	};

	const altText = displayAuthor(authenticatedUser ?? undefined);

	// Get the current avatar for display
	const avatarImage = getAvatarUrl();

	const tooltip = (document: Document) => {
		if (document.state === "uploaded") {
			if (document.mimetype === "application/pdf") {
				return "This file was detected as a PDF file and has been securely stored.";
			}
			if (document.mimetype === "application/excel") {
				return "This file was detected as an Excel file and is currently being processed.";
			}
			return "This file has been uploaded and is currently being processed.";
		}
		if (document.state === "ingested") {
			if (document.type === "financial_statement") {
				return "This file was detected as a financial statement and its financial data has been successfully extracted.";
			}
			return "This file was successfully processed.";
		}
		if (document.state === "invalid") {
			if (document.type === "excel") {
				return getDocumentExcelFormatMessage(document.details ?? "");
			}
			return ALERT_MESSAGES.DOCUMENT_NOT_PROCESSED.message;
		}
		if (document.state === "failed") {
			return ALERT_MESSAGES.DOCUMENT_FAILED_TO_PROCESS.message;
		}
		return "Processing...";
	};

	return (
		<TableBody>
			{documents.map((doc) => (
				<TableRow key={doc.id} hover sx={{ cursor: "pointer" }}>
					<BodyTableCell sx={{ width: "60%", paddingLeft: 2 }}>
						<Box display="flex" gap={1} alignItems="center">
							{getIconForDocumentType(doc?.fileType as string)}
							<Tooltip title={tooltip(doc)}>
								<Typography variant="Text6Medium" sx={{ width: "100%" }}>
									{doc.filename}
								</Typography>
							</Tooltip>
						</Box>
					</BodyTableCell>
					<BodyTableCell sx={{ width: "auto", whiteSpace: "nowrap" }}>
						<Box display="flex" alignItems="center" gap={1}>
							<Avatar
								sx={{ width: 24, height: 24 }}
								alt={altText}
								src={avatarImage}
							/>
							{altText}
						</Box>
					</BodyTableCell>
					<BodyTableCell sx={{ width: "auto", whiteSpace: "nowrap" }}>
						<CustomTooltip
							title={getTooltipTitle(doc?.created_at as string, "Created")}
							placement="top"
						>
							<Typography variant="Text6Medium">
								{DateTime.fromISO(doc?.updated_at as string).toRelative()}
							</Typography>
						</CustomTooltip>
					</BodyTableCell>
					<BodyTableCell sx={{ width: "48px", textAlign: "center" }}>
						<IconButton
							onClick={(e) => handleMenuClick(e, doc, e)}
							size="small"
						>
							<DotsThree size={24} />
						</IconButton>
					</BodyTableCell>
				</TableRow>
			))}
		</TableBody>
	);
};

export default DocumentsListBody;
