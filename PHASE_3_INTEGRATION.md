# Phase 3 Integration Guide

This guide explains how to integrate the new Phase 3 UI components into the existing MovieMatch application.

## Table of Contents

1. [Overview](#overview)
2. [New Components](#new-components)
3. [Store Integration](#store-integration)
4. [WebSocket Message Handlers](#websocket-message-handlers)
5. [Migration from Legacy Room Screen](#migration-from-legacy-room-screen)
6. [State Management Strategy](#state-management-strategy)
7. [Testing Checklist](#testing-checklist)
8. [Known Integration Points](#known-integration-points)

---

## Overview

Phase 3 introduces a modern tabbed interface for the room experience with four distinct screens:

- **SwipeScreen**: Tinder-style card swiping for rating media
- **BrowseScreen**: Grid view with search and filtering
- **MatchesScreen**: View all matches with sorting options
- **SettingsScreen**: Room info, participants, and account management

These screens are managed by the new **RoomContainer** component, which handles tab navigation and state management.

---

## New Components

### Component Hierarchy

```
RoomContainer (screens/RoomContainer.tsx)
├── SwipeScreen (screens/SwipeScreen.tsx)
│   ├── CardStack (organisms/CardStack.tsx)
│   ├── MovieCard (molecules/MovieCard.tsx)
│   ├── MovieInfo (molecules/MovieInfo.tsx)
│   ├── ActionBar (molecules/ActionBar.tsx)
│   ├── NavigationBar (molecules/NavigationBar.tsx)
│   ├── MovieDetails (organisms/MovieDetails.tsx)
│   └── TrailerViewer (organisms/TrailerViewer.tsx)
├── BrowseScreen (screens/BrowseScreen.tsx)
│   ├── NavigationBar
│   └── MovieDetails
├── MatchesScreen (screens/MatchesScreen.tsx)
│   ├── NavigationBar
│   └── MovieDetails
└── SettingsScreen (screens/SettingsScreen.tsx)
    ├── NavigationBar
    └── UserProgressItem (molecules/UserProgressItem.tsx)
```

### Import Path

All components can be imported from the centralized index:

```typescript
import {
  RoomContainer,
  SwipeScreen,
  MatchesScreen,
  AppRouter
} from 'src/components';
```

---

## Store Integration

### Updated Store Types

The store types have been enhanced to support Phase 3 features:

```typescript
// web/app/src/store/types.ts

export type TabType = "swipe" | "browse" | "matches" | "settings";

export interface Store {
  // ... existing fields
  room?: {
    name: string;
    joined: boolean;
    media?: Media[];
    matches?: Match[];
    users?: Array<{ user: User; progress: number }>;

    // Phase 3: New fields
    activeTab?: TabType;
    bookmarkedMedia?: string[]; // Array of media IDs
    undoStack?: Array<{ mediaId: string; action: "like" | "dislike" }>;
    createdAt?: number; // Room creation timestamp
  };
}
```

### New Actions

Phase 3 adds several new client actions:

```typescript
export type ClientActions =
  | { type: "setActiveTab"; payload: TabType }
  | { type: "toggleBookmark"; payload: string } // mediaId
  | { type: "addToUndoStack"; payload: { mediaId: string; action: "like" | "dislike" } }
  | { type: "undoLastSwipe" }
  // ... existing actions
```

### Implementing the Reducer

Add these cases to your reducer (`web/app/src/store/reducer.ts`):

```typescript
export const reducer: Reducer<Store, Actions> = (state = initialState, action) => {
  switch (action.type) {
    // ... existing cases

    case "setActiveTab": {
      if (state.room) {
        return {
          ...state,
          room: {
            ...state.room,
            activeTab: action.payload,
          },
        };
      }
      return state;
    }

    case "toggleBookmark": {
      if (state.room) {
        const bookmarked = state.room.bookmarkedMedia || [];
        const mediaId = action.payload;
        const isBookmarked = bookmarked.includes(mediaId);

        return {
          ...state,
          room: {
            ...state.room,
            bookmarkedMedia: isBookmarked
              ? bookmarked.filter(id => id !== mediaId)
              : [...bookmarked, mediaId],
          },
        };
      }
      return state;
    }

    case "addToUndoStack": {
      if (state.room) {
        const stack = state.room.undoStack || [];
        return {
          ...state,
          room: {
            ...state.room,
            undoStack: [...stack, action.payload],
          },
        };
      }
      return state;
    }

    case "undoLastSwipe": {
      if (state.room && state.room.undoStack?.length) {
        const stack = [...state.room.undoStack];
        const lastAction = stack.pop();

        // You might want to dispatch a message to undo on the server
        // or just remove from local undo stack

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

    default:
      return state;
  }
};
```

---

## WebSocket Message Handlers

### Existing Messages (No Changes Required)

The Phase 3 components use the existing WebSocket message infrastructure:

**Messages Sent to Server:**
- `rate` - When user swipes like/dislike
- `leaveRoom` - When user leaves room
- `logout` - When user logs out

**Messages Received from Server:**
- `match` - New match created
- `media` - Media list for room
- `userJoinedRoom` - New participant joined
- `userLeftRoom` - Participant left
- `userProgress` - Participant progress updated

### Message Handling Example

The RoomContainer automatically handles these messages through the Redux store:

```typescript
// When a match is received from the server
case "match": {
  if (state.room) {
    return {
      ...state,
      room: {
        ...state.room,
        matches: [...(state.room.matches || []), action.payload],
      },
    };
  }
  break;
}
```

### Additional WebSocket Considerations

If you want to add undo functionality that syncs with the server:

```typescript
// Server message type (add to types/moviematch.ts)
export type ServerMessage =
  | { type: "undo"; payload: { mediaId: string } }
  // ... existing messages

// Client sends undo request
dispatch({
  type: "undo",
  payload: { mediaId: "movie-123" }
});
```

---

## Migration from Legacy Room Screen

### Step 1: Update Main Router

Replace the old room screen with the new RoomContainer:

**Before (`web/app/src/main.tsx`):**
```typescript
import { RoomScreen } from "./components/screens/Room";

const routes: Record<Routes, () => JSX.Element> = {
  // ...
  room: RoomScreen,
};
```

**After:**
```typescript
import { AppRouter } from "./components/AppRouter";

// In your MovieMatch component:
return (
  <>
    <AppRouter route={route} translations={translations} />
    <ToastList toasts={toasts} removeToast={...} />
  </>
);
```

Or keep the existing pattern and just swap components:

```typescript
import { RoomContainer } from "./components/screens/RoomContainer";

const routes: Record<Routes, () => JSX.Element> = {
  // ...
  room: RoomContainer, // Phase 3: New tabbed interface
};
```

### Step 2: Verify Data Flow

Ensure the store provides all required data:

```typescript
// The RoomContainer expects:
{
  room: {
    name: string;
    media: Media[];
    matches: Match[];
    users: Array<{ user: User; progress: number }>;
  },
  user: User;
}
```

### Step 3: Test Navigation

Test that users can navigate between tabs:
1. Swipe screen → Browse screen
2. Browse screen → Matches screen
3. Matches screen → Settings screen
4. Settings screen → Swipe screen (full cycle)

### Step 4: Deprecate Old Components (Optional)

Once migration is complete, you can remove:
- `web/app/src/components/screens/Room.tsx` (old room screen)
- `web/app/src/components/screens/Create.tsx` (if using CreateRoomWizard)

**Keep for now**: The old components can coexist during testing.

---

## State Management Strategy

### Local vs. Global State

**Global State (Redux Store):**
- Room data (media, matches, participants)
- User authentication
- Active route
- Connection status
- Bookmarked media (persisted across tabs)
- Undo stack (persisted across sessions)

**Local Component State:**
- Active tab (managed by RoomContainer)
- UI-specific state (modals, carousels, filters)
- Form inputs
- Search queries

### State Flow Diagram

```
User Action (e.g., swipe)
    ↓
Component Handler (e.g., handleSwipe)
    ↓
Redux Dispatch ({ type: "rate", payload: { mediaId, rating } })
    ↓
WebSocket Middleware (send to server)
    ↓
Server Processing
    ↓
Server Response (e.g., "match" message)
    ↓
Redux Reducer (update store.room.matches)
    ↓
Component Re-render (MatchesScreen shows new match)
```

### Optimistic Updates

For better UX, consider optimistic updates:

```typescript
const handleSwipe = (mediaId: string, action: "like" | "dislike") => {
  // Optimistic: Update UI immediately
  setSwipedCards((prev) => [...prev, mediaId]);

  // Then dispatch to server
  dispatch({
    type: "rate",
    payload: { mediaId, rating: action },
  });
};
```

---

## Testing Checklist

### Component Rendering
- [ ] RoomContainer renders with valid room data
- [ ] All 4 screens render without errors
- [ ] NavigationBar shows correct active tab
- [ ] Match count badge updates correctly

### Tab Navigation
- [ ] Can navigate between all 4 tabs
- [ ] Active tab indicator highlights correctly
- [ ] Tab state persists during navigation
- [ ] Deep linking to specific tabs works (if implemented)

### SwipeScreen
- [ ] Cards render with correct media data
- [ ] Swipe left sends "dislike" rating
- [ ] Swipe right sends "like" rating
- [ ] Undo button works (if implemented)
- [ ] Carousel pages work (poster → details → trailer)
- [ ] Bookmark icon toggles correctly
- [ ] Action bar buttons work
- [ ] Progress bar shows correct percentage

### BrowseScreen
- [ ] Grid displays all media
- [ ] Search filters results
- [ ] Genre filter works
- [ ] Rating filter works
- [ ] Sort options work (title, rating, year)
- [ ] Clicking media opens details modal
- [ ] Bookmark toggle works

### MatchesScreen
- [ ] All matches display
- [ ] Sort by recent works
- [ ] Sort by alphabetical works
- [ ] Sort by rating works
- [ ] Time formatting correct ("Just now", "5 minutes ago")
- [ ] Clicking match opens details
- [ ] Empty state shows when no matches

### SettingsScreen
- [ ] Room name displays
- [ ] Participant list shows all users
- [ ] Progress bars show correct values
- [ ] Match count displays
- [ ] Room creation date displays
- [ ] Share button works
- [ ] Leave room button works
- [ ] Logout button works (if authenticated)

### WebSocket Integration
- [ ] New matches appear in real-time
- [ ] User joined notifications work
- [ ] User left notifications work
- [ ] Progress updates in real-time
- [ ] Connection loss handled gracefully
- [ ] Reconnection works

### Store Integration
- [ ] Bookmark state persists across tabs
- [ ] Undo stack tracks swipes
- [ ] Tab state syncs with Redux (if using global state)
- [ ] Leaving room clears room data
- [ ] Logging out clears user data

### Edge Cases
- [ ] Empty media list handled
- [ ] Empty matches list handled
- [ ] Single participant in room
- [ ] Very long room names
- [ ] Very long usernames
- [ ] No trailer available
- [ ] No poster available
- [ ] Slow network connection

---

## Known Integration Points

### 1. WebSocket Connection

**Location:** `web/app/src/store/createStore.ts` (or wherever WebSocket is initialized)

**What to check:**
- Ensure WebSocket messages dispatch to Redux correctly
- Verify message types match server expectations

### 2. Authentication Flow

**Location:** `web/app/src/components/screens/Login.tsx`

**What to check:**
- After login, user is redirected to correct screen
- User object stored in Redux
- Plex login flow works (if enabled)

### 3. Room Creation

**Location:** `web/app/src/components/screens/CreateRoomWizard/CreateRoomWizard.tsx`

**What to check:**
- Wizard submits correct payload to server
- Filter values populated correctly
- Room type selection works
- After creation, redirects to RoomContainer

### 4. Room Joining

**Location:** `web/app/src/components/screens/Join.tsx`

**What to check:**
- Join form submits correctly
- Password validation works
- After joining, redirects to RoomContainer

### 5. Media Poster URLs

**Location:** Server-side handler (`internal/app/moviematch/handlers/poster.ts`)

**What to check:**
- Poster URLs resolve correctly
- Placeholder image shown if poster missing
- CORS headers set correctly for images

### 6. Trailer URLs

**Location:** Server-side handler (`internal/app/moviematch/handlers/trailer.ts`)

**What to check:**
- Trailer URLs resolve correctly
- YouTube embeds work
- Fallback when trailer unavailable

### 7. Translation System

**Location:** `web/app/src/components/atoms/Tr.tsx`

**What to check:**
- All new UI strings have translation keys
- Missing translations fall back gracefully
- Translation context interpolation works

### 8. Routing System

**Location:** `web/app/src/main.tsx`, `web/app/src/components/AppRouter.tsx`

**What to check:**
- All routes defined in `types.ts` have corresponding screens
- Route changes trigger correct screen renders
- Browser back button works (if using browser history)

---

## Code Examples

### Using RoomContainer

```typescript
// Simple usage (reads from Redux store)
import { RoomContainer } from 'src/components';

export const App = () => {
  const [{ route }] = useStore(['route']);

  if (route === 'room') {
    return <RoomContainer />;
  }

  return <OtherScreens />;
};
```

### Custom Tab Navigation

```typescript
// If you want to control tab from outside RoomContainer
import { RoomContainer } from 'src/components';

export const App = () => {
  return <RoomContainer initialTab="matches" />;
};
```

### Accessing Store in Components

```typescript
// Inside a Phase 3 component
import { useStore } from '../../store';

export const MyComponent = () => {
  const [{ room, user }, dispatch] = useStore(['room', 'user']);

  const handleAction = () => {
    dispatch({ type: 'someAction', payload: { ... } });
  };

  return <div>...</div>;
};
```

### Dispatching Actions

```typescript
// Swipe action
dispatch({
  type: 'rate',
  payload: {
    mediaId: 'movie-123',
    rating: 'like',
  },
});

// Leave room
dispatch({ type: 'leaveRoom' });

// Navigate to different route
dispatch({
  type: 'navigate',
  payload: { route: 'join' },
});

// Toggle bookmark
dispatch({
  type: 'toggleBookmark',
  payload: 'movie-123',
});
```

---

## Troubleshooting

### "No Room!" Error

**Cause:** RoomContainer rendered when `room` is undefined in store.

**Fix:** Ensure room data is loaded before rendering RoomContainer.

```typescript
if (!room || !room.media) {
  return <ErrorMessage message="No Room!" />;
}
```

### Tabs Not Switching

**Cause:** `onTabChange` callback not wired correctly.

**Fix:** Verify RoomContainer passes `onTabChange` to all screen components.

### Matches Not Appearing

**Cause:** WebSocket `match` message not handled correctly.

**Fix:** Add reducer case for `match` message type.

### Bookmarks Not Persisting

**Cause:** Local state used instead of Redux.

**Fix:** Store bookmarks in Redux store, not component state.

---

## Next Steps

1. **Run the app** and test basic navigation
2. **Check WebSocket** connection in browser DevTools
3. **Test swipe actions** and verify server receives ratings
4. **Test match creation** and verify UI updates
5. **Test with multiple users** in same room
6. **Review CSS** for responsive design on mobile
7. **Add error boundaries** for graceful error handling
8. **Add loading states** for async operations
9. **Write unit tests** for critical components
10. **Write integration tests** for complete user flows

---

## Additional Resources

- **TypeScript Types:** See `types/moviematch.ts` for all message types
- **Store Types:** See `web/app/src/store/types.ts` for Redux types
- **Component Styles:** Each component has a `.module.css` file
- **Phase 3 Plan:** See `PLAN.md` for feature roadmap

---

## Support

If you encounter issues during integration:

1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Review the [Testing Checklist](#testing-checklist)
3. Examine browser console for errors
4. Check Network tab for failed WebSocket messages
5. Verify Redux DevTools shows correct state

---

**Last Updated:** Phase 3 Initial Integration
**Author:** Claude (AI Assistant)
**Status:** Ready for Integration
