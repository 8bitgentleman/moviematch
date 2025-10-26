# Plex Media Server OpenAPI Specification Analysis for MovieMatch

## Executive Summary

The Plex Media Server API (v1.1.1) provides comprehensive endpoints for media management, including features for filtering, rating, watch history tracking, and metadata retrieval. This analysis identifies which endpoints are currently used by MovieMatch, and recommends additional endpoints for the requested features.

**Key Findings:**
- Current implementation uses only ~8 core endpoints
- OpenAPI spec documents 150+ endpoints with rich functionality
- Many useful endpoints are already available for requested features
- Watch status filtering and trailer fetching are fully supported
- Watchlist integration requires using existing Playlist endpoints

---

## 1. OpenAPI Specification Overview

**File:** `plex media server openapi 1.1.1.json`
- **Specification Version:** OpenAPI 3.1.0
- **API Version:** 1.1.1 (Supported in PMS >= 1.42.2)
- **Total Endpoints:** 150+ paths documented
- **Key Features:**
  - RESTful JSON/XML API
  - Token-based authentication (X-Plex-Token header)
  - Rich filtering and sorting capabilities
  - Pagination support
  - Media provider architecture

### Authentication
All endpoints require:
- `X-Plex-Token` header or query parameter
- Additional headers like `X-Plex-Client-Identifier` recommended

---

## 2. Currently Used Endpoints in MovieMatch

The current implementation uses these endpoints:

| Endpoint | Method | Purpose | File |
|----------|--------|---------|------|
| `/identity` | GET | Get server info and version | plex/api.ts |
| `/` | GET | Get server capabilities | plex/api.ts |
| `/library/sections` | GET | List available libraries | plex/api.ts |
| `/library/sections/{id}/all` | GET | Get items in library with filters | plex/api.ts |
| `/library/sections/{id}/{filter}` | GET | Get filter values | plex/api.ts |
| `/library/metadata/{id}` | GET | Get item details | plex/api.ts |
| `/photo/:/transcode` | GET | Transcode/resize poster images | plex/api.ts |
| Deep linking endpoints | - | Create links to play media | plex/api.ts |

**Example Usage:**
```typescript
// Get library items with filters
await api.getLibraryItems(libraryKey, {
  filters: {
    "genre": "Action",
    "year": "2020"
  }
});
```

---

## 3. Requested Features & Available Endpoints

### 3.1 Watched Status Filtering

**Current Implementation:**
- The code has `viewCount` and `lastViewedAt` fields in the type definitions
- These are **NOT** currently being used to filter results

**Recommended Endpoints:**

#### Primary Endpoint: `/library/sections/{sectionId}/all` with Media Queries
```
GET /library/sections/1/all?viewCount>>=1&sort=lastViewedAt:desc
GET /library/sections/1/all?viewCount=0
```

**Parameters:**
- `viewCount` - Integer field, operators: `=`, `!=`, `>>=`, `<<=`, `<=`, `>=`
- `lastViewedAt` - Date field, operators: `=`, `!=`, `>>=` (after), `<<=` (before)

**Example Query:**
```
GET /library/sections/1/all?type=1&viewCount>>=1
```
Returns movies that have been watched (viewCount > 0)

**Comparison with Spec:**
```json
{
  "description": "Get items in section with media query support",
  "operationId": "librarySectionGetAll",
  "parameters": [{
    "name": "mediaQuery",
    "description": "Media queries for filtering including viewCount, lastViewedAt",
    "in": "query"
  }]
}
```

#### Secondary Endpoint: `/status/sessions/history/all`
```
GET /status/sessions/history/all?metadataItemID=1049&sort=viewedAt:desc
```

**Use Case:** Get watch history for specific users or items
**Important:** Requires admin privileges

**Parameters:**
- `accountID` - Filter by specific user
- `metadataItemID` - Get history for specific item
- `viewedAt` - Filter by time period
- `librarySectionID` - Filter by library

