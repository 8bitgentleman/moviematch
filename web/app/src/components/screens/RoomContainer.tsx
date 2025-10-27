import React, { useState, useCallback, useEffect } from "react";
import type { Media, Match, User } from "../../../../../types/moviematch";
import { SwipeScreen } from "./SwipeScreen";
import { BrowseScreen } from "./BrowseScreen";
import { MatchesScreen } from "./MatchesScreen";
import { SettingsScreen } from "./SettingsScreen";
import { useStore } from "../../store";

type TabType = "swipe" | "browse" | "matches" | "settings";

interface Participant {
  user: User;
  progress: number;
}

interface RoomContainerProps {
  // Props can be passed or derived from store
  initialTab?: TabType;
}

/**
 * RoomContainer - Main container for the room experience
 *
 * This component manages:
 * - Tab navigation between 4 room screens (swipe, browse, matches, settings)
 * - WebSocket event handling for room updates
 * - Shared state management across all tabs
 * - User interactions (swipe, bookmark, leave room, etc.)
 */
export const RoomContainer = ({ initialTab = "swipe" }: RoomContainerProps) => {
  const [{ room, user }, dispatch] = useStore(["room", "user"]);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [bookmarkedMedia, setBookmarkedMedia] = useState<Set<string>>(new Set());

  // Ensure we have room data
  if (!room || !room.media || !user) {
    return null;
  }

  // Extract data from store
  const media = room.media;
  const matches = room.matches || [];
  const participants: Participant[] = room.users || [];
  const roomName = room.name;

  // Tab change handler
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  // Swipe action handler - sends rate message to server
  const handleSwipe = useCallback(
    (mediaId: string, action: "like" | "dislike") => {
      dispatch({
        type: "rate",
        payload: {
          mediaId,
          rating: action,
        },
      });
    },
    [dispatch]
  );

  // Bookmark handler - stores locally for now
  const handleBookmark = useCallback((mediaItem: Media) => {
    setBookmarkedMedia((prev) => {
      const next = new Set(prev);
      if (next.has(mediaItem.id)) {
        next.delete(mediaItem.id);
      } else {
        next.add(mediaItem.id);
      }
      return next;
    });
  }, []);

  // Leave room handler
  const handleLeaveRoom = useCallback(() => {
    dispatch({ type: "leaveRoom" });
  }, [dispatch]);

  // Logout handler
  const handleLogout = useCallback(() => {
    dispatch({ type: "logout" });
  }, [dispatch]);

  // Common props passed to all screens
  const commonProps = {
    onTabChange: handleTabChange,
    isAuthenticated: !!user,
    matchCount: matches.length,
  };

  // Render the appropriate screen based on activeTab
  switch (activeTab) {
    case "swipe":
      return (
        <SwipeScreen
          media={media}
          onSwipe={handleSwipe}
          onBookmark={handleBookmark}
          {...commonProps}
        />
      );

    case "browse":
      return (
        <BrowseScreen
          media={media}
          onBookmark={handleBookmark}
          {...commonProps}
        />
      );

    case "matches":
      return (
        <MatchesScreen
          matches={matches}
          onTabChange={handleTabChange}
        />
      );

    case "settings":
      return (
        <SettingsScreen
          roomName={roomName}
          participants={participants}
          user={user}
          matchCount={matches.length}
          onLeaveRoom={handleLeaveRoom}
          onLogout={handleLogout}
          onTabChange={handleTabChange}
        />
      );

    default:
      return null;
  }
};
