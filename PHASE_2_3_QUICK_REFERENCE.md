# Phase 2.3 Filter Enhancements - Quick Reference

## New Types

### SortOrder
```typescript
type SortOrder = 'newest' | 'oldest' | 'random';
```
- `'newest'`: Sort by year descending (2024, 2023, 2022...)
- `'oldest'`: Sort by year ascending (1950, 1951, 1952...)
- `'random'`: Fisher-Yates shuffle (default)

### GenreFilterMode
```typescript
type GenreFilterMode = 'and' | 'or';
```
- `'and'`: Media must have ALL selected genres
- `'or'`: Media must have AT LEAST ONE selected genre (default)

### RatingFilter
```typescript
interface RatingFilter {
  min?: number;        // 0-10 scale
  max?: number;        // 0-10 scale
  type?: 'critic' | 'audience';  // Reserved for future use
}
```

### ContentRatingFilter
```typescript
interface ContentRatingFilter {
  ratings: string[];  // e.g., ["G", "PG", "PG-13", "R"]
}
```

## CreateRoomRequest Extensions

```typescript
interface CreateRoomRequest {
  // Existing fields
  roomName: string;
  password?: string;
  options?: RoomOption[];
  filters?: Filter[];
  sort?: RoomSort;
  roomType?: RoomType;

  // Phase 2.3 additions
  sortOrder?: SortOrder;
  genreFilterMode?: GenreFilterMode;
  ratingFilter?: RatingFilter;
  contentRatingFilter?: ContentRatingFilter;
}
```

## Common Patterns

### Basic Sort
```typescript
{ sortOrder: "newest" }
{ sortOrder: "oldest" }
{ sortOrder: "random" }  // or omit (default)
```

### Genre Filtering
```typescript
// Any of these genres
{
  filters: [{ key: "genre", value: ["Action", "Comedy"], operator: "=" }],
  genreFilterMode: "or"  // or omit (default)
}

// Must have all these genres
{
  filters: [{ key: "genre", value: ["Action", "Comedy"], operator: "=" }],
  genreFilterMode: "and"
}
```

### Rating Filtering
```typescript
// Minimum rating only
{ ratingFilter: { min: 7.5 } }

// Maximum rating only
{ ratingFilter: { max: 8.5 } }

// Rating range
{ ratingFilter: { min: 7.0, max: 9.0 } }
```

### Content Rating Filtering
```typescript
// Family-friendly
{ contentRatingFilter: { ratings: ["G", "PG"] } }

// Teen-appropriate
{ contentRatingFilter: { ratings: ["PG", "PG-13"] } }

// Mature content
{ contentRatingFilter: { ratings: ["R", "NC-17"] } }
```

## Combined Examples

### Recent High-Quality Action
```typescript
{
  sortOrder: "newest",
  filters: [{ key: "genre", value: ["Action"], operator: "=" }],
  ratingFilter: { min: 7.5 }
}
```

### Family Movie Night
```typescript
{
  sortOrder: "random",
  filters: [{ key: "genre", value: ["Family", "Animation"], operator: "=" }],
  genreFilterMode: "or",
  ratingFilter: { min: 6.5 },
  contentRatingFilter: { ratings: ["G", "PG"] }
}
```

### Curated Drama Selection
```typescript
{
  sortOrder: "newest",
  filters: [{ key: "genre", value: ["Drama"], operator: "=" }],
  ratingFilter: { min: 8.0, max: 9.5 },
  contentRatingFilter: { ratings: ["PG-13", "R"] }
}
```

## Default Values

| Field | Default | Behavior |
|-------|---------|----------|
| `sortOrder` | `'random'` | Random shuffle |
| `genreFilterMode` | `'or'` | Any matching genre |
| `ratingFilter` | `undefined` | No rating filter |
| `contentRatingFilter` | `undefined` | No content rating filter |

## Filter Application Order

1. **Plex filters** (via query parameters)
2. **Genre filter** (AND/OR logic)
3. **Rating filter** (min/max)
4. **Content rating filter**
5. **Sort order**

## Important Notes

### Backward Compatibility
- All Phase 2.3 fields are optional
- Existing rooms continue to work
- Default values ensure seamless migration

### Case Sensitivity
- Genre matching: **Case-insensitive** ✓
- Content rating matching: **Case-sensitive** ⚠️
  - Use "PG-13", not "pg-13"
  - Use "R", not "r"

### Missing Data Handling
- Movies without year: Treated as year 0 (sorted to end)
- Movies without rating: Treated as 0 (excluded by `min` filters)
- Movies without content rating: **Excluded** when `contentRatingFilter` is used

### Empty Results
- Throws `NoMediaError` if no media matches filters
- Check filter restrictiveness if getting no results

## File Locations

