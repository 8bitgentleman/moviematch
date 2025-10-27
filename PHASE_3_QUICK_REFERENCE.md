# Phase 3 Quick Reference

Quick reference guide for common Phase 3 integration tasks.

---

## Quick Start (5 Minutes)

### 1. Enable Phase 3 UI

**File:** `web/app/src/main.tsx`

**Change:**
```typescript
// Replace this line:
import { RoomScreen } from "./components/screens/Room";

// With this:
import { RoomContainer } from "./components/screens/RoomContainer";

// Then update routes:
const routes = {
  // ... other routes
  room: RoomContainer, // Changed from RoomScreen
};
```

**Result:** Your app now uses the new tabbed interface!

---

### 2. Use the New Create Room Wizard

**File:** `web/app/src/main.tsx`

**Change:**
```typescript
// Replace:
import { CreateScreen } from "./components/screens/Create";

// With:
import { CreateRoomWizard } from "./components/screens/CreateRoomWizard/CreateRoomWizard";

// Then update routes:
const routes = {
  // ... other routes
  createRoom: CreateRoomWizard, // Changed from CreateScreen
};
```

**Result:** You now have the enhanced 5-step wizard!

---

### 3. Use AppRouter (Recommended)

**File:** `web/app/src/main.tsx`

**Replace entire routing logic:**
```typescript
import { AppRouter } from "./components/AppRouter";

const MovieMatch = () => {
  const { route, translations, toasts } = useSelector([
    "route",
    "translations",
    "toasts",
  ]);

  return (
    <>
      <AppRouter route={route} translations={translations} />
      <ToastList toasts={toasts} removeToast={...} />
    </>
  );
};
```

**Result:** Cleaner code with centralized routing!

---

## Common Tasks

### Import Components

```typescript
// All Phase 3 components available from one import:
import {
  RoomContainer,
  SwipeScreen,
  MatchesScreen,
  BrowseScreen,
  SettingsScreen,
  CreateRoomWizard,
  MovieDetails,
  TrailerViewer,
  ActionBar,
  NavigationBar,
} from 'src/components';
```

---

### Navigate Between Tabs Programmatically

```typescript
import { RoomContainer } from 'src/components';

// Option 1: Set initial tab
<RoomContainer initialTab="matches" />

// Option 2: Control via state (if needed)
const [currentTab, setCurrentTab] = useState("swipe");
// Pass to child components that need it
```

---

### Add Custom Bookmark Logic

**File:** `web/app/src/components/screens/RoomContainer.tsx`

**Find this function:**
```typescript
const handleBookmark = useCallback((mediaItem: Media) => {
  setBookmarkedMedia((prev) => {
    const next = new Set(prev);
    if (next.has(mediaItem.id)) {
      next.delete(mediaItem.id);
    } else {
      next.add(mediaItem.id);
    }
    return next;
  });
}, []);
```

**Customize it:**
```typescript
const handleBookmark = useCallback((mediaItem: Media) => {
  // Update local state
  setBookmarkedMedia((prev) => {
    const next = new Set(prev);
    if (next.has(mediaItem.id)) {
      next.delete(mediaItem.id);
    } else {
      next.add(mediaItem.id);
    }
    return next;
  });

  // Also save to Redux store (persistent across tabs)
  dispatch({
    type: "toggleBookmark",
    payload: mediaItem.id,
  });

  // Optional: Send to server
  // dispatch({
  //   type: "sendBookmark",
  //   payload: { mediaId: mediaItem.id },
  // });
}, [dispatch]);
```

---

### Add Undo Functionality

**Step 1:** Track swipes

**File:** `web/app/src/components/screens/RoomContainer.tsx`

```typescript
const handleSwipe = useCallback(
  (mediaId: string, action: "like" | "dislike") => {
    // Add to undo stack first
    dispatch({
      type: "addToUndoStack",
      payload: { mediaId, action },
    });

    // Then send rate
    dispatch({
      type: "rate",
      payload: {
        mediaId,
        rating: action,
      },
    });
  },
  [dispatch]
);
```

**Step 2:** Implement undo handler

```typescript
const handleUndo = useCallback(() => {
  dispatch({ type: "undoLastSwipe" });
}, [dispatch]);

// Pass to SwipeScreen:
<SwipeScreen
  onUndo={handleUndo}
  canUndo={room.undoStack?.length > 0}
  // ... other props
/>
```

**Step 3:** Add reducer case

**File:** `web/app/src/store/reducer.ts`

```typescript
case "undoLastSwipe": {
  if (state.room && state.room.undoStack?.length) {
    const stack = [...state.room.undoStack];
    const lastAction = stack.pop();

    // Optional: Send undo message to server
    // WebSocket.send({ type: "undo", payload: lastAction });

    return {
      ...state,
      room: {
        ...state.room,
        undoStack: stack,
      },
    };
  }
  return state;
}
```

