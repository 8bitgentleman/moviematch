# Bug Postmortem: Duplicate Rating Events

## Date
2025-10-27

## Summary
Cards were being rated multiple times per swipe, with a cumulative pattern where each swipe would rate the current card PLUS all previously swiped cards.

## Severity
**Critical** - Core functionality broken, made the app unusable

## Root Cause
`onCardDismissed` callback was being invoked in TWO places:
1. In `rateItem()` function before dispatch (line 281)
2. Inside reducer's animation `.then()` callback (line 183)

This caused every swipe to trigger the rating event twice.

## Timeline of Investigation

### Initial Symptoms
- User reports cards being rated multiple times
- Backend logs show cumulative pattern: swipe 1 rates 1 card, swipe 2 rates 2 cards, swipe 3 rates 3 cards, etc.
- Cards sometimes loop back to the first movie after 3-4 swipes

### Attempted Fixes (All Failed)

1. **Added `useCallback` wrapper** - Thought it was stale closure issue
   - Result: Didn't fix it
   - Why it failed: The bug wasn't about stale closures, it was about double calls

2. **Added `swipeInProgress` mutex guard** - Thought rapid clicks were the issue
   - Result: Didn't fix it
   - Why it failed: Both calls happened in the same logical operation, not concurrent operations

3. **Added `!item.removed` check in reducer** - Thought reducer was processing duplicates
   - Result: Didn't fix it
   - Why it failed: The item wasn't removed yet when the callback fired

4. **Added `dismissedCards` ref tracking in callback** - Thought old callbacks were firing
   - Result: Didn't fix it
   - Why it failed: Both calls were for the same swipe action, both would pass the check

### The Actual Fix
**Removed the duplicate `onCardDismissed` call from the reducer's animation callback** (line 183)

Now `onCardDismissed` is ONLY called in `rateItem()` before any dispatch occurs.

## Why Was This So Hard to Debug?

1. **Code evolved across multiple fixes** - The working version had the call in `rateItem`, but the old call in the reducer wasn't removed
2. **Side effects in reducer** - Violates React principles (reducers should be pure)
3. **Animation callbacks are async** - Created delayed execution that masked the issue
4. **React Strict Mode** - Double-invokes reducers in development, potentially creating duplicate animation callbacks
5. **Closure complexity** - Animation `.then()` callbacks capture values at creation time

## Technical Lessons

### React Principles Violated
- **Reducers must be pure**: No side effects like callbacks or API calls
- **Side effects belong in event handlers**: `rateItem()` is the correct place, not the reducer

### Animation Callback Anti-pattern
```typescript
// ❌ BAD: Side effect in reducer's animation callback
item.controller.start({...}).then(() => {
  dispatch({ type: "finalizeRemove" });
  onCardDismissed(item.item, direction); // Side effect in reducer!
});

// ✅ GOOD: Side effect before dispatch
const rateItem = (direction) => {
  onCardDismissed(item.item, direction); // Side effect in event handler
  dispatch({ type: "remove", payload: { id, direction } });
};
```

## Architecture Review: Is This Over-Engineered?

### Current Complexity
- useReducer for state management
- react-spring for animations
- react-use-gesture for touch/drag
- Multiple refs (swipeInProgress, dismissedCards)
- History management for undo
- Parent callbacks via props

### Assessment: **NOT Over-Engineered**

The complexity is justified:
- ✅ Animations require react-spring controllers
- ✅ Gestures require gesture library
- ✅ Undo requires history tracking
- ✅ useReducer is appropriate for complex state transitions

### Potential Simplifications

#### 1. Remove `dismissedCards` ref (NOW REDUNDANT)
Since we fixed the double-call, this guard is no longer necessary:

```typescript
// Can probably remove this:
const dismissedCards = useRef<Set<string>>(new Set());

// And these checks:
if (dismissedCards.current.has(item.id)) {
  return;
}
dismissedCards.current.add(item.id);
```

**Recommendation**: Remove `dismissedCards` ref and related checks - they're defensive programming for a bug that no longer exists.

#### 2. Keep `swipeInProgress` ref
This is still useful to prevent rapid double-clicks/taps:
```typescript
const swipeInProgress = useRef(false);
```

**Recommendation**: Keep this - it guards against legitimate user error (double-clicking).

#### 3. Keep `!item.removed` check
This defensive check in the reducer prevents edge cases:
```typescript
if (item && !item.removed) { ... }
```

**Recommendation**: Keep this - it's a simple guard with minimal cost.

## Recommendations

### Immediate Actions
1. ✅ Remove duplicate `onCardDismissed` call from reducer
2. 🔄 Consider removing `dismissedCards` ref (no longer needed)
3. ✅ Keep `swipeInProgress` mutex guard
4. ✅ Keep `!item.removed` defensive check

### Long-term Improvements
1. **Add ESLint rule** to catch side effects in reducers
2. **Document animation patterns** - Create guide for working with react-spring + useReducer
3. **Add integration test** - Test that swipes trigger exactly ONE rating event
4. **Code review checklist** - "Are callbacks being invoked in multiple places?"

## Conclusion

This was a **classic double-call bug** disguised by async animation callbacks and multiple layers of state management. The root cause was simple (duplicate function calls), but the symptoms were complex (cumulative ratings).

The architecture is NOT over-engineered - the complexity is inherent to the requirements (animations, gestures, undo). However, we accumulated some **defensive guards** that may now be redundant.

**Final verdict**: Keep the architecture, but consider cleaning up the defensive code that was added while debugging.
