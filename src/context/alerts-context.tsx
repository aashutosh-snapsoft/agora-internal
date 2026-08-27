import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

type AlertContextType = {
	showAlert: (message: string, severity?: AlertColor) => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
	const [alert, setAlert] = useState<{
		message: string;
		severity: AlertColor;
		open: boolean;
	}>({
		message: "",
		severity: "info",
		open: false,
	});

	const showAlert = useCallback((message: string, severity: AlertColor = "info") => {
		setAlert({ message, severity, open: true });
	}, []);

	const hideAlert = useCallback(() => {
		setAlert((prev) => ({ ...prev, open: false }));
	}, []);

	const contextValue = useMemo(() => ({
		showAlert
	}), [showAlert]);

	return (
		<AlertContext.Provider value={contextValue}>
			{children}
			<Snackbar
				open={alert.open}
				autoHideDuration={5000}
				onClose={hideAlert}
				anchorOrigin={{ vertical: "top", horizontal: "right" }}
			>
				<Alert severity={alert.severity} onClose={hideAlert} variant="outlined">
					{alert.message}
				</Alert>
			</Snackbar>
		</AlertContext.Provider>
	);
};

/**
 * Allows us to use the AlertContext in any component.
 * @returns
 */
export const useGlobalAlert = () => {
	const context = useContext(AlertContext);
	if (!context) {
		throw new Error("useGlobalAlert must be used within an AlertProvider");
	}
	return context;
};
