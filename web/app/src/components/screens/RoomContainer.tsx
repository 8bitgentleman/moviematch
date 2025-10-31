import React, { useCallback } from "react";
import type { Media, User } from "../../../../../types/moviematch";
import { SwipeScreen } from "./SwipeScreen";
import { BrowseScreen } from "./BrowseScreen";
import { MatchesScreen } from "./MatchesScreen";
import { SettingsScreen } from "./SettingsScreen";
import { useRoomStore } from "../../store/roomStore";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { client } from "../../store/websocket";

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
  // Zustand store selectors
  const room = useRoomStore((state) => ({
    name: state.name,
    media: state.media,
    matches: state.matches,
    users: state.users,
  }));
  const user = useAuthStore((state) => state.user);
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const toggleBookmark = useRoomStore((state) => state.toggleBookmark);

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
  }, [setActiveTab]);

  // Swipe action handler - sends rate message to server via WebSocket
  const handleSwipe = useCallback(
    (mediaId: string, action: "like" | "dislike") => {
      client.rate({
        mediaId,
        rating: action,
      });
    },
    []
  );

  // Bookmark handler - updates Zustand store
  const handleBookmark = useCallback((mediaItem: Media) => {
    toggleBookmark(mediaItem.id);
  }, [toggleBookmark]);

  // Leave room handler - uses WebSocket client
  const handleLeaveRoom = useCallback(() => {
    client.leaveRoom();
  }, []);

  // Logout handler - uses WebSocket client
  const handleLogout = useCallback(() => {
    client.logout();
  }, []);

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
