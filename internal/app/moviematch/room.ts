import { log } from "/deps.ts";
import {
  ClientMessage,
  ContentRatingFilter,
  CreateRoomRequest,
  Filter,
  GenreFilterMode,
  JoinRoomRequest,
  Match,
  Media,
  Rate,
  RatingFilter,
  RoomOption,
  RoomSort,
  RoomType,
  SortOrder,
  User,
  UserProgress,
} from "/types/moviematch.ts";
import { memo } from "/internal/app/moviematch/util/memo.ts";
import { Client } from "/internal/app/moviematch/client.ts";
import type { RouteContext } from "./types.ts";
import { createStorageFromEnv } from "/internal/app/moviematch/storage/index.ts";
import type { Storage } from "/internal/app/moviematch/storage/interface.ts";
import { createMatchStrategy, type MatchStrategy } from "/internal/app/moviematch/strategies/index.ts";

export class RoomExistsError extends Error {
  override name = "RoomExistsError";
}
export class AccessDeniedError extends Error {
  override name = "AccessDeniedError";
}
export class RoomNotFoundError extends Error {
  override name = "RoomNotFoundError";
}
export class UserAlreadyJoinedError extends Error {
  override name = "UserAlreadyJoinedError";
}
export class NoMediaError extends Error {
  override name = "NoMediaError";
}

export class Room {
  RouteContext: RouteContext;
  roomName: string;
  password?: string;
  users = new Map<string, Client>();
  filters?: Filter[];
  options?: RoomOption[];
  sort: RoomSort;

  // Phase 2.2: Room type and matching strategy
  roomType: RoomType;
  private matchStrategy: MatchStrategy;

  // Phase 2.3 enhanced filters
  sortOrder: SortOrder;
  genreFilterMode?: GenreFilterMode;
  ratingFilter?: RatingFilter;
  contentRatingFilter?: ContentRatingFilter;

  // Creator information for room ownership
  creatorPlexUserId: string;
  creatorPlexUsername: string;
  createdAt: Date;

  media: Promise<Map</*mediaId */ string, Media>>;
  userProgress = new Map</* userName */ string, number>();
  ratings = new Map<
    /* mediaId */ string,
    Array<[userName: string, rating: Rate["rating"], time: number]>
  >();

  constructor(
    req: CreateRoomRequest,
    ctx: RouteContext,
    creatorInfo: { plexUserId: string; plexUsername: string }
  ) {
    this.RouteContext = ctx;
    this.roomName = req.roomName;
    this.password = req.password;
    this.options = req.options;
    this.filters = req.filters;
    this.sort = req.sort ?? "random";

    // Phase 2.2: Initialize room type and matching strategy
    this.roomType = req.roomType ?? "standard"; // Default to standard for backward compatibility
    this.matchStrategy = createMatchStrategy(this.roomType);

    // Phase 2.3 enhanced filters with defaults
    this.sortOrder = req.sortOrder ?? "random";
    this.genreFilterMode = req.genreFilterMode;
    this.ratingFilter = req.ratingFilter;
    this.contentRatingFilter = req.contentRatingFilter;

    // Store creator information
    this.creatorPlexUserId = creatorInfo.plexUserId;
    this.creatorPlexUsername = creatorInfo.plexUsername;
    this.createdAt = new Date();

    this.media = this.getMedia();
  }

  getMedia = memo(async () => {
    const media: Media[] = [];

    for (const provider of this.RouteContext.providers) {
      media.push(...await provider.getMedia({
        filters: this.filters,
        sortOrder: this.sortOrder,
        genreFilterMode: this.genreFilterMode,
        ratingFilter: this.ratingFilter,
        contentRatingFilter: this.contentRatingFilter,
      }));
    }

    if (media.length === 0) {
      throw new NoMediaError(
        "There are no items with the specified filters applied.",
      );
    }

    // Note: Sorting is now handled by the provider based on sortOrder
    // No longer applying random sort here

    return new Map<string, Media>(
      media.map((media) => ([media.id, media])),
    );
  });

  getMediaForUser = async (userName: string): Promise<Media[]> => {
    const media = await this.media;
    return [...media.values()].filter((media) => {
      const ratings = this.ratings.get(media.id);
      return !ratings || !ratings.find(([_userName]) => userName === _userName);
    });
  };

  storeRating = async (userName: string, rating: Rate, matchedAt: number) => {
    const existingRatings = this.ratings.get(rating.mediaId);
    const progress = (this.userProgress.get(userName) ?? 0) + 1;

    if (existingRatings) {
      const existingRatingByUser = existingRatings.find(([_userName]) =>
        _userName === userName
      );

      if (existingRatingByUser) {
        log.warn(`${userName} has already rated ${rating.mediaId}.`);
        return;
      }

      existingRatings.push([userName, rating.rating, matchedAt]);
    } else {
      this.ratings.set(rating.mediaId, [[userName, rating.rating, matchedAt]]);
    }

    // Phase 2.2: Use strategy pattern for match detection
    const activeUsers = new Set(this.users.keys());
    const mediaMap = await this.media;
    const match = this.matchStrategy.checkForMatch(
      this.ratings,
      activeUsers,
      rating.mediaId,
      mediaMap,
      userName
    );

    // If we have a match, notify users based on strategy
    if (match && this.matchStrategy.shouldNotifyUsers(match)) {
      this.notifyMatch(match);
    }

    this.userProgress.set(userName, progress);

    this.notifyProgress({ userName }, progress / (await this.media).size);

    // Persist room state after rating change
    await this.persistRoom();
  };

  /**
   * Persist current room state to storage
   */
  private async persistRoom() {
    try {
      await storage.saveRoom(this.toSerializedRoom());
      log.debug(`Room ${this.roomName} persisted to storage`);
    } catch (error) {
      log.error(`Failed to persist room ${this.roomName}: ${error}`);
    }
  }