**Response includes:**
```json
{
  "viewedAt": 1434341184,  // Unix timestamp
  "accountID": 123,
  "duration": 5129000,     // ms watched
  "ratingKey": "1049"
}
```

**Code Example for Implementation:**
```typescript
async getWatchHistory(options: {
  viewedAfter?: number;
  viewedBefore?: number;
  userId?: number;
}) {
  const params: Record<string, string> = {};
  if (options.viewedAfter) {
    params['viewedAt'] = `>>=` + options.viewedAfter;
  }
  if (options.userId) {
    params['accountID'] = String(options.userId);
  }
  return this.fetch<SessionHistory>('/status/sessions/history/all', {
    searchParams: params
  });
}
```

**For MovieMatch Feature:**
Add to library items query to exclude unwatched:
```typescript
const filterParams = {
  "viewCount>>=": "1"  // Only watched items
};
```

---

### 3.2 Watchlist Integration

**Recommended Endpoints:**

#### Get User Playlists
```
GET /playlists?playlistType=video&smart=0
```

**Response:**
```json
{
  "MediaContainer": {
    "size": 2,
    "Metadata": [
      {
        "ratingKey": "2561805",
        "title": "My Watchlist",
        "key": "/playlists/2561805/items",
        "leafCount": 42,
        "playlistType": "video",
        "duration": 151200000
      }
    ]
  }
}
```

#### Get Playlist Items
```
GET /playlists/{playlistId}/items
```

**Parameters:**
- `includeFields` - Optimize response fields
- Supports pagination: `X-Plex-Container-Start`, `X-Plex-Container-Size`

#### Create Playlist (requires admin)
```
PUT /playlists?title=MovieMatch%20Matches&type=video
```

#### Add Item to Playlist (requires admin)
```
PUT /playlists/{playlistId}/items?uri={itemUri}
```

**Code Example:**
```typescript
async getWatchlists() {
  return this.fetch<PlaylistContainer>('/playlists', {
    searchParams: { playlistType: 'video', smart: '0' }
  });
}

async getPlaylistItems(playlistId: string) {
  return this.fetch<PlaylistItems>(
    `/playlists/${playlistId}/items`
  );
}
```

---

### 3.3 Library/Media Type Selection

**Status:** Already Implemented
- Uses `/library/sections` endpoint ✓
- Filters by `libraryTypeFilter` ✓
- Currently supports: "movie", "show", "music", "photo"

**Spec Reference:**
```
GET /library/sections
```

Returns:
```json
{
  "Directory": [
    {
      "key": "1",
      "type": "movie",
      "title": "Movies"
    }
  ]
}
```

---

### 3.4 Genre Filtering

**Status:** Already Implemented
- Uses `/library/sections/{id}/genre` endpoint ✓
- Integrated into filter system ✓

**Direct Filter Endpoint:**
```
GET /library/sections/1/all?genre=Action,Drama
```

**Get Available Genres:**
```
GET /library/sections/1/genre
```

---

### 3.5 Trailer Fetching

**Status:** NOT Currently Implemented - NEW FEATURE

#### Recommended Endpoint: `/library/metadata/{ids}/extras`

```
GET /library/metadata/1049/extras
```

**Response Structure:**
```json
{
  "MediaContainer": {
    "size": 3,
    "Metadata": [
      {
        "type": "trailer",           // Type 5
        "subtype": "trailer",        // Subtype = "trailer"
        "ratingKey": "1073",
        "key": "/library/metadata/1073",
        "title": "Zoolander Trailer",
        "duration": 120000,
        "summary": "Official trailer",
        "thumb": "/library/metadata/1073/thumb/...",
        "Media": [{
          "Part": [{
            "key": "/library/parts/xyz/file.mp4",
            "file": "..."
          }]
        }]
      }
    ]
  }
}
```

#### Extras Subtypes Available:
- `trailer` - Movie trailers
- `deletedScene`
- `interview`
- `musicVideo`
- `behindTheScenes`
- `sceneOrSample`
- `featurette`
- `short`
- `other`

