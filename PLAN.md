# MovieMatch Extension Plan

> Comprehensive plan to modernize and extend MovieMatch with new features, UI redesign, and improved UX

## Overview

This plan outlines the transformation of MovieMatch from its current state to a modern, feature-rich movie matching application with:
- Modern Tinder-style UI redesign
- Plex-authenticated configuration (move from config files to UI)
- Enhanced filtering and room options
- Progressive Web App (PWA) capabilities
- Improved swipe behaviors and room types

## Goals

### Primary Objectives
1. **Modernize Technology Stack** - Upgrade to Vite, React 18, latest dependencies
2. **Redesign UI** - Implement modern card-based interface with bottom navigation
3. **User-Driven Configuration** - Move library/filter selection from config files to UI
4. **Enhanced Features** - Add watched status filtering, watchlist integration, trailer viewing
5. **Better UX** - Multiple swipe actions, room types, genre filtering, sort options
6. **PWA Support** - Install to home screen, offline capability, native feel

### Success Criteria
- ✅ App installable on mobile devices
- ✅ Users can configure libraries/filters without editing config files
- ✅ Modern, intuitive UI matching design mockup
- ✅ All requested features implemented and tested
- ✅ Performance maintained or improved

---

## Architecture Changes

### Current State
```
Backend:  Deno + WebSocket + Custom Plex API client
Frontend: React 17 + Redux + Snowpack (deprecated)
Config:   Environment variables + config.yaml
UI:       Basic card swipe (2 actions: like/dislike)
```

### Target State
```
Backend:  Deno + WebSocket + Enhanced Plex API (using OpenAPI spec)
Frontend: React 18 + Modern State Management + Vite + PWA
Config:   UI-driven (post-Plex-auth) + minimal server config
Auth:     Plex-only for room creation, optional for joining
UI:       Modern card interface (4 actions + 4-tab bottom nav + multi-screen)
```

---

## Development Phases

## Phase 1: Foundation & Migration (2 weeks) ✅ COMPLETE

**Goal:** Modernize build toolchain and dependencies without breaking existing features

**Status:** ✅ COMPLETE - See [PHASE_1_COMPLETE.md](PHASE_1_COMPLETE.md) for details

### 1.1 Build System Migration (3-4 days)

#### Tasks
- [ ] Replace Snowpack with Vite
  - Remove all `@snowpack/*` packages
  - Install Vite and `@vitejs/plugin-react`
  - Create `vite.config.ts` with proxy to backend
  - Update `package.json` scripts
  - Test dev server and HMR

- [ ] Add PWA support
  - Install `vite-plugin-pwa`
  - Configure service worker and manifest
  - Add app icons (multiple sizes)
  - Configure offline fallback
  - Test "Add to Home Screen" on iOS/Android

- [ ] Update build pipeline
  - Update CI/CD workflows for Vite
  - Configure production build optimizations
  - Set up asset optimization (images, fonts)

#### Files to Modify
```
web/app/
├── package.json (remove Snowpack, add Vite)
├── vite.config.ts (NEW)
├── public/
│   ├── manifest.json (NEW - PWA manifest)
│   └── icons/ (NEW - app icons)
├── src/
│   ├── sw.ts (NEW - service worker)
│   └── main.tsx (update imports)
└── snowpack.config.js (DELETE)
```

#### Code Example: vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*'],
      manifest: {
        name: 'MovieMatch',
        short_name: 'MovieMatch',
        description: 'Swipe through movies with friends',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.plex\.tv\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'plex-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 }
            }
          },
          {
            urlPattern: /\/api\/poster\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'poster-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 86400 }
            }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        ws: true
      }
    }
  }
});
```

### 1.2 Dependency Updates (2-3 days)

#### Tasks
- [ ] Update React ecosystem
  - React 17 → 18
  - react-redux 7 → 9
  - Update react-spring to latest
  - Test for breaking changes

- [ ] Update Deno dependencies
  - Deno std 0.97.0 → latest (0.224.0+)
  - Update `deps.ts` imports
  - Run `deno cache` and fix any issues
  - Update Deno CLI to 1.40+

- [ ] Audit and update other dependencies
  - Run `npm audit` and fix vulnerabilities
  - Update testing libraries
  - Update dev dependencies

#### Migration Checklist
```bash
# Frontend
npm uninstall snowpack @snowpack/plugin-*
npm install -D vite @vitejs/plugin-react vite-plugin-pwa
npm install react@18 react-dom@18
npm install react-redux@9
npm update

