const FAILURE_WINDOW_MS = 2 * 60 * 1000;

// IMPORTANT: Persistence is forbidden. Auth failure escalation must be memory-only.
// This ensures incognito behavior matches normal and no recovery state survives reload.
let consecutiveBootstrapFailures = 0;
let recentFailureTimestamps: number[] = [];
let recentResetTimestamps: number[] = [];

const nowMs = () => Date.now();

const filterRecent = (values: number[], windowMs = FAILURE_WINDOW_MS): number[] => {
	const cutoff = nowMs() - windowMs;
	return values.filter((value) => value >= cutoff);
};

export const recordBootstrapAuthFailure = (): void => {
	consecutiveBootstrapFailures += 1;
	recentFailureTimestamps = filterRecent(recentFailureTimestamps);
	recentFailureTimestamps.push(nowMs());
};

export const shouldEscalateToFederatedLogout = (): boolean => {
	if (consecutiveBootstrapFailures >= 2) return true;
	const recentFailures = filterRecent(recentFailureTimestamps);
	const recentResets = filterRecent(recentResetTimestamps);
	return recentFailures.length >= 2 || recentResets.length >= 2;
};

export const resetAuthFailureTracker = (): void => {
	consecutiveBootstrapFailures = 0;
	recentFailureTimestamps = [];
};

export const recordResetTimestamp = (): void => {
	recentResetTimestamps = filterRecent(recentResetTimestamps);
	recentResetTimestamps.push(nowMs());
};

export const getRecentResetCount = (): number => {
	return filterRecent(recentResetTimestamps).length;
};