#### Alternative: Use primaryExtraKey
```
// From metadata response, get the primary extra
"primaryExtraKey": "/library/metadata/1073"

// Then fetch it
GET /library/metadata/1073
```

**Code Implementation:**
```typescript
async getTrailers(metadataId: string): Promise<TrailerMetadata[]> {
  const extras = await this.fetch<LibraryItems>(
    `/library/metadata/${metadataId}/extras`
  );
  
  return extras.Metadata
    .filter(m => m.type === 'trailer' || m.subtype === 'trailer')
    .map(m => ({
      title: m.title,
      duration: m.duration,
      key: m.key,
      thumb: m.thumb,
      playbackUrl: m.Media?.[0]?.Part?.[0]?.key
    }));
}

// In provider implementation:
getTrailerUrl: async (metadataKey: string) => {
  const trailers = await api.getTrailers(metadataKey);
  if (trailers.length > 0) {
    return `/api/trailer/${id}/${trailers[0].key}`;
  }
  return null;
}
```

**Deep Link to Trailer:**
```
plex://preplay/?metadataKey=/library/metadata/1073&metadataType=5&server=<serverId>
```

---

### 3.6 User Authentication (OAuth Flow)

**Current Implementation:** 
- Uses token-based auth with `X-Plex-Token` ✓
- Does NOT use OAuth, uses direct token authentication

**Relevant Endpoints:**

#### Get Current Identity/User
```
GET /
GET /identity
```

**Response includes server info:**
```json
{
  "friendlyName": "My Plex Server",
  "myPlex": true,
  "myPlexUsername": "user@example.com",
  "myPlexSigninState": "ok"
}
```

#### Verify Token Validity
```
GET / (with X-Plex-Token header)
```

If token is invalid: 401 response

**Code Example:**
```typescript
async verifyToken(token: string): Promise<boolean> {
  try {
    const identity = await this.getIdentity();
    return !!identity.machineIdentifier;
  } catch {
    return false;
  }
}
```

---

## 4. NEW Endpoints Useful for Extended Features

### 4.1 Get Related/Similar Content
```
GET /library/metadata/{ids}/related
GET /library/metadata/{ids}/similar
```

**Use Case:** "Users who liked this also liked..." feature

**Response:**
```json
{
  "MediaContainer": {
    "Metadata": [
      {
        "ratingKey": "1050",
        "title": "Blue Steel",
        "type": "movie"
      }
    ]
  }
}
```

### 4.2 Get Continue Watching Hub
```
GET /hubs/continueWatching
```

**Use Case:** Show only unwatched or partially watched items

### 4.3 Rate/Unrate Media

#### Mark as Watched
```
PUT /:/scrobble?identifier=com.plexapp.plugins.library&key=/library/metadata/1049
```

**Parameters:**
- `identifier` - Always `com.plexapp.plugins.library` for server content
- `key` - The ratingKey of the item

**Response:** 200 OK

#### Mark as Unwatched
```
PUT /:/unscrobble?identifier=com.plexapp.plugins.library&key=/library/metadata/1049
```

#### Rate Media (1-10 stars)
```
PUT /:/rate?identifier=com.plexapp.plugins.library&key=/library/metadata/1049&rating=8
```

**Parameters:**
- `rating` - 0-10 (or can use -1 to remove rating)
- `ratedAt` - Optional unix timestamp

**Code Example:**
```typescript
async markWatched(metadataKey: string) {
  const url = new URL(this.plexUrl.href);
  url.pathname = '/:/scrobble';
  url.searchParams.set('identifier', 'com.plexapp.plugins.library');
  url.searchParams.set('key', metadataKey);
  return fetch(url.href);
}

async rateMedia(metadataKey: string, rating: number) {
  const url = new URL(this.plexUrl.href);
  url.pathname = '/:/rate';
  url.searchParams.set('identifier', 'com.plexapp.plugins.library');
  url.searchParams.set('key', metadataKey);
  url.searchParams.set('rating', String(rating));
  return fetch(url.href);
}
```

