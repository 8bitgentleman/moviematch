# Phase 2.3 Filter Enhancements - Usage Examples

This document provides practical examples of using the Phase 2.3 enhanced filtering capabilities.

## Basic Usage Examples

### 1. Sort by Newest Movies

```typescript
const request: CreateRoomRequest = {
  roomName: "Newest Movies",
  sortOrder: "newest"
};

// Creates a room with movies sorted by release year, newest first
// Movies without a year are treated as year 0 (sorted to the end)
```

### 2. Sort by Oldest Movies

```typescript
const request: CreateRoomRequest = {
  roomName: "Classic Films",
  sortOrder: "oldest"
};

// Perfect for exploring classic cinema
// Movies are sorted by release year, oldest first
```

### 3. Random Order (Default)

```typescript
const request: CreateRoomRequest = {
  roomName: "Random Mix",
  sortOrder: "random"  // Can be omitted, this is the default
};

// Traditional MovieMatch experience with randomized order
```

## Genre Filtering Examples

### 4. Multiple Genres with OR Logic (Default)

```typescript
const request: CreateRoomRequest = {
  roomName: "Action or Comedy",
  filters: [
    { key: "genre", value: ["Action", "Comedy"], operator: "=" }
  ],
  genreFilterMode: "or"  // Can be omitted, this is the default
};

// Returns movies that are:
// - Action movies
// - Comedy movies
// - Action-Comedy movies (has both genres)
```

### 5. Multiple Genres with AND Logic

```typescript
const request: CreateRoomRequest = {
  roomName: "Action-Comedy Only",
  filters: [
    { key: "genre", value: ["Action", "Comedy"], operator: "=" }
  ],
  genreFilterMode: "and"
};

// Returns ONLY movies that have BOTH Action AND Comedy genres
// This is more restrictive than OR mode
```

### 6. Complex Genre Selection

```typescript
const request: CreateRoomRequest = {
  roomName: "Sci-Fi Action Thrillers",
  filters: [
    { key: "genre", value: ["Science Fiction", "Action", "Thriller"], operator: "=" }
  ],
  genreFilterMode: "and"
};

// Returns only movies that are simultaneously:
// - Science Fiction
// - Action
// - Thriller
```

## Rating Filter Examples

### 7. High-Rated Movies Only

```typescript
const request: CreateRoomRequest = {
  roomName: "Top Rated",
  ratingFilter: {
    min: 8.0
  }
};

// Returns movies with rating >= 8.0
// No upper limit
```

### 8. Rating Range

```typescript
const request: CreateRoomRequest = {
  roomName: "Good Movies",
  ratingFilter: {
    min: 7.0,
    max: 9.0
  }
};

// Returns movies with rating between 7.0 and 9.0 (inclusive)
```

### 9. Exclude Low-Rated Movies

```typescript
const request: CreateRoomRequest = {
  roomName: "Decent Movies",
  ratingFilter: {
    min: 6.5
  }
};

// Filters out movies below 6.5 rating
```

## Content Rating Filter Examples

### 10. Family-Friendly Movies

```typescript
const request: CreateRoomRequest = {
  roomName: "Family Night",
  contentRatingFilter: {
    ratings: ["G", "PG"]
  }
};

// Returns only G and PG rated movies
// Movies without a content rating are excluded
```

### 11. Teen-Appropriate Content

```typescript
const request: CreateRoomRequest = {
  roomName: "Teen Movie Night",
  contentRatingFilter: {
    ratings: ["PG", "PG-13"]
  }
};

// Returns PG and PG-13 movies only
```

### 12. Mature Content Only

```typescript
const request: CreateRoomRequest = {
  roomName: "Adult Movies",
  contentRatingFilter: {
    ratings: ["R", "NC-17"]
  }
};

// Returns R and NC-17 rated movies
```

## Combined Filter Examples

### 13. Recent High-Rated Action Movies

```typescript
const request: CreateRoomRequest = {
  roomName: "Recent Action Hits",
  sortOrder: "newest",
  filters: [
    { key: "genre", value: ["Action"], operator: "=" }
  ],
  ratingFilter: {
    min: 7.5
  }
};

// Returns:
// - Action movies
// - Rating >= 7.5
// - Sorted by newest first
```

### 14. Classic Family-Friendly Comedies

```typescript
const request: CreateRoomRequest = {
  roomName: "Classic Family Comedies",
  sortOrder: "oldest",
  filters: [
    { key: "genre", value: ["Comedy"], operator: "=" }
  ],
  contentRatingFilter: {
    ratings: ["G", "PG"]
  }
};

// Returns:
// - Comedy movies
// - Rated G or PG
// - Sorted by oldest first
```

### 15. High-Rated Sci-Fi Thrillers

