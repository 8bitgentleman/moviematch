/**
 * Shared API interfaces between the frontend and backend
 */

export interface BasicAuth {
  userName: string;
  password: string;
}

export interface Config {
  hostname: string;
  port: number;
  logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";
  rootPath: string;
  servers: Array<{
    type?: "plex";
    url: string;
    token: string;
    libraryTitleFilter?: string[];
    libraryTypeFilter: LibraryType[];
    linkType?: "app" | "webLocal" | "webExternal";
  }>;
  requirePlexTvLogin: boolean;
  basicAuth?: BasicAuth;
  tlsConfig?: {
    certFile: string;
    keyFile: string;
  };
  storageType?: "memory" | "file";
  storagePath?: string;
}

export type Message = ServerMessage | ClientMessage;

// Messages intended for the Server
export type ServerMessage =
  | { type: "login"; payload: Login }
  | { type: "logout" }
  | { type: "createRoom"; payload: CreateRoomRequest }
  | { type: "joinRoom"; payload: JoinRoomRequest }
  | { type: "leaveRoom" }
  | { type: "rate"; payload: Rate }
  | { type: "setLocale"; payload: Locale }
  | { type: "setup"; payload: Config }
  | { type: "requestFilters" }
  | { type: "requestFilterValues"; payload: FilterValueRequest };

// Messages intended for the UI
export type ClientMessage =
  | { type: "loginError"; payload: LoginError }
  | { type: "loginSuccess"; payload: User }
  | { type: "logoutError"; payload: LogoutError }
  | { type: "logoutSuccess" }
  | { type: "createRoomError"; payload: CreateRoomError }
  | { type: "createRoomSuccess"; payload: JoinRoomSuccess }
  | { type: "joinRoomError"; payload: JoinRoomError }
  | { type: "joinRoomSuccess"; payload: JoinRoomSuccess }
  | { type: "leaveRoomSuccess" }
  | { type: "leaveRoomError"; payload: LeaveRoomError }
  | { type: "match"; payload: Match }
  | { type: "media"; payload: Media[] }
  | { type: "config"; payload: AppConfig }
  | { type: "translations"; payload: Translations }
  | { type: "setupSuccess"; payload: SetupSuccess }
  | { type: "setupError"; payload: SetupError }
  | { type: "requestFiltersSuccess"; payload: Filters }
  | { type: "requestFiltersError" }
  | {
    type: "requestFilterValuesSuccess";
    payload: { request: FilterValueRequest; values: FilterValue[] };
  }
  | { type: "requestFilterValuesError" }
  | { type: "userJoinedRoom"; payload: UserProgress }
  | { type: "userLeftRoom"; payload: User }
  | { type: "userProgress"; payload: UserProgress };

// Translations
export type TranslationKey =
  | "LANG"
  | "LOGIN_NAME"
  | "LOGIN_ROOM_NAME"
  | "LOGIN_SIGN_IN"
  | "LOGIN_SIGN_IN_PLEX"
  | "CREATE_ROOM"
  | "RATE_SECTION_LOADING"
  | "RATE_SECTION_EXHAUSTED_CARDS"
  | "MATCHES_SECTION_TITLE"
  | "MATCHES_SECTION_NO_MATCHES"
  | "MATCHES_SECTION_CARD_LIKERS"
  | "LIST_CONJUNCTION"
  | "BACK"
  | "SHARE_ROOM_TITLE"
  | "JOIN_ROOM"
  | "FIELD_REQUIRED_ERROR"
  | "COPY_LINK_SUCCESS"
  | "COPY_LINK_FAILURE"
  | "LOGOUT";

// Configure message

export interface AppConfig {
  requiresConfiguration: boolean;
  requirePlexLogin: boolean;
  initialConfiguration?: Partial<Config>;
}

// Translations message

export interface Locale {
  language: string;
}

export type Translations = Record<TranslationKey, string>;

// Login (when login is required to create a new room)

export type Login =
  | { userName: string }
  | { plexClientId: string; plexToken: string };

export interface LoginError {
  name: "MalformedMessage" | "PlexLoginRequired";
  message: string;
}