### 4.4 Get Cast/Crew Information
```
GET /library/metadata/{ids}
```

With response fields:
```json
{
  "Role": [
    {
      "tag": "Ben Stiller",
      "role": "Actor"
    }
  ],
  "Director": [{"tag": "Ben Stiller"}],
  "Writer": [{"tag": "Drake Sather"}],
  "Producer": [{"tag": "Producer Name"}]
}
```

**Currently Used:** ✓ (but not displayed in MovieMatch)

### 4.5 Get Collection Information
```
GET /library/sections/{sectionId}/collection
GET /library/collections/{collectionId}
```

**Use Case:** Filter movies by collection (e.g., "Marvel Cinematic Universe")

---

## 5. Comparison: Current Implementation vs Specification

### 5.1 Endpoint Completeness

| Feature | Current | Spec Available | Gap |
|---------|---------|-----------------|-----|
| Get Libraries | ✓ | ✓ | None |
| Filter Media | ✓ | ✓ Extensive | Using basic filters only |
| Get Item Details | ✓ | ✓ Full metadata | Missing cast/crew display |
| Transcode Images | ✓ | ✓ | Implemented |
| Watch Status Filter | Partial | ✓ Full | NOT using viewCount filter |
| Watch History | None | ✓ | NEW feature needed |
| Extras/Trailers | None | ✓ | NEW feature needed |
| Playlist Support | None | ✓ | NEW feature needed |
| Rate Media | None | ✓ | NEW feature needed |
| Related Content | None | ✓ | NEW feature needed |

### 5.2 Parameter Usage

**Currently Used Query Parameters:**
- Type filtering (type=1 for movies)
- includeMeta=1
- includeAdvanced=1
- includeCollections=1
- includeExternalMedia=0

**Available But Unused:**
- viewCount filtering
- lastViewedAt filtering
- Collection filtering
- Actor filtering
- Director filtering
- Year range filtering
- Rating filtering
- Resolution filtering
- And 30+ more filter types

**Example - Could be used:**
```typescript
// Current way
filters: { genre: 'Action' }

// More powerful way with media queries
GET /library/sections/1/all?type=1&genre=Action&year>>=2020&viewCount=0&sort=rating:desc
```

### 5.3 Media Metadata Not Being Used

**Available in Response but Not Extracted:**
```json
{
  "audienceRating": 7.5,          // Audience score
  "audienceRatingImage": "...",
  "originalTitle": "...",         // For non-English titles
  "titleSort": "...",             // Sort-friendly title
  "Collection": [                 // Collections/franchises
    { "tag": "Marvel" }
  ],
  "Country": [                    // Country of origin
    { "tag": "USA" }
  ],
  "Role": [                       // Cast
    { "tag": "Ben Stiller", "role": "Derek Zoolander" }
  ]
}
```

---

## 6. Recommended Endpoint Usage for Requested Features

### Feature: Watched Status Filtering
```typescript
// In PlexApi class
async getUnwatchedMedia(libraryKey: string): Promise<LibraryItems> {
  return this.getLibraryItems(libraryKey, {
    filters: {
      'viewCount': '0'
    }
  });
}

async getWatchedMedia(libraryKey: string): Promise<LibraryItems> {
  return this.getLibraryItems(libraryKey, {
    filters: {
      'viewCount>>=': '1'
    }
  });
}

// In provider
getMedia: async ({ filters }) => {
  // Existing filter logic + watched status
  if (filters?.some(f => f.key === 'watched')) {
    filterParams['viewCount>>='] = '1';
  } else if (filters?.some(f => f.key === 'unwatched')) {
    filterParams['viewCount'] = '0';
  }
}
```

