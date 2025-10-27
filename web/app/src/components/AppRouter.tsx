import React from "react";
import { LoginScreen } from "./screens/Login";
import { JoinScreen } from "./screens/Join";
import { CreateRoomWizard } from "./screens/CreateRoomWizard/CreateRoomWizard";
import { RoomContainer } from "./screens/RoomContainer";
import { ConfigScreen } from "./screens/Config";
import { Loading } from "./screens/Loading";
import type { Routes } from "../types";

interface AppRouterProps {
  route: Routes;
  translations?: Record<string, string>;
}

/**
 * AppRouter - Helper component for route-based rendering
 *
 * This component handles the routing logic for the entire app.
 * It maps route names to their corresponding screen components.
 *
 * Routes:
 * - loading: Initial loading screen
 * - login: User login screen
 * - join: Join existing room screen
 * - createRoom: Create new room wizard (Phase 3 enhanced)
 * - room: Main room experience (Phase 3 tabbed interface)
 * - config: Server configuration screen
 */
export const AppRouter = ({ route, translations }: AppRouterProps) => {
  // Wait for translations to load before showing content
  if (!translations) {
    return <Loading />;
  }

  // Route mapping
  const routes: Record<Routes, () => JSX.Element> = {
    loading: Loading,
    login: LoginScreen,
    join: JoinScreen,
    createRoom: CreateRoomWizard, // Phase 3: New enhanced wizard
    room: () => <RoomContainer />, // Phase 3: New tabbed container
    config: ConfigScreen,
  };

  const CurrentComponent = routes[route];

  if (CurrentComponent) {
    return <CurrentComponent />;
  }

  // Fallback for unknown routes
  return <p>No route for {route}</p>;
};
