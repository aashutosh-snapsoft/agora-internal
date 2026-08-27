"use client";

import { FC, PropsWithChildren, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { fetchAuthenticatedUser } from "@/store/users/user-thunks";
import { userSelector } from "@/store/users/user-selectors";
import { config } from "@/config";
import * as amplitude from "@amplitude/analytics-browser";
import { callGtag } from "@/lib/gtag";
import { User } from "@/types/user";
import { LoadingScreen } from "@/components/loading-screen";
import { getAppHealthController } from "@/lib/health-controller";

export type SocraticsAuthGuardProps = PropsWithChildren & {
	autoRedirectOnTokenExpire?: boolean;
};

const SocraticsAuthGuard: FC<SocraticsAuthGuardProps> = ({ children }) => {
	const dispatch = useAppDispatch();
	const { authenticatedUser } = useAppSelector(userSelector);
	const healthController = getAppHealthController();

	useEffect(() => {
		if (authenticatedUser) return;

		dispatch(fetchAuthenticatedUser({ forceRefresh: true }))
			.then((action) => {
				if (action.type.endsWith("/fulfilled") && action.payload) {
					const fetchedUser = action.payload as User;

					try {
						amplitude.setUserId(fetchedUser.id);
						amplitude.setGroup("tenant_id", fetchedUser.tenant_id);
						amplitude.setGroup(
							"tenant_name",
							fetchedUser.tenant?.display_label || ""
						);

						callGtag("set", "user_id", fetchedUser.id);
						callGtag("config", config.gaMeasurementId, {
							user_id: fetchedUser.id,
						});
						callGtag("set", "user_properties", {
							tenant_id: fetchedUser.tenant_id,
							tenant_name: fetchedUser.tenant?.display_label || "",
						});
					} catch (analyticsError) {
						console.warn("Analytics setup failed:", analyticsError);
					}
				}
			})
			.catch((error: any) => {
				console.warn("Backend user fetch failed:", error?.message || error);
				healthController.reportAuthFailure("auth-guard", { recordFailure: true });
			});
	}, [authenticatedUser, dispatch, healthController]);

	if (!authenticatedUser) {
		return <LoadingScreen />;
	}

	return <>{children}</>;
};

export default SocraticsAuthGuard;