export interface LogoutError {
  name: "NotLoggedIn";
  message: string;
}

export type Permissions = "CanCreateRoom";

export interface User {
  userName: string;
  permissions?: Permissions[]; // Not available in user*Room messages
  avatarImage?: string;
}

// Create Room

export type RoomOption = "EndOnFirstMatch";

export interface Filter {
  key: string;
  operator: string;
  value: string[];
}

export type RoomSort = "random" | "rating";

export type RoomType = "standard" | "unanimous" | "solo" | "async";

// Enhanced filter types for Phase 2.3
export type SortOrder = "newest" | "oldest" | "random";

export type GenreFilterMode = "and" | "or";

export interface RatingFilter {
  min?: number; // 0-10 scale
  max?: number; // 0-10 scale
  type?: "critic" | "audience"; // Critic rating vs audience rating
}

export interface ContentRatingFilter {
  ratings: string[]; // e.g., ["G", "PG", "PG-13", "R"]
}

export interface CreateRoomRequest {
  roomName: string;
  password?: string;
  options?: RoomOption[];
  filters?: Filter[];
  sort?: RoomSort;
  roomType?: RoomType; // Phase 2.2: Match strategy type
  // Phase 2.3 enhancements
  sortOrder?: SortOrder;
  genreFilterMode?: GenreFilterMode; // For when filters include genre
  ratingFilter?: RatingFilter;
  contentRatingFilter?: ContentRatingFilter;
}

export interface CreateRoomError {
  name:
    | "RoomExistsError"
    | "UnauthorizedError"
    | "NotLoggedInError"
    | "NoMedia"
    | "PlexAuthRequiredError"
    | "UnknownError";
  message: string;
}

// Contains metadata for Create Room filters
export interface CreateRoomFilterMetadata {
  availableFilters: Array<{ key: string; value: string; operator: string }>;
}

// Join

export interface JoinRoomRequest {
  roomName: string;
  password?: string;
}

export interface JoinRoomError {
  name:
    | "UserAlreadyJoinedError"
    | "AccessDeniedError"
    | "RoomNotFoundError"
    | "NotLoggedInError"
    | "UnknownError";
  message: string;
}

export interface JoinRoomSuccess {
  previousMatches: Match[];
  media: Media[];

  users: Array<{ user: User; progress: number }>;
}

// Leave

export interface LeaveRoomError {
  errorType: "NOT_JOINED"; // Can't leave a room you're not in
}

// In-Room

export interface Media {
  id: string;
  type: LibraryType;
  title: string;
  description: string;
  tagline?: string;
  year?: number;
  posterUrl?: string;
  linkUrl: string;
  genres: string[];
  duration: number;
  rating: number;
  contentRating?: string;
  // Phase 2.1: Enhanced metadata
  directors?: string[];
  writers?: string[];
  actors?: string[];
  collections?: string[];
  lastViewedAt?: number;
  viewCount?: number;
}

export interface Match {
  matchedAt: number;
  media: Media;
  users: string[];
}

export interface Rate {
  rating: "like" | "dislike";
  mediaId: string;
}

export interface SetupSuccess {
  hostname: string;
  port: number;
}

export interface SetupError {
  message: string;
  type: string;
}

// Filters

export const LibaryTypes = ["show", "movie", "music", "photo"] as const;
export type LibraryType = typeof LibaryTypes[number];

export interface Library {
  title: string;
  key: string;

  type: LibraryType;
}

export interface Filters {
  filters: Array<{
    title: string;
    key: string;
    type: string;
    libraryTypes: LibraryType[];
  }>;

  // e.g. { integer: [{ key: '=', title: 'is' }, { key: '!=', title: 'is not' }] }
  // Note, the meanings of certain keys (e.g. '=') can be different depending on the type
  filterTypes: Record<
    string,
    Array<{
      key: string;
      title: string;
    }>
  >;
}

export interface FilterValue {
  title: string;
  value: string;
}

export interface FilterValueRequest {
  key: string;
}

export interface UserProgress {
  user: User;
  // A percentage of the way through the room the user is
  progress: number;
}
