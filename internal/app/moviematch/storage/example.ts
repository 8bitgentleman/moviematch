/**
 * Example usage of the storage abstraction layer.
 *
 * This file demonstrates how to use the storage API.
 * It can also be run as a script for quick testing.
 *
 * Usage:
 *   deno run --allow-read --allow-write storage/example.ts
 */

import { createStorage, SerializedRoom } from "./index.ts";

// Example 1: Using Memory Storage
async function memoryStorageExample() {
  console.log("\n=== Memory Storage Example ===\n");

  const storage = createStorage({ type: "memory" });

  // Create a sample room
  const room: SerializedRoom = {
    roomName: "friday-movie-night",
    password: "popcorn",
    sort: "random",
    createdAt: new Date().toISOString(),
    creatorPlexUserId: "12345",
    creatorPlexUsername: "john_doe",
    filters: [
      { key: "genre", operator: "=", value: ["Action", "Comedy"] },
      { key: "year", operator: ">=", value: ["2020"] },
    ],
    ratings: {
      "movie-123": [
        ["john_doe", "like", Date.now() - 10000],
        ["jane_smith", "like", Date.now() - 5000],
      ],
      "movie-456": [
        ["john_doe", "dislike", Date.now() - 8000],
      ],
    },
    userProgress: {
      "john_doe": 5,
      "jane_smith": 3,
    },
  };

  // Save the room
  await storage.saveRoom(room);
  console.log(`✓ Saved room: ${room.roomName}`);

  // Retrieve the room
  const retrieved = await storage.getRoom("friday-movie-night");
  console.log(`✓ Retrieved room: ${retrieved?.roomName}`);
  console.log(`  Creator: ${retrieved?.creatorPlexUsername}`);
  console.log(`  Filters: ${retrieved?.filters?.length ?? 0}`);
  console.log(`  Ratings: ${Object.keys(retrieved?.ratings ?? {}).length}`);

  // Check if room exists
  const exists = await storage.hasRoom("friday-movie-night");
  console.log(`✓ Room exists: ${exists}`);

  // List all rooms
  const allRooms = await storage.listRooms();
  console.log(`✓ Total rooms: ${allRooms.length}`);

  // Delete the room
  await storage.deleteRoom("friday-movie-night");
  console.log(`✓ Deleted room: friday-movie-night`);

  // Verify deletion
  const stillExists = await storage.hasRoom("friday-movie-night");
  console.log(`✓ Room still exists: ${stillExists}`);
}

// Example 2: Using File Storage
async function fileStorageExample() {
  console.log("\n=== File Storage Example ===\n");

  const storage = createStorage({
    type: "file",
    storagePath: "./example-rooms",
  });

  // Create multiple rooms
  const rooms: SerializedRoom[] = [
    {
      roomName: "action-night",
      sort: "rating",
      createdAt: new Date().toISOString(),
      creatorPlexUserId: "user-1",
      creatorPlexUsername: "alice",
      filters: [{ key: "genre", operator: "=", value: ["Action"] }],
    },
    {
      roomName: "comedy-club",
      password: "laughs",
      sort: "random",
      createdAt: new Date().toISOString(),
      creatorPlexUserId: "user-2",
      creatorPlexUsername: "bob",
      filters: [{ key: "genre", operator: "=", value: ["Comedy"] }],
    },
    {
      roomName: "sci-fi-special",
      sort: "random",
      createdAt: new Date().toISOString(),
      creatorPlexUserId: "user-3",
      creatorPlexUsername: "charlie",
      filters: [{ key: "genre", operator: "=", value: ["Science Fiction"] }],
    },
  ];

  // Save all rooms
  for (const room of rooms) {
    await storage.saveRoom(room);
    console.log(`✓ Saved room: ${room.roomName}`);
  }

  // List all rooms
  const allRooms = await storage.listRooms();
  console.log(`\n✓ Found ${allRooms.length} rooms:`);
  for (const room of allRooms) {
    console.log(`  - ${room.roomName} (by ${room.creatorPlexUsername})`);
  }

  // Retrieve a specific room
  const sciFiRoom = await storage.getRoom("sci-fi-special");
  console.log(`\n✓ Retrieved: ${sciFiRoom?.roomName}`);
  console.log(`  Creator: ${sciFiRoom?.creatorPlexUsername}`);
  console.log(`  Has password: ${!!sciFiRoom?.password}`);

  // Update a room (just save again)
  if (sciFiRoom) {
    sciFiRoom.ratings = {
      "movie-789": [["charlie", "like", Date.now()]],
    };
    await storage.saveRoom(sciFiRoom);
    console.log(`✓ Updated room: ${sciFiRoom.roomName}`);
  }

  // Delete one room
  await storage.deleteRoom("comedy-club");
  console.log(`\n✓ Deleted room: comedy-club`);

  // List remaining rooms
  const remainingRooms = await storage.listRooms();
  console.log(`✓ Remaining rooms: ${remainingRooms.length}`);

  // Clean up - delete all example rooms
  console.log("\n=== Cleanup ===\n");
  for (const room of remainingRooms) {
    await storage.deleteRoom(room.roomName);
    console.log(`✓ Deleted: ${room.roomName}`);
  }

  // Remove example directory
  try {
    await Deno.remove("./example-rooms", { recursive: true });
    console.log(`✓ Removed example directory`);
  } catch {
    // Directory might not exist
  }
}