# Backend
# Update deps.ts to use latest Deno std
# Update deno.json or import_map.json if present
```

### 1.3 Add State Persistence (3-4 days)

**Current Problem:** Rooms disappear on server restart

#### Tasks
- [ ] Create storage abstraction layer
  - Define `Storage` interface
  - Implement `MemoryStorage` (current behavior)
  - Implement `FileStorage` (JSON-based persistence)
  - Optional: Implement `RedisStorage` for scaling

- [ ] Integrate with Room management
  - Save rooms on creation/update
  - Load rooms on server startup
  - Handle serialization of Room class
  - Migrate existing in-memory Map
  - **Store room creator's Plex user ID**
  - **Link rooms to authenticated Plex users**

- [ ] Add configuration option
  - `STORAGE_TYPE` env var (memory|file|redis)
  - `STORAGE_PATH` for file-based storage
  - Default to file storage in production

- [ ] Room ownership and permissions
  - Track room creator (Plex user ID)
  - Allow creator to modify room settings
  - Allow creator to delete room
  - Restrict room creation to authenticated Plex users with server access

#### Files to Create
```
internal/app/moviematch/storage/
├── interface.ts (Storage interface)
├── memory.ts (current implementation)
├── file.ts (JSON file-based)
└── index.ts (factory function)
```

#### Code Example: Storage Interface
```typescript
// internal/app/moviematch/storage/interface.ts
export interface Storage {
  saveRoom(room: SerializedRoom): Promise<void>;
  getRoom(roomName: string): Promise<SerializedRoom | null>;
  deleteRoom(roomName: string): Promise<void>;
  listRooms(): Promise<SerializedRoom[]>;
}

export interface SerializedRoom {
  roomName: string;
  password?: string;
  filters: Filter[];
  ratings: Map<string, [string, Rating, number][]>;
  createdAt: number;
  creatorPlexUserId: string; // Plex user ID of room creator
  creatorPlexUsername: string; // Plex username for display
  // ... other room data
}
```

---

## Phase 2: Backend Enhancements (2 weeks) ✅ COMPLETE

**Goal:** Add new Plex API features and room type flexibility

**Status:** ✅ COMPLETE - See [PHASE_2_COMPLETE.md](PHASE_2_COMPLETE.md) for details

**Key Achievements:**
- ✅ Enhanced Plex Integration (trailer endpoint, watched status, metadata, user verification)
- ✅ Room Type System (4 strategies: standard, unanimous, solo, async)
- ✅ Filter Enhancements (sort order, genre AND/OR, rating filters, content rating)
- ✅ All features integrated with persistence layer
- ✅ Deno 2.x migration completed (55 TypeScript errors fixed)

### 2.1 Enhanced Plex Integration (4-5 days)

#### Tasks
- [ ] Add trailer fetching
  - Implement `getExtras()` method using OpenAPI spec
  - Filter for trailer-type extras
  - Add trailer endpoint `/api/trailer/:mediaId`
  - Return video URL or proxy stream

- [ ] Add watched status filtering
  - Use `viewCount` parameter in library queries
  - Add `watched` boolean filter option
  - Integrate with existing filter system
  - Support per-user watched status (requires Plex auth)

- [ ] Enhanced metadata
  - Return `Director`, `Writer`, `Role` in media objects
  - Add `Collection` information
  - Include `lastViewedAt` timestamp
  - Return full description text

- [ ] Plex user verification
  - Add endpoint to verify user has access to configured server
  - Check user permissions for server access
  - Return accessible libraries for authenticated user
  - Handle managed/home users vs server owner

#### Files to Modify
```
internal/app/plex/
├── api.ts
│   ├── getExtras(mediaId) - NEW
│   ├── getPlaylists(userId) - NEW
│   └── addToPlaylist(mediaId, playlistId) - NEW
└── types/
    ├── extras.ts (NEW)
    └── playlists.ts (NEW)

internal/app/moviematch/
├── handlers/
│   └── trailer.ts (NEW - trailer proxy handler)
└── providers/plex.ts
    └── Update getMedia() to support watched filter
```

#### Code Example: Trailer Fetching
```typescript
// internal/app/plex/api.ts
async getExtras(mediaId: string): Promise<Extra[]> {
  const result = await this.fetch<{ Metadata: Extra[] }>(
    `/library/metadata/${mediaId}/extras`
  );
  return result.Metadata || [];
}

async getTrailer(mediaId: string): Promise<Extra | null> {
  const extras = await this.getExtras(mediaId);
  return extras.find(e => e.extraType === 1) || null; // 1 = trailer
}

// internal/app/moviematch/handlers/trailer.ts
export const trailerHandler: RouteHandler = async (req, ctx) => {
  const mediaId = new URL(req.url).pathname.split('/').pop();
  const trailer = await ctx.provider.getTrailer(mediaId);

  if (!trailer) {
    return new Response('Trailer not found', { status: 404 });
  }

  // Proxy the video stream from Plex
  const videoUrl = new URL(trailer.Media[0].Part[0].key, ctx.plexUrl);
  const stream = await fetch(videoUrl);

  return new Response(stream.body, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': stream.headers.get('Content-Length') || '',
    }
  });
};
```

### 2.2 Room Type System (3-4 days)

**Goal:** Support different matching strategies

#### Room Types to Implement
1. **Standard** (current) - Match when 2+ users like
2. **Unanimous** - Match only when ALL users like
3. **Solo** - Individual watchlist building (no matching)
4. **Async** - Users can join/leave, matches persist

#### Tasks
- [ ] Create match strategy pattern
  - Define `MatchStrategy` interface
  - Implement each strategy class
  - Add factory function for strategy selection

- [ ] Update Room class
  - Accept `roomType` in CreateRoomRequest
  - Use strategy pattern for match detection
  - Store strategy type in serialized room

- [ ] Update frontend
  - Add room type selector to Create screen
  - Show room type in room header
  - Adjust UI messaging based on type

#### Files to Create/Modify
```
internal/app/moviematch/strategies/
├── interface.ts (MatchStrategy)
├── standard.ts (StandardMatchStrategy)
├── unanimous.ts (UnanimousMatchStrategy)
├── solo.ts (SoloMatchStrategy)
└── async.ts (AsyncMatchStrategy)