```typescript
const request: CreateRoomRequest = {
  roomName: "Premium Sci-Fi Thrillers",
  filters: [
    { key: "genre", value: ["Science Fiction", "Thriller"], operator: "=" }
  ],
  genreFilterMode: "and",
  ratingFilter: {
    min: 8.0
  },
  contentRatingFilter: {
    ratings: ["PG-13", "R"]
  }
};

// Returns movies that:
// - Have BOTH Sci-Fi AND Thriller genres
// - Rating >= 8.0
// - Rated PG-13 or R
```

### 16. Curated Movie Club Selection

```typescript
const request: CreateRoomRequest = {
  roomName: "Movie Club - December",
  sortOrder: "random",
  filters: [
    { key: "genre", value: ["Drama", "Biography", "History"], operator: "=" }
  ],
  genreFilterMode: "or",
  ratingFilter: {
    min: 7.0,
    max: 9.5
  },
  contentRatingFilter: {
    ratings: ["PG-13", "R"]
  }
};

// Returns movies that:
// - Are Drama, Biography, or History (or any combination)
// - Rating between 7.0 and 9.5
// - Rated PG-13 or R
// - Presented in random order
```

## Advanced Filtering Scenarios

### 17. Date Night - Romance or Comedy

```typescript
const request: CreateRoomRequest = {
  roomName: "Date Night Options",
  sortOrder: "newest",
  filters: [
    { key: "genre", value: ["Romance", "Comedy"], operator: "=" }
  ],
  genreFilterMode: "or",
  ratingFilter: {
    min: 6.5
  },
  contentRatingFilter: {
    ratings: ["PG-13", "R"]
  }
};

// Good movies for couples, newest first
```

### 18. Kids Movie Marathon

```typescript
const request: CreateRoomRequest = {
  roomName: "Kids Marathon",
  sortOrder: "random",
  filters: [
    { key: "genre", value: ["Animation", "Family", "Adventure"], operator: "=" }
  ],
  genreFilterMode: "or",
  ratingFilter: {
    min: 6.0  // Ensure decent quality
  },
  contentRatingFilter: {
    ratings: ["G", "PG"]
  }
};

// Safe, quality content for children
```

### 19. Horror Movie Night

```typescript
const request: CreateRoomRequest = {
  roomName: "Horror Night",
  sortOrder: "newest",
  filters: [
    { key: "genre", value: ["Horror"], operator: "=" }
  ],
  ratingFilter: {
    min: 6.0  // Filter out low-quality horror
  },
  contentRatingFilter: {
    ratings: ["R"]  // Only mature horror
  }
};

// Recent, quality horror movies for adults
```

### 20. Documentary Deep Dive

```typescript
const request: CreateRoomRequest = {
  roomName: "Documentary Night",
  sortOrder: "newest",
  filters: [
    { key: "genre", value: ["Documentary"], operator: "=" }
  ],
  ratingFilter: {
    min: 7.5  // High-quality documentaries only
  }
};

// Recent, highly-rated documentaries
// No content rating filter (documentaries often vary)
```

## Edge Cases and Special Scenarios

### 21. No Filters (All Movies)

```typescript
const request: CreateRoomRequest = {
  roomName: "Everything",
  sortOrder: "random"
};

// Returns all movies in random order
// Traditional MovieMatch experience
```

### 22. Very Restrictive Filters

```typescript
const request: CreateRoomRequest = {
  roomName: "Ultra Specific",
  sortOrder: "newest",
  filters: [
    { key: "genre", value: ["Drama", "War", "History"], operator: "=" }
  ],
  genreFilterMode: "and",  // Must have ALL three genres
  ratingFilter: {
    min: 8.5  // Very high rating
  },
  contentRatingFilter: {
    ratings: ["R"]
  }
};

// Warning: Very restrictive - may return few or no results
// If no media matches, will throw NoMediaError
```

### 23. Case-Insensitive Genre Matching

```typescript
const request: CreateRoomRequest = {
  roomName: "Action Movies",
  filters: [
    // These all work the same due to case-insensitive matching
    { key: "genre", value: ["action"], operator: "=" },
    // { key: "genre", value: ["ACTION"], operator: "=" },
    // { key: "genre", value: ["Action"], operator: "=" },
  ]
};

// Genre matching is case-insensitive
```

### 24. Movies Without Ratings

```typescript
const request: CreateRoomRequest = {
  roomName: "Unrated Content",
  // Note: There's no built-in filter for "no content rating"
  // Movies without ratings are automatically excluded when
  // contentRatingFilter is used
};

// To include all movies regardless of rating, omit contentRatingFilter
```

## WebSocket Message Format

When creating a room via WebSocket:

