import { Match, Media, Rate } from "/types/moviematch.ts";

/**
 * MatchStrategy defines how rooms detect matches from user ratings.
 * Different strategies enable different matching behaviors:
 * - Standard: 2+ users must like (default)
 * - Unanimous: ALL users must like
 * - Solo: Personal watchlist building (each like is a match)
 * - Async: Matches persist across user sessions
 */
export interface MatchStrategy {
  /** Strategy identifier */
  name: "standard" | "unanimous" | "solo" | "async";

  /** Human-readable description */
  description: string;

  /**
   * Check if ratings for a media item constitute a match.
   *
   * @param ratings - All ratings stored in the room
   * @param activeUsers - Set of currently connected user names
   * @param mediaId - The media ID that was just rated
   * @param media - Map of all media in the room
   * @param currentUserName - The user who just submitted a rating
   * @returns Match if criteria met, null otherwise
   */
  checkForMatch(
    ratings: Map<string, Array<[userName: string, rating: Rate["rating"], timestamp: number]>>,
    activeUsers: Set<string>,
    mediaId: string,
    media: Map<string, Media>,
    currentUserName: string
  ): Match | null;

  /**
   * Determine if users should be notified about this match.
   * Solo mode returns false to avoid broadcasting personal matches.
   *
   * @param match - The match that was detected
   * @returns true if users should be notified via broadcast
   */
  shouldNotifyUsers(match: Match): boolean;
}
