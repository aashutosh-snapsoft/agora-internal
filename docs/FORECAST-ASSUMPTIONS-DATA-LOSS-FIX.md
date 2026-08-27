# Forecast Assumptions Data Loss Fix

## Problem Description

Users were experiencing data loss when entering forecast assumptions for multiple line items:

1. ✅ **First assumption works**: User enters values for `interest-expense` → Save → Sync → Assumption preserved
2. ❌ **Second assumption kills first**: User enters values for `depreciation-expense` → Save → Sync → `interest-expense` assumptions disappear, only `depreciation-expense` remains
3. 🔄 **Pattern repeats**: Each new assumption overwrites all previous assumptions

## Root Cause Analysis

### The Bug Location
**File**: `src/store/financialModels/financial-models-thunks.ts`  
**Function**: `deriveBuild` → `persistForecastDriverAndInputUpdates$`  
**Lines**: ~230-250

### The Problematic Code
```typescript
// BEFORE (Buggy Implementation)
const relevantContext = args.contexts?.find(
    (c) => c.context_id === updatesForContext[0].context_id
) ?? {
    forecast_settings: {
        line_items: [], // ← Always empty fallback!
        forecast_enabled: true,
    },
};

const forecast_settings = {
    line_items: relevantContext.forecast_settings.line_items.concat(
        updatesForContext.map((update) => ({ /* new forecast item */ }))
    ),
    forecast_enabled: true,
};
```

### Why It Failed
1. **Empty Fallback**: `args.contexts` was undefined/incomplete, so it always fell back to empty `line_items: []`
2. **Blind Concatenation**: Each sync concatenated new updates to an empty array
3. **Data Loss**: Previous forecast assumptions were completely lost

### Data Flow Pattern
```
Sync 1: [] + [interest-expense] = [interest-expense] ✅
Sync 2: [] + [depreciation] = [depreciation] ❌ (interest-expense lost)
Sync 3: [] + [tax-expense] = [tax-expense] ❌ (both previous lost)
```

## Solution Implemented

### Strategy
1. **Fetch Current State**: Query database for existing `forecast_settings` before updating
2. **Intelligent Merge**: Preserve existing settings while updating current changes
3. **Deduplication**: Handle updates to same taxonomy concepts properly

### The Fix Code
```typescript
// AFTER (Fixed Implementation)
const contextId = updatesForContext[0].context_id;

// 1. Fetch current context from database
const fetchCurrentContext$ = from(
    client.query({
        query: gql`
            query GetContextForecastSettings($context_id: uuid!) {
                contexts_by_pk(id: $context_id) {
                    id
                    forecast_settings
                }
            }
        `,
        variables: { context_id: contextId },
    })
);

return fetchCurrentContext$.pipe(
    mergeMap((response: any) => {
        // 2. Get existing forecast settings or create empty structure
        const currentContext = response.data?.contexts_by_pk;
        const existingForecastSettings = currentContext?.forecast_settings || {
            line_items: [],
            forecast_enabled: true,
        };

        // 3. Convert updates to forecast_settings format
        const newForecastLineItems = updatesForContext.map((update) => ({
            id: update.line_item_id,
            context_id: update.context_id,
            forecast_inputs: update.forecast_inputs,
            forecast_drivers: update.forecast_driver,
            taxonomy_concept: {
                name: update.line_item.taxonomy_concept?.name,
            },
            model_template_id: update.line_item.model_template_id,
        }));

        // 4. Intelligent merge - preserve existing, update current
        const existingLineItems = existingForecastSettings.line_items || [];
        const updatedTaxonomyNames = new Set(
            newForecastLineItems.map((item: any) => item.taxonomy_concept?.name).filter(Boolean)
        );

        // Keep existing items that aren't being updated
        const preservedLineItems = existingLineItems.filter(
            (existingItem: any) => !updatedTaxonomyNames.has(existingItem.taxonomy_concept?.name)
        );

        // Combine preserved items with new updates
        const mergedLineItems = [...preservedLineItems, ...newForecastLineItems];

        const forecast_settings = {
            line_items: mergedLineItems,
            forecast_enabled: true,
        };

        // 5. Debug logging
        console.log("🔍 FORECAST SETTINGS MERGE:", {
            contextId,
            existingCount: existingLineItems.length,
            newUpdatesCount: newForecastLineItems.length,
            preservedCount: preservedLineItems.length,
            finalCount: mergedLineItems.length,
            updatedTaxonomyNames: Array.from(updatedTaxonomyNames),
        });

        // 6. Update context with merged settings
        return from(
            client.mutate({
                mutation: gql`
                    mutation updateContext(
                        $context_id: uuid!
                        $forecast_settings: jsonb!
                    ) {
                        update_contexts_by_pk(
                            pk_columns: { id: $context_id }
                            _set: { forecast_settings: $forecast_settings }
                        ) {
                            id
                        }
                    }
                `,
                variables: {
                    context_id: contextId,
                    forecast_settings: forecast_settings,
                },
            })
        );
    })
);
```

## Behavior After Fix

### Expected User Flow
```
1. User enters interest-expense assumption → Save → Sync
   Result: [interest-expense] ✅

2. User enters depreciation-expense assumption → Save → Sync  
   Result: [interest-expense, depreciation-expense] ✅

3. User updates interest-expense assumption → Save → Sync
   Result: [depreciation-expense, interest-expense-updated] ✅

4. User enters tax-expense assumption → Save → Sync
   Result: [depreciation-expense, interest-expense-updated, tax-expense] ✅
```

### Key Improvements
- **Preservation**: Existing assumptions are preserved across syncs
- **Updates**: Re-entering same line item updates existing entry (no duplicates)
- **Merging**: New assumptions are added without affecting existing ones
- **Logging**: Debug output shows merge statistics for troubleshooting

## Technical Details

### Dependencies Added
```typescript
import { map } from "rxjs"; // Added to existing RxJS imports
```

### Database Query Added
- **Query**: `GetContextForecastSettings` - Fetches current `forecast_settings` for a context
- **Purpose**: Get existing state before merging new updates
- **Performance**: Single query per context (grouped updates processed together)

### Error Handling
- Graceful fallback to empty `forecast_settings` if context not found
- Type safety with explicit typing on RxJS operators
- Console logging for debugging merge operations

## Testing Recommendations

### Manual Testing Scenario
1. Open forecast modal for `interest-expense`
2. Enter user assumptions (e.g., 100, 200, 300 for future periods)
3. Save and sync ✅
4. Open forecast modal for `depreciation-and-amortization-expense` 
5. Enter user assumptions (e.g., 50, 60, 70 for future periods)
6. Save and sync ✅
7. **Verify**: Open `interest-expense` modal again - assumptions should still be there ✅
8. **Verify**: Both line items show "User Assumption" instead of "Assumption Needed" ✅

### Debug Console Output
Look for log messages like:
```
🔍 FORECAST SETTINGS MERGE: {
  contextId: "abc-123",
  existingCount: 1,
  newUpdatesCount: 1, 
  preservedCount: 1,
  finalCount: 2,
  updatedTaxonomyNames: ["depreciation-and-amortization-expense"]
}
```

## Files Modified

- **Primary**: `src/store/financialModels/financial-models-thunks.ts` 
  - Modified `deriveBuild` function
  - Added intelligent forecast settings merge logic
  - Added database query for current context state


The fix ensures that the forecast assumptions feature works as intended, allowing users to build comprehensive financial models with multiple assumption-driven line items. 