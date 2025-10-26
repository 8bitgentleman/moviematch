/**
 * Strategy Pattern for Room Matching
 *
 * This module provides different matching strategies for rooms:
 * - Standard: Default behavior (2+ users must like)
 * - Unanimous: All users must like
 * - Solo: Personal watchlist building
 * - Async: Matches persist across user sessions
 */

import type { RoomType } from "/types/moviematch.ts";
import { MatchStrategy } from "./interface.ts";
import { StandardMatchStrategy } from "./standard.ts";
import { UnanimousMatchStrategy } from "./unanimous.ts";
import { SoloMatchStrategy } from "./solo.ts";
import { AsyncMatchStrategy } from "./async.ts";

export type { MatchStrategy, RoomType };
export { StandardMatchStrategy, UnanimousMatchStrategy, SoloMatchStrategy, AsyncMatchStrategy };

/**
 * Factory function to create the appropriate match strategy
 * based on room type.
 *
 * @param roomType - The type of room matching strategy to use
 * @returns An instance of the corresponding MatchStrategy
 */
export function createMatchStrategy(roomType?: RoomType): MatchStrategy {
  // Default to standard for backward compatibility
  const type = roomType ?? "standard";

  switch (type) {
    case "standard":
      return new StandardMatchStrategy();
    case "unanimous":
      return new UnanimousMatchStrategy();
    case "solo":
      return new SoloMatchStrategy();
    case "async":
      return new AsyncMatchStrategy();
    default:
      // Should never happen with TypeScript types, but provide fallback
      return new StandardMatchStrategy();
  }
}
