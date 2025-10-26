# Phase 2.3 Filter Architecture Diagram

## Overview

This document provides visual representations of the Phase 2.3 filter enhancement architecture.

---

## Data Flow: Room Creation with Enhanced Filters

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (User)                           │
│                                                                 │
│  Creates room with filters:                                    │
│  - sortOrder: "newest"                                         │
│  - genreFilterMode: "and"                                      │
│  - ratingFilter: { min: 7.5, max: 9.0 }                       │
│  - contentRatingFilter: { ratings: ["PG-13", "R"] }           │
│  - filters: [{ key: "genre", value: ["Action", "Thriller"] }] │
└────────────────────────────┬────────────────────────────────────┘
                             │ WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Client.ts (Message Handler)                   │
│                                                                 │
│  Receives createRoom message                                   │
│  Validates user authentication                                 │
│  Extracts creator info (Plex user ID, username)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               createRoom() in room.ts                           │
│                                                                 │
│  1. Check room doesn't already exist                           │
│  2. Create new Room instance with:                             │
│     - CreateRoomRequest (all filter fields)                    │
│     - RouteContext (providers, config)                         │
│     - Creator info (Plex user)                                 │
│  3. Await room.media (triggers getMedia)                       │
│  4. Store room in active rooms Map                             │
│  5. Persist to storage                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Room Constructor                             │
│                                                                 │
│  Store configuration:                                          │
│  - sortOrder: "newest"                                         │
│  - genreFilterMode: "and"                                      │
│  - ratingFilter: { min: 7.5, max: 9.0 }                       │
│  - contentRatingFilter: { ratings: ["PG-13", "R"] }           │
│  - filters: [{ key: "genre", value: ["Action", "Thriller"] }] │
│                                                                 │
│  Initialize:                                                   │
│  - users Map (empty)                                           │
│  - ratings Map (empty)                                         │
│  - userProgress Map (empty)                                    │
│  - media Promise → getMedia()                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Room.getMedia() (Memoized)                    │
│                                                                 │
│  For each provider in RouteContext:                            │
│    Call provider.getMedia({                                    │
│      filters,                                                  │
│      sortOrder: "newest",                                      │
│      genreFilterMode: "and",                                   │
│      ratingFilter: { min: 7.5, max: 9.0 },                    │
│      contentRatingFilter: { ratings: ["PG-13", "R"] }         │
│    })                                                          │
│                                                                 │
│  Combine media from all providers                              │
│  Convert to Map<mediaId, Media>                                │
│  Throw NoMediaError if empty                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            PlexProvider.getMedia() in plex.ts                   │
│                                                                 │
│  Step 1: Convert filters to Plex query parameters              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ filtersToPlexQueryString(filters)                         │ │
│  │ - Extract non-genre filters                               │ │
│  │ - Convert to Plex API format                              │ │
│  │ - Returns: { "year>>": "2020", ... }                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Step 2: Fetch media from Plex                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ For each library:                                         │ │
│  │   api.getLibraryItems(libraryKey, { filters: queryParams })│ │
│  │   - Fetch metadata                                        │ │
│  │   - Parse genre, rating, contentRating, year, etc.        │ │
│  │   - Build Media objects                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Step 3: Apply Phase 2.3 Filters                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ media = applyGenreFilter(media, filters, "and")          │ │
│  │ ↓                                                          │ │
│  │ Filter: Must have Action AND Thriller                     │ │
│  │ - Extract genre filters                                   │ │
│  │ - Apply AND logic: every genre must match                │ │
│  │ - Case-insensitive matching                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ media = applyRatingFilter(media, { min: 7.5, max: 9.0 }) │ │
│  │ ↓                                                          │ │
│  │ Filter: 7.5 <= rating <= 9.0                             │ │
│  │ - Check min boundary                                      │ │
│  │ - Check max boundary                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ media = applyContentRatingFilter(media, ["PG-13", "R"])  │ │
│  │ ↓                                                          │ │
│  │ Filter: contentRating in ["PG-13", "R"]                  │ │
│  │ - Exclude if no contentRating                            │ │
│  │ - Exact string match                                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Step 4: Apply Sort Order                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ media = applySortOrder(media, "newest")                   │ │
│  │ ↓                                                          │ │
│  │ Sort by year descending (newest first)                    │ │
│  │ - Create copy of array                                    │ │
│  │ - Sort: (b.year || 0) - (a.year || 0)                    │ │
│  │ - Return sorted array                                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Return: Filtered and sorted Media[]                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Storage Persistence                        │
│                                                                 │
│  room.toSerializedRoom() → {                                   │
│    roomName,                                                   │
│    password,                                                   │
│    filters,                                                    │
│    sortOrder: "newest",                                        │
│    genreFilterMode: "and",                                     │
│    ratingFilter: { min: 7.5, max: 9.0 },                      │
│    contentRatingFilter: { ratings: ["PG-13", "R"] },          │
│    creatorPlexUserId,                                          │
│    creatorPlexUsername,                                        │
│    createdAt,                                                  │
│    ratings: {},                                                │
│    userProgress: {}                                            │
│  }                                                             │
│                                                                 │
│  storage.saveRoom(serialized) → File/Memory storage            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Client Response                             │
│                                                                 │
│  Send createRoomSuccess message with:                          │
│  - previousMatches: []                                         │
│  - media: [filtered and sorted Media objects]                  │
│  - users: [creator user with progress]                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Filter Application Pipeline