| Component | File Path |
|-----------|-----------|
| Types | `/types/moviematch.ts` |
| Room Class | `/internal/app/moviematch/room.ts` |
| Plex Provider | `/internal/app/moviematch/providers/plex.ts` |
| Provider Types | `/internal/app/moviematch/providers/types.ts` |
| Storage Interface | `/internal/app/moviematch/storage/interface.ts` |

## Testing Checklist

- [ ] Test each sort order independently
- [ ] Test genre AND vs OR logic
- [ ] Test rating range boundaries
- [ ] Test content rating combinations
- [ ] Test combined filters
- [ ] Test backward compatibility (no Phase 2.3 fields)
- [ ] Test empty result scenarios
- [ ] Test room persistence and restoration
- [ ] Test with large media libraries (performance)
- [ ] Test case sensitivity (genres vs content ratings)

## Common Errors

### NoMediaError
```
Error: There are no items with the specified filters applied.
```
**Solution**: Relax filter restrictions or verify media library content

### Invalid Rating Range
```typescript
// Wrong
{ ratingFilter: { min: 9, max: 7 } }  // max < min

// Right
{ ratingFilter: { min: 7, max: 9 } }
```

### Case-Sensitive Content Ratings
```typescript
// Wrong
{ contentRatingFilter: { ratings: ["pg-13"] } }

// Right
{ contentRatingFilter: { ratings: ["PG-13"] } }
```

## Performance Tips

1. **Use Plex filters first**: Filter at source before Phase 2.3 post-processing
2. **Avoid overly restrictive AND mode**: Can significantly reduce results
3. **Random sort**: O(n) complexity (Fisher-Yates)
4. **Year sort**: O(n log n) complexity (JavaScript sort)
5. **Large libraries**: Consider combining Plex filters with Phase 2.3 filters

## Migration Guide

### Phase 1 to Phase 2.3

**Before (Phase 1):**
```typescript
const request: CreateRoomRequest = {
  roomName: "Action Movies",
  filters: [
    { key: "genre", value: ["Action"], operator: "=" }
  ]
};
```

**After (Phase 2.3):**
```typescript
const request: CreateRoomRequest = {
  roomName: "Action Movies",
  sortOrder: "newest",                    // NEW
  genreFilterMode: "or",                  // NEW
  ratingFilter: { min: 7.0 },            // NEW
  contentRatingFilter: { ratings: ["PG-13", "R"] },  // NEW
  filters: [
    { key: "genre", value: ["Action"], operator: "=" }
  ]
};
```

**No Breaking Changes**: Phase 1 code continues to work!

## API Reference

### Room Class
```typescript
class Room {
  sortOrder: SortOrder;
  genreFilterMode?: GenreFilterMode;
  ratingFilter?: RatingFilter;
  contentRatingFilter?: ContentRatingFilter;

  constructor(req: CreateRoomRequest, ctx: RouteContext, creatorInfo)
  toSerializedRoom(): SerializedRoom
}
```

### Provider Interface
```typescript
interface MovieMatchProvider {
  getMedia(options: {
    filters?: Filter[];
    sortOrder?: SortOrder;
    genreFilterMode?: GenreFilterMode;
    ratingFilter?: RatingFilter;
    contentRatingFilter?: ContentRatingFilter;
  }): Promise<Media[]>;
}
```

### Storage Interface
```typescript
interface SerializedRoom {
  // ... existing fields
  sortOrder?: SortOrder;
  genreFilterMode?: GenreFilterMode;
  ratingFilter?: RatingFilter;
  contentRatingFilter?: ContentRatingFilter;
}
```

## WebSocket Messages

### Create Room
```javascript
// Client → Server
{
  type: "createRoom",
  payload: {
    roomName: "My Room",
    sortOrder: "newest",
    genreFilterMode: "and",
    ratingFilter: { min: 7, max: 9 },
    contentRatingFilter: { ratings: ["PG-13", "R"] },
    filters: [...]
  }
}

// Server → Client (Success)
{
  type: "createRoomSuccess",
  payload: {
    previousMatches: [],
    media: [...],
    users: [...]
  }
}

// Server → Client (Error)
{
  type: "createRoomError",
  payload: {
    name: "NoMedia",
    message: "There are no items with the specified filters applied."
  }
}
```

## Version Information

- **Phase**: 2.3
- **Feature**: Filter Enhancements
- **Status**: ✅ Complete
- **Backward Compatible**: Yes
- **Breaking Changes**: None

## Support

For issues or questions:
1. Check PHASE_2_3_IMPLEMENTATION_SUMMARY.md for detailed implementation
2. See PHASE_2_3_USAGE_EXAMPLES.md for comprehensive examples
3. Review PLAN.md lines 455-506 for original requirements
