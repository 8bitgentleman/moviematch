# Storage Architecture

Visual overview of the MovieMatch storage abstraction layer.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MovieMatch Application                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐         ┌──────────────┐                       │
│  │   Room      │         │   Config     │                       │
│  │   Class     │         │   Loader     │                       │
│  └──────┬──────┘         └──────┬───────┘                       │
│         │                       │                                │
│         │ (future)              │ (Phase 1.3)                    │
│         │                       │                                │
│         v                       v                                │
│  ┌──────────────────────────────────────┐                       │
│  │   Storage Abstraction Layer          │                       │
│  │   (/internal/app/moviematch/storage) │                       │
│  └──────────────────────────────────────┘                       │
│         │                                                         │
│         │                                                         │
│         v                                                         │
│  ┌──────────────────────────────────────┐                       │
│  │        Storage Interface             │                       │
│  │  ┌──────────────────────────────┐   │                       │
│  │  │  saveRoom()                   │   │                       │
│  │  │  getRoom()                    │   │                       │
│  │  │  deleteRoom()                 │   │                       │
│  │  │  listRooms()                  │   │                       │
│  │  │  hasRoom()                    │   │                       │
│  │  └──────────────────────────────┘   │                       │
│  └──────────────────────────────────────┘                       │
│         │                                                         │
│         │                                                         │
│         ├─────────────┬────────────────┬──────────────┐         │
│         │             │                │              │          │
│         v             v                v              v          │
│  ┌───────────┐ ┌───────────┐   ┌──────────┐  ┌──────────┐     │
│  │  Memory   │ │   File    │   │  Redis   │  │  Custom  │     │
│  │  Storage  │ │  Storage  │   │ Storage  │  │ Storage  │     │
│  │           │ │           │   │ (future) │  │ (future) │     │
│  └─────┬─────┘ └─────┬─────┘   └────┬─────┘  └────┬─────┘     │
│        │             │               │             │            │
└────────┼─────────────┼───────────────┼─────────────┼────────────┘
         │             │               │             │
         v             v               v             v
    ┌────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │JavaScript│  │ JSON     │   │  Redis   │   │  Your    │
    │   Map    │  │ Files    │   │  Server  │   │ Backend  │
    └────────┘   └──────────┘   └──────────┘   └──────────┘
```

## Data Flow

### Creating a Room (Future Integration)

```
User Creates Room
       │
       v
┌──────────────┐
│ createRoom() │
│  (room.ts)   │
└──────┬───────┘
       │
       │ Create Room instance
       v
┌──────────────┐
│  new Room()  │
│   + creator  │
│   + metadata │
└──────┬───────┘
       │
       │ toSerializedRoom()
       v
┌──────────────────────┐
│  SerializedRoom {    │
│    roomName,         │
│    creatorPlexUserId,│
│    createdAt,        │
│    ...               │
│  }                   │
└──────┬───────────────┘
       │
       │ storage.saveRoom()
       v
┌──────────────┐      ┌──────────────┐
│   Memory     │  OR  │     File     │
│   Storage    │      │   Storage    │
│              │      │              │
│  Map.set()   │      │ writeJSON()  │
└──────────────┘      └──────────────┘
                            │
                            v
                      ┌──────────────┐
                      │ data/rooms/  │
                      │ room.json    │
                      └──────────────┘
```

### Retrieving a Room (Future Integration)

```
User Joins Room
       │
       v
┌──────────────┐
│  getRoom()   │
│  (room.ts)   │
└──────┬───────┘
       │
       │ storage.getRoom(roomName)
       v
┌──────────────┐      ┌──────────────┐
│   Memory     │  OR  │     File     │
│   Storage    │      │   Storage    │
│              │      │              │
│  Map.get()   │      │  readJSON()  │
└──────┬───────┘      └──────┬───────┘
       │                     │
       └──────────┬──────────┘
                  │
                  v
         ┌────────────────────┐
         │  SerializedRoom    │
         │  or null           │
         └────────┬───────────┘
                  │
                  │ Room.fromSerializedRoom()
                  v
         ┌────────────────────┐
         │  Room instance     │
         │  (with state       │
         │   restored)        │
         └────────────────────┘