---

### Pass Additional Props to Screens

**File:** `web/app/src/components/screens/RoomContainer.tsx`

**Find the switch statement and customize:**

```typescript
switch (activeTab) {
  case "swipe":
    return (
      <SwipeScreen
        media={media}
        onSwipe={handleSwipe}
        onBookmark={handleBookmark}
        {...commonProps}
        // Add custom props here:
        enableUndo={true}
        showTrailer={true}
        customProp="value"
      />
    );

  case "settings":
    return (
      <SettingsScreen
        roomName={roomName}
        participants={participants}
        user={user}
        matchCount={matches.length}
        onLeaveRoom={handleLeaveRoom}
        onLogout={handleLogout}
        onTabChange={handleTabChange}
        // Add custom props:
        showInviteButton={true}
        enableNotifications={false}
      />
    );

  // ... other cases
}
```

---

### Get Current Tab State

**Option 1:** Local state (recommended)
```typescript
// In RoomContainer
const [activeTab, setActiveTab] = useState<TabType>("swipe");

// Access anywhere in component
console.log("Current tab:", activeTab);
```

**Option 2:** Store in Redux
```typescript
// Add to reducer
case "setActiveTab": {
  return {
    ...state,
    room: {
      ...state.room,
      activeTab: action.payload,
    },
  };
}

// Access from anywhere
const [{ room }] = useStore(["room"]);
console.log("Current tab:", room?.activeTab);
```

---

### Handle Tab Change Events

**File:** `web/app/src/components/screens/RoomContainer.tsx`

```typescript
const handleTabChange = useCallback((tab: TabType) => {
  // Log analytics
  console.log("Tab changed to:", tab);

  // Save to local storage
  localStorage.setItem("lastActiveTab", tab);

  // Update state
  setActiveTab(tab);

  // Optional: Save to Redux
  dispatch({ type: "setActiveTab", payload: tab });

  // Optional: Send to analytics service
  // analytics.track("Tab Changed", { tab });
}, [dispatch]);
```

---

### Customize Match Count Badge

**File:** Each screen component passes `matchCount` prop

**In RoomContainer:**
```typescript
const commonProps = {
  onTabChange: handleTabChange,
  isAuthenticated: !!user,
  matchCount: matches.length, // Customize this calculation
};

// Example: Only count recent matches
const recentMatches = matches.filter(
  m => Date.now() - m.matchedAt < 24 * 60 * 60 * 1000
);

const commonProps = {
  onTabChange: handleTabChange,
  isAuthenticated: !!user,
  matchCount: recentMatches.length, // Shows only matches from last 24h
};
```

---

### Add Deep Linking to Tabs

**File:** `web/app/src/components/screens/RoomContainer.tsx`

```typescript
export const RoomContainer = ({ initialTab = "swipe" }: RoomContainerProps) => {
  const [{ routeParams }] = useStore(["routeParams"]);

  // Read tab from URL params
  const tabFromUrl = routeParams?.tab as TabType | undefined;
  const [activeTab, setActiveTab] = useState<TabType>(
    tabFromUrl || initialTab
  );

  // Update URL when tab changes
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);

    // Update URL
    dispatch({
      type: "navigate",
      payload: {
        route: "room",
        routeParams: { tab },
      },
    });
  }, [dispatch]);

  // ... rest of component
};
```

**Usage:**
```
https://yourapp.com/#/room?tab=matches  → Opens Matches tab
https://yourapp.com/#/room?tab=settings → Opens Settings tab
```

---

### Filter Media by Bookmark Status

**In BrowseScreen or SwipeScreen:**

```typescript
// Get bookmarked IDs from RoomContainer
const bookmarkedIds = Array.from(bookmarkedMedia);

// In BrowseScreen, add filter option
const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);

const filteredMedia = useMemo(() => {
  let filtered = media;

  // Apply bookmark filter
  if (showOnlyBookmarked) {
    filtered = filtered.filter(m => bookmarkedIds.includes(m.id));
  }

  // ... other filters

  return filtered;
}, [media, showOnlyBookmarked, bookmarkedIds]);
```

---

### Persist Tab State Across Sessions

**File:** `web/app/src/components/screens/RoomContainer.tsx`

```typescript
export const RoomContainer = ({ initialTab = "swipe" }: RoomContainerProps) => {
  // Load last tab from localStorage
  const savedTab = localStorage.getItem("lastActiveTab") as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(
    savedTab || initialTab
  );

  // Save tab changes to localStorage
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    localStorage.setItem("lastActiveTab", tab);
  }, []);

  // ... rest of component
};
```