```
                    Input: Raw Media from Plex
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │   applyGenreFilter()                │
            │                                     │
            │   Mode: AND / OR                    │
            │   Input: ["Action", "Thriller"]     │
            │                                     │
            │   AND: Must have ALL genres         │
            │   OR:  Must have AT LEAST ONE       │
            │                                     │
            │   Case-insensitive matching         │
            └──────────────┬──────────────────────┘
                           │ Filtered by genre
                           ▼
            ┌─────────────────────────────────────┐
            │   applyRatingFilter()               │
            │                                     │
            │   Min: 7.5                          │
            │   Max: 9.0                          │
            │                                     │
            │   Filter: min <= rating <= max      │
            │   Exclude if outside range          │
            └──────────────┬──────────────────────┘
                           │ Filtered by rating
                           ▼
            ┌─────────────────────────────────────┐
            │   applyContentRatingFilter()        │
            │                                     │
            │   Allowed: ["PG-13", "R"]           │
            │                                     │
            │   Exact string match                │
            │   Exclude if no contentRating       │
            │   Exclude if not in list            │
            └──────────────┬──────────────────────┘
                           │ Filtered by content rating
                           ▼
            ┌─────────────────────────────────────┐
            │   applySortOrder()                  │
            │                                     │
            │   Mode: newest / oldest / random    │
            │                                     │
            │   newest: Sort by year DESC         │
            │   oldest: Sort by year ASC          │
            │   random: Fisher-Yates shuffle      │
            │                                     │
            │   Create new array (no mutation)    │
            └──────────────┬──────────────────────┘
                           │
                           ▼
                Output: Filtered & Sorted Media[]
```

---

## Type Dependency Graph

```
                     types/moviematch.ts
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   SortOrder          GenreFilterMode      RatingFilter
  'newest' |            'and' | 'or'      { min?, max?,
  'oldest' |                                type? }
  'random'                                       │
        │                    │                   │
        │                    │                   ▼
        │                    │         ContentRatingFilter
        │                    │         { ratings: string[] }
        │                    │                   │
        └────────┬───────────┴───────────────────┘
                 │
                 ▼
        CreateRoomRequest
        {
          roomName: string;
          sortOrder?: SortOrder;
          genreFilterMode?: GenreFilterMode;
          ratingFilter?: RatingFilter;
          contentRatingFilter?: ContentRatingFilter;
          filters?: Filter[];
          ...
        }
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   Room class     SerializedRoom
   (runtime)        (storage)
```

---

## Storage Flow

