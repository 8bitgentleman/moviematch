import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, Translations, AppConfig } from '../../../../types/moviematch';
import * as plex from '../api/plex_tv';

interface AuthState {
  user?: User;
  translations?: Translations;
  config?: AppConfig;

  // Actions
  login: (user: User) => void;
  logout: () => void;
  setConfig: (config: AppConfig) => void;
  setTranslations: (translations: Translations) => void;
  initPlexLogin: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      // Initial state
      user: undefined,
      translations: undefined,
      config: undefined,

      // Actions
      login: (user) => {
        // Store userName in localStorage for persistence
        if (user.userName) {
          localStorage.setItem('userName', user.userName);
        }
        set({ user });
      },

      logout: () => {
        // Clean up all auth-related localStorage items
        localStorage.removeItem('userName');
        localStorage.removeItem('plexToken');
        localStorage.removeItem('plexTvPin');
        set({ user: undefined });
      },

      setConfig: (config) => {
        set({ config });
      },

      setTranslations: (translations) => {
        set({ translations });
      },

      initPlexLogin: () => {
        // Trigger Plex sign-in flow
        // This delegates to the plex API which handles the OAuth flow
        plex.signIn();
      },
    }),
    { name: 'AuthStore' }
  )
);
