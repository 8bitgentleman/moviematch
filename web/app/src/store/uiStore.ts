import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Routes } from '../types';
import type { Toast } from '../components/atoms/Toast';
import type { TabType } from './types';

interface UIState {
  connectionStatus: "connecting" | "connected" | "disconnected";
  route: Routes;
  routeParams?: Record<string, string | undefined>;
  error?: { type?: string; message?: string };
  toasts: Toast[];
  activeTab: TabType;

  // Actions
  setConnectionStatus: (status: "connecting" | "connected" | "disconnected") => void;
  navigate: (route: Routes, routeParams?: Record<string, string | undefined>) => void;
  addToast: (toast: Toast) => void;
  removeToast: (toast: Toast) => void;
  setActiveTab: (tab: TabType) => void;
  setError: (error: { type?: string; message?: string }, route?: Routes) => void;
  clearError: () => void;
  loginError: (message: string) => void;
  joinRoomError: (message: string) => void;
  createRoomError: (message: string) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      connectionStatus: "disconnected",
      route: "loading",
      routeParams: undefined,
      error: undefined,
      toasts: [],
      activeTab: "swipe",

      // Actions
      setConnectionStatus: (status) => {
        set((state) => {
          let toasts = state.toasts;

          if (status === "disconnected") {
            // Add connection-failure toast if not already present
            const hasConnectionToast = state.toasts.some(({ id }) => id === "connection-failure");
            if (!hasConnectionToast) {
              toasts = [
                {
                  id: "connection-failure",
                  message: "Disconnected",
                  appearance: "Failure" as const,
                },
                ...state.toasts,
              ];
            }
          } else if (status === "connected") {
            // Remove connection-failure toast when connected
            toasts = state.toasts.filter(({ id }) => id !== "connection-failure");
          }

          return { connectionStatus: status, toasts };
        }, false, 'setConnectionStatus');
      },

      navigate: (route, routeParams) => {
        set({ route, routeParams }, false, 'navigate');
      },

      addToast: (toast) => {
        set((state) => ({
          toasts: [...state.toasts, toast],
        }), false, 'addToast');
      },

      removeToast: (toast) => {
        set((state) => ({
          toasts: state.toasts.filter(t => t !== toast),
        }), false, 'removeToast');
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab }, false, 'setActiveTab');
      },

      setError: (error, route) => {
        set({ error, ...(route ? { route } : {}) }, false, 'setError');
      },

      clearError: () => {
        set({ error: undefined }, false, 'clearError');
      },

      loginError: (message) => {
        set({
          error: { type: "login", message },
          route: "login",
        }, false, 'loginError');
      },

      joinRoomError: (message) => {
        set({
          error: { type: "join", message },
          route: "join",
        }, false, 'joinRoomError');
      },

      createRoomError: (message) => {
        set({
          error: { type: "createRoom", message },
          route: "createRoom",
        }, false, 'createRoomError');
      },
    }),
    { name: 'UIStore' }
  )
);
