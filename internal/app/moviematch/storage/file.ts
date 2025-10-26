/**
 * File-based storage implementation.
 *
 * This implementation persists rooms as JSON files in a directory.
 * Each room is stored in a separate file: {storagePath}/{roomName}.json
 *
 * Features:
 * - Rooms persist across server restarts
 * - Human-readable JSON format
 * - Automatic directory creation
 * - Safe file operations with error handling
 */

import { log, joinPath, walk } from "/deps.ts";
import { SerializedRoom, Storage, StorageError } from "./interface.ts";

export interface FileStorageOptions {
  /** Directory where room files will be stored. Default: "./data/rooms" */
  storagePath?: string;
}

export class FileStorage implements Storage {
  private storagePath: string;

  constructor(options: FileStorageOptions = {}) {
    this.storagePath = options.storagePath ?? "./data/rooms";
    this.ensureStorageDirectory();
    log.info(`Using file storage at: ${this.storagePath}`);
  }

  /**
   * Ensure the storage directory exists, creating it if necessary.
   */
  private ensureStorageDirectory(): void {
    try {
      const dirInfo = Deno.statSync(this.storagePath);
      if (!dirInfo.isDirectory) {
        throw new StorageError(
          `Storage path exists but is not a directory: ${this.storagePath}`,
        );
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // Directory doesn't exist, create it
        try {
          Deno.mkdirSync(this.storagePath, { recursive: true });
          log.info(`Created storage directory: ${this.storagePath}`);
        } catch (createError) {
          throw new StorageError(
            `Failed to create storage directory: ${this.storagePath}`,
            createError as Error,
          );
        }
      } else if (error instanceof StorageError) {
        throw error;
      } else {
        throw new StorageError(
          `Failed to access storage directory: ${this.storagePath}`,
          error as Error,
        );
      }
    }
  }

  /**
   * Get the file path for a room.
   */
  private getRoomFilePath(roomName: string): string {
    // Sanitize room name to prevent directory traversal attacks
    const safeName = roomName.replace(/[^a-zA-Z0-9_-]/g, "_");
    return joinPath(this.storagePath, `${safeName}.json`);
  }

  async saveRoom(room: SerializedRoom): Promise<void> {
    const filePath = this.getRoomFilePath(room.roomName);

    try {
      // Ensure directory still exists (in case it was deleted)
      this.ensureStorageDirectory();

      // Serialize room data with pretty printing for readability
      const jsonData = JSON.stringify(room, null, 2);

      // Write atomically by writing to a temp file first, then renaming
      const tempPath = `${filePath}.tmp`;
      await Deno.writeTextFile(tempPath, jsonData);
      await Deno.rename(tempPath, filePath);

      log.debug(`Saved room "${room.roomName}" to ${filePath}`);
    } catch (error) {
      throw new StorageError(
        `Failed to save room "${room.roomName}" to file: ${filePath}`,
        error as Error,
      );
    }
  }

  async getRoom(roomName: string): Promise<SerializedRoom | null> {
    const filePath = this.getRoomFilePath(roomName);

    try {
      const jsonData = await Deno.readTextFile(filePath);
      const room = JSON.parse(jsonData) as SerializedRoom;

      // Validate that the room has required fields
      if (!room.roomName || !room.creatorPlexUserId || !room.createdAt) {
        throw new StorageError(
          `Room file "${filePath}" is missing required fields`,
        );
      }

      log.debug(`Loaded room "${roomName}" from ${filePath}`);
      return room;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return null;
      }
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `Failed to read room "${roomName}" from file: ${filePath}`,
        error as Error,
      );
    }
  }

  async deleteRoom(roomName: string): Promise<void> {
    const filePath = this.getRoomFilePath(roomName);

    try {
      await Deno.remove(filePath);
      log.debug(`Deleted room "${roomName}" from ${filePath}`);
    } catch (error) {
      // Idempotent - not an error if file doesn't exist
      if (error instanceof Deno.errors.NotFound) {
        log.debug(`Room file "${filePath}" already deleted or doesn't exist`);
        return;
      }
      throw new StorageError(
        `Failed to delete room "${roomName}" file: ${filePath}`,
        error as Error,
      );
    }
  }

  async listRooms(): Promise<SerializedRoom[]> {
    const rooms: SerializedRoom[] = [];

    try {
      // Ensure directory exists before walking
      this.ensureStorageDirectory();

      // Walk through all .json files in the storage directory
      for await (const entry of walk(this.storagePath, {
        maxDepth: 1,
        includeFiles: true,
        includeDirs: false,
        exts: [".json"],
      })) {
        // Skip the directory itself and temp files
        if (entry.isFile && !entry.name.endsWith(".tmp")) {
          try {
            const jsonData = await Deno.readTextFile(entry.path);
            const room = JSON.parse(jsonData) as SerializedRoom;

            // Validate room has required fields
            if (room.roomName && room.creatorPlexUserId && room.createdAt) {
              rooms.push(room);
            } else {
              log.warn(
                `Skipping invalid room file: ${entry.path} (missing required fields)`,
              );
            }
          } catch (error) {
            log.warn(
              `Failed to parse room file: ${entry.path}`,
              error,
            );
            // Continue processing other files
          }
        }
      }

      log.debug(`Listed ${rooms.length} rooms from ${this.storagePath}`);
      return rooms;
    } catch (error) {
      throw new StorageError(
        `Failed to list rooms from directory: ${this.storagePath}`,
        error as Error,
      );
    }
  }

  async hasRoom(roomName: string): Promise<boolean> {
    const filePath = this.getRoomFilePath(roomName);

    try {
      const stat = await Deno.stat(filePath);
      return stat.isFile;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return false;
      }
      throw new StorageError(
        `Failed to check if room "${roomName}" exists: ${filePath}`,
        error as Error,
      );
    }
  }

  /**
   * Get the storage path being used.
   * Useful for debugging and testing.
   */
  getStoragePath(): string {
    return this.storagePath;
  }
}
