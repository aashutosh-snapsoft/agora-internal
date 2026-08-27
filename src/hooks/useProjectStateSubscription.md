# Project State Subscription: RxJS → TanStack Query Migration

## Overview

This file has been transformed from a complex RxJS subscription-based system to a simpler TanStack Query polling implementation. The change provides several benefits while maintaining the same functionality.

## Key Benefits

### ✅ Simplified Code
- **Before**: 400+ lines with complex subscription management, singleton patterns, and reference counting
- **After**: ~300 lines with straightforward query hooks and simple polling logic

### ✅ Reduced Complexity
- **Before**: Custom `ProjectSubscriptionManager` singleton class with complex lifecycle management
- **After**: Built-in TanStack Query caching and lifecycle management

### ✅ Better Performance
- **Before**: Heavy data fetched on every subscription update
- **After**: Lightweight version query + heavy data only when version changes

### ✅ Automatic Memory Management
- **Before**: Manual subscription cleanup with reference counting
- **After**: Automatic cleanup handled by TanStack Query

### ✅ Native Polling Support
- **Before**: Real-time subscriptions (potentially overengineered for the use case)
- **After**: Configurable polling intervals with smart invalidation

## Architecture Comparison

### Before (RxJS Subscriptions)
```typescript
// Complex subscription management
class ProjectSubscriptionManager {
  private subscriptions: Map<string, {
    subscription: Subscription;
    refCount: number;
    subscribers: Set<string>;
  }>;
  
  // Manual reference counting
  // Complex cleanup logic
  // Singleton pattern
}

// Multiple RxJS observables combined
combineLatest([
  projectStateOverview$,
  projectUploadState$,
]).pipe(distinctUntilChanged())
```

### After (TanStack Query)
```typescript
// Lightweight version polling
const { data: projectDataHash } = useQuery({
  queryKey: ['projectDataVersion', projectId],
  queryFn: () => createProjectDataHash(...),
  refetchInterval: 10000, // Poll every 10 seconds
});

// Heavy data queries with smart invalidation
const { data: projectStateOverview } = useQuery({
  queryKey: ['projectStateOverview', projectId, projectDataHash],
  queryFn: () => fetchProjectStateOverview(...),
  staleTime: Infinity, // Only refetch when invalidated
});
```

## Implementation Pattern

The new implementation follows the **recommended TanStack Query pattern**:

1. **Version Query**: Polls frequently with minimal data
2. **Data Queries**: Only refetch when version changes
3. **Smart Caching**: Automatic deduplication and memory management

## Migration Benefits

### Maintainability
- Easier to understand and debug
- Standard React Query patterns
- Less custom code to maintain

### Performance
- Reduced unnecessary data fetching
- Better caching strategies
- Configurable polling intervals

### Developer Experience
- Familiar React Query APIs
- Built-in loading and error states
- DevTools support

## Usage

The hook maintains the same interface:

```typescript
useProjectStateSubscription(
  hasuraService,
  projectId,
  layoutState,
  dispatchLayoutState
);
```

The only difference is the internal implementation - all consuming components remain unchanged. 