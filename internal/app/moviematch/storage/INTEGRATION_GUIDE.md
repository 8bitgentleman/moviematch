# Storage Integration Guide

This document explains how to integrate the storage abstraction layer with the Room class and the rest of the MovieMatch application.

## Overview

The storage abstraction layer provides a clean separation between room configuration persistence and runtime room state. This allows rooms to survive server restarts while keeping the implementation flexible.

## Current State

Currently, rooms are stored in a simple Map in `room.ts`:

```typescript
const rooms = new Map<RoomName, Room>();
```

This means:
- Rooms are lost on server restart
- No persistence across deployments
- No way to restore room state

## Target State

With the storage layer:
- Rooms persist to configurable storage backends (memory, file, optionally Redis)
- Room configuration and match history survive restarts
- Users can rejoin rooms and see their previous matches
- Room creators can be identified via Plex user ID

## Integration Steps

### 1. Add Creator Information to Room Class

The `Room` class needs to track who created it:

```typescript
export class Room {
  RouteContext: RouteContext;
  roomName: string;
  password?: string;
  users = new Map<string, Client>();
  filters?: Filter[];
  options?: RoomOption[];
  sort: RoomSort;

  // NEW: Add creator information
  creatorPlexUserId: string;
  creatorPlexUsername: string;
  createdAt: Date;

  media: Promise<Map<string, Media>>;
  userProgress = new Map<string, number>();
  ratings = new Map<string, Array<[userName: string, rating: Rate["rating"], time: number]>>();

  constructor(req: CreateRoomRequest, ctx: RouteContext, creatorInfo: { plexUserId: string; plexUsername: string }) {
    this.RouteContext = ctx;
    this.roomName = req.roomName;
    this.password = req.password;
    this.options = req.options;
    this.filters = req.filters;
    this.sort = req.sort ?? "random";

    // NEW: Store creator information
    this.creatorPlexUserId = creatorInfo.plexUserId;
    this.creatorPlexUsername = creatorInfo.plexUsername;
    this.createdAt = new Date();

    this.media = this.getMedia();
  }

  // ... rest of class
}
```

### 2. Add Serialization Methods to Room Class

Add methods to convert between Room instances and SerializedRoom:

```typescript
export class Room {
  // ... existing code ...

  /**
   * Serialize this room for storage.
   * Only includes persistent data, not runtime state like websocket connections.
   */
  toSerializedRoom(): SerializedRoom {
    return {
      roomName: this.roomName,
      password: this.password,
      options: this.options,
      filters: this.filters,
      sort: this.sort,
      createdAt: this.createdAt.toISOString(),
      creatorPlexUserId: this.creatorPlexUserId,
      creatorPlexUsername: this.creatorPlexUsername,
      ratings: this.ratingsToObject(),
      userProgress: this.userProgressToObject(),
    };
  }

  /**
   * Convert ratings Map to plain object for serialization.
   */
  private ratingsToObject(): Record<string, Array<[string, "like" | "dislike", number]>> {
    const obj: Record<string, Array<[string, "like" | "dislike", number]>> = {};
    for (const [mediaId, ratings] of this.ratings.entries()) {
      obj[mediaId] = ratings;
    }
    return obj;
  }

  /**
   * Convert userProgress Map to plain object for serialization.
   */
  private userProgressToObject(): Record<string, number> {
    const obj: Record<string, number> = {};
    for (const [userName, progress] of this.userProgress.entries()) {
      obj[userName] = progress;
    }
    return obj;
  }

  /**
   * Restore a room from serialized data.
   * This is used when loading persisted rooms on server startup.
   */
  static fromSerializedRoom(
    serialized: SerializedRoom,
    ctx: RouteContext,
  ): Room {
    // Create a minimal CreateRoomRequest from serialized data
    const req: CreateRoomRequest = {
      roomName: serialized.roomName,
      password: serialized.password,
      options: serialized.options,
      filters: serialized.filters,
      sort: serialized.sort,
    };

    const creatorInfo = {
      plexUserId: serialized.creatorPlexUserId,
      plexUsername: serialized.creatorPlexUsername,
    };

    const room = new Room(req, ctx, creatorInfo);

    // Restore timestamps
    room.createdAt = new Date(serialized.createdAt);

    // Restore ratings if they exist
    if (serialized.ratings) {
      room.ratings = new Map(Object.entries(serialized.ratings));
    }

    // Restore user progress if it exists
    if (serialized.userProgress) {
      room.userProgress = new Map(Object.entries(serialized.userProgress));
    }

    return room;
  }
}
```