### Feature: Watchlist Integration
```typescript
// New methods in PlexApi
async getPlaylists(): Promise<PlaylistMetadata[]> {
  const result = await this.fetch<{
    Metadata: PlaylistMetadata[]
  }>('/playlists', {
    searchParams: { playlistType: 'video' }
  });
  return result.Metadata ?? [];
}

async getPlaylistItems(playlistId: string): Promise<LibraryItems> {
  return this.fetch<LibraryItems>(`/playlists/${playlistId}/items`);
}

// New provider method
getWatchlists: async () => {
  const playlists = await api.getPlaylists();
  return playlists.map(p => ({
    id: p.ratingKey,
    title: p.title,
    key: p.key
  }));
}
```

### Feature: Trailer Fetching
```typescript
// In PlexApi
async getExtras(metadataId: string): Promise<LibraryItems> {
  return this.fetch<LibraryItems>(
    `/library/metadata/${metadataId}/extras`
  );
}

// In provider
getTrailerUrl: (metadataKey: string) => {
  const trailers = await api.getExtras(metadataKey);
  const trailer = trailers.Metadata.find(
    m => m.type === 'trailer'
  );
  if (trailer?.key) {
    return api.getDeepLink(trailer.key, {
      type: 'plexTv',
      metadataType: '5'
    });
  }
  return null;
}
```

---

## 7. Detailed Endpoint Reference

### Core Endpoints

#### `/library/sections` (GET)
Returns list of all media libraries available

**Query Parameters:** None required

**Response:**
```json
{
  "Directory": [
    {
      "key": "1",
      "title": "Movies",
      "type": "movie",
      "uuid": "..." 
    }
  ]
}
```

---

#### `/library/sections/{sectionId}/all` (GET)
Main endpoint for querying library items with full filtering capability

**Query Parameters:**
```
type=1                     # Type 1=movie, 2=show
genre=Action              # Filter by genre
year=2020                 # Filter by year
decade=2020               # Filter by decade
contentRating=PG-13       # Filter by rating
collection=Marvel         # Filter by collection
director=Martin%20Scorsese
actor=Tom%20Hanks
writer=Aaron%20Sorkin
viewCount=0               # Unwatched only
viewCount>>=1            # Watched only
lastViewedAt>>=timestamp  # Watched after date
sort=title,rating:desc   # Sort by fields
limit=50                 # Max results
X-Plex-Container-Start=0 # Pagination start
X-Plex-Container-Size=20 # Pagination size
includeDetails=1         # Include filter/sort info
includeMeta=1            # Include metadata info
includeAdvanced=1        # Include advanced filters
includeCollections=1     # Include collection info
includeExternalMedia=0   # Exclude external content
```

**Response Fields in Metadata:**
```json
{
  "ratingKey": "1049",
  "key": "/library/metadata/1049",
  "guid": "plex://movie/...",
  "type": "movie",
  "title": "Zoolander",
  "year": 2001,
  "summary": "Description...",
  "rating": 6.5,               # Plex rating
  "audienceRating": 7.2,       # Audience score
  "viewCount": 1,              # Times watched
  "lastViewedAt": 1434341184,  # Unix timestamp
  "duration": 5129000,         # Milliseconds
  "contentRating": "PG-13",
  "thumb": "/library/metadata/1049/thumb/...",
  "art": "/library/metadata/1049/art/...",
  "addedAt": 1408525217,
  "updatedAt": 1434341184,
  "primaryExtraKey": "/library/metadata/1073",
  "Genre": [{"tag": "Comedy"}],
  "Director": [{"tag": "Ben Stiller"}],
  "Writer": [{"tag": "Drake Sather"}],
  "Role": [{"tag": "Ben Stiller", "role": "Derek"}],
  "Collection": [{"tag": "Fashion"}],
  "Country": [{"tag": "USA"}]
}
```

---

#### `/library/metadata/{ids}/extras` (GET)
Get extras (trailers, deleted scenes, etc.) for a media item

**Path Parameters:**
- `ids` - Comma-separated list of metadata IDs

**Query Parameters:** None

**Response:**
```json
{
  "Metadata": [
    {
      "type": "trailer",
      "subtype": "trailer",
      "ratingKey": "1073",
      "title": "Official Trailer",
      "duration": 120000,
      "thumb": "/library/metadata/1073/thumb/...",
      "Media": [{
        "Part": [{
          "key": "/library/parts/xyz/file.mp4"
        }]
      }]
    }
  ]
}
```

