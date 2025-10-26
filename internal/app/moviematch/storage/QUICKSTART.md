# Storage Layer Quick Start

A 5-minute guide to understanding and using the MovieMatch storage abstraction layer.

## TL;DR

```typescript
import { createStorage } from "/internal/app/moviematch/storage/index.ts";

// Create storage
const storage = createStorage({ type: "file", storagePath: "./data/rooms" });

// Save a room
await storage.saveRoom({
  roomName: "my-room",
  sort: "random",
  createdAt: new Date().toISOString(),
  creatorPlexUserId: "123",
  creatorPlexUsername: "john",
});

// Get a room
const room = await storage.getRoom("my-room");

// List all rooms
const allRooms = await storage.listRooms();

// Delete a room
await storage.deleteRoom("my-room");
```

## What Is This?

A storage abstraction layer that lets MovieMatch persist rooms across server restarts.

**Before**: Rooms stored in `Map` → lost on restart
**After**: Rooms stored in configurable backend → survive restarts

## Two Storage Types

### Memory Storage (Default)
- Same as current behavior
- Fast, simple, no configuration
- Data lost on restart

```typescript
const storage = createStorage({ type: "memory" });
```

### File Storage (New!)
- Saves rooms as JSON files
- Survives server restarts
- Human-readable

```typescript
const storage = createStorage({
  type: "file",
  storagePath: "./data/rooms"
});
```

## Configuration

### Environment Variables

```bash
export STORAGE_TYPE=file
export STORAGE_PATH=./data/rooms
```

### Config File (config.yaml)

```yaml
storageType: file
storagePath: ./data/rooms
```

### Code

```typescript
import { Config } from "/types/moviematch.ts";

const config: Config = {
  // ... other config ...
  storageType: "file",
  storagePath: "./data/rooms",
};
```

## The Storage Interface

All storage backends implement this interface:

```typescript
interface Storage {
  // Save or update a room
  saveRoom(room: SerializedRoom): Promise<void>;

  // Get a room by name (null if not found)
  getRoom(roomName: string): Promise<SerializedRoom | null>;

  // Delete a room (idempotent)
  deleteRoom(roomName: string): Promise<void>;

  // List all rooms
  listRooms(): Promise<SerializedRoom[]>;

  // Check if a room exists
  hasRoom(roomName: string): Promise<boolean>;
}
```

## SerializedRoom Structure

```typescript
interface SerializedRoom {
  // Required fields
  roomName: string;
  sort: "random" | "rating";
  createdAt: string;              // ISO 8601 timestamp
  creatorPlexUserId: string;      // Who created the room
  creatorPlexUsername: string;    // For display

  // Optional fields
  password?: string;
  filters?: Filter[];
  options?: RoomOption[];
  ratings?: Record<string, Array<[userName, rating, timestamp]>>;
  userProgress?: Record<userName, number>;
}
```

## Common Patterns

### Check if Room Exists

```typescript
const exists = await storage.hasRoom("my-room");
if (!exists) {
  console.log("Room doesn't exist");
}
```

### Get or Create Pattern

```typescript
let room = await storage.getRoom("my-room");
if (!room) {
  room = {
    roomName: "my-room",
    sort: "random",
    createdAt: new Date().toISOString(),
    creatorPlexUserId: "123",
    creatorPlexUsername: "john",
  };
  await storage.saveRoom(room);
}
```

### Update Room

```typescript
const room = await storage.getRoom("my-room");
if (room) {
  // Add a rating
  room.ratings = room.ratings || {};
  room.ratings["movie-123"] = [["john", "like", Date.now()]];

  // Save back
  await storage.saveRoom(room);
}
```

### List All Rooms by Creator

```typescript
const allRooms = await storage.listRooms();
const johnsRooms = allRooms.filter(
  room => room.creatorPlexUsername === "john"
);
```

### Delete Old Rooms

```typescript
const allRooms = await storage.listRooms();
const now = Date.now();
const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

for (const room of allRooms) {
  const createdAt = new Date(room.createdAt).getTime();
  if (createdAt < oneWeekAgo) {
    await storage.deleteRoom(room.roomName);
    console.log(`Deleted old room: ${room.roomName}`);
  }
}
```

## Error Handling

```typescript
import { StorageError } from "/internal/app/moviematch/storage/index.ts";

try {
  await storage.saveRoom(room);
} catch (error) {
  if (error instanceof StorageError) {
    console.error("Storage operation failed:", error.message);
    console.error("Caused by:", error.cause);
  } else {
    throw error; // Re-throw unexpected errors
  }
}
```

## Testing

### Run Examples

```bash
deno run --allow-read --allow-write \
  internal/app/moviematch/storage/example.ts
```

### Manual Testing

