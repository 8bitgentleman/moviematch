# Plex Media Server OpenAPI Analysis - Executive Summary

## Overview

A comprehensive analysis of the Plex Media Server OpenAPI specification (v1.1.1) has been completed and compared with the current MovieMatch implementation.

**Two detailed documentation files have been created:**

1. **PLEX_OPENAPI_ANALYSIS.md** (29 KB) - Complete technical reference with endpoint details, code examples, and implementation guides
2. **PLEX_API_QUICK_REFERENCE.md** (10 KB) - Quick implementation guide with ready-to-use code snippets and priorities

---

## Key Findings

### Current Implementation Status

| Component | Status | Scope |
|-----------|--------|-------|
| **Endpoints Used** | 8 core endpoints | Basic library browsing and filtering |
| **Authentication** | Token-based (working) | X-Plex-Token header |
| **Filtering** | Partial | Genre, type, basic filters only |
| **Metadata** | Partial | Uses title, year, rating, duration |
| **Features** | Basic | List libraries, filter, get items |

### OpenAPI Specification Coverage

| Aspect | Coverage |
|--------|----------|
| **Total Endpoints** | 150+ documented |
| **Authentication** | Full token-based support |
| **Filtering** | 30+ filter types available |
| **Pagination** | Full support via headers |
| **Media Queries** | Advanced query language |
| **Metadata** | Rich with cast, crew, collections |

---

## Requested Features Analysis

### 1. Watched Status Filtering
**Current:** Data exists but not used for filtering
**Recommendation:** HIGH PRIORITY - Easiest implementation
**Effort:** 1-2 hours
**Implementation:**
```
Use existing viewCount field: 0 = unwatched, >0 = watched
API: GET /library/sections/1/all?viewCount=0
```

### 2. Trailer Fetching
**Current:** Not implemented
**Recommendation:** HIGH PRIORITY - High user value
**Effort:** 2-3 hours
**Implementation:**
```
New endpoint: GET /library/metadata/{id}/extras
Filter for type='trailer' in response
```

### 3. Genre Filtering
**Current:** Already implemented in backend
**Recommendation:** QUICK WIN - Just UI work
**Effort:** 30 minutes - 1 hour
**Implementation:**
```
Already working - just expose in UI
API: GET /library/sections/1/all?genre=Action,Drama
```

### 4. Watchlist Integration
**Current:** Not implemented
**Recommendation:** MEDIUM PRIORITY - potentially Requires playlist management - more questions/analysis needed
**Effort:** 3-4 hours
**Implementation:**
```
New endpoints: GET /playlists, GET /playlists/{id}/items
Integration with existing filter system
```

### 5. User Authentication
**Current:** Already implemented and working
**Recommendation:** No changes needed
**Effort:** 0 hours
**Status:** Token-based auth is correct approach

---

## Currently Used Endpoints

```
GET /                              Server capabilities
GET /identity                      Server identity & version
GET /library/sections              List all libraries
GET /library/sections/{id}/all     Get items with filters
GET /library/sections/{id}/{filter} Get filter values
GET /library/metadata/{id}         Get item details
GET /photo/:/transcode            Resize/transcode images
Deep link generation              Plex client links
```

---

## Recommended New Endpoints

```
GET /library/metadata/{id}/extras      Get trailers & extras
GET /library/sections/{id}/genre       Get available genres
PUT /:/scrobble                        Mark item watched
PUT /:/unscrobble                      Mark item unwatched
PUT /:/rate                           Rate item (1-10)
GET /playlists                        List user playlists
GET /playlists/{id}/items             Get playlist items
GET /status/sessions/history/all      Get watch history
GET /library/metadata/{id}/related    Get related content
GET /library/metadata/{id}/similar    Get similar content
```

---

## Data Available But Not Used

The API responses contain many fields not currently extracted:

```typescript
viewCount              // Times watched (use for filtering)
lastViewedAt           // Timestamp of last view
primaryExtraKey        // Link to primary extra (trailer)
audienceRating         // External rating score
Collection             // Collections/franchises
Director               // Director information
Writer                 // Writer/creator information
Role                   // Cast information with roles
Country                // Country of origin
originalTitle          // Original language title
titleSort              // Sortable title
```

---

## Implementation Priority

### Priority 1 - HIGH VALUE, LOW EFFORT (Week 1)

**Watched Status Filtering** (1-2 hours)
- Add 'watched' filter option
- Use viewCount field
- Enable filtering unwatched media only

**Genre Filtering UI** (30 mins - 1 hour)  
- Already implemented in backend
- Just needs UI component

**Trailer Button** (2-3 hours)
- Fetch extras endpoint
- Parse for trailer type
- Add UI button with deep link

### Priority 2 - MEDIUM VALUE, MEDIUM EFFORT (Week 2)

**Watchlist Selection** (3-4 hours)
- Fetch user playlists
- Allow filtering by playlist
- Integration with existing filter system

**Display Cast/Crew** (1 hour)
- Extract from metadata
- Display in UI

### Priority 3 - NICE TO HAVE (Week 3+)

**Advanced Filters** - Year range, actor, director filters
**Watch History** - Show what was watched when
**Smart Recommendations** - Related/similar content
**User Ratings** - Persist ratings via API