---

#### `/:/scrobble` (PUT)
Mark media item as watched

**Query Parameters (required):**
```
identifier=com.plexapp.plugins.library  # Provider identifier
key=/library/metadata/1049              # Item ratingKey or key
```

**Response:** 200 OK

---

#### `/:/unscrobble` (PUT)
Mark media item as unwatched

**Query Parameters (same as scrobble):**

---

#### `/:/rate` (PUT)
Rate media item (1-10 stars)

**Query Parameters (required):**
```
identifier=com.plexapp.plugins.library
key=/library/metadata/1049
rating=8
ratedAt=<unix timestamp>  # Optional
```

**Response:** 200 OK

---

#### `/playlists` (GET)
Get user's playlists

**Query Parameters:**
```
playlistType=video       # video, audio, photo
smart=0                  # 0=manual, 1=smart playlists
```

**Response:**
```json
{
  "Metadata": [
    {
      "ratingKey": "2561805",
      "key": "/playlists/2561805/items",
      "title": "My Watchlist",
      "type": "playlist",
      "playlistType": "video",
      "duration": 151200000,
      "leafCount": 42,
      "addedAt": 1476942219,
      "updatedAt": 1485900004,
      "viewCount": 8
    }
  ]
}
```

---

#### `/playlists/{playlistId}/items` (GET)
Get items in a playlist

**Query Parameters:**
- Standard pagination: `X-Plex-Container-Start`, `X-Plex-Container-Size`
- Field selection: `includeFields`, `excludeFields`

**Response:** Same as `/library/sections/{id}/all` Metadata

---

#### `/status/sessions/history/all` (GET)
Get watch history (admin only)

**Query Parameters:**
```
accountID=123              # Filter by user
metadataItemID=1049        # Filter by item
librarySectionID=1         # Filter by library
viewedAt>>=timestamp       # Filter by date range
sort=viewedAt:desc         # Sort order
X-Plex-Container-Start=0   # Pagination
X-Plex-Container-Size=20
```

**Response:**
```json
{
  "Metadata": [
    {
      "ratingKey": "1049",
      "key": "/library/metadata/1049",
      "viewedAt": 1434341184,
      "accountID": 123,
      "title": "Zoolander",
      "duration": 5129000,
      "historyKey": "/status/sessions/history/..." 
    }
  ]
}
```

---

#### `/hubs/continueWatching` (GET)
Get hub of items user is actively watching

**Response:** Similar structure to library items, pre-filtered for in-progress media

---

#### `/library/metadata/{ids}/related` (GET)
Get content related to the specified item

**Response:**
```json
{
  "Metadata": [
    {
      "ratingKey": "1050",
      "title": "Blue Steel",
      "type": "movie"
    }
  ]
}
```

---

## 8. Code Examples for Integration

### Example 1: Add Watched Status Filter to Room Creation

```typescript
// In plex.ts provider

export const createProvider = (
  id: string,
  providerOptions: PlexProviderConfig,
): MovieMatchProvider => {
  return {
    // ... existing methods ...
    
    getFilters: async () => {
      const meta = await api.getAllFilters();
      // ... existing filter logic ...
      
      // Add watched/unwatched filter option
      filters.set('watched', {
        title: 'Watch Status',
        key: 'watched',
        type: 'boolean',
        libraryTypes: ['movie', 'show']
      });
      
      // ... return filters ...
    },
    
    getFilterValues: async (key: string) => {
      if (key === 'watched') {
        return [
          { value: '0', title: 'Unwatched' },
          { value: '1', title: 'Watched' }
        ];
      }
      // ... existing logic ...
    },
    
    getMedia: async ({ filters }) => {
      const filterParams: Record<string, string> = filtersToPlexQueryString(filters);
      
      // Process watched filter
      const watchedFilter = filters?.find(f => f.key === 'watched');
      if (watchedFilter) {
        if (watchedFilter.value[0] === '0') {
          filterParams['viewCount'] = '0';  // Unwatched
        } else {
          filterParams['viewCount>>='] = '1';  // Watched
        }
      }
      
      // ... rest of getMedia ...
    }
  };
};
```