// Example 3: Error Handling
async function errorHandlingExample() {
  console.log("\n=== Error Handling Example ===\n");

  const storage = createStorage({ type: "memory" });

  // Try to get a non-existent room
  const room = await storage.getRoom("non-existent");
  console.log(`✓ Non-existent room returns: ${room}`); // null

  // Check if room exists
  const exists = await storage.hasRoom("non-existent");
  console.log(`✓ Non-existent room exists: ${exists}`); // false

  // Delete a non-existent room (idempotent)
  await storage.deleteRoom("non-existent");
  console.log(`✓ Deleting non-existent room: OK (idempotent)`);

  // Create a room with minimal data
  const minimalRoom: SerializedRoom = {
    roomName: "minimal",
    sort: "random",
    createdAt: new Date().toISOString(),
    creatorPlexUserId: "123",
    creatorPlexUsername: "test",
  };
  await storage.saveRoom(minimalRoom);
  console.log(`✓ Saved minimal room`);

  const retrieved = await storage.getRoom("minimal");
  console.log(`✓ Retrieved minimal room: ${retrieved?.roomName}`);
  console.log(`  Has password: ${!!retrieved?.password}`); // false
  console.log(`  Has filters: ${!!retrieved?.filters}`); // false
}

// Example 4: Working with Ratings and Progress
async function ratingsExample() {
  console.log("\n=== Ratings and Progress Example ===\n");

  const storage = createStorage({ type: "memory" });

  const room: SerializedRoom = {
    roomName: "date-night",
    sort: "random",
    createdAt: new Date().toISOString(),
    creatorPlexUserId: "couple-1",
    creatorPlexUsername: "john_and_jane",
  };

  // Save initial room
  await storage.saveRoom(room);
  console.log(`✓ Created room: ${room.roomName}`);

  // Simulate user ratings
  room.ratings = {};
  room.userProgress = {};

  // John rates some movies
  room.ratings["movie-1"] = [["john", "like", Date.now()]];
  room.ratings["movie-2"] = [["john", "dislike", Date.now()]];
  room.ratings["movie-3"] = [["john", "like", Date.now()]];
  room.userProgress["john"] = 3;

  await storage.saveRoom(room);
  console.log(`✓ John rated 3 movies`);

  // Jane rates the same movies
  room.ratings["movie-1"].push(["jane", "like", Date.now()]);
  room.ratings["movie-2"].push(["jane", "like", Date.now()]);
  room.ratings["movie-3"].push(["jane", "dislike", Date.now()]);
  room.userProgress["jane"] = 3;

  await storage.saveRoom(room);
  console.log(`✓ Jane rated 3 movies`);

  // Find matches (both liked)
  const retrieved = await storage.getRoom("date-night");
  const matches: string[] = [];

  for (const [movieId, ratings] of Object.entries(retrieved?.ratings ?? {})) {
    const likes = ratings.filter(([, rating]) => rating === "like");
    if (likes.length >= 2) {
      matches.push(movieId);
    }
  }

  console.log(`\n✓ Matches found: ${matches.length}`);
  console.log(`  Movies: ${matches.join(", ")}`);
}

// Run all examples
if (import.meta.main) {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  MovieMatch Storage Abstraction Layer - Examples      ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  await memoryStorageExample();
  await fileStorageExample();
  await errorHandlingExample();
  await ratingsExample();

  console.log("\n✅ All examples completed successfully!\n");
}
