import { Paper, Typography } from "@mui/material";
import { FC } from "react";
import { useTheme } from "@mui/material/styles";
import { CloudArrowUp } from "@phosphor-icons/react";
import { CustomTheme } from "@/external/essence/theme/createTheme";

interface UploadDocumentsDragDropAreaProps {
	getRootProps: () => any;
	getInputProps: () => any;
}
const UploadDocumentsDragDropArea: FC<UploadDocumentsDragDropAreaProps> = ({
	getRootProps,
	getInputProps,
}) => {
	const theme = useTheme<CustomTheme>();

	//----------------------------------------------------------------
	//----------------------------------------------------------------

	return (
		<Paper
			{...getRootProps()}
			sx={{
				mt: 2,
				p: 3,
				textAlign: "center",
				border: `2px solid ${theme.palette.grey[900]}`,
				outline: `2px dashed ${theme.palette.grey[900]}`,
				outlineOffset: "4px",
				borderRadius: theme.spacing(2),
				cursor: "pointer",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				position: "relative",
				"&:hover": { borderColor: "primary.main" },
			}}
		>
			<input {...getInputProps()} />
			<CloudArrowUp color={theme.palette.grey[500]} size={40} />
			<Typography variant="Text5Regular" color="text.secondary">
				Drop your files here or
			</Typography>
			<Typography variant="Text3Bold" color="text.primary">
				Select click to browse{" "}
			</Typography>
		</Paper>
	);
};

export default UploadDocumentsDragDropArea;
