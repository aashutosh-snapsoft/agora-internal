import { Box, Typography } from "@mui/material";
import { FC } from "react";
import { styled } from "@mui/material/styles";
import { ProjectDebugContentProps } from "./project-debug-content.types";

const ProjectDebugContent: FC<ProjectDebugContentProps> = ({
	className,
	project,
}) => {
	return (
		<Box className={className}>
			<Typography variant="h2">ProjectDebugContent Component</Typography>
			<pre>{JSON.stringify(project, null, 2)}</pre>
		</Box>
	);
};

const StyledProjectDebugContent = styled(ProjectDebugContent)(({ theme }) => ({
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

export default StyledProjectDebugContent;
export { ProjectDebugContent };
