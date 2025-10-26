# MovieMatch Storage Abstraction Layer

This module provides a storage abstraction layer for persisting MovieMatch rooms across server restarts.

## Overview

The storage layer separates room configuration persistence from runtime state, allowing rooms to survive server restarts while keeping the implementation flexible and testable.

## Features

- **Multiple backends**: Memory (default) and File storage, extensible to Redis and others
- **Type-safe**: Full TypeScript interfaces with strong typing
- **Persistent rooms**: Rooms survive server restarts (with file storage)
- **Match history**: User ratings and matches are preserved
- **Creator tracking**: Rooms are tied to the Plex user who created them
- **Easy configuration**: Environment variables or config file

## Architecture

### Files

- `interface.ts` - Core types and interfaces (`Storage`, `SerializedRoom`)
- `memory.ts` - In-memory Map-based storage (default, volatile)
- `file.ts` - File-based JSON storage (persistent)
- `index.ts` - Factory function and exports
- `INTEGRATION_GUIDE.md` - Detailed integration instructions

### Key Concepts

**SerializedRoom**: The persistent data structure representing a room's configuration:
```typescript
interface SerializedRoom {
  roomName: string;
  password?: string;
  filters?: Filter[];
  options?: RoomOption[];
  sort: RoomSort;
  createdAt: string;
  creatorPlexUserId: string;      // Who created the room
  creatorPlexUsername: string;    // For display
  ratings?: Record<string, ...>;  // Match history
  userProgress?: Record<string, number>;
}
```

**Storage**: The interface all storage backends implement:
```typescript
interface Storage {
  saveRoom(room: SerializedRoom): Promise<void>;
  getRoom(roomName: string): Promise<SerializedRoom | null>;
  deleteRoom(roomName: string): Promise<void>;
  listRooms(): Promise<SerializedRoom[]>;
  hasRoom(roomName: string): Promise<boolean>;
}
```

## Usage

### Basic Setup

```typescript
import { createStorage } from "/internal/app/moviematch/storage/index.ts";

// Memory storage (default, no persistence)
const storage = createStorage({ type: "memory" });

// File storage (persistent)
const storage = createStorage({
  type: "file",
  storagePath: "./data/rooms"
});
```

### Using Storage

```typescript
// Save a room
const room: SerializedRoom = {
  roomName: "movie-night",
  password: "secret",
  sort: "random",
  createdAt: new Date().toISOString(),
  creatorPlexUserId: "123",
  creatorPlexUsername: "john",
};
await storage.saveRoom(room);

// Retrieve a room
const room = await storage.getRoom("movie-night");
if (room) {
  console.log(`Room created by ${room.creatorPlexUsername}`);
}

// List all rooms
const allRooms = await storage.listRooms();
console.log(`Found ${allRooms.length} persisted rooms`);

// Delete a room
await storage.deleteRoom("movie-night");
```

### Environment Configuration

```bash
# Use file storage
export STORAGE_TYPE=file
export STORAGE_PATH=./data/rooms

# Or use memory storage (default)
export STORAGE_TYPE=memory
```

### Config File (config.yaml)

```yaml
storageType: file
storagePath: ./data/rooms
```

## Storage Backends

### MemoryStorage

**Use when:**
- Development and testing
- Deployments where persistence is not needed
- Maximum performance (no I/O)

**Characteristics:**
- Stores rooms in a JavaScript Map
- All data lost on server restart
- Zero configuration needed
- Instant operations

**Example:**
```typescript
const storage = new MemoryStorage();
```

### FileStorage

**Use when:**
- Production deployments
- Rooms should survive restarts
- Human-readable persistence needed
- Small to medium scale (< 10k rooms)

**Characteristics:**
- One JSON file per room in `storagePath` directory
- Human-readable JSON format
- Atomic writes (temp file + rename)
- Directory created automatically
- Safe room name sanitization

**Example:**
```typescript
const storage = new FileStorage({
  storagePath: "./data/rooms"
});
```

**File Structure:**
```
data/rooms/
  movie-night.json
  friday-evening.json
  weekend-watch.json
```

