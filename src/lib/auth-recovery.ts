import { recordBootstrapAuthFailure } from "@/lib/auth-failure-tracker";

type RecoveryOptions = {
	recordFailure?: boolean;
};

export const requestAuthRecovery = (_reason?: string, options?: RecoveryOptions): void => {
	if (options?.recordFailure) {
		recordBootstrapAuthFailure();
	}
	// No longer redirect to /reset on auth failure; health controller handles retry.
};
