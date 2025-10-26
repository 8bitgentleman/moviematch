/**
 * In-memory storage implementation.
 *
 * This implementation stores rooms in a Map, providing the same behavior
 * as the original MovieMatch implementation. Rooms are lost on server restart.
 *
 * This is useful for:
 * - Development and testing
 * - Deployments where persistence is not required
 * - As a fallback when file storage is not available
 */

import { log } from "/deps.ts";
import { SerializedRoom, Storage, StorageError } from "./interface.ts";

export class MemoryStorage implements Storage {
  private rooms = new Map<string, SerializedRoom>();

  constructor() {
    log.info("Using in-memory storage (rooms will not persist on restart)");
  }

  async saveRoom(room: SerializedRoom): Promise<void> {
    try {
      // Create a deep copy to prevent external mutations
      const roomCopy = JSON.parse(JSON.stringify(room)) as SerializedRoom;
      this.rooms.set(room.roomName, roomCopy);
      log.debug(`Saved room "${room.roomName}" to memory storage`);
    } catch (error) {
      throw new StorageError(
        `Failed to save room "${room.roomName}" to memory`,
        error as Error,
      );
    }
  }

  async getRoom(roomName: string): Promise<SerializedRoom | null> {
    try {
      const room = this.rooms.get(roomName);
      if (!room) {
        return null;
      }
      // Return a deep copy to prevent external mutations
      return JSON.parse(JSON.stringify(room)) as SerializedRoom;
    } catch (error) {
      throw new StorageError(
        `Failed to get room "${roomName}" from memory`,
        error as Error,
      );
    }
  }

  async deleteRoom(roomName: string): Promise<void> {
    try {
      this.rooms.delete(roomName);
      log.debug(`Deleted room "${roomName}" from memory storage`);
    } catch (error) {
      throw new StorageError(
        `Failed to delete room "${roomName}" from memory`,
        error as Error,
      );
    }
  }

  async listRooms(): Promise<SerializedRoom[]> {
    try {
      // Return deep copies of all rooms
      return [...this.rooms.values()].map((room) =>
        JSON.parse(JSON.stringify(room)) as SerializedRoom
      );
    } catch (error) {
      throw new StorageError(
        "Failed to list rooms from memory",
        error as Error,
      );
    }
  }

  async hasRoom(roomName: string): Promise<boolean> {
    return this.rooms.has(roomName);
  }

  /**
   * Get the number of rooms currently in memory.
   * Useful for testing and monitoring.
   */
  size(): number {
    return this.rooms.size;
  }

  /**
   * Clear all rooms from memory.
   * Useful for testing.
   */
  clear(): void {
    this.rooms.clear();
    log.debug("Cleared all rooms from memory storage");
  }
}
