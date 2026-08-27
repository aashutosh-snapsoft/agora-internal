import { Theme } from "@mui/material";

/**
 * Reusable button styles extracted from RevisionModal
 * These can be used with the sx prop or in theme configurations
 */

export const getModalButtonStyles = (theme: Theme) => ({
	// Common modal button styles
	modalButton: {
		width: 77,
		height: 40,
		px: 4,
		py: 1.5,
		fontWeight: 500,
		borderRadius: 3,
		fontSize: "14px",
	},
	
	// Close button styles (outlined variant)
	modalCloseButton: {
		width: 77,
		height: 40,
		px: 4,
		py: 1.5,
		fontWeight: 500,
		borderRadius: 3,
		color: "text.primary",
		borderColor: "divider",
		fontSize: "14px",
	},
	
	// Save button styles (contained variant with grey background)
	modalSaveButton: {
		width: 77,
		height: 40,
		px: 4,
		py: 1.5,
		fontWeight: 500,
		borderRadius: 3,
		bgcolor: "grey.900",
		fontSize: "14px",
		"&:hover": {
			bgcolor: "grey.800",
		},
	},
	
	// Loading state for save button
	modalSaveButtonLoading: {
		width: 77,
		height: 40,
		px: 4,
		py: 1.5,
		fontWeight: 500,
		borderRadius: 3,
		bgcolor: "grey.900",
		fontSize: "14px",
		"&:hover": {
			bgcolor: "grey.800",
		},
		"&.Mui-disabled": {
			bgcolor: "grey.400",
		},
	},
});

/**
 * Button size variants that can be used across the application
 */
export const getButtonSizeStyles = () => ({
	// Small button (30px height)
	small: {
		padding: "0.25rem .5rem",
		height: 30,
		fontSize: "12px",
	},
	
	// Medium button (default)
	medium: {
		padding: "6px 14px",
		fontSize: "14px",
	},
	
	// Large button (48px height)
	large: {
		padding: "8px 16px",
		height: 48,
		fontSize: "16px",
	},
	
	// Modal button (40px height, 77px width)
	modal: {
		width: 77,
		height: 40,
		padding: "6px 16px",
		fontSize: "14px",
		borderRadius: 12,
	},
});

/**
 * Button variant styles for different use cases
 */
export const getButtonVariantStyles = (theme: Theme) => ({
	// Primary action button
	primary: {
		backgroundColor: theme.palette.primary.main,
		color: "white",
		"&:hover": {
			backgroundColor: theme.palette.primary.dark,
		},
	},
	
	// Secondary action button
	secondary: {
		backgroundColor: "transparent",
		border: `1px solid ${theme.palette.divider}`,
		color: theme.palette.text.primary,
		"&:hover": {
			backgroundColor: theme.palette.grey[100],
		},
	},
	
	// Danger/Error button
	danger: {
		backgroundColor: theme.palette.error.main,
		color: "white",
		"&:hover": {
			backgroundColor: theme.palette.error.dark,
		},
	},
	
	// Success button
	success: {
		backgroundColor: theme.palette.success.main,
		color: "white",
		"&:hover": {
			backgroundColor: theme.palette.success.dark,
		},
	},
	
	// Grey button (like modal save button)
	grey: {
		backgroundColor: theme.palette.grey[900],
		color: "white",
		"&:hover": {
			backgroundColor: theme.palette.grey[800],
		},
	},
});

/**
 * USAGE EXAMPLES
 * 
 * 1. Basic Usage:
 * 
 * import { getModalButtonStyles, getButtonSizeStyles, getButtonVariantStyles } from '@/external/essence/theme/components/button-styles';
 * import { useTheme } from '@mui/material';
 * 
 * const theme = useTheme();
 * const modalStyles = getModalButtonStyles(theme);
 * const sizeStyles = getButtonSizeStyles();
 * const variantStyles = getButtonVariantStyles(theme);
 * 
 * // Modal buttons
 * <Button variant="outlined" sx={modalStyles.modalCloseButton}>Close</Button>
 * <Button variant="contained" sx={modalStyles.modalSaveButton}>Save</Button>
 * 
 * // Size variants
 * <Button sx={sizeStyles.small}>Small</Button>
 * <Button sx={sizeStyles.medium}>Medium</Button>
 * <Button sx={sizeStyles.large}>Large</Button>
 * <Button sx={sizeStyles.modal}>Modal Size</Button>
 * 
 * // Variant styles
 * <Button sx={variantStyles.primary}>Primary</Button>
 * <Button sx={variantStyles.secondary}>Secondary</Button>
 * <Button sx={variantStyles.danger}>Delete</Button>
 * <Button sx={variantStyles.success}>Success</Button>
 * <Button sx={variantStyles.grey}>Grey</Button>
 * 
 * 2. Combining Styles:
 * 
 * <Button sx={{...getButtonSizeStyles().modal, ...getButtonVariantStyles(theme).primary}}>
 *   Custom Button
 * </Button>
 * 
 * 3. Conditional Styling:
 * 
 * <Button sx={isLoading ? modalStyles.modalSaveButtonLoading : modalStyles.modalSaveButton}>
 *   {isLoading ? "Saving..." : "Save"}
 * </Button>
 * 
 * 4. Creating Custom Button Components:
 * 
 * const ModalButton = ({ variant = 'close', children, ...props }) => {
 *   const theme = useTheme();
 *   const modalStyles = getModalButtonStyles(theme);
 *   
 *   const buttonStyles = {
 *     close: modalStyles.modalCloseButton,
 *     save: modalStyles.modalSaveButton,
 *   }[variant];
 *   
 *   return (
 *     <Button variant={variant === 'save' ? 'contained' : 'outlined'} sx={buttonStyles} {...props}>
 *       {children}
 *     </Button>
 *   );
 * };
 */ 