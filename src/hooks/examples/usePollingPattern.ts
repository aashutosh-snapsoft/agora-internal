import { useQuery } from "@tanstack/react-query";
import { useCallback, useRef, useEffect } from "react";

/**
 * Example implementation of the polling pattern used in useProjectStateSubscription
 *
 * This pattern can be used to replace RxJS subscriptions throughout the codebase
 * where you need to poll for changes efficiently.
 */

// Type definitions for example
interface DataVersion {
	version: string;
	lastUpdated: string;
}

interface HeavyData {
	id: string;
	content: any;
	metadata: any;
}

// Helper function to create a lightweight version hash
function createVersionHash(data: any): string {
	return JSON.stringify({
		timestamp: data.lastUpdated,
		id: data.id,
		checksum: data.version,
	});
}

/**
 * Generic polling pattern hook for efficient real-time data updates
 *
 * This pattern replaces RxJS subscriptions with a more efficient approach:
 * 1. Polls lightweight version/hash data frequently
 * 2. Only fetches heavy data when the version actually changes
 */

// Generic configuration interface
export interface PollingConfig<TVersion, TData> {
	// Required: Unique identifier for this polling instance
	entityId: string;

	// Version/lightweight query configuration
	versionQuery: {
		queryFn: () => Promise<TVersion>;
		queryKey: (entityId: string) => readonly unknown[];
		enabled?: boolean;
		interval?: number;
	};

	// Heavy data query configuration
	dataQuery: {
		queryFn: (version: TVersion) => Promise<TData>;
		queryKey: (entityId: string, version: TVersion) => readonly unknown[];
		enabled?: (entityId: string, version: TVersion) => boolean;
	};

	// Optional: Custom version comparison function
	versionComparator?: (
		prev: TVersion | undefined,
		current: TVersion
	) => boolean;

	// Optional: Data processing callback when data changes
	onDataChange?: (data: TData, version: TVersion) => void | Promise<void>;

	// Optional: Error handling
	onError?: (error: Error) => void;

	// Control flags
	shouldPoll?: boolean;

	// Query options
	staleTime?: number;
	refetchOnWindowFocus?: boolean;
}

export interface PollingResult<TVersion, TData> {
	data: TData | undefined;
	version: TVersion | undefined;
	isLoading: boolean;
	isVersionLoading: boolean;
	isDataLoading: boolean;
	error: Error | null;
	versionError: Error | null;
	dataError: Error | null;
}

/**
 * Generic polling pattern hook
 */
export function usePollingPattern<TVersion, TData>(
	config: PollingConfig<TVersion, TData>
): PollingResult<TVersion, TData> {
	const {
		entityId,
		versionQuery,
		dataQuery,
		versionComparator,
		onDataChange,
		onError,
		shouldPoll = true,
		staleTime = Infinity,
		refetchOnWindowFocus = false,
	} = config;

	const dataProcessingRef = useRef(false);
	const lastProcessedVersionRef = useRef<TVersion>();

	// Step 1: Lightweight version query that polls frequently
	const {
		data: version,
		isLoading: isVersionLoading,
		error: versionError,
	} = useQuery<TVersion>({
		queryKey: versionQuery.queryKey(entityId),
		queryFn: versionQuery.queryFn,
		refetchInterval:
			shouldPoll && (versionQuery.enabled ?? true)
				? versionQuery.interval ?? 10000
				: false,
		enabled: Boolean(entityId && shouldPoll && (versionQuery.enabled ?? true)),
		staleTime: 0, // Always refetch on interval
		refetchOnWindowFocus,
	});

	// Custom version comparison
	const hasVersionChanged = useCallback(
		(newVersion: TVersion) => {
			if (versionComparator) {
				return versionComparator(lastProcessedVersionRef.current, newVersion);
			}
			// Default comparison using JSON.stringify
			return (
				JSON.stringify(lastProcessedVersionRef.current) !==
				JSON.stringify(newVersion)
			);
		},
		[versionComparator]
	);

	// Step 2: Heavy data query that only refetches when version changes
	const {
		data,
		isLoading: isDataLoading,
		error: dataError,
	} = useQuery<TData>({
		queryKey: dataQuery.queryKey(entityId, version as TVersion),
		queryFn: () => dataQuery.queryFn(version as TVersion),
		enabled: Boolean(
			entityId &&
				version !== undefined &&
				(dataQuery.enabled
					? dataQuery.enabled(entityId, version as TVersion)
					: true)
		),
		staleTime,
		refetchOnWindowFocus,
	});

	// Handle data changes
	useEffect(() => {
		if (
			data &&
			version &&
			!dataProcessingRef.current &&
			hasVersionChanged(version)
		) {
			dataProcessingRef.current = true;

			try {
				onDataChange?.(data, version);
				lastProcessedVersionRef.current = version;
			} catch (error) {
				onError?.(error as Error);
			} finally {
				dataProcessingRef.current = false;
			}
		}
	}, [data, version, hasVersionChanged, onDataChange, onError]);

	// Handle errors
	useEffect(() => {
		if (versionError) {
			onError?.(versionError as Error);
		}
	}, [versionError, onError]);

	useEffect(() => {
		if (dataError) {
			onError?.(dataError as Error);
		}
	}, [dataError, onError]);

	const isLoading = isVersionLoading || isDataLoading;
	const error = versionError || dataError;

	return {
		data,
		version,
		isLoading,
		isVersionLoading,
		isDataLoading,
		error: error as Error | null,
		versionError: versionError as Error | null,
		dataError: dataError as Error | null,
	};
}