### 3. Initialize Storage in App

In the main app initialization (likely `app.ts` or `moviematch.ts`), create a storage instance:

```typescript
import { createStorage, Storage } from "/internal/app/moviematch/storage/index.ts";

// In app initialization
const storage: Storage = createStorage({
  type: config.storageType ?? "memory",
  storagePath: config.storagePath,
});

// Pass storage to route context or make it available globally
```

### 4. Update Room Management Functions

Modify `createRoom` and `getRoom` functions to use storage:

```typescript
import { Storage } from "/internal/app/moviematch/storage/index.ts";

type RoomName = string;

// In-memory cache of active rooms (with websocket connections, etc.)
const activeRooms = new Map<RoomName, Room>();

// Storage instance (injected from app initialization)
let roomStorage: Storage;

/**
 * Initialize the room management with a storage backend.
 */
export function initRoomStorage(storage: Storage) {
  roomStorage = storage;
}

/**
 * Load all persisted rooms on server startup.
 * This restores room configurations but not active connections.
 */
export async function loadPersistedRooms(ctx: RouteContext): Promise<void> {
  if (!roomStorage) {
    log.warning("Room storage not initialized, skipping room loading");
    return;
  }

  try {
    const serializedRooms = await roomStorage.listRooms();
    log.info(`Loading ${serializedRooms.length} persisted rooms...`);

    for (const serialized of serializedRooms) {
      try {
        // Don't add to activeRooms yet - they'll be loaded when first accessed
        log.debug(`Found persisted room: ${serialized.roomName}`);
      } catch (error) {
        log.error(`Failed to load room ${serialized.roomName}:`, error);
      }
    }
  } catch (error) {
    log.error("Failed to load persisted rooms:", error);
  }
}

export const createRoom = async (
  createRequest: CreateRoomRequest,
  ctx: RouteContext,
  creatorInfo: { plexUserId: string; plexUsername: string },
): Promise<Room> => {
  // Check both active rooms and storage
  if (activeRooms.has(createRequest.roomName)) {
    throw new RoomExistsError(`${createRequest.roomName} already exists.`);
  }

  if (roomStorage && await roomStorage.hasRoom(createRequest.roomName)) {
    throw new RoomExistsError(`${createRequest.roomName} already exists in storage.`);
  }

  const room = new Room(createRequest, ctx, creatorInfo);
  await room.media; // Ensure media is loaded

  // Add to active rooms
  activeRooms.set(room.roomName, room);

  // Persist to storage
  if (roomStorage) {
    try {
      await roomStorage.saveRoom(room.toSerializedRoom());
      log.info(`Persisted room "${room.roomName}" to storage`);
    } catch (error) {
      log.error(`Failed to persist room "${room.roomName}":`, error);
      // Don't fail room creation if storage fails
    }
  }

  return room;
};

export const getRoom = async (
  userName: string,
  { roomName, password }: JoinRoomRequest,
  ctx: RouteContext,
): Promise<Room> => {
  // Check active rooms first
  let room = activeRooms.get(roomName);

  // If not in active rooms, try to load from storage
  if (!room && roomStorage) {
    const serialized = await roomStorage.getRoom(roomName);
    if (serialized) {
      log.info(`Loading room "${roomName}" from storage`);
      room = Room.fromSerializedRoom(serialized, ctx);
      activeRooms.set(roomName, room);
    }
  }

  if (!room) {
    throw new RoomNotFoundError(`${roomName} does not exist`);
  }

  // Password check
  if (typeof room.password === "string") {
    if (room.password !== password) {
      throw new AccessDeniedError(`${roomName} requires a password`);
    }
  }

  // Already joined check
  if (room.users.has(userName)) {
    throw new UserAlreadyJoinedError(
      `${userName} is already logged into ${room.roomName} room`,
    );
  }

  return room;
};

/**
 * Save a room's state to storage (call after ratings change, etc.)
 */
export async function persistRoom(room: Room): Promise<void> {
  if (!roomStorage) return;

  try {
    await roomStorage.saveRoom(room.toSerializedRoom());
    log.debug(`Persisted room "${room.roomName}" state`);
  } catch (error) {
    log.error(`Failed to persist room "${room.roomName}":`, error);
  }
}

/**
 * Delete a room from both active rooms and storage
 */
export async function deleteRoom(roomName: string): Promise<void> {
  activeRooms.delete(roomName);

  if (roomStorage) {
    try {
      await roomStorage.deleteRoom(roomName);
      log.info(`Deleted room "${roomName}" from storage`);
    } catch (error) {
      log.error(`Failed to delete room "${roomName}" from storage:`, error);
    }
  }
}
```

