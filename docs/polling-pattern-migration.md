# Migration Guide: From RxJS Subscriptions to Polling Patterns

## Overview

This document outlines the transformation of `useOnboardingUpload.ts` from RxJS-based subscriptions to React Query-based polling patterns. The new approach provides better performance, easier testing, and more predictable behavior.

## Key Benefits of Polling Pattern

1. **Better Performance**: Only fetches heavy data when lightweight version data changes
2. **Easier Testing**: Each polling function can be tested independently
3. **Better Error Handling**: Comprehensive error handling with retries
4. **Configurable**: Polling intervals and conditions can be easily adjusted
5. **Type Safety**: Full TypeScript support with generics
6. **React Query Integration**: Built on proven React Query foundation

## Migration Summary

### Original RxJS Functions → New Polling Functions

| Original Function | New Polling Function | Pattern Used | Interval |
|------------------|---------------------|--------------|----------|
| `subscribeToDocuments` | `useDocumentsPolling` | Simple Polling | 10s |
| `subscribeToProjectContents` | `useProjectContentsPolling` | Hash-based Polling | 5s |
| `getProjectStateOverview` | `useProjectStateOverviewPolling` | Version-based Polling | 8s |
| `subscribeProjectState` | `useProjectStatePolling` | Simple Polling | 5s |
| `determineUploadState` | `useUploadStatePolling` | Computed State | Based on project state |
| `determineOnboardingState` | `useOnboardingStatePolling` | Simple Polling | 15s |

## Detailed Transformations

### 1. Documents Subscription → Simple Polling

**Before (RxJS):**
```typescript
export function subscribeToDocuments(
  hasuraService: HasuraService,
  projectId: string
): Observable<Document[]> {
  return new Observable((subscriber) => {
    // GraphQL subscription setup
    const subscription = hasuraService.getClient().subscribe({...});
    // Manual subscription management
  });
}
```

**After (Polling):**
```typescript
export function useDocumentsPolling(
  hasuraService: HasuraService,
  projectId: string,
  shouldPoll: boolean = true
) {
  return useSimplePolling<Document[]>({
    entityId: projectId,
    queryFn: async () => {
      // GraphQL query (not subscription)
      const response = await hasuraService.getClient().query({...});
      return response.data?.documents || [];
    },
    queryKey: (id: string) => ["documents", id],
    interval: 10000,
    shouldPoll,
  });
}
```

### 2. Project Contents → Hash-based Polling

**Before (RxJS):**
```typescript
export function subscribeToProjectContents(...): Observable<ProjectContentsData> {
  return new Observable((subscriber) => {
    // Heavy subscription that always fetches full data
    const subscription = hasuraService.getClient().subscribe({
      query: HEAVY_QUERY, // Always fetches all FM component data
    });
  });
}
```

**After (Polling):**
```typescript
export function useProjectContentsPolling(...) {
  return useHashBasedPolling<ProjectContentsSummary, ProjectContentsData>({
    // Lightweight query for change detection
    lightweightQuery: {
      queryFn: async () => {
        // Only fetch summary data (timestamp, counts)
        const response = await hasuraService.getClient().query({
          query: LIGHTWEIGHT_SUMMARY_QUERY,
        });
        return { lastUpdated, dataSize, componentsCount };
      },
      interval: 5000,
    },
    // Create hash from summary
    createHash: (summary) => PollingUtils.createCompositeHash(summary, [...]),
    // Heavy query only when hash changes
    dataQuery: {
      queryFn: async () => {
        // Full data fetch only when needed
        const response = await hasuraService.getClient().query({
          query: HEAVY_FULL_DATA_QUERY,
        });
        return processedData;
      },
    },
  });
}
```

### 3. Project State Overview → Version-based Polling

**Before (RxJS):**
```typescript
export function getProjectStateOverview(...): Observable<ProjectStateOverview> {
  return new Observable((subscriber) => {
    // Always fetches complete project state overview
    const subscription = hasuraService.getClient().subscribe({...});
  });
}
```

**After (Polling):**
```typescript
export function useProjectStateOverviewPolling(...) {
  return usePollingPattern<VersionData, ProjectStateOverview>({
    // Check version first
    versionQuery: {
      queryFn: async () => {
        // Only fetch IDs and timestamps
        return { stateId, stateUpdated, documentsCount };
      },
      interval: 8000,
    },
    // Heavy data only when version changes
    dataQuery: {
      queryFn: async () => {
        // Complete overview data
        return fullProjectStateOverview;
      },
    },
  });
}
```

## Usage Examples

### Simple Hook Migration

**Before:**
```typescript
export function useDocuments(projectId: string) {
  const [documents, setDocuments] = useState<any[]>([]);
  const hasuraService = getHasuraService();

  useEffect(() => {
    const subscription = subscribeToDocuments(hasuraService, projectId)
      .subscribe((docsData) => {
        setDocuments(docsData);
      });

    return () => subscription.unsubscribe();
  }, [hasuraService, projectId]);

  return documents;
}
```

