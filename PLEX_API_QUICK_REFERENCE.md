# Plex Media Server API - Quick Reference for MovieMatch

## Current Implementation Status

| Feature | Status | Endpoint | Notes |
|---------|--------|----------|-------|
| List Libraries | ✓ Implemented | `GET /library/sections` | Works correctly |
| Filter Media | ✓ Implemented | `GET /library/sections/{id}/all` | Basic filters only |
| Get Metadata | ✓ Implemented | `GET /library/metadata/{id}` | Full data available |
| Transcode Images | ✓ Implemented | `GET /photo/:/transcode` | Poster/artwork handled |
| Deep Linking | ✓ Implemented | Generated URLs | Works with Plex clients |

---

## Requested Features - Implementation Guide

### 1. WATCHED STATUS FILTERING (HIGH PRIORITY - EASY)

**Status:** NOT IMPLEMENTED - Data fields already in types

**What to do:**
```typescript
// Add to filter options in plex.ts provider
getFilters() {
  // ... existing code ...
  filters.set('watched', {
    title: 'Watch Status',
    key: 'watched',
    type: 'boolean',
    libraryTypes: ['movie', 'show']
  });
}

getFilterValues(key: string) {
  if (key === 'watched') {
    return [
      { value: '0', title: 'Unwatched' },
      { value: '1', title: 'Watched' }
    ];
  }
  // ... existing code ...
}

getMedia({ filters }) {
  // ... existing code ...
  const watchedFilter = filters?.find(f => f.key === 'watched');
  if (watchedFilter?.value[0] === '0') {
    filterParams['viewCount'] = '0';  // Unwatched only
  } else if (watchedFilter?.value[0] === '1') {
    filterParams['viewCount>>='] = '1';  // Watched only
  }
}
```

**API Call:**
```
GET /library/sections/1/all?type=1&viewCount=0
GET /library/sections/1/all?type=1&viewCount>>=1
```

**Fields Already Available:**
- `viewCount` - Number of times watched
- `lastViewedAt` - Unix timestamp of last view

---

### 2. TRAILER FETCHING (HIGH PRIORITY - MODERATE EFFORT)

**Status:** NOT IMPLEMENTED - Endpoint available, needs UI integration

**Implementation:**
```typescript
// Add to plex/api.ts
async getExtras(metadataId: string): Promise<LibraryItems> {
  return this.fetch<LibraryItems>(
    `/library/metadata/${metadataId}/extras`
  );
}

// Add to providers/plex.ts
getTrailerUrl: async (metadataKey: string) => {
  try {
    const id = metadataKey.replace('/library/metadata/', '');
    const extras = await api.getExtras(id);
    const trailer = extras.Metadata?.find(
      m => m.type === 'trailer' || m.subtype === 'trailer'
    );
    if (trailer?.key) {
      return api.getDeepLink(trailer.key, { 
        type: 'plexTv',
        metadataType: '5'  // Type 5 = trailer
      });
    }
  } catch (err) {
    log.debug(`Trailer fetch error: ${err}`);
  }
  return null;
}
```

**API Endpoint:**
```
GET /library/metadata/1049/extras
```

**Response includes:** All extras with type=trailer

**Trailer Types Available:** trailer, deletedScene, interview, musicVideo, behindTheScenes, featurette, short

---

### 3. GENRE FILTERING (ALREADY WORKING - UI ONLY)

**Status:** IMPLEMENTED BUT NOT EXPOSED - Code exists, needs UI

**Current Code Location:** `internal/app/moviematch/providers/plex.ts`

**How it works:**
- `getFilterValues('genre')` returns available genres
- Filter system already handles genre in media queries

**What's needed:** Frontend UI to expose this option

**API Used:**
```
GET /library/sections/1/all?genre=Action,Drama,Comedy
GET /library/sections/1/genre  # Get available genres
```

---

### 4. WATCHLIST INTEGRATION (MEDIUM PRIORITY - MODERATE EFFORT)

**Status:** NOT IMPLEMENTED - Requires playlist management

**Implementation:**
```typescript
// Add to plex/api.ts
async getPlaylists(): Promise<PlaylistMetadata[]> {
  const result = await this.fetch<{
    Metadata: PlaylistMetadata[]
  }>('/playlists', {
    searchParams: { playlistType: 'video', smart: '0' }
  });
  return result.Metadata ?? [];
}

async getPlaylistItems(playlistId: string): Promise<LibraryItems> {
  return this.fetch<LibraryItems>(`/playlists/${playlistId}/items`);
}

// Add to providers/plex.ts (optional)
getWatchlists: async () => {
  const playlists = await api.getPlaylists();
  return playlists.map(p => ({
    id: p.ratingKey,
    title: p.title,
    itemCount: p.leafCount
  }));
}
```

**API Endpoints:**
```
GET /playlists?playlistType=video  # Get playlists
GET /playlists/{id}/items           # Get items in playlist
```

**Response Structure:**
```json
{
  "ratingKey": "2561805",
  "title": "My Watchlist",
  "leafCount": 42,
  "playlistType": "video"
}
```

---

### 5. USER AUTHENTICATION (ALREADY WORKING)

**Status:** IMPLEMENTED - Token-based auth working

**Current:** Direct token authentication (NOT OAuth)

**What you have:**
```
X-Plex-Token: <server_token>
```

**Verification:**
```
GET / (with X-Plex-Token header)
// Returns server info if token valid, 401 if invalid
```

**Current Implementation Location:** `internal/app/plex/api.ts`