### 5. Auto-Save Room State

To keep storage in sync with room state, call `persistRoom()` after significant changes:

```typescript
// In Room class
storeRating = async (userName: string, rating: Rate, matchedAt: number) => {
  // ... existing rating storage code ...

  // NEW: Persist after rating changes
  await persistRoom(this);
};
```

Or use a debounced approach to avoid excessive writes:

```typescript
// In Room class
private persistDebounced = debounce(() => persistRoom(this), 5000);

storeRating = async (userName: string, rating: Rate, matchedAt: number) => {
  // ... existing rating storage code ...

  // NEW: Debounced persist
  this.persistDebounced();
};
```

### 6. Update Configuration Loading

Ensure the config loader reads storage settings:

```typescript
// In config loading code
const config: Config = {
  // ... existing config ...
  storageType: Deno.env.get("STORAGE_TYPE") as "memory" | "file" | undefined,
  storagePath: Deno.env.get("STORAGE_PATH"),
};
```

Or from `config.yaml`:

```yaml
# config.yaml
storageType: file  # or "memory"
storagePath: ./data/rooms
```

## Usage Examples

### Using Memory Storage (Default)

```bash
# No configuration needed - this is the default
deno run --allow-all cmd/moviematch.ts
```

### Using File Storage

```bash
# Via environment variables
STORAGE_TYPE=file STORAGE_PATH=./data/rooms deno run --allow-all cmd/moviematch.ts

# Or via config.yaml
# storageType: file
# storagePath: ./data/rooms
deno run --allow-all cmd/moviematch.ts
```

### Accessing Rooms After Restart

1. User creates room "friday-night" with password "pizza"
2. Server persists room to `./data/rooms/friday-night.json`
3. Server restarts
4. User joins "friday-night" with password "pizza"
5. Room is loaded from storage with all previous matches intact

## Testing the Storage Layer

### Unit Tests

Create tests in `internal/app/moviematch/storage/storage_test.ts`:

