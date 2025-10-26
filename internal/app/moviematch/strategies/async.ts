import { Match, Media, Rate } from "/types/moviematch.ts";
import { MatchStrategy } from "./interface.ts";

/**
 * AsyncMatchStrategy: Asynchronous matching mode.
 * Matches persist across user sessions - users can join/leave at different times.
 * A match occurs when 2+ users (active OR inactive) have liked the same movie.
 * Perfect for groups where people rate at different times.
 */
export class AsyncMatchStrategy implements MatchStrategy {
  name = "async" as const;
  description = "Matches persist - users can rate at different times";

  checkForMatch(
    ratings: Map<string, Array<[userName: string, rating: Rate["rating"], timestamp: number]>>,
    activeUsers: Set<string>,
    mediaId: string,
    media: Map<string, Media>,
    currentUserName: string
  ): Match | null {
    const mediaRatings = ratings.get(mediaId) || [];
    const likes = mediaRatings.filter(([, rating]) => rating === "like");

    // In async mode, we don't care if users are currently active
    // Match when 2 or more users (past or present) have liked
    if (likes.length >= 2) {
      const matchedMedia = media.get(mediaId);
      if (!matchedMedia) {
        return null;
      }

      // Use the timestamp of the most recent like
      const matchedAt = likes.reduce(
        (lastTime, [, , time]) => (time > lastTime ? time : lastTime),
        0
      );

      return {
        matchedAt,
        media: matchedMedia,
        users: likes.map(([userName]) => userName)
      };
    }

    return null;
  }

  shouldNotifyUsers(match: Match): boolean {
    // Always notify in async mode
    // Even if some users who liked are offline, currently active users should see the match
    return true;
  }
}