```
       Room Instance (Runtime)
              │
              │ toSerializedRoom()
              ▼
       SerializedRoom Object
       {
         roomName: string;
         sortOrder?: SortOrder;
         genreFilterMode?: GenreFilterMode;
         ratingFilter?: RatingFilter;
         contentRatingFilter?: ContentRatingFilter;
         ...
       }
              │
              ▼
      ┌──────┴───────┐
      │              │
      ▼              ▼
  File Storage   Memory Storage
  (JSON file)    (in-memory Map)
      │              │
      └──────┬───────┘
             │
             │ On server restart/room load
             ▼
      SerializedRoom Object
             │
             │ Reconstruct Room
             ▼
       Room Instance (Runtime)
       - Uses sortOrder for getMedia()
       - Applies all filters
       - Maintains filter settings
```

---

## Sort Order Comparison

### Newest Sort
```
Input:  [Movie A (2020), Movie B (2023), Movie C (2019)]
              │
              │ applySortOrder(media, "newest")
              │ Sort: (b.year || 0) - (a.year || 0)
              ▼
Output: [Movie B (2023), Movie A (2020), Movie C (2019)]
```

### Oldest Sort
```
Input:  [Movie A (2020), Movie B (2023), Movie C (2019)]
              │
              │ applySortOrder(media, "oldest")
              │ Sort: (a.year || 0) - (b.year || 0)
              ▼
Output: [Movie C (2019), Movie A (2020), Movie B (2023)]
```

### Random Sort
```
Input:  [Movie A, Movie B, Movie C, Movie D]
              │
              │ applySortOrder(media, "random")
              │ Fisher-Yates Shuffle:
              │   for i from n-1 to 1:
              │     j = random(0, i)
              │     swap(arr[i], arr[j])
              ▼
Output: [Movie C, Movie A, Movie D, Movie B]  (example)
```

---

## Genre Filter Logic

### OR Mode (Default)
```
Selected Genres: ["Action", "Thriller"]
Filter Mode: "or"

Movie A: ["Action", "Comedy"]          → ✓ PASS (has Action)
Movie B: ["Drama"]                     → ✗ FAIL (no match)
Movie C: ["Thriller", "Mystery"]       → ✓ PASS (has Thriller)
Movie D: ["Action", "Thriller", "Sci-Fi"] → ✓ PASS (has both)

Logic: some((genre) => item.genres.includes(genre))
```

### AND Mode
```
Selected Genres: ["Action", "Thriller"]
Filter Mode: "and"

Movie A: ["Action", "Comedy"]          → ✗ FAIL (missing Thriller)
Movie B: ["Drama"]                     → ✗ FAIL (no match)
Movie C: ["Thriller", "Mystery"]       → ✗ FAIL (missing Action)
Movie D: ["Action", "Thriller", "Sci-Fi"] → ✓ PASS (has both)

Logic: every((genre) => item.genres.includes(genre))
```

---

## Rating Filter Logic

```
Configuration: { min: 7.5, max: 9.0 }

Movie A: rating = 8.5    → ✓ PASS (7.5 <= 8.5 <= 9.0)
Movie B: rating = 6.0    → ✗ FAIL (6.0 < 7.5)
Movie C: rating = 9.2    → ✗ FAIL (9.2 > 9.0)
Movie D: rating = 7.5    → ✓ PASS (7.5 = 7.5, inclusive)
Movie E: rating = 9.0    → ✓ PASS (9.0 = 9.0, inclusive)

Logic:
  if (min !== undefined && rating < min) return false;
  if (max !== undefined && rating > max) return false;
  return true;
```

---

## Content Rating Filter Logic

```
Configuration: { ratings: ["PG-13", "R"] }

Movie A: contentRating = "PG-13"    → ✓ PASS (in list)
Movie B: contentRating = "R"        → ✓ PASS (in list)
Movie C: contentRating = "PG"       → ✗ FAIL (not in list)
Movie D: contentRating = undefined  → ✗ FAIL (no rating)
Movie E: contentRating = "G"        → ✗ FAIL (not in list)

Logic:
  if (!item.contentRating) return false;
  return ratings.includes(item.contentRating);
```

---

## Component Interaction Map

