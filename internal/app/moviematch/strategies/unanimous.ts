import { Match, Media, Rate } from "/types/moviematch.ts";
import { MatchStrategy } from "./interface.ts";

/**
 * UnanimousMatchStrategy: Strict matching mode.
 * A match occurs ONLY when ALL active users have liked the same movie.
 * Perfect for groups where everyone needs to agree.
 */
export class UnanimousMatchStrategy implements MatchStrategy {
  name = "unanimous" as const;
  description = "Match only when ALL users like the same movie";

  checkForMatch(
    ratings: Map<string, Array<[userName: string, rating: Rate["rating"], timestamp: number]>>,
    activeUsers: Set<string>,
    mediaId: string,
    media: Map<string, Media>,
    currentUserName: string
  ): Match | null {
    const mediaRatings = ratings.get(mediaId) || [];
    const likes = mediaRatings.filter(([, rating]) => rating === "like");

    // Check if we have at least one active user
    if (activeUsers.size === 0) {
      return null;
    }

    // Get the set of users who liked this media
    const usersWhoLiked = new Set(likes.map(([userName]) => userName));

    // Match only if ALL active users have liked
    // This means: every active user is in the usersWhoLiked set
    const allActiveUsersLiked = [...activeUsers].every(userName =>
      usersWhoLiked.has(userName)
    );

    if (allActiveUsersLiked && likes.length === activeUsers.size) {
      const matchedMedia = media.get(mediaId);
      if (!matchedMedia) {
        return null;
      }

      // Use the timestamp of the most recent like (the unanimous decision point)
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
    // Always notify in unanimous mode - it's a big deal when everyone agrees!
    return true;
  }
}