```

## Component Structure

```
storage/
│
├── interface.ts          [Core Contracts]
│   ├── Storage interface
│   ├── SerializedRoom interface
│   └── StorageError class
│
├── memory.ts            [Implementation]
│   └── MemoryStorage
│       ├── Map<string, SerializedRoom>
│       └── Implements Storage
│
├── file.ts              [Implementation]
│   └── FileStorage
│       ├── storagePath: string
│       ├── Deno file operations
│       └── Implements Storage
│
├── index.ts             [Factory & Exports]
│   ├── createStorage()
│   ├── createStorageFromEnv()
│   └── Re-exports all types
│
├── README.md            [Documentation]
├── INTEGRATION_GUIDE.md [Integration Docs]
├── QUICKSTART.md        [Quick Reference]
├── ARCHITECTURE.md      [This File]
└── example.ts           [Usage Examples]
```

## Type Hierarchy

```
┌─────────────────────────────────────────┐
│          SerializedRoom                 │
│  ┌───────────────────────────────────┐ │
│  │ roomName: string                  │ │
│  │ password?: string                 │ │
│  │ sort: "random" | "rating"         │ │
│  │ createdAt: string                 │ │
│  │ creatorPlexUserId: string         │ │
│  │ creatorPlexUsername: string       │ │
│  │ filters?: Filter[]                │ │
│  │ options?: RoomOption[]            │ │
│  │ ratings?: Record<...>             │ │
│  │ userProgress?: Record<...>        │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    │
                    │ Used by
                    v
┌─────────────────────────────────────────┐
│         Storage Interface               │
│  ┌───────────────────────────────────┐ │
│  │ saveRoom(SerializedRoom)          │ │
│  │ getRoom(string): SerializedRoom?  │ │
│  │ deleteRoom(string)                │ │
│  │ listRooms(): SerializedRoom[]     │ │
│  │ hasRoom(string): boolean          │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    │
                    │ Implemented by
        ┌───────────┴───────────┐
        │                       │
        v                       v
┌───────────────┐      ┌────────────────┐
│ MemoryStorage │      │  FileStorage   │
├───────────────┤      ├────────────────┤
│ rooms: Map    │      │ storagePath    │
│ size()        │      │ getRoomPath()  │
│ clear()       │      │ getStoragePath()│
└───────────────┘      └────────────────┘
```

## State Separation

The storage layer distinguishes between **persistent state** and **runtime state**:

```
┌──────────────────────────────────────────────────┐
│                Room Class                        │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────┐  ┌──────────────────┐ │
│  │  Persistent State   │  │  Runtime State   │ │
│  │  (SerializedRoom)   │  │  (In-Memory)     │ │
│  ├─────────────────────┤  ├──────────────────┤ │
│  │ • roomName          │  │ • users (Map)    │ │
│  │ • password          │  │ • websockets     │ │
│  │ • filters           │  │ • media promise  │ │
│  │ • sort              │  │ • RouteContext   │ │
│  │ • creatorPlexUserId │  │ • active clients │ │
│  │ • createdAt         │  │                  │ │
│  │ • ratings           │  │                  │ │
│  │ • userProgress      │  │                  │ │
│  └─────────────────────┘  └──────────────────┘ │
│           │                                      │
│           │ toSerializedRoom()                   │
│           v                                      │
│    ┌─────────────┐                              │
│    │   Storage   │                              │
│    └─────────────┘                              │
└──────────────────────────────────────────────────┘
```

**Persistent State**: Saved to storage, survives restarts
**Runtime State**: Kept in memory, recreated on restart

## Storage Backend Comparison

```
Feature           │ MemoryStorage │ FileStorage  │ Redis (Future)
──────────────────┼───────────────┼──────────────┼────────────────
Persistence       │ ✗ No          │ ✓ Yes        │ ✓ Yes
Speed             │ ★★★★★         │ ★★★★☆        │ ★★★★☆
Scalability       │ ★★☆☆☆         │ ★★★☆☆        │ ★★★★★
Multi-instance    │ ✗ No          │ ✗ No         │ ✓ Yes
Human-readable    │ ✗ No          │ ✓ Yes        │ ✗ No
Dependencies      │ None          │ File system  │ Redis server
Configuration     │ None          │ Path         │ URL, auth
Best for          │ Dev/Test      │ Production   │ Scale-out
──────────────────┼───────────────┼──────────────┼────────────────
```

## File Storage Layout

```
project/
│
├── data/
│   └── rooms/                    [Storage Directory]
│       ├── movie-night.json      [Room File]
│       ├── friday-watch.json     [Room File]
│       └── weekend-party.json    [Room File]
│
└── internal/
    └── app/
        └── moviematch/
            ├── room.ts           [Room Class - Future Integration]
            └── storage/
                ├── interface.ts  [Contracts]
                ├── memory.ts     [Memory Backend]
                ├── file.ts       [File Backend]
                └── index.ts      [Factory]