---

## Files to Modify

| File | Size | Changes | Priority |
|------|------|---------|----------|
| `internal/app/plex/api.ts` | 294 lines | Add getExtras(), getPlaylists() | HIGH |
| `internal/app/moviematch/providers/plex.ts` | 224 lines | Add watched filter, trailer handler | HIGH |
| `types/moviematch.ts` | 284 lines | Optional: new filter types | MEDIUM |
| Frontend components | N/A | Add UI for filters/features | MEDIUM |

---

## Type Definitions Status

All necessary TypeScript types already exist in the codebase:
- `viewCount?: number` ✓
- `lastViewedAt?: number` ✓  
- `primaryExtraKey?: string` ✓
- `Genre[]`, `Director[]`, `Writer[]`, `Role[]` ✓

No breaking schema changes required.

---

## Testing Instructions

Before implementing, test endpoints with curl:

```bash
# Set these variables
SERVER="http://localhost:32400"
TOKEN="your_plex_token"

# Test unwatched filter
curl -H "X-Plex-Token: $TOKEN" \
  "$SERVER/library/sections/1/all?type=1&viewCount=0"

# Test trailers
curl -H "X-Plex-Token: $TOKEN" \
  "$SERVER/library/metadata/1049/extras"

# Test playlists
curl -H "X-Plex-Token: $TOKEN" \
  "$SERVER/playlists?playlistType=video"

# Test genres
curl -H "X-Plex-Token: $TOKEN" \
  "$SERVER/library/sections/1/genre"
```

---

## Documentation Included

### PLEX_OPENAPI_ANALYSIS.md (1,250 lines)
Comprehensive technical reference including:
- Full endpoint documentation
- Request/response examples
- Comparison with current implementation
- Code examples for each feature
- Security and performance considerations
- Future enhancement opportunities
- Complete filter and sort options

### PLEX_API_QUICK_REFERENCE.md (380 lines)
Implementation-focused guide including:
- Ready-to-use code snippets
- Priority ranking with effort estimates
- Step-by-step implementation guide
- Common pitfalls and solutions
- File modification checklist
- Testing instructions

---

## Key Insights

### What's Working Well
- Token authentication is correct approach
- Deep linking implementation is solid
- Filter system is extensible
- Metadata extraction is comprehensive

### Missed Opportunities
- Watch status not being filtered (data is there)
- Genre filter not exposed in UI (code works)
- Trailer endpoint not used (fully documented)
- Advanced metadata not displayed (available in response)

### No Breaking Changes
- All recommendations are backward compatible
- Existing functionality continues unchanged
- Can be implemented incrementally
- No database schema changes needed

---

## Next Steps

1. **Read the detailed analysis** - Start with PLEX_OPENAPI_ANALYSIS.md for complete context
2. **Review quick reference** - Check PLEX_API_QUICK_REFERENCE.md for implementation details
3. **Test with your server** - Use curl commands to validate endpoints
4. **Start with Priority 1** - Watched status filtering (easiest, highest value)
5. **Create feature branch** - Implement one feature per branch/PR

---

## Estimated Timeline

- **Quick Wins (Week 1):** 
  - Watched status filter: 1-2 hours
  - Genre UI: 30 mins - 1 hour
  - Trailer button: 2-3 hours
  - **Total: ~4-6 hours of implementation**

- **Medium Priority (Week 2):**
  - Watchlist selection: 3-4 hours
  - Cast/crew display: 1 hour
  - **Total: ~4-5 hours**

- **Polish & Testing:** 2-3 hours

**Total Estimated Effort: 10-14 hours for Priority 1+2 features**

---

## Questions Answered

**Q: Is the API documentation complete?**
A: Yes, the OpenAPI 1.1.1 spec covers all current endpoints with examples.

**Q: Are there deprecated endpoints we're using?**
A: No, all current endpoints are current and documented.

**Q: Can we add these features without breaking changes?**
A: Yes, all recommendations are fully backward compatible.

**Q: What's the most impactful feature to add first?**
A: Watched status filtering - easiest to implement, high user value.

**Q: Why isn't genre filtering working?**
A: It IS working in the backend - just needs to be exposed in the UI.

**Q: What endpoints require special permissions?**
A: Watch history (`/status/sessions/history/all`) requires admin token.

---

## Repository Files

The analysis is complete with comprehensive documentation:

```
moviematch/
├── ANALYSIS_SUMMARY.md                    # This file
├── PLEX_OPENAPI_ANALYSIS.md              # Full technical reference
├── PLEX_API_QUICK_REFERENCE.md           # Implementation guide
├── plex media server openapi 1.1.1.json  # Original OpenAPI spec
└── [existing code files...]
```

---

## Conclusion

The Plex Media Server API is well-documented and feature-rich. MovieMatch currently uses only a small fraction of available functionality. The recommended features are all achievable with moderate effort and provide significant value to users:

- **Watched status filtering** - Users can exclude or focus on unwatched content
- **Trailer support** - Users can preview movies before watching
- **Genre filtering** - Already works, just needs UI
- **Watchlist integration** - Users can filter from existing playlists
- **Additional metadata** - Cast, crew, collections already available

All recommendations maintain backward compatibility and can be implemented incrementally.