### Example 2: Add Trailer Fetching

```typescript
// In plex/api.ts

export class PlexApi {
  // ... existing methods ...
  
  async getExtras(
    metadataId: string,
  ): Promise<LibraryItems> {
    return this.fetch<LibraryItems>(
      `/library/metadata/${metadataId}/extras`,
    );
  }
  
  async getPrimaryExtra(metadataId: string): Promise<string | null> {
    const metadata = await this.fetch<LibraryItems>(
      `/library/metadata/${metadataId}`
    );
    const primary = metadata.Metadata?.[0]?.primaryExtraKey;
    return primary ?? null;
  }
}

// In providers/plex.ts

export const createProvider = (
  id: string,
  providerOptions: PlexProviderConfig,
): MovieMatchProvider => {
  return {
    // ... existing methods ...
    
    getTrailerUrl: async (metadataKey: string, options?: any) => {
      try {
        const extras = await api.getExtras(metadataKey.replace('/library/metadata/', ''));
        const trailer = extras.Metadata?.find(
          m => m.type === 'trailer' || m.subtype === 'trailer'
        );
        
        if (trailer?.key) {
          return api.getDeepLink(trailer.key, {
            type: options?.linkType ?? 'plexTv',
            metadataType: '5'  // Trailer type
          });
        }
      } catch (err) {
        log.debug(`Could not fetch trailer: ${err}`);
      }
      return null;
    }
  };
};
```

### Example 3: Watch History Lookup

```typescript
// In plex/api.ts

export interface WatchHistoryItem {
  ratingKey: string;
  title: string;
  viewedAt: number;
  accountID: number;
  duration: number;  // Milliseconds watched
}

export class PlexApi {
  async getWatchHistory(options?: {
    userId?: number;
    libraryId?: number;
    itemId?: string;
    afterDate?: number;
    beforeDate?: number;
    limit?: number;
  }): Promise<WatchHistoryItem[]> {
    const params: Record<string, string> = {};
    
    if (options?.userId) {
      params['accountID'] = String(options.userId);
    }
    if (options?.libraryId) {
      params['librarySectionID'] = String(options.libraryId);
    }
    if (options?.itemId) {
      params['metadataItemID'] = options.itemId;
    }
    if (options?.afterDate) {
      params['viewedAt'] = `>>=` + String(options.afterDate);
    }
    if (options?.beforeDate) {
      params['viewedAt'] = `<<=` + String(options.beforeDate);
    }
    
    params['sort'] = 'viewedAt:desc';
    
    const result = await this.fetch<LibraryItems>(
      '/status/sessions/history/all',
      { searchParams: params }
    );
    
    return result.Metadata?.map(m => ({
      ratingKey: m.ratingKey,
      title: m.title,
      viewedAt: m.lastViewedAt || 0,
      accountID: 0,  // Not in response
      duration: m.duration || 0
    })) ?? [];
  }
}
```

---

## 9. Deprecated Endpoints

**Finding:** No deprecated endpoints found in the OpenAPI 1.1.1 specification. All endpoints appear to be current. However:

- Older XML-only APIs (pre-JSON support) are no longer documented
- The spec recommends always sending `Accept: application/json` header
- Some server features may require PMS >= 1.42.2

---

## 10. Future Enhancement Opportunities

### 1. Smart Playlist Creation
```
POST /playlists?title=MovieMatch%20Matches
```
Create a playlist containing matched movies found by users

### 2. Cast/Crew Filtering
Currently available in metadata but not exposed as filters:
```
GET /library/sections/1/all?actor=Tom%20Hanks
```

### 3. Collection Browsing
```
GET /library/sections/1/collection
```
Allow filtering by franchises/collections