/**
 * Hash-based polling pattern with custom hash function
 */
export interface HashPollingConfig<TLightweight, TData> {
	entityId: string;

	// Lightweight data query
	lightweightQuery: {
		queryFn: () => Promise<TLightweight>;
		queryKey: (entityId: string) => readonly unknown[];
		enabled?: boolean;
		interval?: number;
	};

	// Hash creation function
	createHash: (data: TLightweight) => string;

	// Heavy data query
	dataQuery: {
		queryFn: (hash: string, lightweightData: TLightweight) => Promise<TData>;
		queryKey: (entityId: string, hash: string) => readonly unknown[];
		enabled?: (
			entityId: string,
			hash: string,
			lightweightData: TLightweight
		) => boolean;
	};

	// Optional callbacks
	onDataChange?: (
		data: TData,
		hash: string,
		lightweightData: TLightweight
	) => void | Promise<void>;
	onError?: (error: Error) => void;

	// Control flags
	shouldPoll?: boolean;
	staleTime?: number;
	refetchOnWindowFocus?: boolean;
}

export function useHashBasedPolling<TLightweight, TData>(
	config: HashPollingConfig<TLightweight, TData>
): PollingResult<string, TData> & {
	lightweightData: TLightweight | undefined;
} {
	const {
		entityId,
		lightweightQuery,
		createHash,
		dataQuery,
		onDataChange,
		onError,
		shouldPoll = true,
		staleTime = Infinity,
		refetchOnWindowFocus = false,
	} = config;

	// Poll lightweight data and create hash
	const {
		data: lightweightData,
		isLoading: isLightweightLoading,
		error: lightweightError,
	} = useQuery<TLightweight>({
		queryKey: lightweightQuery.queryKey(entityId),
		queryFn: lightweightQuery.queryFn,
		refetchInterval:
			shouldPoll && (lightweightQuery.enabled ?? true)
				? lightweightQuery.interval ?? 10000
				: false,
		enabled: Boolean(
			entityId && shouldPoll && (lightweightQuery.enabled ?? true)
		),
		staleTime: 0,
		refetchOnWindowFocus,
	});

	const dataHash = lightweightData ? createHash(lightweightData) : undefined;

	// Full data query triggered by hash changes
	const {
		data,
		isLoading: isDataLoading,
		error: dataError,
	} = useQuery<TData>({
		queryKey: dataQuery.queryKey(entityId, dataHash as string),
		queryFn: () =>
			dataQuery.queryFn(dataHash as string, lightweightData as TLightweight),
		enabled: Boolean(
			entityId &&
				dataHash &&
				lightweightData &&
				(dataQuery.enabled
					? dataQuery.enabled(entityId, dataHash, lightweightData)
					: true)
		),
		staleTime,
		refetchOnWindowFocus,
	});

	// Handle data changes
	useEffect(() => {
		if (data && dataHash && lightweightData) {
			onDataChange?.(data, dataHash, lightweightData);
		}
	}, [data, dataHash, lightweightData, onDataChange]);

	// Handle errors
	useEffect(() => {
		if (lightweightError) {
			onError?.(lightweightError as Error);
		}
	}, [lightweightError, onError]);

	useEffect(() => {
		if (dataError) {
			onError?.(dataError as Error);
		}
	}, [dataError, onError]);

	const isLoading = isLightweightLoading || isDataLoading;
	const error = lightweightError || dataError;

	return {
		data,
		version: dataHash,
		lightweightData,
		isLoading,
		isVersionLoading: isLightweightLoading,
		isDataLoading,
		error: error as Error | null,
		versionError: lightweightError as Error | null,
		dataError: dataError as Error | null,
	};
}

