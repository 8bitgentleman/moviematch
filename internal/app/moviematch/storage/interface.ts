/**
 * Storage abstraction layer for room persistence.
 *
 * This interface allows rooms to be stored in different backends
 * (memory, file system, Redis, etc.) without changing the Room class.
 */

import {
  ContentRatingFilter,
  Filter,
  GenreFilterMode,
  RatingFilter,
  RoomOption,
  RoomSort,
  RoomType,
  SortOrder,
} from "/types/moviematch.ts";

/**
 * Serializable room data that can be persisted to storage.
 *
 * This represents the immutable configuration of a room that should
 * be persisted across server restarts. It does NOT include runtime
 * state like active users, websocket connections, or in-progress ratings.
 */
export interface SerializedRoom {
  /** Unique room identifier */
  roomName: string;

  /** Optional password for room access */
  password?: string;

  /** Room configuration options */
  options?: RoomOption[];

  /** Media filters applied to this room */
  filters?: Filter[];

  /** Sort order for media presentation */
  sort: RoomSort;

  /** Phase 2.2: Room type (matching strategy) */
  roomType?: RoomType;

  /** Phase 2.3: Enhanced sort order (newest, oldest, random) */
  sortOrder?: SortOrder;

  /** Phase 2.3: Genre filter mode (and/or logic) */
  genreFilterMode?: GenreFilterMode;

  /** Phase 2.3: Rating filter (min/max, type) */
  ratingFilter?: RatingFilter;

  /** Phase 2.3: Content rating filter (G, PG, PG-13, R, etc.) */
  contentRatingFilter?: ContentRatingFilter;

  /** Timestamp when the room was created (ISO 8601 format) */
  createdAt: string;

  /** Plex user ID of the room creator (for ownership/permissions) */
  creatorPlexUserId: string;

  /** Plex username of the room creator (for display purposes) */
  creatorPlexUsername: string;

  /**
   * Stored ratings: map of mediaId to array of [userName, rating, timestamp]
   * This allows rooms to persist match history across restarts.
   */
  ratings?: Record<string, Array<[userName: string, rating: "like" | "dislike", timestamp: number]>>;

  /**
   * User progress: map of userName to number of items rated
   * This allows progress to be restored when users rejoin.
   */
  userProgress?: Record<string, number>;
}

/**
 * Storage interface for persisting room data.
 *
 * Implementations must be thread-safe and handle errors gracefully.
 * All methods are async to support both in-memory and I/O-based storage.
 */
export interface Storage {
  /**
   * Save or update a room in storage.
   * If a room with the same name exists, it will be overwritten.
   *
   * @param room - The serialized room data to persist
   * @throws {StorageError} if the operation fails
   */
  saveRoom(room: SerializedRoom): Promise<void>;

  /**
   * Retrieve a room by name.
   *
   * @param roomName - The unique room identifier
   * @returns The serialized room data, or null if not found
   * @throws {StorageError} if the operation fails (but not if room doesn't exist)
   */
  getRoom(roomName: string): Promise<SerializedRoom | null>;

  /**
   * Delete a room from storage.
   * This is idempotent - deleting a non-existent room is not an error.
   *
   * @param roomName - The unique room identifier
   * @throws {StorageError} if the operation fails
   */
  deleteRoom(roomName: string): Promise<void>;

  /**
   * List all rooms in storage.
   *
   * @returns Array of all serialized rooms
   * @throws {StorageError} if the operation fails
   */
  listRooms(): Promise<SerializedRoom[]>;

  /**
   * Check if a room exists in storage.
   *
   * @param roomName - The unique room identifier
   * @returns true if the room exists, false otherwise
   * @throws {StorageError} if the operation fails
   */
  hasRoom(roomName: string): Promise<boolean>;
}

/**
 * Error thrown by storage implementations.
 */
export class StorageError extends Error {
  name = "StorageError";

  constructor(message: string, public cause?: Error) {
    super(message);
  }
}