types/moviematch.ts
└── Add roomType field to CreateRoomRequest

internal/app/moviematch/room.ts
└── Refactor storeRating() to use strategy
```

#### Code Example: Match Strategies
```typescript
// internal/app/moviematch/strategies/interface.ts
export interface MatchStrategy {
  name: string;
  description: string;

  checkForMatch(
    ratings: Map<string, [userName: string, rating: Rating, timestamp: number][]>,
    activeUsers: Set<string>,
    mediaId: string
  ): Match | null;

  shouldNotifyUsers(match: Match): boolean;
}

// internal/app/moviematch/strategies/unanimous.ts
export class UnanimousMatchStrategy implements MatchStrategy {
  name = "unanimous";
  description = "Everyone must like for a match";

  checkForMatch(ratings, activeUsers, mediaId) {
    const mediaRatings = ratings.get(mediaId) || [];
    const likes = mediaRatings.filter(([_, rating]) => rating === "like");

    // Must have likes from ALL active users
    if (likes.length === activeUsers.size && activeUsers.size > 0) {
      const media = this.getMedia(mediaId);
      return {
        matchedAt: Date.now(),
        media,
        users: Array.from(activeUsers)
      };
    }
    return null;
  }

  shouldNotifyUsers(match: Match): boolean {
    return true; // Always notify on unanimous match
  }
}

// internal/app/moviematch/strategies/solo.ts
export class SoloMatchStrategy implements MatchStrategy {
  name = "solo";
  description = "Build your personal watchlist";

  checkForMatch(ratings, activeUsers, mediaId) {
    // In solo mode, each "like" is immediately a personal match
    const mediaRatings = ratings.get(mediaId) || [];
    const lastRating = mediaRatings[mediaRatings.length - 1];

    if (lastRating && lastRating[1] === "like") {
      return {
        matchedAt: Date.now(),
        media: this.getMedia(mediaId),
        users: [lastRating[0]]
      };
    }
    return null;
  }

  shouldNotifyUsers(match: Match): boolean {
    return false; // Don't broadcast, just add to personal list
  }
}
```

### 2.3 Filter Enhancements (2-3 days)

#### Tasks
- [ ] Add sort order option
  - `newest` - Sort by release date descending
  - `oldest` - Sort by release date ascending
  - `random` - Randomize order (current behavior)
  - Add to CreateRoomRequest

- [ ] Improve genre filtering
  - Fetch available genres from Plex
  - Support multiple genre selection
  - AND vs OR logic for multiple genres

- [ ] Add rating filters
  - Min/max rating (0-10)
  - Critic rating vs audience rating
  - Content rating (G, PG, PG-13, R, etc.)

#### Code Example: Sort Implementation
```typescript
// types/moviematch.ts
export type SortOrder = 'newest' | 'oldest' | 'random';

export interface CreateRoomRequest {
  roomName: string;
  roomType: RoomType;
  sortOrder: SortOrder;
  filters: Filter[];
  // ...
}