/**
 * Simplified polling pattern for basic use cases
 */
export interface SimplePollingConfig<TData> {
	entityId: string;
	queryFn: () => Promise<TData>;
	queryKey: (entityId: string) => readonly unknown[];
	shouldPoll?: boolean;
	interval?: number;
	enabled?: boolean;
	onDataChange?: (data: TData) => void;
	onError?: (error: Error) => void;
}

export function useSimplePolling<TData>(
	config: SimplePollingConfig<TData>
): Omit<
	PollingResult<never, TData>,
	"version" | "versionError" | "isVersionLoading"
> {
	const {
		entityId,
		queryFn,
		queryKey,
		shouldPoll = true,
		interval = 10000,
		enabled = true,
		onDataChange,
		onError,
	} = config;

	const { data, isLoading, error } = useQuery<TData>({
		queryKey: queryKey(entityId),
		queryFn,
		refetchInterval: shouldPoll && enabled ? interval : false,
		enabled: Boolean(entityId && shouldPoll && enabled),
		staleTime: 0,
	});

	// Handle data changes
	useEffect(() => {
		if (data) {
			onDataChange?.(data);
		}
	}, [data, onDataChange]);

	// Handle errors
	useEffect(() => {
		if (error) {
			onError?.(error as Error);
		}
	}, [error, onError]);

	return {
		data,
		isLoading,
		isDataLoading: isLoading,
		error: error as Error | null,
		dataError: error as Error | null,
	};
}

/**
 * Utility functions for common patterns
 */
export const PollingUtils = {
	/**
	 * Create a simple version hash from any object
	 */
	createSimpleHash: (data: any): string => {
		return JSON.stringify(data);
	},

	/**
	 * Create a timestamp-based version
	 */
	createTimestampVersion: (data: { lastUpdated?: string | number }): string => {
		return String(data.lastUpdated || Date.now());
	},

	/**
	 * Create a composite hash from multiple properties
	 */
	createCompositeHash: (data: any, properties: string[]): string => {
		const values = properties.map((prop) => data[prop]);
		return JSON.stringify(values);
	},

	/**
	 * Debounced comparison function
	 */
	createDebouncedComparator: (debounceMs: number = 1000) => {
		let lastComparisonTime = 0;

		return <T>(prev: T | undefined, current: T): boolean => {
			const now = Date.now();
			if (now - lastComparisonTime < debounceMs) {
				return false; // Skip comparison if within debounce period
			}

			const hasChanged = JSON.stringify(prev) !== JSON.stringify(current);
			if (hasChanged) {
				lastComparisonTime = now;
			}
			return hasChanged;
		};
	},
};

/**
 * Benefits of this generalized pattern:
 *
 * 1. **Highly Configurable**: Custom query functions, keys, and conditions
 * 2. **Type Safe**: Full TypeScript support with generics
 * 3. **Efficient**: Only fetches heavy data when version changes
 * 4. **Flexible**: Multiple patterns (version-based, hash-based, simple)
 * 5. **Error Handling**: Comprehensive error handling with callbacks
 * 6. **Debouncing**: Built-in utilities for debounced updates
 * 7. **Composable**: Easy to combine with other hooks and patterns
 * 8. **Testable**: Each piece can be tested independently
 */