```

## Room File Structure

```json
{
  "roomName": "movie-night",        // Unique identifier
  "password": "secret",             // Optional password
  "sort": "random",                 // Sort order
  "createdAt": "2025-10-25...",    // ISO 8601 timestamp
  "creatorPlexUserId": "12345",    // Plex user ID (for permissions)
  "creatorPlexUsername": "john",   // Display name
  "filters": [...],                 // Media filters
  "options": [...],                 // Room options
  "ratings": {                      // Match history
    "movie-123": [
      ["john", "like", 1729890000000],
      ["jane", "like", 1729890005000]
    ]
  },
  "userProgress": {                 // User progress
    "john": 5,
    "jane": 3
  }
}
```

## Configuration Flow

```
┌──────────────────┐
│  config.yaml     │
│  or              │
│  Environment     │
│  Variables       │
└────────┬─────────┘
         │
         │ Read config
         v
┌──────────────────┐
│   Config {       │
│     storageType, │
│     storagePath  │
│   }              │
└────────┬─────────┘
         │
         │ Pass to factory
         v
┌──────────────────┐
│ createStorage({ │
│   type,          │
│   storagePath    │
│ })               │
└────────┬─────────┘
         │
         │ Returns
         v
┌──────────────────┐
│  Storage         │
│  instance        │
│  (Memory/File)   │
└──────────────────┘
         │
         │ Used by app
         v
┌──────────────────┐
│  Room            │
│  Management      │
└──────────────────┘
```

## Error Handling Flow

```
┌──────────────────┐
│ Storage          │
│ Operation        │
└────────┬─────────┘
         │
         │ Try operation
         v
    ┌────────┐
    │Success?│
    └───┬┬───┘
        ││
    ┌───┘└───┐
    │        │
   Yes       No
    │        │
    v        v
┌────────┐  ┌───────────────┐
│Return  │  │Throw          │
│Result  │  │StorageError { │
└────────┘  │ message,      │
            │ cause         │
            │}              │
            └───────┬───────┘
                    │
                    │ Caught by caller
                    v
            ┌───────────────┐
            │Log error      │
            │               │
            │Option 1:      │
            │ - Retry       │
            │ - Fallback    │
            │ - Continue    │
            └───────────────┘