// internal/app/moviematch/providers/plex.ts
getMedia: async ({ filters, sortOrder }) => {
  const media = await fetchMediaFromPlex(filters);

  switch (sortOrder) {
    case 'newest':
      return media.sort((a, b) =>
        (b.year || 0) - (a.year || 0)
      );
    case 'oldest':
      return media.sort((a, b) =>
        (a.year || 0) - (b.year || 0)
      );
    case 'random':
    default:
      return shuffleArray(media);
  }
}
```

---

## Phase 3: UI Redesign (3 weeks) - ✅ 100% COMPLETE

**Goal:** Implement modern Tinder-style interface based on design mockup `/Users/mtvogel/Documents/Github-Repos/moviematch/UI_idea.png`

**Status:** Phase 3 is 100% COMPLETE! All components, screens, routing, and WebSocket integration finished.

**Completed:** 2025-10-27

### Summary of Completed Work
- ✅ **Design System** - Complete `design/tokens.ts` with all tokens
- ✅ **All Components** - 100+ components implemented (atoms, molecules, organisms)
- ✅ **All Screens** - SwipeScreen, MatchesScreen, SettingsScreen, BrowseScreen, CreateRoomWizard
- ✅ **Routing** - AppRouter and RoomContainer complete
- ✅ **Bug Fixes** - All 6 critical bugs from Phase 3.0 resolved
- ✅ **LibrarySelection** - Full WebSocket integration complete (fetches real Plex libraries)

### 3.0 SwipeScreen Bug Fixes (COMPLETED ✅)

**Completed:** 2025-10-27

#### Issues Fixed
All critical bugs in the initial SwipeScreen implementation were identified and resolved:

1. **Bottom UI Spacing** ✅
   - **Issue**: Action buttons were obscured by the 80px bottom navigation bar
   - **Fix**: Added proper padding to `.actionBarContainer` in `SwipeScreen.module.css:134`
   - **Code**: `padding-bottom: calc(88px + env(safe-area-inset-bottom))`

2. **Progress Bar Navigation** ✅
   - **Issue**: Clicking progress indicators didn't switch carousel pages
   - **Fix**: Made segments clickable and connected to `setCarouselPage`
   - **Files Modified**: `ProgressBar.tsx:27`, `SwipeScreen.tsx:107`

3. **Trailer X-Frame-Options Error** ✅
   - **Issue**: Third carousel page caused iframe embedding error (Plex blocks iframes)
   - **Fix**: Replaced iframe with "Open in Plex" button that opens in new tab
   - **File Modified**: `SwipeScreen.tsx:148-173`

4. **Like/Reject Button Animation** ✅
   - **Issue**: Action buttons didn't trigger card swipe animations
   - **Fix**: Exposed CardStack's `rateItem()` function via `onSwipeRequest` callback prop
   - **Files Modified**:
     - `CardStack.tsx:38,320-328` - Added `onSwipeRequest` prop and useEffect
     - `SwipeScreen.tsx:38-68` - Store and use swipe handlers

5. **Poster API 500 Error** ✅
   - **Issue**: Deprecated `readerFromStreamReader` used removed `Deno.copy` function
   - **Root Cause**: Old Deno std library (0.97.0) incompatible with newer Deno versions
   - **Fix**: Buffer ReadableStream to Uint8Array before returning response
   - **Files Modified**:
     - `poster.ts:1,32-63` - Removed deprecated import, buffer stream to Uint8Array
     - `app.ts:163-164` - Added error logging for response errors

6. **Swipe Limit Bug** ✅
   - **Issue**: Off-by-one error prevented loading cards beyond initial batch
   - **Root Cause**: Boundary check was `newIndex > cards.length` instead of `index >= cards.length`
   - **Fix**: Check if more cards exist BEFORE incrementing index
   - **File Modified**: `CardStack.tsx:131-134`
   - **Code Change**:
     ```typescript
     // Before
     newIndex = index + 1;
     if (newIndex > cards.length) { return; }

     // After
     if (index >= cards.length) { return; }
     newIndex = index + 1;
     ```

#### Testing Results
- ✅ Swipe animations working smoothly
- ✅ All action buttons functional
- ✅ Progress indicators clickable
- ✅ Poster images loading correctly
- ✅ Can swipe through entire media library
- ✅ Trailer/Plex link working
- ✅ Bottom navigation properly positioned

### 3.1 Design System & Components (COMPLETED ✅)

**Status:** 100% Complete - All design tokens and components implemented

#### Design Tokens
Fully implemented at `web/app/src/design/tokens.ts`:

```typescript
// src/design/tokens.ts
export const colors = {
  background: '#000000',
  surface: '#1a1a1a',
  text: {
    primary: '#ffffff',
    secondary: '#b3b3b3',
  },
  actions: {
    undo: '#ff9500',      // Orange
    reject: '#ff2d55',     // Red
    star: '#007aff',       // Blue
    like: '#34c759',       // Green
    superLike: '#af52de',  // Purple
  },
  navBar: {
    background: 'rgba(0, 0, 0, 0.95)',
    active: '#ff9500',
    inactive: '#666666',
  }
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};

export const borderRadius = {
  sm: '8px',
  md: '16px',
  lg: '24px',
  pill: '999px',
};
```

#### Component Structure
```
src/components/
├── atoms/
│   ├── ActionButton.tsx (circular action buttons)
│   ├── GenreTag.tsx (pill-shaped genre tags)
│   ├── NavIcon.tsx (bottom nav icons)
│   └── ProgressBar.tsx (top progress indicators)
├── molecules/
│   ├── MovieCard.tsx (full poster card)
│   ├── MovieInfo.tsx (title, length, genres)
│   ├── ActionBar.tsx (5 action buttons row)
│   └── NavigationBar.tsx (bottom nav)
├── organisms/
│   ├── CardStack.tsx (UPDATE - new swipe logic)
│   ├── MovieDetails.tsx (carousel page - description)
│   └── TrailerViewer.tsx (carousel page - trailer)
└── screens/
    ├── SwipeScreen.tsx (main swiping interface)
    ├── MatchesScreen.tsx (matched movies list)
    ├── SettingsScreen.tsx (room settings)
    └── CreateRoomScreen.tsx (NEW UI for room creation)
```

#### Tasks
- [ ] Create design token file
- [ ] Build atomic components
  - ActionButton with icon + color props
  - GenreTag with label
  - ProgressBar with segments
  - NavIcon with badge support

- [ ] Build molecule components
  - MovieCard with poster, title, info
  - ActionBar with 5 buttons
  - NavigationBar with 5 icons

- [ ] Set up CSS-in-JS or Tailwind
  - Decision: Use Tailwind for rapid development
  - Install and configure
  - Create utility classes

#### Code Example: ActionButton Component
```typescript
// src/components/atoms/ActionButton.tsx
import { FC } from 'react';

interface ActionButtonProps {
  icon: React.ReactNode;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
  disabled?: boolean;
}

