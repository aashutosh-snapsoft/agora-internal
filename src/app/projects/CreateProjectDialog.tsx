import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Typography,
	Box,
	useTheme,
} from "@mui/material";
import { ActionsLoadingProgress } from "@/components/actions-loading-progress/actions-loading-progress";
import { Plus } from "@phosphor-icons/react";
import { getModalButtonStyles } from "@/external/essence/theme/components/button-styles";

interface CreateProjectDialogProps {
	open: boolean;
	onClose: () => void;
	onSave: (projectData: { name: string; description: string }) => void;
	isLoading?: boolean;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
	open,
	onClose,
	onSave,
	isLoading = false,
}) => {
	const theme = useTheme();
	const modalButtonStyles = getModalButtonStyles(theme);
	const [formData, setFormData] = React.useState({
		name: "",
		description: "",
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSave(formData);
	};

	const handleCancel = () => {
		setFormData({ name: "", description: "" });
		onClose();
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<form onSubmit={handleSubmit}>
				<DialogTitle
					display="flex"
					alignItems="center"
					gap={1}
					sx={{
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
						padding: 0,
						marginTop: 3,
						marginLeft: 3,
						marginRight: 3,
						marginBottom: 1,
					}}
				>
					<Plus />
					<Typography
						id="create-project-dialog-title"
						className="flex items-center gap-2 whitespace-nowrap"
						variant="Text4Bold"
						component="span"
					>
						New Project
					</Typography>
				</DialogTitle>
				<DialogContent
					sx={{
						padding: 0,
						marginLeft: 3,
						marginRight: 3,
						marginBottom: 2,
						"& .MuiInputBase-root": {
							borderRadius: 4,
						},
					}}
				>
					{isLoading ? (
						<ActionsLoadingProgress loading_text="Project creation is in progress, Please wait...." />
					) : (
						<>
							<TextField
								autoFocus
								margin="dense"
								label="Project Name"
								id="name"
								fullWidth
								autoComplete="off"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								required
							/>
							{/* <TextField
								margin="dense"
								label="Description"
								id="description"
								fullWidth
								autoComplete="off"
								multiline
								rows={4}
								sx={{
									"& .MuiInputBase-inputMultiline": {
										padding: 0,
									},
								}}
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
							/> */}
						</>
					)}
				</DialogContent>
				<DialogActions
					sx={{
						justifyContent: "flex-start",
						padding: 0,
						marginLeft: 3,
						marginRight: 3,
						marginBottom: 3,
						gap: 1,
					}}
				>
					<Button 
						onClick={handleCancel} 
						variant="outlined"
						sx={modalButtonStyles.modalCloseButton}
					>
						<Typography
							variant="body1"
							fontWeight={500}
							sx={{ fontSize: "14px" }}
						>
							Cancel
						</Typography>
					</Button>
					<Button 
						type="submit" 
						variant="contained" 
						disabled={isLoading}
						sx={isLoading ? modalButtonStyles.modalSaveButtonLoading : modalButtonStyles.modalSaveButton}
					>
						<Typography
							variant="body1"
							fontWeight={500}
							sx={{ fontSize: "14px" }}
						>
							{isLoading ? "Creating..." : "Create"}
						</Typography>
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
};
