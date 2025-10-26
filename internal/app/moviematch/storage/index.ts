/**
 * Storage factory and exports.
 *
 * This module provides a factory function to create storage instances
 * and re-exports all storage-related types and classes.
 */

import { log } from "/deps.ts";
import { Storage, StorageError } from "./interface.ts";
import { MemoryStorage } from "./memory.ts";
import { FileStorage, FileStorageOptions } from "./file.ts";

export type { SerializedRoom, Storage } from "./interface.ts";
export { StorageError } from "./interface.ts";
export { MemoryStorage } from "./memory.ts";
export { FileStorage } from "./file.ts";

/**
 * Storage type discriminator.
 */
export type StorageType = "memory" | "file";

/**
 * Options for creating a storage instance.
 */
export interface CreateStorageOptions {
  /** Type of storage to create */
  type: StorageType;

  /** Storage path (for file-based storage) */
  storagePath?: string;
}

/**
 * Create a storage instance based on the specified type.
 *
 * @param options - Storage configuration options
 * @returns A Storage implementation instance
 * @throws {StorageError} if the storage type is invalid or initialization fails
 *
 * @example
 * ```ts
 * // Create in-memory storage
 * const storage = createStorage({ type: "memory" });
 *
 * // Create file storage with custom path
 * const storage = createStorage({
 *   type: "file",
 *   storagePath: "./data/rooms"
 * });
 * ```
 */
export function createStorage(options: CreateStorageOptions): Storage {
  const { type, storagePath } = options;

  log.info(`Initializing ${type} storage...`);

  switch (type) {
    case "memory":
      return new MemoryStorage();

    case "file": {
      const fileOptions: FileStorageOptions = {};
      if (storagePath) {
        fileOptions.storagePath = storagePath;
      }
      return new FileStorage(fileOptions);
    }

    default:
      throw new StorageError(
        `Invalid storage type: ${type}. Must be "memory" or "file".`,
      );
  }
}

/**
 * Create a storage instance from environment variables or config.
 *
 * This is a convenience function that reads storage configuration from
 * common environment variables:
 * - STORAGE_TYPE: "memory" or "file" (default: "memory")
 * - STORAGE_PATH: path for file storage (default: "./data/rooms")
 *
 * @returns A Storage implementation instance
 *
 * @example
 * ```ts
 * // Using environment variables:
 * // STORAGE_TYPE=file STORAGE_PATH=./my-rooms
 * const storage = createStorageFromEnv();
 * ```
 */
export function createStorageFromEnv(): Storage {
  const type = (Deno.env.get("STORAGE_TYPE") || "memory") as StorageType;
  const storagePath = Deno.env.get("STORAGE_PATH");

  const options: CreateStorageOptions = { type };
  if (storagePath) {
    options.storagePath = storagePath;
  }

  return createStorage(options);
}