```typescript
import { MemoryStorage } from "/internal/app/moviematch/storage/memory.ts";

const storage = new MemoryStorage();

// Save a test room
await storage.saveRoom({
  roomName: "test",
  sort: "random",
  createdAt: new Date().toISOString(),
  creatorPlexUserId: "123",
  creatorPlexUsername: "test-user",
});

// Verify it was saved
const room = await storage.getRoom("test");
console.log(room); // Should show the room
```

## Integration with Room Class

**NOTE**: The storage layer is NOT yet integrated with the Room class.

When integrated, it will look like this:

```typescript
// In room.ts
export class Room {
  // Add creator info
  creatorPlexUserId: string;
  creatorPlexUsername: string;
  createdAt: Date;

  // Add serialization
  toSerializedRoom(): SerializedRoom {
    return {
      roomName: this.roomName,
      password: this.password,
      sort: this.sort,
      createdAt: this.createdAt.toISOString(),
      creatorPlexUserId: this.creatorPlexUserId,
      creatorPlexUsername: this.creatorPlexUsername,
      // ... ratings, progress, etc.
    };
  }
}

// In createRoom function
export const createRoom = async (
  createRequest: CreateRoomRequest,
  ctx: RouteContext,
  creatorInfo: { plexUserId: string; plexUsername: string },
): Promise<Room> => {
  const room = new Room(createRequest, ctx, creatorInfo);

  // Persist to storage
  if (storage) {
    await storage.saveRoom(room.toSerializedRoom());
  }

  return room;
};
```

See `INTEGRATION_GUIDE.md` for complete integration instructions.

## File Storage Details

### Where Files Are Stored

Default: `./data/rooms/`

Each room gets its own file:
```
data/rooms/
  movie-night.json
  friday-watch.json
  weekend-marathon.json
```

### File Format

Pretty-printed JSON:

```json
{
  "roomName": "movie-night",
  "password": "secret",
  "sort": "random",
  "createdAt": "2025-10-25T20:00:00.000Z",
  "creatorPlexUserId": "12345",
  "creatorPlexUsername": "john_doe",
  "filters": [
    {
      "key": "genre",
      "operator": "=",
      "value": ["Action", "Comedy"]
    }
  ],
  "ratings": {
    "movie-123": [
      ["john_doe", "like", 1729890000000],
      ["jane_smith", "like", 1729890005000]
    ]
  },
  "userProgress": {
    "john_doe": 5,
    "jane_smith": 3
  }
}
```

### File Operations

- **Atomic writes**: Uses temp file + rename to prevent corruption
- **Auto-create directory**: Creates `storagePath` if it doesn't exist
- **Safe names**: Sanitizes room names to prevent directory traversal

## Performance

### Memory Storage
- **Read**: Instant (Map lookup)
- **Write**: Instant (Map set)
- **List**: Fast (iterate Map)
- **Memory**: ~1-10 KB per room

### File Storage
- **Read**: ~1-10ms (disk I/O)
- **Write**: ~5-20ms (disk I/O)
- **List**: ~10-100ms for 100 rooms
- **Disk**: ~1-10 KB per room (JSON)

## When to Use Which?

### Use Memory Storage:
- Development
- Testing
- Don't need persistence
- Maximum performance

### Use File Storage:
- Production
- Need persistence
- Small to medium scale (< 1000 rooms)
- Want human-readable backups

### Future: Use Redis Storage:
- Multi-instance deployments
- High scale (1000+ rooms)
- Need distributed access

## Troubleshooting

### Storage directory not writable

```bash
# Fix permissions
chmod 700 ./data/rooms
chown moviematch:moviematch ./data/rooms
```

### Rooms not persisting

```bash
# Check storage type
echo $STORAGE_TYPE  # Should be "file"

# Check storage path
echo $STORAGE_PATH  # Should be valid directory

# Check logs
# Look for "Using file storage at: ..." message
```

### Corrupted room file

```bash
# File storage uses atomic writes, but if corruption occurs:
cd data/rooms
cat my-room.json  # Check if valid JSON

# If invalid, delete and let it recreate
rm my-room.json
```

## FAQ

**Q: Will this break existing rooms?**
A: No. Default is memory storage (same as current behavior).

**Q: What happens on upgrade?**
A: Nothing. New rooms can be persisted, old rooms continue to work.

**Q: Can I switch storage types?**
A: Yes, but data won't migrate. Use memory→file requires exporting/importing.

**Q: What about passwords?**
A: Currently stored as plain text. Consider hashing in future.

**Q: How do I backup rooms?**
A: With file storage, just copy the `data/rooms/` directory.

**Q: Can I edit room files manually?**
A: Yes! They're human-readable JSON. Just ensure valid JSON.

## Next Steps

1. Read `INTEGRATION_GUIDE.md` for integration details
2. Run `example.ts` to see working examples
3. Check `README.md` for comprehensive documentation
4. Start integration with Room class

## Need Help?

- Full docs: `README.md`
- Integration guide: `INTEGRATION_GUIDE.md`
- Working examples: `example.ts`
- Implementation summary: `/PHASE_1_3_IMPLEMENTATION_SUMMARY.md`