  getMatches = async (
    userName: string,
    allLikes: boolean,
  ): Promise<Match[]> => {
    const matches: Match[] = [];
    const mediaMap = await this.media;

    for (const [mediaId, rating] of this.ratings.entries()) {
      const likes = rating.filter(([, rating]) => rating === "like");
      const matchedAt = likes.reduce(
        (lastTime, [, , time]) => (time > lastTime ? time : lastTime),
        0,
      );

      // Phase 2.2: Handle different strategy types
      let isMatch = false;

      if (this.roomType === "solo") {
        // In solo mode, only show matches for this specific user
        isMatch = likes.some(([_userName]) => _userName === userName);
      } else if (this.roomType === "unanimous") {
        // In unanimous mode, all users must have liked
        const activeUsers = new Set(this.users.keys());
        const usersWhoLiked = new Set(likes.map(([userName]) => userName));
        isMatch = activeUsers.size > 0 &&
                  [...activeUsers].every(u => usersWhoLiked.has(u)) &&
                  (allLikes || usersWhoLiked.has(userName));
      } else {
        // Standard and async modes: 2+ likes required
        isMatch = likes.length >= 2 &&
                  (allLikes || !!likes.find(([_userName]) => userName === _userName));
      }

      if (isMatch) {
        const media = mediaMap.get(mediaId);
        if (media) {
          matches.push({
            matchedAt,
            media,
            users: likes.map(([userName]) => userName),
          });
        } else {
          log.info(
            `Tried to rate mediaId: ${mediaId}, but it looks like that media item doesn't exist.`,
          );
        }
      }
    }

    return matches;
  };

  getUsers = async (): Promise<Array<{ user: User; progress: number }>> => {
    const mediaSize = (await this.media).size;
    return [...this.users.values()].map((client) => {
      const user = client.getUser();
      return {
        user,
        progress: (this.userProgress.get(user.userName) ?? 0) / mediaSize,
      };
    });
  };

  notifyJoin = (userProgress: UserProgress) => {
    this.broadcastMessage({
      type: "userJoinedRoom",
      payload: userProgress,
    }, userProgress.user.userName);
  };

  notifyLeave = (user: User) => {
    this.broadcastMessage({
      type: "userLeftRoom",
      payload: user,
    }, user.userName);
  };

  notifyProgress = (user: User, progress: number) => {
    this.broadcastMessage({
      type: "userProgress",
      payload: { user, progress },
    });
  };

  notifyMatch = (match: Match) => {
    this.broadcastMessage({
      type: "match",
      payload: match,
    });
  };

  broadcastMessage = (msg: ClientMessage, sourceUserName?: string) => {
    for (const [userName, client] of this.users.entries()) {
      if (client && userName !== sourceUserName) {
        client.sendMessage(msg);
      }
    }
  };

  /**
   * Helper: Convert ratings Map to plain object for serialization
   */
  private ratingsToObject(): Record<string, Array<[userName: string, rating: "like" | "dislike", timestamp: number]>> {
    const result: Record<string, Array<[userName: string, rating: "like" | "dislike", timestamp: number]>> = {};
    for (const [mediaId, ratings] of this.ratings.entries()) {
      result[mediaId] = ratings;
    }
    return result;
  }

  /**
   * Helper: Convert userProgress Map to plain object for serialization
   */
  private userProgressToObject(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [userName, progress] of this.userProgress.entries()) {
      result[userName] = progress;
    }
    return result;
  }

  /**
   * Serialize this room for storage.
   * Only includes persistent data, not runtime state like websocket connections.
   */
  toSerializedRoom() {
    return {
      roomName: this.roomName,
      password: this.password,
      options: this.options,
      filters: this.filters,
      sort: this.sort,
      // Phase 2.2: Room type
      roomType: this.roomType,
      // Phase 2.3 enhanced filters
      sortOrder: this.sortOrder,
      genreFilterMode: this.genreFilterMode,
      ratingFilter: this.ratingFilter,
      contentRatingFilter: this.contentRatingFilter,
      createdAt: this.createdAt.toISOString(),
      creatorPlexUserId: this.creatorPlexUserId,
      creatorPlexUsername: this.creatorPlexUsername,
      ratings: this.ratingsToObject(),
      userProgress: this.userProgressToObject(),
    };
  }
}

type RoomName = string;

const rooms = new Map<RoomName, Room>();

// Initialize storage from environment/config
const storage: Storage = createStorageFromEnv();

export const createRoom = async (
  createRequest: CreateRoomRequest,
  ctx: RouteContext,
  creatorInfo: { plexUserId: string; plexUsername: string },
): Promise<Room> => {
  if (rooms.has(createRequest.roomName)) {
    throw new RoomExistsError(`${createRequest.roomName} already exists.`);
  }

  const room = new Room(createRequest, ctx, creatorInfo);
  await room.media;
  rooms.set(room.roomName, room);

  // Persist the room to storage
  await storage.saveRoom(room.toSerializedRoom());
  log.info(`Room ${room.roomName} created by ${creatorInfo.plexUsername} and persisted to storage`);

  return room;
};

export const getRoom = (
  userName: string,
  { roomName, password }: JoinRoomRequest,
): Room => {
  const room = rooms.get(roomName);

  if (!room) {
    throw new RoomNotFoundError(`${roomName} does not exist`);
  }

  if (typeof room.password === "string") {
    if (room.password === password) {
      return room;
    } else {
      throw new AccessDeniedError(`${roomName} requires a password`);
    }
  }

  if (room.users.has(userName)) {
    throw new UserAlreadyJoinedError(
      `${userName} is already logged into ${room.roomName} room`,
    );
  }

  return room;
};