```javascript
// Client sends
{
  type: "createRoom",
  payload: {
    roomName: "My Room",
    sortOrder: "newest",
    filters: [
      { key: "genre", value: ["Action", "Comedy"], operator: "=" }
    ],
    genreFilterMode: "or",
    ratingFilter: {
      min: 7.0,
      max: 9.0
    },
    contentRatingFilter: {
      ratings: ["PG-13", "R"]
    }
  }
}

// Server responds with success
{
  type: "createRoomSuccess",
  payload: {
    previousMatches: [],
    media: [
      {
        id: "...",
        type: "movie",
        title: "Example Movie",
        year: 2023,
        rating: 8.5,
        contentRating: "PG-13",
        genres: ["Action", "Comedy"],
        // ... other fields
      },
      // ... more media
    ],
    users: [...]
  }
}

// Or error if no media matches
{
  type: "createRoomError",
  payload: {
    name: "NoMedia",
    message: "There are no items with the specified filters applied."
  }
}
```

## Performance Considerations

### Filter Order and Performance

The filters are applied in this order:
1. Basic Plex filters (sent as query parameters to Plex)
2. Genre filter (post-processing)
3. Rating filter (post-processing)
4. Content rating filter (post-processing)
5. Sort order (post-processing)

**Optimization Tips:**
- Use Plex's built-in filters when possible (via `filters` array)
- Genre, rating, and content rating filters are applied in-memory after fetching
- For large libraries, be aware that restrictive filters may require fetching many items
- `sortOrder: "random"` uses Fisher-Yates shuffle (O(n) complexity)
- `sortOrder: "newest"` and `"oldest"` use JavaScript's sort (O(n log n) complexity)

### Large Library Handling

```typescript
// For libraries with 10,000+ movies:
// Consider using Plex's built-in filters to reduce initial fetch size

const request: CreateRoomRequest = {
  roomName: "Optimized",
  filters: [
    // These are sent to Plex and filter at the source
    { key: "year", value: ["2020"], operator: ">>" },  // After 2020
    { key: "genre", value: ["Action"], operator: "=" }
  ],
  // Then apply additional Phase 2.3 filters
  ratingFilter: { min: 7.0 },
  sortOrder: "newest"
};

// This fetches fewer items from Plex initially
```

## Testing Filters

### Verify Filter Behavior

```typescript
// Create a test room to verify filters work as expected
const testRequest: CreateRoomRequest = {
  roomName: "Filter Test",
  sortOrder: "newest",
  filters: [
    { key: "genre", value: ["Comedy"], operator: "=" }
  ],
  ratingFilter: {
    min: 7.0
  }
};

const room = await createRoom(testRequest, ctx, creatorInfo);
const media = await room.media;

// Verify all media meets criteria:
for (const [id, item] of media) {
  console.assert(item.genres.includes("Comedy"), "Has Comedy genre");
  console.assert(item.rating >= 7.0, "Rating >= 7.0");
}

// Verify sort order
const mediaArray = Array.from(media.values());
for (let i = 1; i < mediaArray.length; i++) {
  const prevYear = mediaArray[i - 1].year || 0;
  const currYear = mediaArray[i].year || 0;
  console.assert(
    prevYear >= currYear,
    "Sorted newest first"
  );
}
```

## Common Pitfalls

### 1. Empty Results
```typescript
// This might return no movies:
const request: CreateRoomRequest = {
  genreFilterMode: "and",
  filters: [
    { key: "genre", value: ["Action", "Romance", "Comedy", "Drama"], operator: "=" }
  ]
};
// Movies rarely have 4+ genres
```

### 2. Conflicting Filters
```typescript
// Invalid: max < min
const request: CreateRoomRequest = {
  ratingFilter: {
    min: 9.0,
    max: 7.0  // This will match nothing
  }
};
```

### 3. Case Sensitivity
```typescript
// Content rating filter IS case-sensitive
const request: CreateRoomRequest = {
  contentRatingFilter: {
    ratings: ["pg-13"]  // Wrong! Should be "PG-13"
  }
};
```

### 4. Missing Content Ratings
```typescript
// Movies without content rating are excluded
const request: CreateRoomRequest = {
  contentRatingFilter: {
    ratings: ["PG"]
  }
};
// Old or foreign movies may not have ratings and will be filtered out
```

## Migration from Phase 1

If you have existing room creation code:

```typescript
// Phase 1 code (still works)
const oldRequest: CreateRoomRequest = {
  roomName: "Old Style",
  filters: [
    { key: "genre", value: ["Action"], operator: "=" }
  ]
};

// Phase 2.3 enhanced version
const newRequest: CreateRoomRequest = {
  roomName: "New Style",
  sortOrder: "newest",  // NEW
  genreFilterMode: "or",  // NEW
  ratingFilter: { min: 7.0 },  // NEW
  contentRatingFilter: { ratings: ["PG-13", "R"] },  // NEW
  filters: [
    { key: "genre", value: ["Action"], operator: "=" }
  ]
};

// Both requests work - Phase 2.3 is backward compatible
```

## Summary

Phase 2.3 provides powerful filtering capabilities:
- **Sort Order**: Control presentation order (newest, oldest, random)
- **Genre Logic**: AND/OR logic for genre combinations
- **Rating Filters**: Set quality thresholds
- **Content Ratings**: Age-appropriate content selection

All filters are **optional** and work together to create highly customized movie selections for your MovieMatch rooms.
