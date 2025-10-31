import { MovieMatchClient } from '../api/moviematch';
import * as plex from '../api/plex_tv';
import { useAuthStore } from './authStore';
import { useRoomStore } from './roomStore';
import { useMediaStore } from './mediaStore';
import { useUIStore } from './uiStore';
import type { ClientMessage } from '../../../../types/moviematch';

let client: MovieMatchClient;

/**
 * Checks for existing login credentials from localStorage or Plex
 */
const getExistingLogin = async () => {
  const plexLoginStatus = plex.getLogin();

  if (plexLoginStatus) {
    if ("pin" in plexLoginStatus) {
      try {
        return await plex.verifyPin(plexLoginStatus.pin);
      } catch (err) {
        return null;
      }
    } else {
      return plexLoginStatus;
    }
  }

  const userName = localStorage.getItem("userName");
  if (userName) return { userName };

  return null;
};

/**
 * Routes incoming WebSocket messages to the appropriate Zustand store actions
 */
const handleServerMessage = (message: ClientMessage) => {
  const authStore = useAuthStore.getState();
  const roomStore = useRoomStore.getState();
  const mediaStore = useMediaStore.getState();
  const uiStore = useUIStore.getState();

  switch (message.type) {
    case 'config':
      authStore.setConfig(message.payload);
      if (message.payload.requiresConfiguration) {
        uiStore.navigate('config');
      }
      break;

    case 'translations':
      authStore.setTranslations(message.payload);
      break;

    case 'loginSuccess':
      if (message.payload) {
        authStore.login(message.payload);
        const config = useAuthStore.getState().config;
        if (!config?.requiresConfiguration) {
          uiStore.navigate('join');
        }
      }
      break;

    case 'loginError':
      uiStore.setError({ type: 'login', message: message.payload.message }, 'login');
      break;

    case 'logoutSuccess':
      authStore.logout();
      roomStore.leaveRoom();
      uiStore.navigate('login');
      break;

    case 'createRoomSuccess':
    case 'joinRoomSuccess':
      roomStore.setRoomSuccess({
        media: message.payload.media,
        previousMatches: message.payload.previousMatches,
        users: message.payload.users,
      });
      uiStore.navigate('room');
      uiStore.clearError();

      // Update URL with roomName
      const roomName = useRoomStore.getState().name;
      if (roomName) {
        const newUrl = new URL(location.href);
        newUrl.searchParams.set('roomName', roomName);
        history.replaceState(null, document.title, newUrl.href);
      }
      break;

    case 'createRoomError':
      uiStore.setError(
        { type: 'createRoom', message: message.payload.message },
        'createRoom'
      );
      break;

    case 'joinRoomError':
      uiStore.setError(
        { type: 'join', message: message.payload.message },
        'join'
      );
      break;

    case 'leaveRoomSuccess':
      roomStore.leaveRoom();
      uiStore.navigate('join');

      // Remove roomName from URL
      const newUrl = new URL(location.href);
      newUrl.searchParams.delete('roomName');
      history.replaceState(null, document.title, newUrl.href);
      break;

    case 'requestFiltersSuccess':
      mediaStore.setAvailableFilters(message.payload);
      break;

    case 'requestFilterValuesSuccess':
      mediaStore.setFilterValues(message.payload.request.key, message.payload.values);
      break;

    case 'getLibraries':
      // Server is requesting libraries - trigger loading state
      mediaStore.requestLibraries();
      break;

    case 'getLibrariesSuccess':
      mediaStore.setLibraries(message.payload);
      break;

    case 'getLibrariesError':
      mediaStore.setLibrariesError(message.payload.message);
      break;

    case 'match':
      roomStore.addMatch(message.payload);
      break;

    case 'userJoinedRoom':
      roomStore.userJoined(message.payload);
      break;

    case 'userLeftRoom':
      roomStore.userLeft(message.payload.userName);
      break;

    case 'userProgress':
      roomStore.updateUserProgress(message.payload.user.userName, message.payload.progress);
      break;
  }
};

/**
 * Initializes the WebSocket connection and sets up event listeners
 * that route messages to Zustand stores
 */
export const initializeWebSocket = () => {
  if (!client) {
    client = new MovieMatchClient();
  }

  // Get store instances
  const uiStore = useUIStore.getState();

  // Set initial connection status
  uiStore.setConnectionStatus('connecting');

  // Connected event
  client.addEventListener('connected', async () => {
    const uiStore = useUIStore.getState();

    uiStore.setConnectionStatus('connected');

    // Set locale to user's browser language
    client.setLocale({ language: navigator.language });

    // Check for existing login
    const existingLogin = await getExistingLogin();

    if (existingLogin) {
      // Send login message to server
      if ('token' in existingLogin) {
        client.login({
          plexToken: existingLogin.token,
          plexClientId: existingLogin.clientId,
        });
      } else {
        client.login(existingLogin);
      }
    } else {
      uiStore.navigate('login');
    }
  });

  // Disconnected event
  client.addEventListener('disconnected', () => {
    useUIStore.getState().setConnectionStatus('disconnected');
  });

  // Message event - route to appropriate stores
  client.addEventListener('message', (e) => {
    const message = (e as MessageEvent<ClientMessage>).data;
    handleServerMessage(message);
  });

  return client;
};

export { client };
