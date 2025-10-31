import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Media, Match, User } from '../../../../types/moviematch';

interface UserProgress {
  user: User;
  progress: number;
}

interface RoomState {
  name?: string;
  joined: boolean;
  media?: Media[];
  matches?: Match[];
  users?: UserProgress[];
  bookmarkedMedia: string[];
  undoStack: Array<{ mediaId: string; action: "like" | "dislike" }>;
  createdAt?: number;

  // Actions
  createRoom: (roomName: string) => void;
  joinRoom: (roomName: string) => void;
  setRoomSuccess: (data: { media: Media[]; previousMatches: Match[]; users: UserProgress[] }) => void;
  leaveRoom: () => void;
  addMatch: (match: Match) => void;
  userJoined: (userProgress: UserProgress) => void;
  userLeft: (userName: string) => void;
  updateUserProgress: (userName: string, progress: number) => void;
  toggleBookmark: (mediaId: string) => void;
  addToUndoStack: (mediaId: string, action: "like" | "dislike") => void;
  undoLastSwipe: () => { mediaId: string; action: "like" | "discard" } | null;
}

export const useRoomStore = create<RoomState>()(
  devtools(
    (set, get) => ({
      // Initial state
      name: undefined,
      joined: false,
      media: undefined,
      matches: undefined,
      users: undefined,
      bookmarkedMedia: [],
      undoStack: [],
      createdAt: undefined,

      // Actions
      createRoom: (roomName) => {
        set({ name: roomName, joined: false, createdAt: Date.now() }, false, 'createRoom');
      },

      joinRoom: (roomName) => {
        set({ name: roomName, joined: false }, false, 'joinRoom');
      },

      setRoomSuccess: (data) => {
        set({
          joined: true,
          media: data.media,
          matches: data.previousMatches,
          users: data.users,
        }, false, 'setRoomSuccess');
      },

      leaveRoom: () => {
        set({
          name: undefined,
          joined: false,
          media: undefined,
          matches: undefined,
          users: undefined,
          bookmarkedMedia: [],
          undoStack: [],
          createdAt: undefined,
        }, false, 'leaveRoom');
      },

      addMatch: (match) => {
        set((state) => ({
          matches: [
            ...(state.matches ?? []).filter(m => m.media.id !== match.media.id),
            match,
          ],
        }), false, 'addMatch');
      },

      userJoined: (userProgress) => {
        set((state) => ({
          users: [...(state.users ?? []), userProgress],
        }), false, 'userJoined');
      },

      userLeft: (userName) => {
        set((state) => ({
          users: (state.users ?? []).filter(up => up.user.userName !== userName),
        }), false, 'userLeft');
      },

      updateUserProgress: (userName, progress) => {
        set((state) => ({
          users: (state.users ?? []).map(up =>
            up.user.userName === userName ? { ...up, progress } : up
          ),
        }), false, 'updateUserProgress');
      },

      toggleBookmark: (mediaId) => {
        set((state) => {
          const bookmarked = state.bookmarkedMedia.includes(mediaId);
          return {
            bookmarkedMedia: bookmarked
              ? state.bookmarkedMedia.filter(id => id !== mediaId)
              : [...state.bookmarkedMedia, mediaId],
          };
        }, false, 'toggleBookmark');
      },

      addToUndoStack: (mediaId, action) => {
        set((state) => ({
          undoStack: [...state.undoStack, { mediaId, action }],
        }), false, 'addToUndoStack');
      },

      undoLastSwipe: () => {
        const state = get();
        if (state.undoStack.length === 0) return null;
        const lastAction = state.undoStack[state.undoStack.length - 1];
        set({
          undoStack: state.undoStack.slice(0, -1),
        }, false, 'undoLastSwipe');
        return lastAction;
      },
    }),
    { name: 'RoomStore' }
  )
);
