/**
 * Component Exports Index
 *
 * Centralized exports for all MovieMatch components.
 * This file provides a single import point for components across the app.
 *
 * Usage:
 *   import { SwipeScreen, MatchesScreen } from 'src/components';
 */

// ============================================================================
// SCREENS
// ============================================================================

// Phase 3: New Tabbed Screens
export { SwipeScreen } from "./screens/SwipeScreen";
export { MatchesScreen } from "./screens/MatchesScreen";
export { SettingsScreen } from "./screens/SettingsScreen";
export { BrowseScreen } from "./screens/BrowseScreen";

// Phase 3: Room Container & Wizard
export { RoomContainer } from "./screens/RoomContainer";
export { CreateRoomWizard } from "./screens/CreateRoomWizard/CreateRoomWizard";

// Existing Screens
export { LoginScreen } from "./screens/Login";
export { JoinScreen } from "./screens/Join";
export { ConfigScreen } from "./screens/Config";
export { RoomScreen } from "./screens/Room"; // Legacy room screen
export { Loading } from "./screens/Loading";

// ============================================================================
// ORGANISMS
// ============================================================================

export { MovieDetails } from "./organisms/MovieDetails";
export { TrailerViewer } from "./organisms/TrailerViewer";
export { CardStack } from "./organisms/CardStack";
export { MatchesList } from "./organisms/MatchesList";
export { RoomInfoBar } from "./organisms/RoomInfoBar";

// ============================================================================
// MOLECULES
// ============================================================================

export { MovieCard } from "./molecules/MovieCard";
export { MovieInfo } from "./molecules/MovieInfo";
export { ActionBar } from "./molecules/ActionBar";
export { NavigationBar } from "./molecules/NavigationBar";
export { UserProgressItem } from "./molecules/UserProgressItem";
export { Card } from "./molecules/Card";
export { Field } from "./molecules/Field";
export { FilterField } from "./molecules/FilterField";
export { ShareMenu } from "./molecules/ShareMenu";
export { UserMenu } from "./molecules/UserMenu";
export { AutoSuggestInput } from "./molecules/AutoSuggestInput";

// ============================================================================
// ATOMS
// ============================================================================

export { ActionButton } from "./atoms/ActionButton";
export { Avatar } from "./atoms/Avatar";
export { Button } from "./atoms/Button";
export { ErrorMessage } from "./atoms/ErrorMessage";
export { GenreTag } from "./atoms/GenreTag";
export { Logo } from "./atoms/Logo";
export { MenuButton } from "./atoms/MenuButton";
export { MenuGroup } from "./atoms/MenuGroup";
export { NavIcon } from "./atoms/NavIcon";
export { Pill } from "./atoms/Pill";
export { Popover } from "./atoms/Popover";
export { ProgressBar } from "./atoms/ProgressBar";
export { SegmentedControls, SegmentedControlOption } from "./atoms/SegmentedControls";
export { Select } from "./atoms/Select";
export { Spinner } from "./atoms/Spinner";
export { Switch } from "./atoms/Switch";
export { TextInput } from "./atoms/TextInput";
export { Toast, ToastList } from "./atoms/Toast";
export { Tr } from "./atoms/Tr";
export { Version } from "./atoms/Version";
export { VisuallyHidden } from "./atoms/VisuallyHidden";
export { AddRemoveList } from "./atoms/AddRemoveList";

// ============================================================================
// ICONS
// ============================================================================

export { BookmarkIcon } from "./icons/BookmarkIcon";
export { ChevronDown } from "./icons/ChevronDown";
export { CloseIcon } from "./icons/CloseIcon";
export { ContentRatingSymbol } from "./icons/ContentRatingSymbol";
export { ExpandIcon } from "./icons/ExpandIcon";
export { GridIcon } from "./icons/GridIcon";
export { HeartIcon } from "./icons/HeartIcon";
export { InfoIcon } from "./icons/InfoIcon";
export { SettingsIcon } from "./icons/SettingsIcon";
export { ShareIcon } from "./icons/ShareIcon";
export { StarIcon } from "./icons/StarIcon";
export { SwipeIcon } from "./icons/SwipeIcon";
export { UndoIcon } from "./icons/UndoIcon";
export { XIcon } from "./icons/XIcon";

// ============================================================================
// LAYOUT
// ============================================================================

export { Layout } from "./layout/Layout";
export { ButtonContainer } from "./layout/ButtonContainer";

// ============================================================================
// ROUTING
// ============================================================================

export { AppRouter } from "./AppRouter";