---

### Add Loading State for Media

**File:** `web/app/src/components/screens/RoomContainer.tsx`

```typescript
export const RoomContainer = ({ initialTab = "swipe" }: RoomContainerProps) => {
  const [{ room, user }, dispatch] = useStore(["room", "user"]);

  // Check for loading state
  if (!room) {
    return <LoadingSpinner message="Joining room..." />;
  }

  if (!room.media || room.media.length === 0) {
    return <EmptyState message="No media found. Try adjusting your filters." />;
  }

  if (!user) {
    return <ErrorMessage message="Not authenticated" />;
  }

  // ... rest of component
};
```

---

### Add Error Boundaries

**File:** `web/app/src/components/ErrorBoundary.tsx` (create new file)

```typescript
import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage:**
```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary fallback={<ErrorMessage message="Room failed to load" />}>
  <RoomContainer />
</ErrorBoundary>
```

---

## Debugging

### Check Redux State

```typescript
// In any component
import { useStore } from '../../store';

const [state] = useStore([]);
console.log("Full state:", state);

// Or specific slices
const [{ room, user }] = useStore(["room", "user"]);
console.log("Room:", room);
console.log("User:", user);
```

### Check WebSocket Messages

**Browser DevTools → Network → WS → Messages**

Look for:
- Outgoing: `rate`, `leaveRoom`, `logout`
- Incoming: `match`, `media`, `userJoinedRoom`, `userProgress`

### Log Tab Changes

```typescript
const handleTabChange = useCallback((tab: TabType) => {
  console.log(`[TabChange] ${activeTab} → ${tab}`);
  setActiveTab(tab);
}, [activeTab]);
```

### Check Component Props

```typescript
export const SwipeScreen = (props: SwipeScreenProps) => {
  console.log("[SwipeScreen] Props:", props);
  console.log("[SwipeScreen] Media count:", props.media.length);
  console.log("[SwipeScreen] Match count:", props.matchCount);

  // ... rest of component
};
```

---

## Performance Tips

### Memoize Expensive Computations

```typescript
import { useMemo } from 'react';

const sortedMatches = useMemo(() => {
  return matches.sort((a, b) => b.matchedAt - a.matchedAt);
}, [matches]); // Only recompute when matches change
```

### Prevent Unnecessary Re-renders

```typescript
import { memo } from 'react';

export const MovieCard = memo(({ media, onClick }: MovieCardProps) => {
  // Component only re-renders when media or onClick changes
  return <div>...</div>;
});
```

### Use Callback Hooks

```typescript
const handleSwipe = useCallback(
  (mediaId: string, action: "like" | "dislike") => {
    dispatch({ type: "rate", payload: { mediaId, rating: action } });
  },
  [dispatch] // Only recreate if dispatch changes
);
```

---

## Testing Snippets

### Mock Store Data

```typescript
const mockStore = {
  room: {
    name: "Test Room",
    media: [
      {
        id: "1",
        title: "Test Movie",
        year: 2024,
        rating: 8.5,
        // ... other fields
      },
    ],
    matches: [],
    users: [
      { user: { userName: "Alice" }, progress: 50 },
    ],
  },
  user: { userName: "Alice" },
};
```

### Test Component

```typescript
import { render, screen } from '@testing-library/react';
import { RoomContainer } from './RoomContainer';

test('renders swipe screen by default', () => {
  render(<RoomContainer />);
  expect(screen.getByText('Swipe')).toBeInTheDocument();
});
```

---

## Common Errors & Fixes

### "Cannot read property 'media' of undefined"

**Cause:** Room data not loaded yet

**Fix:**
```typescript
if (!room || !room.media) {
  return <Loading />;
}
```

### "onTabChange is not a function"

**Cause:** Missing prop from RoomContainer

**Fix:**
```typescript
// In RoomContainer, ensure you pass onTabChange to ALL screens:
<SwipeScreen
  onTabChange={handleTabChange}  // Make sure this is here
  // ... other props
/>
```

### Tabs Not Switching

**Cause:** State not updating correctly

**Fix:**
```typescript
const handleTabChange = useCallback((tab: TabType) => {
  console.log("Changing to:", tab); // Debug log
  setActiveTab(tab);
}, []);
```

---

## Where to Get Help

1. **Integration Guide:** See `PHASE_3_INTEGRATION.md` for detailed docs
2. **Summary:** See `PHASE_3_SUMMARY.md` for architecture overview
3. **TypeScript Types:** Check `web/app/src/store/types.ts`
4. **Component Props:** Check individual component files for prop interfaces

---

**Last Updated:** Phase 3 Initial Integration
