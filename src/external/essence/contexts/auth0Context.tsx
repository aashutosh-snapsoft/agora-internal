"use client";

/**
 * @deprecated This file is kept for backward compatibility but is no longer actively used.
 * The application now uses @auth0/nextjs-auth0 instead of @auth0/auth0-react.
 * This file can be removed once all dependencies are confirmed.
 */

import {
	createContext,
	useEffect,
	useReducer,
	FC,
	PropsWithChildren,
	useCallback,
} from "react";
// CUSTOM COMPONENTS
import { LoadingProgress } from "@/external/essence/components/loader";
import { getBestAvatarUrl } from "@/lib/utils/avatar";

// Local type definitions (replacing @auth0/auth0-react types)
interface User {
	sub?: string;
	name?: string;
	email?: string;
	picture?: string;
	[key: string]: any;
}

interface PopupLoginOptions {
	[key: string]: any;
}

interface LogoutOptions {
	returnTo?: string;
	[key: string]: any;
}

interface INITIAL_AUTH_STATE {
	user: User | null;
	isInitialized: boolean;
	isAuthenticated: boolean;
}

const initialAuthState: INITIAL_AUTH_STATE = {
	user: null,
	isInitialized: false,
	isAuthenticated: false,
};

const reducer = (state: INITIAL_AUTH_STATE, action: any) => {
	switch (action.type) {
		case "INIT": {
			const { isAuthenticated, user } = action.payload;
			return { ...state, isAuthenticated, isInitialized: true, user };
		}

		case "LOGIN": {
			const { user } = action.payload;
			return { ...state, isAuthenticated: true, user };
		}

		case "LOGOUT": {
			return { ...state, isAuthenticated: false, user: null };
		}

		default: {
			return state;
		}
	}
};

interface ContextProps extends INITIAL_AUTH_STATE {
	method: string;
	logout: (options?: LogoutOptions) => void;
	loginWithPopup: (options?: PopupLoginOptions) => Promise<void>;
}

export const AuthContext = createContext({} as ContextProps);

/**
 * @deprecated AuthProvider is no longer used. The application uses UserProvider from @auth0/nextjs-auth0/client.
 * This is kept as a stub for backward compatibility.
 */
export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
	const [state, dispatch] = useReducer(reducer, initialAuthState);

	// Stub implementation - this provider is no longer functional
	// All auth is now handled by @auth0/nextjs-auth0
	const loginWithPopup = useCallback(async (_options?: PopupLoginOptions) => {
		console.warn("AuthProvider.loginWithPopup is deprecated. Use /api/auth/login instead.");
	}, []);

	const logout = useCallback((_options?: LogoutOptions) => {
		console.warn("AuthProvider.logout is deprecated. Use /api/auth/logout instead.");
		dispatch({ type: "LOGOUT" });
	}, []);

	// Initialize as not authenticated since this provider is not used
	useEffect(() => {
		dispatch({
			type: "INIT",
			payload: { isAuthenticated: false, user: null },
		});
	}, []);

	if (!state.isInitialized) return <LoadingProgress />;

	return (
		<AuthContext.Provider
			value={{ ...state, method: "AUTH0", loginWithPopup, logout }}
		>
			{children}
		</AuthContext.Provider>
	);
};