**After:**
```typescript
export function useDocuments(projectId: string) {
  const hasuraService = getHasuraService();
  
  const { data: documents, isLoading, error } = useDocumentsPolling(
    hasuraService!,
    projectId,
    !!hasuraService
  );

  return documents || [];
}
```

### Advanced State Management

**Before:**
```typescript
// Complex RxJS chain with multiple subscriptions
const uploadState$ = subscribeProjectState(hasuraService, projectId).pipe(
  map(mapProjectStateToUploadState),
  distinctUntilChanged()
);

const contents$ = subscribeToProjectContents(hasuraService, projectId);

// Manual subscription management
useEffect(() => {
  const sub1 = uploadState$.subscribe(...);
  const sub2 = contents$.subscribe(...);
  return () => { sub1.unsubscribe(); sub2.unsubscribe(); };
}, []);
```

**After:**
```typescript
// Clean, declarative hooks
const uploadStateResult = useUploadStatePolling(hasuraService, projectId);
const contentsResult = useProjectContentsPolling(hasuraService, projectId);

// Automatic subscription management, built-in loading states
const { uploadState, isLoading: uploadLoading } = uploadStateResult;
const { data: contents, isLoading: contentsLoading } = contentsResult;
```

## Performance Improvements

### 1. Efficient Change Detection

- **Before**: Always fetched complete data on every subscription update
- **After**: Fetches lightweight version/hash data frequently, heavy data only when changed

### 2. Reduced Network Traffic

- **Before**: WebSocket subscriptions with full data payloads
- **After**: HTTP queries with intelligent caching and minimal data transfer

### 3. Better Caching

- **Before**: No built-in caching, manual state management
- **After**: React Query automatic caching, deduplication, and background updates

## Testing Improvements

### Before (RxJS Testing)
```typescript
// Complex Observable testing
it('should handle subscription updates', (done) => {
  const mockService = createMockHasuraService();
  const subscription = subscribeToDocuments(mockService, 'project-id');
  
  subscription.subscribe({
    next: (data) => {
      expect(data).toEqual(expectedDocuments);
      done();
    },
    error: done,
  });
  
  // Simulate subscription update
  mockService.triggerUpdate(mockData);
});
```

### After (Polling Testing)
```typescript
// Clean React Query testing
it('should poll documents correctly', async () => {
  const mockService = createMockHasuraService();
  mockService.query.mockResolvedValue({ data: { documents: expectedDocuments } });
  
  const { result } = renderHook(() => 
    useDocumentsPolling(mockService, 'project-id')
  );
  
  await waitFor(() => {
    expect(result.current.data).toEqual(expectedDocuments);
  });
  
  expect(mockService.query).toHaveBeenCalledWith({
    query: expect.any(Object),
    variables: { project_id: 'project-id' },
  });
});
```

## Migration Checklist

- [ ] Update imports from `useOnboardingUpload.ts` to `useOnboardingUploadPolling.ts`
- [ ] Replace `Observable` returns with hook usage patterns
- [ ] Update component state management to use polling hook results
- [ ] Remove manual subscription management (`subscribe`/`unsubscribe`)
- [ ] Update error handling to use polling error states
- [ ] Configure appropriate polling intervals for each use case
- [ ] Update tests to use React Query testing patterns
- [ ] Verify performance improvements in development

## Best Practices

### 1. Choose the Right Polling Pattern

- **Simple Polling**: For data that changes infrequently or when you always need fresh data
- **Version-based Polling**: When you have explicit version/timestamp fields
- **Hash-based Polling**: When you can compute a hash from lightweight data

### 2. Configure Appropriate Intervals

- **Frequent state changes**: 3-5 seconds
- **Moderate updates**: 8-10 seconds  
- **Infrequent changes**: 15-30 seconds

### 3. Handle Edge Cases

```typescript
// Always provide fallbacks
const { data: documents, isLoading, error } = useDocumentsPolling(
  hasuraService,
  projectId,
  !!hasuraService && !!projectId // Guard conditions
);

// Handle loading and error states
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!documents) return <EmptyState />;

return <DocumentsList documents={documents} />;
```

## Rollback Strategy

If needed, the original RxJS functions remain in `useOnboardingUpload.ts` and can be used as fallbacks:

```typescript
// Gradual migration approach
const USE_POLLING = process.env.NODE_ENV === 'development';

export function useDocuments(projectId: string) {
  if (USE_POLLING) {
    return useDocumentsPolling(hasuraService, projectId);
  } else {
    // Fallback to original RxJS implementation
    return useDocumentsLegacy(projectId);
  }
}
```

## Conclusion

The migration from RxJS subscriptions to polling patterns provides:

1. **Better Performance**: Intelligent data fetching reduces network overhead
2. **Improved Developer Experience**: Cleaner code, better TypeScript support
3. **Enhanced Testing**: Easier to test, mock, and debug
4. **Greater Reliability**: Built-in error handling and retry logic
5. **Future-proofing**: Based on established React Query patterns

The new polling approach maintains the same real-time feel while being more efficient and maintainable. 