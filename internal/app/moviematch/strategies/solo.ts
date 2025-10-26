import { Match, Media, Rate } from "/types/moviematch.ts";
import { MatchStrategy } from "./interface.ts";

/**
 * SoloMatchStrategy: Personal watchlist mode.
 * Each user builds their own watchlist. Every "like" becomes a personal match.
 * Matches are NOT broadcast to other users - they're personal to each user.
 * Perfect for individual movie discovery and list building.
 */
export class SoloMatchStrategy implements MatchStrategy {
  name = "solo" as const;
  description = "Build your personal watchlist - each like is a match";

  checkForMatch(
    ratings: Map<string, Array<[userName: string, rating: Rate["rating"], timestamp: number]>>,
    activeUsers: Set<string>,
    mediaId: string,
    media: Map<string, Media>,
    currentUserName: string
  ): Match | null {
    const mediaRatings = ratings.get(mediaId) || [];

    // Find the rating from the current user who just submitted
    const currentUserRating = mediaRatings.find(([userName]) =>
      userName === currentUserName
    );

    // If the current user liked this media, create a personal match
    if (currentUserRating && currentUserRating[1] === "like") {
      const matchedMedia = media.get(mediaId);
      if (!matchedMedia) {
        return null;
      }

      return {
        matchedAt: currentUserRating[2], // timestamp of the like
        media: matchedMedia,
        users: [currentUserName] // Only the current user
      };
    }

    return null;
  }

  shouldNotifyUsers(match: Match): boolean {
    // Do NOT broadcast in solo mode - matches are personal
    // The match will still be returned and stored, but won't be sent to other users
    return false;
  }
}