**File Format:**
```json
{
  "roomName": "movie-night",
  "password": "secret",
  "sort": "random",
  "createdAt": "2025-10-25T20:00:00.000Z",
  "creatorPlexUserId": "123",
  "creatorPlexUsername": "john",
  "ratings": {
    "media-123": [["john", "like", 1635188400000]]
  },
  "userProgress": {
    "john": 5
  }
}
```

## Integration Status

**Current Status**: Storage abstraction layer complete, NOT yet integrated with Room class.

**Next Steps**:
1. Add `creatorPlexUserId`, `creatorPlexUsername`, and `createdAt` to Room class
2. Add serialization methods to Room class (`toSerializedRoom()`, `fromSerializedRoom()`)
3. Initialize storage in app.ts
4. Update `createRoom()` and `getRoom()` to use storage
5. Add auto-save on rating changes

See `INTEGRATION_GUIDE.md` for detailed integration instructions.

## Testing

### Manual Testing

```typescript
// Test memory storage
import { MemoryStorage } from "./storage/memory.ts";
const storage = new MemoryStorage();

const room = {
  roomName: "test",
  sort: "random" as const,
  createdAt: new Date().toISOString(),
  creatorPlexUserId: "123",
  creatorPlexUsername: "test",
};

await storage.saveRoom(room);
const retrieved = await storage.getRoom("test");
console.log(retrieved); // Should match original room

// Test file storage
import { FileStorage } from "./storage/file.ts";
const fileStorage = new FileStorage({ storagePath: "./test-rooms" });

await fileStorage.saveRoom(room);
// Check ./test-rooms/test.json exists
```

### Unit Tests (TODO)

Create `storage_test.ts` with tests for:
- Save and retrieve rooms
- List rooms
- Delete rooms
- Error handling
- Room name sanitization
- Concurrent access

## Error Handling

All storage operations throw `StorageError` on failure:

```typescript
try {
  await storage.saveRoom(room);
} catch (error) {
  if (error instanceof StorageError) {
    console.error("Storage failed:", error.message);
    console.error("Caused by:", error.cause);
  }
}
```

Storage operations are designed to be safe:
- `getRoom()` returns `null` for not found (not an error)
- `deleteRoom()` is idempotent (deleting non-existent room is OK)
- `saveRoom()` creates directories as needed

## Future Enhancements

### Redis Storage

For multi-instance deployments:

```typescript
// Future implementation
const storage = createStorage({
  type: "redis",
  redisUrl: "redis://localhost:6379"
});
```

### Features

- **Room expiration**: Auto-delete inactive rooms after X days
- **Backup/restore**: Export and import room data
- **Migration tools**: Move between storage backends
- **Analytics**: Track room creation, match rates, etc.
- **Compression**: Compress large room files
- **Encryption**: Encrypt sensitive room data

## Performance Considerations

### Memory Storage
- **Reads**: O(1) - instant
- **Writes**: O(1) - instant
- **List**: O(n) - linear in number of rooms
- **Memory**: ~1-10 KB per room

### File Storage
- **Reads**: O(1) file read - ~1-10ms depending on disk
- **Writes**: O(1) file write - ~5-20ms depending on disk
- **List**: O(n) - reads all files, ~10-100ms for 100 rooms
- **Disk**: ~1-10 KB per room (JSON files)

### Scaling Recommendations

- **< 100 rooms**: File storage is fine
- **100-1000 rooms**: File storage OK, consider list() caching
- **1000+ rooms**: Consider Redis or database storage

## Security

### File Storage Security

- **Directory traversal protection**: Room names are sanitized
- **Atomic writes**: Temp file + rename prevents corruption
- **File permissions**: Ensure only MovieMatch process can access storage directory

```bash
# Secure file storage directory
chmod 700 ./data/rooms
chown moviematch:moviematch ./data/rooms
```

### Password Storage

Room passwords are stored as-is (plain text) in `SerializedRoom`. Consider:
- Hashing passwords before storage
- Encrypting storage files
- Storing passwords separately

## Debugging

Enable debug logging:

```bash
export LOG_LEVEL=DEBUG
```

Debug logs show:
- Storage initialization
- Room save/load operations
- File I/O operations
- Storage errors

## Contributing

When adding new storage backends:

1. Implement the `Storage` interface
2. Add comprehensive error handling
3. Add to the factory function
4. Update this README
5. Add unit tests

See `INTEGRATION_GUIDE.md` for integration patterns.
