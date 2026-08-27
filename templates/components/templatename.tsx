import { Box, Typography } from "@mui/material";
import { FC } from "react";

import { styled } from "@mui/material/styles";
import { TemplateNameProps } from "./templatename.types";

const TemplateName: FC<TemplateNameProps> = ({ className }) => {
	return (
		<Box className={className}>
			<Typography variant="h2">TemplateName Component</Typography>
		</Box>
	);
};

const StyledTemplateName = styled(TemplateName)(({ theme }) => ({
	backgroundColor: theme.palette.background.paper,
	borderRadius: theme.shape.borderRadius,
	boxShadow: theme.shadows[1],
	padding: theme.spacing(2),
	"&:hover": {
		boxShadow: theme.shadows[3],
		transition: theme.transitions.create("box-shadow", {
			duration: theme.transitions.duration.short,
		}),
	},
}));

export default StyledTemplateName;
export { TemplateName };
