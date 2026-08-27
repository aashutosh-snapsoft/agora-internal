"use client";

import useLocation from "@/external/essence/hooks/useLocation";
import {
	useState,
	createContext,
	PropsWithChildren,
	useMemo,
	useCallback,
} from "react";

// ==============================================================
interface ContextProps {
	sidebarCompact: boolean;
	showMobile: boolean;
	showMobileSidebar: boolean;
	isWorkspacePath: boolean;
	handleSidebarCompactToggle: () => void;
	handleCloseMobile: () => void;
	handleOpenMobile: () => void;
	handleOpenMobileSidebar: () => void;
	handleCloseMobileSidebar: () => void;
}
// ==============================================================

export const LayoutContext = createContext({} as ContextProps);

const LayoutProvider = ({ children }: PropsWithChildren) => {
	// Initialize sidebar state from localStorage or default
	const [sidebarCompact, setSidebarCompact] = useState(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('sidebarCompact');
			return saved ? JSON.parse(saved) : false;
		}
		return false;
	});
	const [showMobile, setshowMobile] = useState(false);
	const [showMobileSidebar, setShowMobileSidebar] = useState(false);
	const { pathname } = useLocation();

	// CHECK IF THE PATH IS WORKSPACE
	const isWorkspacePath =
		pathname !== null &&
		pathname.startsWith("/projects/") &&
		pathname !== "/projects";

	// HANDLE SIDE BAR TOGGLE FOR LARGE DEVICE
	const handleSidebarCompactToggle = useCallback(
		() => {
			const newState = !sidebarCompact;
			setSidebarCompact(newState);
			// Save to localStorage
			if (typeof window !== 'undefined') {
				localStorage.setItem('sidebarCompact', JSON.stringify(newState));
			}
		},
		[sidebarCompact]
	);

	// HANDLE SIDE BAR OPEN FOR SMALL DEVICE
	const handleOpenMobile = useCallback(() => setshowMobile(true), []);
	const handleCloseMobile = useCallback(() => setshowMobile(false), []);

	const handleOpenMobileSidebar = useCallback(
		() => setShowMobileSidebar(true),
		[]
	);
	const handleCloseMobileSidebar = useCallback(
		() => setShowMobileSidebar(false),
		[]
	);

	// Sidebar stays open by default unless user explicitly closes it
	// Removed auto-collapse logic - sidebar state is only controlled by user toggle

	const contextValue = useMemo(
		() => ({
			sidebarCompact,
			showMobile,
			showMobileSidebar,
			isWorkspacePath,
			handleSidebarCompactToggle,
			handleCloseMobile,
			handleOpenMobile,
			handleOpenMobileSidebar,
			handleCloseMobileSidebar,
		}),
		[
			sidebarCompact,
			showMobile,
			showMobileSidebar,
			isWorkspacePath,
			handleSidebarCompactToggle,
			handleCloseMobile,
			handleOpenMobile,
			handleOpenMobileSidebar,
			handleCloseMobileSidebar,
		]
	);

	return (
		<LayoutContext.Provider value={contextValue}>
			{children}
		</LayoutContext.Provider>
	);
};

export default LayoutProvider;