```typescript
import { assertEquals } from "/deps.ts";
import { MemoryStorage } from "./memory.ts";
import { FileStorage } from "./file.ts";
import { SerializedRoom } from "./interface.ts";

Deno.test("MemoryStorage - save and retrieve room", async () => {
  const storage = new MemoryStorage();

  const room: SerializedRoom = {
    roomName: "test-room",
    password: "secret",
    sort: "random",
    createdAt: new Date().toISOString(),
    creatorPlexUserId: "123",
    creatorPlexUsername: "testuser",
  };

  await storage.saveRoom(room);
  const retrieved = await storage.getRoom("test-room");

  assertEquals(retrieved?.roomName, "test-room");
  assertEquals(retrieved?.creatorPlexUserId, "123");
});

Deno.test("FileStorage - save and retrieve room", async () => {
  const storage = new FileStorage({ storagePath: "./test-data/rooms" });

  const room: SerializedRoom = {
    roomName: "test-room",
    password: "secret",
    sort: "random",
    createdAt: new Date().toISOString(),
    creatorPlexUserId: "123",
    creatorPlexUsername: "testuser",
  };

  await storage.saveRoom(room);
  const retrieved = await storage.getRoom("test-room");

  assertEquals(retrieved?.roomName, "test-room");

  // Cleanup
  await storage.deleteRoom("test-room");
  await Deno.remove("./test-data/rooms", { recursive: true });
});
```

## Migration Notes

### For Existing Deployments

When upgrading to this version:

1. **No migration needed for memory storage** - existing behavior unchanged
2. **For file storage** - rooms created before upgrade won't be persisted, but new rooms will be

### Future: Redis Storage

To add Redis storage in the future:

1. Create `internal/app/moviematch/storage/redis.ts`
2. Implement the `Storage` interface
3. Add "redis" to the `StorageType` union
4. Update the factory function in `index.ts`

Example stub:

```typescript
// redis.ts
export class RedisStorage implements Storage {
  private client: RedisClient;

  constructor(options: RedisStorageOptions) {
    this.client = new RedisClient(options);
  }

  async saveRoom(room: SerializedRoom): Promise<void> {
    await this.client.set(`room:${room.roomName}`, JSON.stringify(room));
  }

  // ... implement other methods ...
}
```

## Key Decisions

### Why Separate Active Rooms from Storage?

- **Active rooms** (`Map<RoomName, Room>`) contain runtime state:
  - WebSocket connections
  - Active users
  - Ongoing media queries

- **Storage** (`Storage.saveRoom()`) contains persistent state:
  - Room configuration
  - Match history
  - Creator information

This separation allows us to:
- Restore room configuration on restart
- Keep websocket connections in memory for performance
- Scale storage independently from runtime

### Why Not Store Media Lists?

Media lists can be regenerated from filters, so we don't persist them. This:
- Reduces storage size significantly
- Ensures media lists stay fresh (new content added to Plex appears automatically)
- Avoids stale data issues

### When to Persist?

Options:
1. **On every rating** - Most consistent, but high I/O
2. **Debounced** - Good balance, writes every N seconds if changes occurred
3. **On room events** - Manual control, risk of missing changes
4. **Periodic background** - Simple, but may lose recent data

**Recommendation**: Start with debounced (option 2), fallback to periodic background sync.

## Security Considerations

### File Storage

- Room names are sanitized to prevent directory traversal
- Files are written atomically (temp file + rename) to prevent corruption
- File permissions should be restricted (only MovieMatch process can read/write)

### Creator Permissions

Future features could use `creatorPlexUserId`:
- Only creator can delete room
- Only creator can change room settings
- Creator gets admin privileges

## Questions & Considerations

1. **Should we auto-delete old rooms?**
   - Consider adding `lastActivityAt` to `SerializedRoom`
   - Add a cleanup job to delete rooms inactive for X days

2. **How to handle storage failures?**
   - Current approach: Log error, don't fail the operation
   - Alternative: Retry logic, fallback to memory storage

3. **Room capacity limits?**
   - Should we limit the number of persisted rooms?
   - FileStorage could check directory size

4. **Backup and restore?**
   - File storage is human-readable JSON
   - Easy to backup: just copy the directory
   - Could add export/import commands

## Next Steps

After implementing this storage layer:

1. **Phase 1.4**: Implement creator permissions and room ownership
2. **Phase 2.x**: Add room management UI (list all rooms, delete old rooms)
3. **Phase 3.x**: Add Redis storage for scalability
4. **Future**: Room analytics (most popular rooms, match rates, etc.)