### 4. Advanced Statistics
```
GET /library/metadata/{ids}/users/top
```
Get most popular/rated content across users

### 5. Deep Linking Improvements
```
Current: plex://preplay/?metadataKey=/library/metadata/1049&server=<id>
Future: Allow direct timestamp links for resume functionality
```

### 6. Content Recommendations
Use `/library/metadata/{ids}/related` and `/library/metadata/{ids}/similar` endpoints

### 7. User-Specific Watchlists
Leverage existing playlist structure to create per-user temporary watchlists during matches

---

## 11. Security & Performance Considerations

### Authentication
- Always use `X-Plex-Token` in header (not URL, when possible)
- Validate token before making requests to Plex server
- Store tokens securely in environment variables

### Performance
- Use `limit` parameter for large result sets
- Implement caching for filter values (they change infrequently)
- Batch metadata requests when possible
- Use `includeFields` to exclude unnecessary data

**Example optimized request:**
```
GET /library/sections/1/all?type=1&limit=50&includeFields=ratingKey,title,year,thumb,rating,viewCount&excludeElements=Media
```

### Pagination
Always check response headers:
- `X-Plex-Container-Total-Size` - Total items available
- `X-Plex-Container-Start` - Current offset

### Rate Limiting
- No explicit rate limits documented
- Implement backoff strategy for large bulk operations
- Consider implementing request queue/throttling

---

## 12. Recommendations for MovieMatch Enhancement

### Priority 1 (High Value, Low Effort)
1. **Add watched status filtering** - Uses existing `viewCount` field
2. **Add genre filtering UI** - Already implemented in code, just needs UI exposure
3. **Display additional metadata** - Cast, director, writers already available

### Priority 2 (Moderate Value, Medium Effort)
1. **Trailer button** - Requires fetching extras, deep linking working
2. **Watch history filtering** - Requires admin endpoint, may not be available
3. **Year range filtering** - Easily added to media query

### Priority 3 (Nice to Have, Higher Effort)
1. **Watchlist integration** - Requires playlist management
2. **User ratings persistence** - Requires rating endpoint calls
3. **Smart recommendations** - Requires related/similar endpoint calls

### Not Recommended
- OAuth integration - Current token-based auth works well
- User authentication per-Plex-user - Complex, require user mapping

---

## 13. File Locations & Structure

```
/Users/mtvogel/Documents/Github-Repos/moviematch/
├── plex media server openapi 1.1.1.json          # OpenAPI spec (29,847 lines)
├── internal/app/plex/
│   ├── api.ts                                    # Main Plex API client (294 lines)
│   ├── plex_tv.ts                               # Plex.tv integration (not used much)
│   └── types/
│       ├── library_items.ts                      # Shared item interface (253 lines)
│       ├── library_item_movie.ts                # Movie-specific (133 lines)
│       ├── library_item_show.ts
│       ├── capabilities.ts
│       ├── identity.ts
│       ├── libraries_list.ts
│       └── library_filter_values.ts
├── internal/app/moviematch/providers/
│   └── plex.ts                                  # Plex provider implementation (224 lines)
└── types/moviematch.ts                          # Main app types (284 lines)
```

---

## Appendix: Complete Filter & Sort Options

### Available Filter Fields
```
genre, year, decade, contentRating, collection, 
director, actor, writer, producer, country, studio,
resolution, bitrate, subtitleLanguage, audioLanguage,
channel, channels, recentlyAdded (date), lastViewed (date),
rating (numeric), userRating (numeric), duration,
viewCount, plays, added (date), updated (date)
```

### Available Sort Options
```
titleSort, year, released, addedAt, updatedAt,
lastViewedAt, rating, duration, viewCount, random,
actor, channel, director, writer
```

### Available Operators
```
= (equals/contains)
!= (not equals/does not contain)
== (exactly equals)
!== (exactly does not equal)
<= (begins with)
>= (ends with)
<<= (less than/before)
>>= (greater than/after)
```

