"use client";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/store";
import * as amplitude from "@amplitude/analytics-browser";
import { sessionReplayPlugin } from "@amplitude/plugin-session-replay-browser";
import { config } from "@/config";
import { fetchAuthenticatedUser } from "@/store/users/user-thunks";
import { userSelector } from "@/store/users/user-selectors";
import { LoadingScreen } from "@/components/loading-screen";
import { installAuthFetchInterceptor, startVersionCheck } from "@/lib/self-healing";
import { AppHealthState, getAppHealthController } from "@/lib/health-controller";
import AppHealthOverlay from "@/components/app-health/AppHealthOverlay";

/**
 * Hook for initializing Amplitude session replay
 *
 * @param apiKey - The Amplitude API key
 */
const useSessionReplay = (apiKey: string) => {
	useEffect(() => {
		// Create and Install Session Replay Plugin
		const sessionReplayTracking = sessionReplayPlugin({
			sampleRate: 1,
		});
		amplitude.add(sessionReplayTracking);

		amplitude.init(apiKey, {
			autocapture: { elementInteractions: true },
		});

		// Flush queued events before the page unloads. Cross-app navigations to
		// Compose (/workflow) are full-document loads via plain <a> /
		// location.assign (see ComposeProjectsList, SENG-791); the default fetch
		// transport can drop in-flight events on unload. On hidden, switch to the
		// beacon transport (survives unload) and flush; restore fetch when visible
		// again so normal in-session events keep retries / no payload cap.
		const handleVisibilityChange = () => {
			if (document.visibilityState === "hidden") {
				amplitude.setTransport("beacon");
				amplitude.flush();
			} else {
				amplitude.setTransport("fetch");
			}
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener(
				"visibilitychange",
				handleVisibilityChange,
			);
		};
	}, [apiKey]);
};

/**
 * AppInitializer component is responsible for initializing the application.
 * Authentication is handled via Auth0 session (no token fetching needed).
 *
 * @component
 *
 * @returns {ReactNode} Renders children components.
 *
 * @example
 * // Usage example
 * <AppInitializer />
 *
 * @remarks
 * This component relies on server-enforced session auth; no client-side auth hook is used.
 */

const AppInitializer: React.FC<PropsWithChildren> = ({ children }) => {
	const dispatch = useAppDispatch();
	const { authenticatedUser, authResolved } = useAppSelector(userSelector);
	const pathname = usePathname();
	const [healthState, setHealthState] = useState<AppHealthState>("recovering");
	const publicRoutes = ["/welcome", "/verify-email", "/login-error"];
	const isPublicRoute =
		!!pathname && publicRoutes.some((route) => pathname.startsWith(route));

	const amplitudeApiKey = config.amplitudeApiKey;

	// Initialize session replay
	useSessionReplay(amplitudeApiKey);

	useEffect(() => {
		if (isPublicRoute) return;
		dispatch(fetchAuthenticatedUser({ forceRefresh: true }));
	}, [dispatch, isPublicRoute]);

	useEffect(() => {
		installAuthFetchInterceptor();
		// Shorter interval in dev so you can test version-check without waiting 5 minutes
		const versionCheckInterval =
			process.env.NODE_ENV === "development" ? 15 * 1000 : 5 * 60 * 1000;
		const cleanup = startVersionCheck(config.buildId, versionCheckInterval);
		return cleanup;
	}, []);

	const healthController = useMemo(() => getAppHealthController(), []);

	useEffect(() => {
		healthController.setRouteContext({ pathname, isPublicRoute });
		const unsubscribe = healthController.subscribe(setHealthState);
		healthController.start();
		return () => {
			unsubscribe();
		};
	}, [healthController, pathname, isPublicRoute]);

	useEffect(() => {
		if (healthState !== "healthy") return;
		if (isPublicRoute) return;
		if (!authenticatedUser || !authResolved) {
			dispatch(fetchAuthenticatedUser({ forceRefresh: true }));
		}
	}, [authenticatedUser, authResolved, dispatch, healthState, isPublicRoute]);

	if (healthState === "degraded" || healthState === "hard_recovering" || healthState === "offline") {
		return <AppHealthOverlay state={healthState} />;
	}
	if (!authResolved) {
		return <LoadingScreen />;
	}

	if (!authenticatedUser && !isPublicRoute) {
		return <LoadingScreen />;
	}

	return children;
};

export default AppInitializer;
