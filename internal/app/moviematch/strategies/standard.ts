import { Match, Media, Rate } from "/types/moviematch.ts";
import { MatchStrategy } from "./interface.ts";

/**
 * StandardMatchStrategy: The default matching behavior.
 * A match occurs when 2 or more users like the same movie.
 * This is the original MovieMatch behavior.
 */
export class StandardMatchStrategy implements MatchStrategy {
  name = "standard" as const;
  description = "Match when 2 or more users like the same movie";

  checkForMatch(
    ratings: Map<string, Array<[userName: string, rating: Rate["rating"], timestamp: number]>>,
    activeUsers: Set<string>,
    mediaId: string,
    media: Map<string, Media>,
    currentUserName: string
  ): Match | null {
    const mediaRatings = ratings.get(mediaId) || [];
    const likes = mediaRatings.filter(([, rating]) => rating === "like");

    // Match when 2 or more users have liked
    if (likes.length >= 2) {
      const matchedMedia = media.get(mediaId);
      if (!matchedMedia) {
        return null;
      }

      // Use the timestamp of the most recent like as matchedAt
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
    // Always notify users in standard mode
    return true;
  }
}
