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

## Conclusion

The migration from RxJS subscriptions to polling patterns provides better performance, improved developer experience, enhanced testing capabilities, greater reliability, and future-proofing based on established React Query patterns. 