---

## Additional Useful Endpoints

### Get Cast/Crew (Already in response, just not displayed)
```
GET /library/metadata/1049
```

**Response includes:**
```json
{
  "Role": [{"tag": "Actor Name", "role": "Character"}],
  "Director": [{"tag": "Director Name"}],
  "Writer": [{"tag": "Writer Name"}],
  "Collection": [{"tag": "Collection Name"}]
}
```

### Mark as Watched/Unwatched
```
PUT /:/scrobble?identifier=com.plexapp.plugins.library&key=/library/metadata/1049
PUT /:/unscrobble?identifier=com.plexapp.plugins.library&key=/library/metadata/1049
```

### Rate Media
```
PUT /:/rate?identifier=com.plexapp.plugins.library&key=/library/metadata/1049&rating=8
```

### Watch History
```
GET /status/sessions/history/all?metadataItemID=1049&sort=viewedAt:desc
```
**Note:** Requires admin privileges

### Related/Similar Content
```
GET /library/metadata/1049/related
GET /library/metadata/1049/similar
```

---

## Implementation Priority Summary

### Quick Wins (1-2 hours each)
1. **Watched Status Filter** - Add viewCount filtering to existing filter system
2. **Display Cast/Crew** - Extract from existing metadata response
3. **Expose Genre Filter UI** - Already implemented, just needs UI component

### Medium Effort (2-4 hours each)
1. **Trailer Button** - Fetch extras endpoint, create UI button
2. **Watchlist Selection** - Use playlist endpoints for filtering
3. **Watch History Stats** - Display watch status in UI

### Lower Priority (4+ hours)
1. **Smart Recommendations** - Use related/similar endpoints
2. **User Rating Persistence** - Store ratings via /:/rate endpoint
3. **Advanced Filter UI** - Year range, actor, director, etc.

---

## Testing Endpoints Locally

### Using curl with Plex server:
```bash
# Replace <SERVER_URL> with your server (e.g., http://localhost:32400)
# Replace <TOKEN> with your Plex token

# List movies
curl -H "X-Plex-Token: <TOKEN>" \
  "<SERVER_URL>/library/sections/1/all?type=1&limit=5"

# Get unwatched movies
curl -H "X-Plex-Token: <TOKEN>" \
  "<SERVER_URL>/library/sections/1/all?type=1&viewCount=0"

# Get movie extras
curl -H "X-Plex-Token: <TOKEN>" \
  "<SERVER_URL>/library/metadata/1049/extras"

# Get playlists
curl -H "X-Plex-Token: <TOKEN>" \
  "<SERVER_URL>/playlists?playlistType=video"

# Get genres
curl -H "X-Plex-Token: <TOKEN>" \
  "<SERVER_URL>/library/sections/1/genre"
```

---

## Files to Modify

| File | Current Size | Change Type | Priority |
|------|-------------|-------------|----------|
| `internal/app/plex/api.ts` | 294 lines | Add getExtras(), getPlaylists() | HIGH |
| `internal/app/moviematch/providers/plex.ts` | 224 lines | Add watched filter, trailer URL handler | HIGH |
| `types/moviematch.ts` | 284 lines | May need new types for watchlist | MEDIUM |
| Frontend components | N/A | Add UI for new filters/features | MEDIUM |

---

## Type Definitions Already Available

Located in: `internal/app/plex/types/library_items.ts`

```typescript
export interface LibraryItem {
  viewCount?: number;           // ✓ Available - use for watched status
  lastViewedAt?: number;        // ✓ Available - use for last view time
  primaryExtraKey?: string;     // ✓ Available - use for trailers
  Genre?: Tag[];               // ✓ Available - for genre display
  Director?: Tag[];            // ✓ Available - for cast display
  Writer?: Tag[];              // ✓ Available - for cast display
  Role?: Tag[];                // ✓ Available - for cast display
  Collection?: Tag[];          // ✓ Available - for collection info
  Country?: Tag[];             // ✓ Available - for origin info
}
```

---

## API Response Time Expectations

- Library listing: < 100ms (cached)
- Filter values: < 200ms (cached)
- Media queries: 500ms - 5s (depends on library size)
- Extras fetching: 200-500ms per item
- Playlist operations: 100-500ms
- Scrobbling/rating: 100-300ms

---

## Common Gotchas

1. **Filter parameters need proper encoding:** Use `key+operator` format
   - `viewCount>>=1` (not `viewCount >= 1`)
   - `year=2020` (not `year == 2020`)

2. **Path vs Query parameters:** Keys can be either
   - `/library/metadata/1049` vs `?key=1049`
   - Use metadata ID (numeric) or full key path

3. **Pagination headers are important:**
   - Always check `X-Plex-Container-Total-Size`
   - Use `X-Plex-Container-Start` and `X-Plex-Container-Size` for paging

4. **Some endpoints require admin:**
   - `/status/sessions/history/all` - needs admin token
   - Playlist modification endpoints

5. **Media type numbers:**
   - 1 = movie
   - 2 = show
   - 3 = season
   - 4 = episode
   - 5 = trailer

---

## Next Steps

1. **Review full analysis:** Read `PLEX_OPENAPI_ANALYSIS.md` for complete details
2. **Start with Priority 1:** Watched status filtering (easiest win)
3. **Test endpoints:** Use curl commands above to validate against your server
4. **Implement incrementally:** One feature per PR
5. **Update types:** Ensure new endpoints have proper TypeScript interfaces

