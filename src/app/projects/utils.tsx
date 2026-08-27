import { DateTime } from "luxon";
import { User } from "@/types/user";
import {
	FileDoc,
	FileImage,
	FileJpg,
	FilePdf,
	FileText,
	FileXls,
} from "@phosphor-icons/react";

// Function to generate a tooltip title with relative time only
export const getTooltipTitle = (date: string, label: "Created" | "Modified"): string => {
	return `${label} ${DateTime.fromISO(date).toRelative()}`;
};

// Function to display author name or return "Unknown"
export const displayAuthor = (author?: User): string => {
	if (!author || !author.first_name || !author.last_name) {
		return "Unknown";
	}
	return `${author.first_name!} ${author.last_name!}`;
};

export const getIconForDocumentType = (
	documentType: string
): React.ReactElement => {
	if (!documentType) return <FileText size={24} />;

	const icons: { [key: string]: React.ReactElement } = {
		pdf: <FilePdf size={24} />,
		jpg: <FileJpg size={24} />,
		jpeg: <FileImage size={24} />,
		png: <FileImage size={24} />,
		doc: <FileDoc size={24} />,
		txt: <FileText size={24} />,
		xlsx: <FileXls size={24} />,
		xls: <FileXls size={24} />,
	};

	return icons[documentType.toLowerCase()] || <FileText size={24} />;
};