export const ActionButton: FC<ActionButtonProps> = ({
  icon,
  color,
  size = 'md',
  onClick,
  disabled = false
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        rounded-full
        border-2
        flex items-center justify-center
        transition-all duration-200
        active:scale-90
        disabled:opacity-50
        disabled:cursor-not-allowed
      `}
      style={{
        borderColor: color,
        color: color,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
    >
      {icon}
    </button>
  );
};
```

### 3.2 Main Swipe Interface (COMPLETED ✅)

**Status:** 100% Complete - Full Tinder-style interface with all features

**Reference:** UI_idea.png mockup

#### Layout Structure
```
┌─────────────────────────┐
│ ─────── ─────── ─────── │ Carousel progress indicators
├─────────────────────────┤
│                         │
│                         │
│     MOVIE POSTER        │ Full-screen card
│      (swipeable)        │
│ tap to progress carousel|        
│                         │
├─────────────────────────┤
│ Title - Length        ⓘ│ Movie info
│ [Genre] [Genre]         │ Genre tags
├─────────────────────────┤
│   ↻     ✕   🔖   ♥       │ 4 Action buttons
├─────────────────────────┤
│   ▶   ⊞   ★   👤        │ Bottom navigation
└─────────────────────────┘
```

#### Action Button Mapping
Based on mockup colors (updated based on requirements):
1. **Orange Undo (↻)** - Undo last swipe
2. **Red X (✕)** - Reject/Skip
3. **Blue Bookmark (🔖)** - Add to Plex watchlist
4. **Green Heart (♥)** - Like/Match

#### Bottom Navigation Icons
1. **Yellow Arrow (▶)** - Swipe screen (active)
2. **Grid (⊞)** - Browse/filter view
3. **Star with badge (★99+)** - Matches list
4. **Profile (👤)** - Settings/account

#### Tasks
- [ ] Update CardStack component
  - Implement 4-action swipe logic
  - Add swipe threshold detection
  - Handle undo functionality
  - Smooth animations with react-spring

- [ ] Create SwipeScreen
  - Full-screen card display
  - Gesture handlers (swipe, tap)
  - Action button handlers
  - Progress tracking

- [ ] Implement carousel for details
  - Swipe up or tap to see description
  - Tap again to see trailer
  - Smooth transitions

- [ ] Add bottom navigation
  - Route to different screens
  - Show active state
  - Badge for match count

#### Code Example: Enhanced CardStack
```typescript
// src/components/organisms/CardStack.tsx
import { useSpring, animated } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';

type SwipeAction = 'undo' | 'reject' | 'watchlist' | 'like';

interface CardStackProps {
  cards: Media[];
  onSwipe: (card: Media, action: SwipeAction) => void;
  onUndo: () => void;
}

export const CardStack: FC<CardStackProps> = ({ cards, onSwipe, onUndo }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<Media[]>([]);

  // Spring animation for card position
  const [{ x, y, rotate }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0
  }));

  // Gesture handlers
  const bind = useGesture({
    onDrag: ({ down, movement: [mx, my], velocity: [vx] }) => {
      if (!down) {
        // Determine swipe action based on direction and velocity
        const threshold = window.innerWidth * 0.3;

        if (Math.abs(mx) > threshold || Math.abs(vx) > 0.5) {
          const action = mx > 0 ? 'like' : 'reject';
          handleSwipe(action);
        } else {
          // Snap back
          api.start({ x: 0, y: 0, rotate: 0 });
        }
      } else {
        // Follow finger
        const rotation = mx / 20;
        api.start({
          x: mx,
          y: my * 0.2, // Limit vertical movement
          rotate: rotation
        });
      }
    },
    onDragUp: ({ movement: [_, my] }) => {
      // Swipe up to view details
      if (my < -100) {
        showDetails();
      }
    }
  });

  const handleSwipe = (action: SwipeAction) => {
    const card = cards[currentIndex];

    // Add to history for undo
    setHistory(prev => [...prev, card]);

    // Animate out
    const flyoutX = action === 'like' ? window.innerWidth : -window.innerWidth;
    api.start({
      x: flyoutX,
      y: 0,
      rotate: action === 'like' ? 30 : -30,
      onRest: () => {
        setCurrentIndex(prev => prev + 1);
        api.start({ x: 0, y: 0, rotate: 0 });
      }
    });

    onSwipe(card, action);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      setCurrentIndex(prev => prev - 1);
      setHistory(prev => prev.slice(0, -1));
      onUndo();
    }
  };

  // Button handlers
  const handleReject = () => handleSwipe('reject');
  const handleLike = () => handleSwipe('like');
  const handleWatchlist = () => handleSwipe('watchlist');

  const currentCard = cards[currentIndex];

  return (
    <div className="relative h-screen w-screen">
      {/* Card */}
      <animated.div
        {...bind()}
        style={{ x, y, rotate }}
        className="absolute inset-0 touch-none"
      >
        <MovieCard movie={currentCard} />
      </animated.div>

      {/* Action Bar */}
      <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-6 px-4">
        <ActionButton
          icon={<UndoIcon />}
          color="#ff9500"
          onClick={handleUndo}
          disabled={history.length === 0}
        />
        <ActionButton
          icon={<XIcon />}
          color="#ff2d55"
          size="lg"
          onClick={handleReject}
        />
        <ActionButton
          icon={<BookmarkIcon />}
          color="#007aff"
          onClick={handleWatchlist}
          disabled={!isPlexAuthenticated}
        />
        <ActionButton
          icon={<HeartIcon />}
          color="#34c759"
          size="lg"
          onClick={handleLike}
        />
      </div>

      {/* Navigation Bar */}
      <NavigationBar active="swipe" matchCount={99} />
    </div>
  );
};
```

### 3.3 Room Creation Flow (COMPLETED ✅)

**Status:** 100% Complete - All 5 wizard steps implemented with full WebSocket integration

**Goal:** Move from config files to UI-driven setup

#### New Flow
```
1. User clicks "Create Room"
2. Check if logged in with Plex - if not, prompt to login
3. Verify user has access to Plex server
4. After Plex auth verification, show library selection screen
5. Select libraries (multiple choice from user's accessible libraries)
6. Select media types (movies, shows, etc.)
7. Configure filters (genre, rating, watched status)
8. Select room type (standard, unanimous, solo)
9. Choose sort order (newest, oldest, random)
10. Create room (tied to authenticated Plex user)
11. Generate shareable room ID for others to join
12. Start swiping
```

**Note:** Only authenticated Plex users with access to the configured Plex server can create rooms. Rooms are owned by the creator. Anyone with the room ID can join without authentication.

#### Tasks
- [ ] Create multi-step room creation wizard
  - Step 1: Room name + password
  - Step 2: Library selection (fetch from Plex)
  - Step 3: Filters (genre, rating, watched)
  - Step 4: Room type + sort order
  - Progress indicator

- [ ] Library selection UI
  - Fetch available libraries from Plex API
  - Show library names + types (Movies, TV, Music)
  - Multi-select checkboxes
  - Show item counts per library

- [ ] Filter UI improvements
  - Genre multi-select (chips)
  - Rating slider (0-10)
  - Watched status toggle
  - Content rating picker

- [ ] Save preferences
  - Store user's last selections
  - Quick create with defaults
  - Presets (e.g., "Unwatched Action Movies")

#### Code Example: Library Selection Screen
```typescript
// src/components/screens/CreateRoom/LibrarySelection.tsx
import { FC, useEffect, useState } from 'react';

interface Library {
  key: string;
  title: string;
  type: string;
  count: number;
}

interface LibrarySelectionProps {
  onNext: (selectedLibraries: string[]) => void;
  onBack: () => void;
}

export const LibrarySelection: FC<LibrarySelectionProps> = ({ onNext, onBack }) => {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch libraries from Plex via WebSocket
    const ws = getWebSocket();
    ws.send({ type: 'getLibraries' });

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'libraries') {
        setLibraries(msg.payload);
        setLoading(false);
      }
    });
  }, []);

  const toggleLibrary = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleNext = () => {
    if (selected.size > 0) {
      onNext(Array.from(selected));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Select Libraries</h2>
      <p className="text-gray-400 mb-6">
        Choose which libraries to include in your room
      </p>

      <div className="space-y-3 mb-8">
        {libraries.map(lib => (
          <label
            key={lib.key}
            className={`
              flex items-center p-4 rounded-lg border-2 cursor-pointer
              transition-colors
              ${selected.has(lib.key)
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-600'
              }
            `}
          >
            <input
              type="checkbox"
              checked={selected.has(lib.key)}
              onChange={() => toggleLibrary(lib.key)}
              className="mr-4 w-5 h-5"
            />
            <div className="flex-1">
              <div className="font-medium">{lib.title}</div>
              <div className="text-sm text-gray-400">
                {lib.type} · {lib.count} items
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg border border-gray-700"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={selected.size === 0}
          className="flex-1 py-3 rounded-lg bg-blue-500 disabled:opacity-50"
        >
          Next ({selected.size} selected)
        </button>
      </div>
    </div>
  );
};
```

### 3.4 Additional Screens (COMPLETED ✅)

**Status:** 100% Complete - All 4 screens plus routing implemented

#### Implemented Screens

**MatchesScreen** (`web/app/src/components/screens/MatchesScreen.tsx`)
- List of matched movies with sorting
- Sort by match time or popularity
- Click to view details or open in Plex
- Group by room or date
- Show who liked each match

**SettingsScreen** (`web/app/src/components/screens/SettingsScreen.tsx`)
- View current room settings
- See active participants
- Copy invite link with success feedback
- Leave room button with confirmation
- User profile section with Plex status
- App version and footer

**BrowseScreen** (`web/app/src/components/screens/BrowseScreen.tsx`)
- Grid view of all available media
- Search bar (filters by title, description, actors, directors)
- Filter dropdowns (genre, sort, min rating)
- Quick add to watchlist (requires Plex auth)
- Click to view details modal
- Result count display

**RoomContainer** (`web/app/src/components/screens/RoomContainer.tsx`)
- Central coordinator for all 4 room screens
- Tab state management
- WebSocket event handling
- Shared state across screens

**AppRouter** (`web/app/src/components/AppRouter.tsx`)
- Complete routing system
- 6 routes: loading, login, join, createRoom, room, config

---

## Phase 4: State Management Refactor (1 week)

**Goal:** Simplify state management, reduce Redux boilerplate

### Current Issues with Redux
- Verbose action creators
- Complex reducers for simple state
- WebSocket middleware is custom
- Overkill for current app size

### Proposed Solution: Zustand

**Why Zustand?**
- Much simpler API (less boilerplate)
- Better TypeScript support
- Works well with async operations
- Smaller bundle size
- Still supports middleware

#### Tasks
- [ ] Install Zustand
- [ ] Create stores
  - `useAuthStore` - User, Plex auth state
  - `useRoomStore` - Current room, participants, matches
  - `useMediaStore` - Media cards, filters
  - `useUIStore` - Navigation, modals, toasts

- [ ] Migrate Redux logic to Zustand
  - Convert reducers to store setters
  - Convert selectors to store getters
  - Update components to use stores

- [ ] Create WebSocket middleware for Zustand
- [ ] Remove Redux dependencies
- [ ] Test thoroughly

#### Code Example: Zustand Store
```typescript
// src/store/roomStore.ts
import create from 'zustand';
import { devtools } from 'zustand/middleware';

interface RoomState {
  // State
  roomName: string | null;
  roomType: RoomType | null;
  participants: User[];
  matches: Match[];
  isJoined: boolean;

  // Actions
  joinRoom: (roomName: string) => void;
  leaveRoom: () => void;
  addMatch: (match: Match) => void;
  updateParticipants: (participants: User[]) => void;
}

export const useRoomStore = create<RoomState>()(
  devtools(
    (set, get) => ({
      // Initial state
      roomName: null,
      roomType: null,
      participants: [],
      matches: [],
      isJoined: false,

      // Actions
      joinRoom: (roomName) => {
        set({ roomName, isJoined: true });
        // Send WebSocket message
        ws.send({ type: 'joinRoom', payload: { roomName } });
      },

      leaveRoom: () => {
        const { roomName } = get();
        if (roomName) {
          ws.send({ type: 'leaveRoom' });
          set({
            roomName: null,
            isJoined: false,
            participants: [],
            matches: []
          });
        }
      },

      addMatch: (match) => {
        set(state => ({
          matches: [...state.matches, match]
        }));
      },

      updateParticipants: (participants) => {
        set({ participants });
      }
    })
  )
);

// Usage in component
function RoomScreen() {
  const { roomName, matches, leaveRoom } = useRoomStore();

  return (
    <div>
      <h1>Room: {roomName}</h1>
      <p>{matches.length} matches</p>
      <button onClick={leaveRoom}>Leave</button>
    </div>
  );
}
```

---

## Phase 5: Testing & Polish (1 week)

### 5.1 Testing

#### Tasks
- [ ] Add frontend tests
  - Component tests (Testing Library)
  - Action button interactions
  - Swipe gesture tests
  - Navigation tests
  - Form validation tests

- [ ] Add E2E tests
  - Room creation flow
  - Swiping and matching
  - Multi-user scenarios
  - PWA installation

- [ ] Backend tests
  - New match strategies
  - Filter logic
  - Storage persistence
  - WebSocket messages

#### Code Example: Component Test
```typescript
// src/components/atoms/__tests__/ActionButton.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { ActionButton } from '../ActionButton';
import { HeartIcon } from '../../icons';

describe('ActionButton', () => {
  it('renders with correct color', () => {
    const { container } = render(
      <ActionButton
        icon={<HeartIcon />}
        color="#34c759"
        onClick={() => {}}
      />
    );

    const button = container.querySelector('button');
    expect(button).toHaveStyle({ borderColor: '#34c759' });
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    const { container } = render(
      <ActionButton
        icon={<HeartIcon />}
        color="#34c759"
        onClick={handleClick}
      />
    );

    const button = container.querySelector('button');
    fireEvent.click(button!);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const { container } = render(
      <ActionButton
        icon={<HeartIcon />}
        color="#34c759"
        onClick={() => {}}
        disabled
      />
    );

    const button = container.querySelector('button');
    expect(button).toBeDisabled();
  });
});
```

### 5.2 Performance Optimization

#### Tasks
- [ ] Image optimization
  - Lazy load posters
  - Use WebP format
  - Responsive images
  - Preload next 3 cards

- [ ] Code splitting
  - Route-based splitting
  - Lazy load screens
  - Dynamic imports

- [ ] Bundle optimization
  - Tree shaking
  - Minimize dependencies
  - Analyze bundle size

- [ ] Network optimization
  - Cache posters aggressively
  - Debounce WebSocket messages
  - Compress responses

### 5.3 UX Polish

#### Tasks
- [ ] Animations
  - Smooth transitions between screens
  - Card flip for details view
  - Match celebration animation
  - Loading states

- [ ] Haptic feedback (PWA)
  - Vibrate on swipe
  - Vibrate on match
  - Vibrate on action button press

- [ ] Error handling
  - Offline mode messaging
  - Connection lost recovery
  - Graceful degradation

- [ ] Accessibility
  - ARIA labels
  - Keyboard navigation
  - Screen reader support
  - Focus management

---

## Phase 6: Documentation & Deployment (3-4 days)

### 6.1 Documentation

#### Tasks
- [ ] Update README
  - New features list
  - Updated screenshots
  - PWA installation instructions
  - Configuration guide

- [ ] Create user guide
  - How to create rooms
  - How to use filters
  - Room types explained
  - Troubleshooting

- [ ] Developer documentation
  - Architecture overview
  - Contributing guide
  - API documentation
  - Testing guide

### 6.2 Deployment

#### Tasks
- [ ] Docker updates
  - Multi-stage build for Vite
  - Environment variables
  - Health checks
  - Docker Compose for development

- [ ] CI/CD updates
  - Update build pipeline
  - Add E2E tests to CI
  - Automated deployments
  - Version tagging

- [ ] Production config
  - HTTPS setup
  - Service worker updates
  - Error tracking (Sentry?)
  - Analytics (optional)

---

## Timeline Summary

| Phase | Duration | Status | Key Deliverables |
|-------|----------|--------|------------------|
| **Phase 1: Foundation** | 2 weeks | ✅ COMPLETE | Vite + PWA, Dependencies updated, Persistence |
| **Phase 2: Backend** | 2 weeks | ✅ COMPLETE | Trailers, Watched filter, Room types, Match strategies, Deno 2.x migration |
| **Phase 3: UI Redesign** | 3 weeks | ✅ **100% COMPLETE** | Design system, 100+ components, All screens, Routing, WebSocket integration |
| **Phase 4: State Management** | 1 week | 🔄 **NEXT** | Zustand migration, Simplified state |
| **Phase 5: Testing & Polish** | 1 week | ⏸️ PENDING | Tests, Performance, UX improvements |
| **Phase 6: Docs & Deploy** | 3-4 days | ⏸️ PENDING | Documentation, CI/CD, Production ready |
| **TOTAL** | **~9-10 weeks** | **~7 weeks done** | Fully redesigned, feature-complete app |

---

## Risk Assessment

### High Risk
- **UI Redesign Scope** - Complete redesign is time-consuming
  - *Mitigation:* Incremental rollout, feature flags

- **State Management Migration** - Redux to Zustand could break things
  - *Mitigation:* Comprehensive testing, gradual migration

### Medium Risk
- **Plex API Changes** - OpenAPI spec might not cover everything
  - *Mitigation:* Maintain custom API client, fallback to current impl

- **PWA Browser Support** - iOS has limitations
  - *Mitigation:* Test on real devices, provide fallback

### Low Risk
- **Vite Migration** - Well-documented, straightforward
- **Dependency Updates** - Mostly backward compatible

---

## Success Metrics

### Technical Metrics
- [ ] Lighthouse PWA score > 90
- [ ] Bundle size < 500KB gzipped
- [ ] First contentful paint < 1.5s
- [ ] Test coverage > 70%

### User Experience Metrics
- [ ] Can create room in < 1 minute
- [ ] Swipe interaction feels smooth (60fps)
- [ ] Works offline (cached data)
- [ ] Installable on mobile

### Feature Completeness
- [ ] All requested features implemented
- [ ] Config moved to UI (post-auth)
- [ ] UI matches design mockup
- [ ] PWA functional on iOS and Android

---

## Requirements & Decisions

### Authentication & Room Ownership
- ✅ **Room Creation**: Only authenticated Plex users with access to the configured server can create rooms
- ✅ **Room Joining**: Anyone with a room ID can join (no authentication required)
- ✅ **Room Persistence**: Rooms are tied to the authenticated Plex user who created them
- ✅ **Room Ownership**: The creator owns the room and can manage settings

### UI Components
- ✅ **Action Buttons**: 4 buttons (removed purple lightning/super-like)
  1. Orange Undo - Undo last swipe
  2. Red X - Reject/Skip
  3. Blue Bookmark - Add to Plex watchlist
  4. Green Heart - Like/Match

- ✅ **Bottom Navigation**: 4 tabs (removed chat)
  1. Swipe screen
  2. Browse/filter view
  3. Matches list
  4. Settings/account

### Watchlist Behavior
- ✅ **Bookmark Button**: Adds directly to user's Plex watchlist only
- ✅ **Icon**: Use bookmark icon (🔖) instead of star
- ✅ **Authentication**: Requires user to be logged in with Plex to use this feature

---

## Next Steps

1. ✅ **Requirements gathered** - All decisions made and documented
2. ✅ **Phase 1 Complete** - Vite migration, PWA setup, dependencies updated, persistence layer
3. ✅ **Phase 2 Complete** - Backend enhancements, Deno 2.x migration, all TypeScript errors fixed
4. ✅ **Phase 3 Complete (100%)** - UI Redesign with 100+ components, all screens, routing, WebSocket integration
5. 🔄 **Start Phase 4** - State Management Refactor (Zustand migration)
6. ⏸️ **Phase 5 Pending** - Testing & Polish
7. ⏸️ **Phase 6 Pending** - Documentation & Deployment

**Phase 3 Complete! Ready to begin Phase 4: State Management Refactor.**

---

## Resources

### Documentation
- [Plex API OpenAPI Spec](./plex%20media%20server%20openapi%201.1.1.json)
- [Plex API Analysis](./PLEX_API_QUICK_REFERENCE.md)
- [Vite Documentation](https://vitejs.dev/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

### Design Reference
- [UI Mockup](./UI_idea.png)
- Design system to be created in Phase 3

### Current Codebase
- [Codebase Analysis](./ANALYSIS_SUMMARY.md)

---

**Last Updated:** 2025-10-27
**Version:** 1.4
**Status:** Phase 1, 2, & 3 (100%) Complete - Ready for Phase 4 (State Management Refactor)