```

## Integration Points (Future)

```
┌────────────────────────────────────────────────┐
│              Application Layer                  │
├────────────────────────────────────────────────┤
│                                                 │
│  app.ts                                        │
│  ├─ Initialize storage                         │
│  └─ Pass to RouteContext                       │
│                                                 │
├────────────────────────────────────────────────┤
│              Room Management                    │
├────────────────────────────────────────────────┤
│                                                 │
│  room.ts                                       │
│  ├─ createRoom()    → storage.saveRoom()      │
│  ├─ getRoom()       → storage.getRoom()       │
│  ├─ deleteRoom()    → storage.deleteRoom()    │
│  ├─ storeRating()   → storage.saveRoom()      │
│  └─ Room.toSerializedRoom()                   │
│                                                 │
├────────────────────────────────────────────────┤
│           Storage Abstraction Layer             │
├────────────────────────────────────────────────┤
│                                                 │
│  storage/                                      │
│  ├─ interface.ts   (Storage, SerializedRoom)  │
│  ├─ memory.ts      (MemoryStorage)            │
│  ├─ file.ts        (FileStorage)              │
│  └─ index.ts       (createStorage)            │
│                                                 │
└────────────────────────────────────────────────┘
```

## Lifecycle

### Server Startup
```
1. Load config (storageType, storagePath)
2. createStorage(config)
3. storage.listRooms()
4. Restore rooms (lazy load on first access)
```

### Room Creation
```
1. User creates room
2. new Room(request, ctx, creator)
3. room.toSerializedRoom()
4. storage.saveRoom(serialized)
```

### Room Join
```
1. User joins room
2. storage.getRoom(roomName)
3. If found: Room.fromSerializedRoom(serialized)
4. If not found: throw RoomNotFoundError
```

### Rating Change
```
1. User rates media
2. room.storeRating(...)
3. Debounced: storage.saveRoom(room.toSerializedRoom())
```

### Server Shutdown
```
1. Graceful shutdown
2. (Optional) Final save of all active rooms
3. storage connection cleanup (if needed)
```

## Extension Points

The architecture is designed for extensibility:

```
┌─────────────────────────────────────────────┐
│        New Storage Backend                  │
├─────────────────────────────────────────────┤
│                                             │
│  1. Create new file (e.g., redis.ts)       │
│                                             │
│  2. Implement Storage interface:           │
│     class RedisStorage implements Storage {│
│       saveRoom()   { ... }                 │
│       getRoom()    { ... }                 │
│       deleteRoom() { ... }                 │
│       listRooms()  { ... }                 │
│       hasRoom()    { ... }                 │
│     }                                       │
│                                             │
│  3. Update factory (index.ts):             │
│     case "redis":                          │
│       return new RedisStorage(options);    │
│                                             │
│  4. Update types:                          │
│     type StorageType = "memory"|"file"|    │
│                        "redis";            │
│                                             │
│  5. Update config:                         │
│     storageType?: "memory"|"file"|"redis"; │
│                                             │
└─────────────────────────────────────────────┘
```

## Performance Characteristics

```
Operation      │ Memory   │ File      │ Redis (Future)
───────────────┼──────────┼───────────┼────────────────
saveRoom       │ O(1)     │ O(1)      │ O(1)
               │ ~0ms     │ ~5-20ms   │ ~1-5ms
───────────────┼──────────┼───────────┼────────────────
getRoom        │ O(1)     │ O(1)      │ O(1)
               │ ~0ms     │ ~1-10ms   │ ~1-5ms
───────────────┼──────────┼───────────┼────────────────
deleteRoom     │ O(1)     │ O(1)      │ O(1)
               │ ~0ms     │ ~1-10ms   │ ~1-5ms
───────────────┼──────────┼───────────┼────────────────
listRooms      │ O(n)     │ O(n)      │ O(n)
               │ ~0ms     │ ~10-100ms │ ~5-50ms
───────────────┼──────────┼───────────┼────────────────
hasRoom        │ O(1)     │ O(1)      │ O(1)
               │ ~0ms     │ ~1-5ms    │ ~1-5ms
───────────────┴──────────┴───────────┴────────────────

n = number of rooms
Times are approximate and depend on hardware/network
```

## Security Model

```
┌────────────────────────────────────────┐
│          Security Layers               │
├────────────────────────────────────────┤
│                                        │
│  Application Layer:                    │
│  ├─ Password verification             │
│  ├─ Creator permissions (future)       │
│  └─ Access control (future)            │
│                                        │
│  Storage Layer:                        │
│  ├─ Room name sanitization            │
│  ├─ Directory traversal prevention     │
│  ├─ Atomic file operations             │
│  └─ Error isolation                    │
│                                        │
│  File System:                          │
│  ├─ File permissions (700)             │
│  ├─ Directory ownership                │
│  └─ Disk encryption (OS-level)         │
│                                        │
└────────────────────────────────────────┘
```

## Scalability Path

```
Phase 1: Memory Storage (Dev/Test)
   │
   v
Phase 2: File Storage (Small Production)
   │     └─ < 100 rooms
   v
Phase 3: File + Caching (Medium Production)
   │     ├─ 100-1000 rooms
   │     └─ Cache listRooms() results
   v
Phase 4: Redis Storage (Large Production)
   │     ├─ 1000+ rooms
   │     └─ Multi-instance support
   v
Phase 5: Database Storage (Enterprise)
       ├─ 10,000+ rooms
       ├─ Complex queries
       ├─ Advanced analytics
       └─ Backup/replication
```

## Summary

The storage architecture provides:

✅ **Clean abstraction** - Interface-based design
✅ **Flexibility** - Multiple backends, easy to extend
✅ **Separation** - Persistent vs runtime state
✅ **Safety** - Error handling, atomic operations
✅ **Scalability** - Clear upgrade path
✅ **Security** - Input sanitization, access control
✅ **Testability** - Easy to mock and test

See other documentation files for implementation details and usage examples.