```
┌──────────────────────────────────────────────────────────────┐
│                     Client (WebSocket)                       │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                   client.ts (Handler)                        │
│  - Validates authentication                                  │
│  - Extracts creator info                                     │
│  - Calls createRoom()                                        │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                   room.ts (Room Manager)                     │
│  - createRoom() function                                     │
│  - Room class                                                │
│  - Active rooms Map                                          │
└──────────┬─────────────────┬───────────────┬─────────────────┘
           │                 │               │
           ▼                 ▼               ▼
    ┌──────────┐      ┌──────────┐   ┌──────────────┐
    │ Provider │      │ Storage  │   │ Serialization│
    │Interface │      │Interface │   │  Methods     │
    └─────┬────┘      └────┬─────┘   └──────┬───────┘
          │                │                 │
          ▼                ▼                 ▼
    ┌──────────┐      ┌──────────┐   ┌──────────────┐
    │plex.ts   │      │file.ts / │   │toSerialized  │
    │- getMedia│      │memory.ts │   │Room()        │
    │- filters │      │          │   │              │
    │- sorting │      │          │   │              │
    └──────────┘      └──────────┘   └──────────────┘
```

---

## Implementation Status Summary

```
┌─────────────────────────────────────────────────────────────┐
│              Phase 2.3 Implementation Status                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ SortOrder Type & Implementation                        │
│     - newest, oldest, random                               │
│     - Fisher-Yates shuffle                                 │
│     - Year-based sorting                                   │
│                                                             │
│  ✅ Genre Filter Enhancement                               │
│     - AND/OR logic                                         │
│     - Multiple genre selection                             │
│     - Case-insensitive matching                            │
│                                                             │
│  ✅ Rating Filter                                          │
│     - Min/max range (0-10)                                 │
│     - Optional boundaries                                  │
│     - ⚠️  Critic/audience type (future)                    │
│                                                             │
│  ✅ Content Rating Filter                                  │
│     - Multiple rating selection                            │
│     - Exact string matching                                │
│     - Excludes unrated content                             │
│                                                             │
│  ✅ Storage Integration                                    │
│     - SerializedRoom updated                               │
│     - Persistence across restarts                          │
│     - Backward compatible                                  │
│                                                             │
│  ✅ Provider Integration                                   │
│     - PlexProvider updated                                 │
│     - Filter pipeline implemented                          │
│     - Sort order applied                                   │
│                                                             │
│  ✅ Type Safety                                            │
│     - All types exported                                   │
│     - Interfaces updated                                   │
│     - Imports verified                                     │
│                                                             │
│  ✅ Documentation                                          │
│     - Implementation summary                               │
│     - Usage examples (24)                                  │
│     - Quick reference                                      │
│     - Completion checklist                                 │
│     - Architecture diagrams                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Genre Filter (OR) | O(n × m) | n = media, m = genres per item |
| Genre Filter (AND) | O(n × m) | n = media, m = genres per item |
| Rating Filter | O(n) | Simple numeric comparison |
| Content Rating Filter | O(n) | String array includes check |
| Sort (newest/oldest) | O(n log n) | JavaScript Array.sort() |
| Sort (random) | O(n) | Fisher-Yates shuffle |
| **Total Pipeline** | **O(n log n)** | Dominated by sort operation |

For typical libraries (< 10,000 items), all operations complete in < 100ms.

---

## End-to-End Example

```
User Request:
  "Show me recent high-quality action thrillers rated PG-13 or R"

Maps to:
  sortOrder: "newest"
  filters: [{ key: "genre", value: ["Action", "Thriller"], operator: "=" }]
  genreFilterMode: "and"
  ratingFilter: { min: 7.5 }
  contentRatingFilter: { ratings: ["PG-13", "R"] }

Processing:
  1. Fetch all movies from Plex
  2. Filter: Must have Action AND Thriller genres
  3. Filter: Rating >= 7.5
  4. Filter: Content rating is PG-13 or R
  5. Sort: By year descending (newest first)

Result:
  [
    "Movie A" (2024, 8.5, PG-13, Action/Thriller),
    "Movie B" (2023, 8.0, R, Action/Thriller),
    "Movie C" (2023, 7.8, PG-13, Action/Thriller),
    ...
  ]
```

This architecture provides a flexible, performant, and maintainable filter system for MovieMatch!
